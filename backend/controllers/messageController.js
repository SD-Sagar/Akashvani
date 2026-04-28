import Message from '../models/Message.js';

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
    const { receiverId } = req.body;
    const senderId = req.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const message = new Message({
      senderId,
      receiverId,
      content: req.file.path, // Store the Cloudinary URL in content
    });

    await message.save();
    
    // We can also return the message so the client can emit it via socket if needed,
    // but usually, the server handles the socket emit too.
    // However, to keep it simple, we'll return the message and let the client handle UI update
    // OR we can emit from here if we have access to the IO instance.
    // Let's just return it for now.
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Send image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
