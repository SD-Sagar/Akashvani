import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/authRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import Message from './models/Message.js';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Mongoose deprecated warning fix
mongoose.set('returnDocument', 'after');

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
    credentials: true,
  },
});

const userSockets = new Map(); // userId -> socketId

io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error('Authentication error'));
    
    const token = cookies.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (!token) return next(new Error('Authentication error'));
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.userId.toString(); // Join a private room for this user
  socket.join(`user_${userId}`);
  userSockets.set(userId, socket.id);
  console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

  // Broadcast online status to friends
  try {
    const user = await User.findById(userId).populate('friends', '_id');
    if (user) {
      const onlineFriendIds = [];
      user.friends.forEach(friend => {
        const isOnline = userSockets.has(friend._id.toString());
        if (isOnline) {
          onlineFriendIds.push(friend._id.toString());
          // Tell the friend I am online (send to all their tabs)
          io.to(`user_${friend._id}`).emit('user_status', { userId, status: 'online' });
        }
      });
      // Send the list of currently online friends to the user
      socket.emit('initial_status', onlineFriendIds);
    }
  } catch (err) {
    console.error("Status broadcast error:", err);
  }

  socket.on('typing', ({ receiverId }) => {
    io.to(`user_${receiverId}`).emit('typing_status', { userId, isTyping: true });
  });

  socket.on('stop_typing', ({ receiverId }) => {
    io.to(`user_${receiverId}`).emit('typing_status', { userId, isTyping: false });
  });

  socket.on('friend_added', ({ receiverId, friendData }) => {
    io.to(`user_${receiverId}`).emit('friend_added', friendData);
  });

  socket.on('private_message', async ({ receiverId, content }) => {
    try {
      const message = new Message({
        senderId: userId,
        receiverId,
        content,
      });
      const savedMessage = await message.save();
      const populatedMessage = await savedMessage.populate('senderId', 'username avatarUrl');
      
      io.to(`user_${receiverId}`).emit('receive_message', populatedMessage);
      io.to(`user_${userId}`).emit('receive_message', populatedMessage);
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  socket.on('mark_read', async ({ messageId, senderId }) => {
    try {
      await Message.updateOne({ _id: messageId }, { isRead: true });
      io.to(`user_${senderId}`).emit('message_read', { messageId });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  socket.on('mark_all_read', async ({ senderId }) => {
    try {
      await Message.updateMany(
        { senderId, receiverId: userId, isRead: false },
        { $set: { isRead: true } }
      );
      io.to(`user_${senderId}`).emit('all_read', { receiverId: userId });
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  });

  socket.on('disconnect', async () => {
    userSockets.delete(userId);
    console.log(`User disconnected: ${userId}`);
    
    // Check if user has any other active sockets before saying they are offline
    const remainingSockets = await io.in(`user_${userId}`).fetchSockets();
    if (remainingSockets.length === 0) {
      try {
        const user = await User.findById(userId).populate('friends', '_id');
        if (user) {
          user.friends.forEach(friend => {
            io.to(`user_${friend._id}`).emit('user_status', { userId, status: 'offline' });
          });
        }
      } catch (err) {
        console.error("Status broadcast error:", err);
      }
    }
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
