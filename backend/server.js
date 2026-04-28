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
  const userId = socket.userId.toString();
  console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
  userSockets.set(userId, socket.id);

  // Notify friends that this user is online
  try {
    const user = await User.findById(userId).populate('friends', '_id');
    if (user) {
      user.friends.forEach(friend => {
        const friendSocketId = userSockets.get(friend._id.toString());
        if (friendSocketId) {
          // Tell the friend I am online
          io.to(friendSocketId).emit('user_status', { userId, status: 'online' });
          // Tell me the friend is online
          socket.emit('user_status', { userId: friend._id.toString(), status: 'online' });
        }
      });
    }
  } catch (err) {
    console.error("Status broadcast error:", err);
  }

  socket.on('typing', ({ receiverId }) => {
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing_status', { userId, isTyping: true });
    }
  });

  socket.on('stop_typing', ({ receiverId }) => {
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing_status', { userId, isTyping: false });
    }
  });

  socket.on('private_message', async ({ receiverId, content }) => {
    try {
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        content,
      });
      await message.save();

      // Populate sender info if needed, but client might already have it.
      const savedMessage = await message.populate('senderId', 'username avatarUrl uniqueId');

      const receiverSocketId = userSockets.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', savedMessage);
      }
      
      // Also send it back to sender to confirm
      socket.emit('receive_message', savedMessage);
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  socket.on('mark_read', async ({ messageId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { isRead: true });
      // Emit to sender that message was read
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${userId}`);
    userSockets.delete(userId);

    // Notify friends that this user is offline
    try {
      const user = await User.findById(userId).populate('friends', '_id');
      if (user) {
        user.friends.forEach(friend => {
          const friendSocketId = userSockets.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('user_status', { userId, status: 'offline' });
          }
        });
      }
    } catch (err) {
      console.error("Status broadcast error:", err);
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
