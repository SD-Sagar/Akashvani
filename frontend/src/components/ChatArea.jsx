import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { Send, Image as ImageIcon, Smile, MoreVertical, ChevronLeft, Trash2, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const ChatArea = ({ activeChatId, onBack }) => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isOnline = onlineUsers.has(activeChatId);
  
  const activeFriend = user?.friends.find(f => f._id === activeChatId);

  useEffect(() => {
    if (activeChatId) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/messages/${activeChatId}`);
          setMessages(res.data);
          
          // Mark messages from this friend as read in the DB and notify them
          await axios.put(`${API_BASE_URL}/api/messages/read/${activeChatId}`);
          if (socket) {
            socket.emit('mark_all_read', { senderId: activeChatId });
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };
      fetchMessages();
      setShowMenu(false);
      setShowEmojiPicker(false);
    }
  }, [activeChatId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (message) => {
        // If message belongs to the current open chat
        const msgSenderId = String(message.senderId._id || message.senderId);
        const msgReceiverId = String(message.receiverId._id || message.receiverId);
        const currentUserId = String(user._id);
        const currentChatId = String(activeChatId);

        if (
          (msgSenderId === currentChatId && msgReceiverId === currentUserId) ||
          (msgSenderId === currentUserId && msgReceiverId === currentChatId)
        ) {
          setMessages((prev) => [...prev, message]);
          setIsFriendTyping(false); 
          
          if (msgSenderId !== currentUserId) {
             socket.emit('mark_read', { messageId: message._id, senderId: msgSenderId });
          }
        }
      });

      socket.on('message_read', ({ messageId }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true } : msg
        ));
      });

      socket.on('all_read', ({ receiverId }) => {
        if (receiverId === activeChatId) {
          setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
        }
      });

      socket.on('typing_status', ({ userId, isTyping }) => {
        if (userId === activeChatId) {
          setIsFriendTyping(isTyping);
        }
      });

      return () => {
        socket.off('receive_message');
        socket.off('message_read');
        socket.off('all_read');
        socket.off('typing_status');
      };
    }
  }, [socket, activeChatId, user._id]);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (socket && activeChatId) {
      socket.emit('typing', { receiverId: activeChatId });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { receiverId: activeChatId });
      }, 3000);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId || !socket) return;

    socket.emit('private_message', {
      receiverId: activeChatId,
      content: inputMessage,
    });

    setInputMessage('');
    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("File size exceeds 20MB limit.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('receiverId', activeChatId);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/messages/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Emit the message via socket. The socket listener on the server will now save it to the DB.
      socket.emit('private_message', {
        receiverId: activeChatId,
        content: res.data.imageUrl, // Use the imageUrl returned from the server
      });

    } catch (err) {
      console.error("Image upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm("Delete all messages in this chat? This cannot be undone.")) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/messages/${activeChatId}`);
      setMessages([]);
      setShowMenu(false);
    } catch (err) {
      console.error("Delete chat failed", err);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setInputMessage(prev => prev + emojiObject.emoji);
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--pane-bg)] backdrop-blur-md">
        <div className="w-24 h-24 mb-6 rounded-full bg-sagar-blue/10 flex items-center justify-center">
          <Send size={40} className="text-sagar-blue opacity-50 ml-2" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
        <p className="opacity-60 text-sm max-w-xs text-center">Select a friend from the sidebar to start chatting or add a new friend.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--pane-bg)] backdrop-blur-md">
      {/* Chat Header */}
      <div className="h-16 px-4 md:px-6 border-b border-[var(--pane-border)] flex items-center justify-between shrink-0 bg-[var(--input-bg)]/50">
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 hover:bg-[var(--pane-border)] rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          {activeFriend?.avatarUrl ? (
            <img src={activeFriend.avatarUrl} alt="avatar" className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
              {activeFriend?.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <h3 className="font-bold text-sm md:text-base truncate">{activeFriend?.username}</h3>
            <p className={`text-[10px] md:text-xs font-medium transition-colors ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
              {isFriendTyping ? (
                <span className="flex items-center gap-1">
                  Typing
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-sagar-blue rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-sagar-blue rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-sagar-blue rounded-full animate-bounce"></span>
                  </span>
                </span>
              ) : (
                isOnline ? 'Online' : 'Offline'
              )}
            </p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-full transition-colors ${showMenu ? 'bg-[var(--pane-border)]' : 'hover:bg-[var(--pane-border)]'}`}
          >
            <MoreVertical size={20} className="opacity-70" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-2xl z-50 py-2 border border-[var(--pane-border)]">
              <button 
                onClick={handleDeleteChat}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={16} /> Delete Chat History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg, index) => {
          const msgSenderId = String(msg.senderId._id || msg.senderId);
          const currentUserId = String(user._id);
          const isSender = msgSenderId === currentUserId;
          const isImage = msg.content.startsWith('http') && (msg.content.includes('cloudinary') || msg.content.match(/\.(jpeg|jpg|gif|png|webp)$/) != null);
          
          return (
            <div key={msg._id || index} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isSender ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div 
                className={`p-3 px-4 rounded-2xl shadow-sm ${
                  isSender 
                    ? 'bg-[var(--chat-bubble-send)] text-[var(--chat-bubble-send-fg)] rounded-br-sm' 
                    : 'bg-[var(--chat-bubble-receive)] text-[var(--chat-bubble-receive-fg)] rounded-bl-sm border border-[var(--pane-border)]'
                }`}
              >
                {isImage ? (
                  <img src={msg.content} alt="Shared content" className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.content, '_blank')} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[10px] opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isSender && (
                  <span className="text-[10px] text-sagar-blue ml-1 font-medium">
                    {msg.isRead ? 'Read' : 'Delivered'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 md:p-4 border-t border-[var(--pane-border)] bg-[var(--input-bg)]/50 shrink-0 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 z-50 mb-2 shadow-2xl rounded-2xl overflow-hidden" ref={emojiPickerRef}>
            <EmojiPicker 
              onEmojiClick={onEmojiClick} 
              theme={window.document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              width={300}
              height={400}
            />
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-center gap-1 md:gap-2">
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 transition-colors rounded-full ${showEmojiPicker ? 'text-sagar-blue bg-sagar-blue/10' : 'text-gray-400 hover:text-sagar-blue hover:bg-[var(--pane-border)]'}`}
          >
            <Smile size={22} />
          </button>
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current.click()}
            className={`p-2 text-gray-400 hover:text-sagar-blue transition-colors rounded-full hover:bg-[var(--pane-border)] ${isUploading ? 'animate-pulse text-sagar-blue' : ''}`}
          >
            <ImageIcon size={22} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-[var(--input-bg)] border border-[var(--pane-border)] rounded-full px-4 md:px-5 py-2.5 md:py-3 focus:outline-none focus:border-sagar-blue/50 focus:ring-1 focus:ring-sagar-blue/50 transition-all text-sm shadow-sm"
            value={inputMessage}
            onChange={handleInputChange}
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim()}
            className="p-2.5 md:p-3 bg-sagar-blue text-white rounded-full hover:bg-sagar-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sagar-blue/30 ml-1"
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
