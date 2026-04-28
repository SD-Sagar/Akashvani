import express from 'express';
import { register, login, logout, getMe, updateAvatar } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

export default router;
