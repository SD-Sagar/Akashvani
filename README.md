# 🌌 Akashvani - Celestial Messaging

Akashvani is an ultra-modern, professional private messaging application built with the MERN stack. It features a stunning glassmorphism UI, real-time communication, and secure media sharing.

## ✨ Features

- **Real-time Chat**: Powered by Socket.io for instant message delivery with user-room isolation.
- **Smart Activity Sorting**: Friends list dynamically sorts by the most recent conversation.
- **Persistent Unread Memory**: Unread counts are saved to the DB and persist across logouts.
- **Real-time Read Receipts**: Instant "Delivered" to "Read" status updates across devices.
- **Presence & Typing**: See when friends are online and when they are typing.
- **Unique Identity**: Every user gets a permanent, unique 8-character ID (e.g., AK-99-SKY).
- **Secure Media Sharing**: Support for image uploads up to 20MB via Cloudinary.
- **Profile Customization**: Dynamic avatar updates and professional profile management.
- **Privacy Controls**: Friend removal and full chat history deletion.
- **Responsive Design**: Optimized layouts with device-specific UI elements.
- **Premium Aesthetics**: Dark/Light mode support with animated SVG "Cosmic Signal" logo.

## 🚀 Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express 5.
- **Database**: MongoDB (Mongoose).
- **Real-time**: Socket.io (with WebSocket/Polling fallback).
- **Storage**: Cloudinary.
- **Authentication**: JWT with HTTP-only Cookies.

## 🛠️ Quick Start

1. Clone the repository.
2. Run `npm run install-all` in the root directory.
3. Configure your `.env` in the `backend/` folder.
4. Run `npm run dev` to start both frontend and backend.

---

*Crafted with 💙 for the next generation of private messaging.*
