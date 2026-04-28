import express from 'express';
import { addFriend, removeFriend } from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/add', protect, addFriend);
router.post('/remove', protect, removeFriend);

export default router;
