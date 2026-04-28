import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { Search, UserPlus, LogOut, Copy, Check, Camera, UserMinus, X } from 'lucide-react';

const Sidebar = ({ activeChatId, setActiveChatId }) => {
  const { user, updateFriends, logout, updateAvatarState, removeFriendState } = useAuth();
  const { socket } = useSocket();
  const [friendIdInput, setFriendIdInput] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('user_status', ({ userId, status }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (status === 'online') newSet.add(userId);
          else newSet.delete(userId);
          return newSet;
        });
      });

      return () => socket.off('user_status');
    }
  }, [socket]);

  const handleAvatarUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUpdatingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await axios.put(`${API_BASE_URL}/api/auth/avatar`, formData);
      updateAvatarState(res.data.avatarUrl);
    } catch (err) {
      console.error("Avatar update failed", err);
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    
    try {
      await axios.post(`${API_BASE_URL}/api/friends/remove`, { friendId });
      removeFriendState(friendId);
      if (activeChatId === friendId) setActiveChatId(null);
    } catch (err) {
      console.error("Remove friend failed", err);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendIdInput.trim()) return;

    setAddingFriend(true);
    setAddFriendError('');
    setAddFriendSuccess('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/friends/add`, { uniqueId: friendIdInput });
      updateFriends(res.data.friend);
      setAddFriendSuccess(`Added ${res.data.friend.username}!`);
      setFriendIdInput('');
    } catch (err) {
      setAddFriendError(err.response?.data?.message || 'Failed to add friend');
    } finally {
      setAddingFriend(false);
    }
  };

  const copyUniqueId = () => {
    navigator.clipboard.writeText(user.uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl flex flex-col h-full z-10 relative overflow-hidden">
      {/* Profile Section */}
      <div className="p-5 border-b border-[var(--pane-border)] shrink-0 bg-[var(--pane-bg)] backdrop-blur-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative group">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover shadow-lg border-2 border-[var(--pane-border)]" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sagar-blue to-blue-400 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-[var(--pane-border)]">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera size={16} className="text-white" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpdate} className="hidden" accept="image/*" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--pane-bg)]"></div>
            {updatingAvatar && (
              <div className="absolute inset-0 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-sagar-blue border-t-transparent animate-spin rounded-full"></div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-lg truncate">{user.username}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono bg-[var(--input-bg)] px-2 py-1 rounded-md border border-[var(--pane-border)] opacity-80 truncate">{user.uniqueId}</span>
              <button onClick={copyUniqueId} className="text-gray-400 hover:text-sagar-blue transition-colors" title="Copy Unique ID">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>

        {/* Add Friend Input */}
        <form onSubmit={handleAddFriend} className="relative mt-2">
          <input
            type="text"
            placeholder="Add friend by unique ID (e.g. AK-99-SKY)"
            className="w-full p-2.5 pl-4 pr-10 rounded-xl text-sm bg-[var(--input-bg)] border border-[var(--pane-border)] focus:outline-none focus:ring-2 focus:ring-sagar-blue transition-all placeholder-gray-400/70"
            value={friendIdInput}
            onChange={(e) => setFriendIdInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={addingFriend || !friendIdInput}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sagar-blue hover:bg-sagar-blue/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <UserPlus size={18} />
          </button>
        </form>
        {addFriendError && <p className="text-red-500 text-xs mt-2 px-1">{addFriendError}</p>}
        {addFriendSuccess && <p className="text-green-500 text-xs mt-2 px-1">{addFriendSuccess}</p>}
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        <h4 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Friends</h4>
        {user.friends.length === 0 ? (
          <div className="p-4 text-center opacity-60 text-sm mt-4">
            No friends yet. Add someone using their unique ID!
          </div>
        ) : (
          user.friends.map((friend) => (
            <button
              key={friend._id}
              onClick={() => setActiveChatId(friend._id)}
              className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all ${activeChatId === friend._id ? 'bg-sagar-blue/10 border border-sagar-blue/20' : 'hover:bg-[var(--pane-bg)] border border-transparent'}`}
            >
              <div className="relative shrink-0">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {onlineUsers.has(friend._id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--pane-bg)] shadow-sm animate-pulse"></div>
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="font-semibold truncate text-sm">{friend.username}</p>
                <p className="text-xs opacity-60 truncate">{friend.uniqueId}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFriend(friend._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Remove Friend"
              >
                <UserMinus size={16} />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
