import express from 'express';
import { getMessages, deleteChat, sendImage, getUnreadCounts, markAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.get('/unread', protect, getUnreadCounts);
router.put('/read/:senderId', protect, markAsRead);
router.get('/:userId', protect, getMessages);
router.delete('/:userId', protect, deleteChat);
router.post('/image', protect, upload.single('image'), sendImage);
router.post('/audio', protect, upload.single('audio'), sendImage); // Using sendImage for both as it just returns the URL

export default router;
