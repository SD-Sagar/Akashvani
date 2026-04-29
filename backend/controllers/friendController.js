import User from '../models/User.js';

export const addFriend = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    const currentUserId = req.userId;

    if (!uniqueId) {
      return res.status(400).json({ message: 'Friend unique ID is required' });
    }

    const currentUser = await User.findById(currentUserId);
    const friendToAdd = await User.findOne({ uniqueId });

    if (!friendToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser._id.toString() === friendToAdd._id.toString()) {
      return res.status(400).json({ message: 'You cannot add yourself as a friend' });
    }

    if (currentUser.friends.includes(friendToAdd._id)) {
      return res.status(400).json({ message: 'User is already in your friends list' });
    }

    // Two-way friendship
    currentUser.friends.push(friendToAdd._id);
    friendToAdd.friends.push(currentUser._id);

    await currentUser.save();
    await friendToAdd.save();

    // Send back the friend details
    const friendDataForUser = {
      _id: friendToAdd._id,
      username: friendToAdd.username,
      uniqueId: friendToAdd.uniqueId,
      avatarUrl: friendToAdd.avatarUrl,
    };

    const userDataForFriend = {
      _id: currentUser._id,
      username: currentUser.username,
      uniqueId: currentUser.uniqueId,
      avatarUrl: currentUser.avatarUrl,
    };

    res.status(200).json({ 
      message: 'Friend added successfully', 
      friend: friendDataForUser,
      currentUserData: userDataForFriend 
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const currentUserId = req.userId;

    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required' });
    }

    const currentUser = await User.findById(currentUserId);
    const friendToRemove = await User.findById(friendId);

    if (!friendToRemove) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.friends = currentUser.friends.filter(id => id.toString() !== friendId);
    friendToRemove.friends = friendToRemove.friends.filter(id => id.toString() !== currentUserId);

    await currentUser.save();
    await friendToRemove.save();

    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
