import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

// Register User
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique ID like AK-8char
    const uniqueId = `AK-${nanoid(8).toUpperCase()}`;

    const avatarUrl = req.file ? req.file.path : '';

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      uniqueId,
      avatarUrl,
    });

    await newUser.save();
    
    // Populate friends (even if empty) to keep structure consistent
    const populatedUser = await User.findById(newUser._id).populate('friends', 'username uniqueId avatarUrl');

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const populatedUser = await User.findById(user._id).populate('friends', 'username uniqueId avatarUrl');

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(populatedUser);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout User
export const logout = (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  res.status(200).json({ message: 'Logged out successfully' });
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username uniqueId avatarUrl');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Avatar
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatarUrl: req.file.path },
      { new: true }
    ).populate('friends', 'username uniqueId avatarUrl');

    res.status(200).json(user);
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
