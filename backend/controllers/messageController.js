import Message from '../models/Message.js';
import mongoose from 'mongoose';

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    await Message.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    });

    res.status(200).json({ message: 'Chat history deleted' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    res.status(200).json({ imageUrl: req.file.path });
  } catch (error) {
    console.error('Send image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const counts = await Message.aggregate([
      { $match: { receiverId: new mongoose.Types.ObjectId(req.userId), isRead: false } },
      { $group: { _id: '$senderId', count: { $sum: 1 } } }
    ]);
    
    const unreadMap = {};
    counts.forEach(item => {
      unreadMap[item._id.toString()] = item.count;
    });
    
    res.status(200).json(unreadMap);
  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    await Message.updateMany(
      { senderId, receiverId: req.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
