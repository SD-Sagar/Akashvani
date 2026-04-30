import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { Send, Image as ImageIcon, Smile, MoreVertical, ChevronLeft, Trash2, X, Reply, Mic, Play, Pause, Square } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const ChatArea = ({ activeChatId, onBack }) => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeFriend, setActiveFriend] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isOnline = onlineUsers.has(activeChatId);

  useEffect(() => {
    if (activeChatId) {
      const friend = user.friends.find(f => f._id === activeChatId);
      setActiveFriend(friend);
      fetchMessages();
      if (socket) socket.emit('mark_all_read', { senderId: activeChatId });
    }
    setReplyTo(null);
    setAudioBlob(null);
    setShowMenu(false);
    setActiveMenuId(null);
  }, [activeChatId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket && activeChatId) {
      socket.on('receive_message', (message) => {
        if (
          (message.senderId?._id === activeChatId && message.receiverId === user._id) ||
          (message.senderId?._id === user._id && message.receiverId === activeChatId)
        ) {
          setMessages(prev => [...prev, message]);
          if (message.senderId?._id === activeChatId) {
            socket.emit('mark_read', { messageId: message._id, senderId: activeChatId });
          }
        }
      });

      socket.on('message_read', ({ messageId }) => {
        setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, isRead: true } : msg));
      });

      socket.on('all_read', ({ receiverId }) => {
        if (receiverId === activeChatId) {
          setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
        }
      });

      socket.on('message_deleted', ({ messageId }) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        setReplyTo(prev => prev?._id === messageId ? null : prev);
      });

      socket.on('reaction_updated', ({ messageId, reactions }) => {
        setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions } : msg));
      });

      socket.on('history_cleared', ({ senderId }) => {
        if (senderId === activeChatId) setMessages([]);
      });

      socket.on('typing_status', ({ userId, isTyping }) => {
        if (userId === activeChatId) setIsFriendTyping(isTyping);
      });

      return () => {
        socket.off('receive_message');
        socket.off('message_read');
        socket.off('all_read');
        socket.off('message_deleted');
        socket.off('reaction_updated');
        socket.off('history_cleared');
        socket.off('typing_status');
      };
    }
  }, [socket, activeChatId, user._id]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/${activeChatId}`, { withCredentials: true });
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { receiverId: activeChatId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { receiverId: activeChatId });
      }, 2000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId || !socket) return;
    socket.emit('private_message', {
      receiverId: activeChatId,
      content: inputMessage,
      messageType: 'text',
      replyTo: replyTo?._id || null
    });
    setInputMessage('');
    setReplyTo(null);
    setShowEmojiPicker(false);
  };

  const handleIndividualDelete = (messageId) => {
    if (socket) socket.emit('delete_message', { messageId, receiverId: activeChatId });
    setActiveMenuId(null);
  };

  const handleReact = (messageId, emoji) => {
    if (socket) {
      socket.emit('react_message', { messageId, emoji, receiverId: activeChatId });
      setReactionPickerFor(null);
      setActiveMenuId(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || !activeChatId || !socket) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/messages/audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      socket.emit('private_message', {
        receiverId: activeChatId,
        content: res.data.imageUrl,
        messageType: 'audio',
        replyTo: replyTo?._id || null
      });
      setAudioBlob(null);
      setReplyTo(null);
    } catch (err) {
      console.error("Audio upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatId || !socket) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/messages/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      socket.emit('private_message', {
        receiverId: activeChatId,
        content: res.data.imageUrl,
        messageType: 'image',
        replyTo: replyTo?._id || null
      });
      setReplyTo(null);
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteChat = async () => {
    if (window.confirm('Delete this entire chat history?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/messages/${activeChatId}`, { withCredentials: true });
        setMessages([]);
        if (socket) socket.emit('clear_history', { receiverId: activeChatId });
      } catch (err) {
        console.error('Delete chat error:', err);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderMessageContent = (msg) => {
    switch (msg.messageType) {
      case 'image':
        return <img src={msg.content} alt="shared" className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.content, '_blank')} />;
      case 'audio':
        return (
          <div className="py-1 min-w-[240px] md:min-w-[280px]">
            <audio src={msg.content} controls className="w-full h-10" />
          </div>
        );
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>;
    }
  };

  if (!activeChatId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--pane-bg)]/50 backdrop-blur-md rounded-none md:rounded-3xl border-l md:border border-[var(--pane-border)] overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-[var(--pane-border)] flex items-center justify-between bg-[var(--pane-bg)]/80 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 hover:bg-[var(--pane-border)] rounded-full transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="relative">
            {activeFriend?.avatarUrl ? (
              <img src={activeFriend.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sagar-blue/20 flex items-center justify-center text-sagar-blue font-bold shadow-inner text-sm">
                {activeFriend?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--pane-bg)] shadow-sm animate-pulse"></div>}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-sm tracking-tight truncate">{activeFriend?.username}</h3>
            <p className="text-[10px] opacity-60 font-medium">
              {isFriendTyping ? <span className="text-sagar-blue animate-pulse">Typing...</span> : isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-[var(--pane-border)] rounded-xl transition-all">
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 glass rounded-2xl shadow-2xl border border-[var(--pane-border)] p-2 z-50">
              <button onClick={() => { handleDeleteChat(); setShowMenu(false); }} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-xs font-bold">
                <Trash2 size={16} /> Clear History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth" onClick={() => setActiveMenuId(null)}>
        {messages.map((msg, index) => {
          const isMe = String(msg.senderId?._id || msg.senderId) === String(user._id);
          const showAvatar = index === 0 || String(messages[index-1].senderId?._id || messages[index-1].senderId) !== String(msg.senderId?._id || msg.senderId);
          const isMenuOpen = activeMenuId === msg._id;

          return (
            <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/bubble relative message-appear`}>
              <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                {msg.replyTo && (
                  <div className={`mb-[-8px] pb-3 px-3 py-2 rounded-t-xl opacity-60 text-[10px] flex items-center gap-2 border-x border-t border-[var(--pane-border)] ${isMe ? 'bg-sagar-blue/5 mr-3' : 'bg-gray-500/5 ml-3'}`}>
                    <Reply size={10} className="rotate-180" />
                    <span className="truncate italic max-w-[150px]">{msg.replyTo.messageType === 'text' ? msg.replyTo.content : `Shared ${msg.replyTo.messageType}`}</span>
                  </div>
                )}
                
                <div className={`flex items-start gap-2 relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && showAvatar && (
                    <div className="w-6 h-6 rounded-full overflow-hidden mt-auto mb-1 shrink-0 shadow-sm border border-[var(--pane-border)]">
                      {activeFriend?.avatarUrl ? <img src={activeFriend.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-500/20" />}
                    </div>
                  )}
                  {!isMe && !showAvatar && <div className="w-6" />}
                  
                  <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : msg._id); }}>
                    <div className={`p-3 px-4 rounded-2xl shadow-sm transition-all duration-300 ${isMe ? 'bg-sagar-blue text-white rounded-tr-none' : 'glass rounded-tl-none border border-[var(--pane-border)]'} ${isMenuOpen ? 'ring-2 ring-sagar-blue/50 scale-[0.98]' : ''}`}>
                      {renderMessageContent(msg)}
                      <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] ${isMe ? 'text-white/70' : 'opacity-40'} font-medium`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <span className={`text-[10px] font-bold ${msg.isRead ? 'text-white' : 'text-white/40'}`}>{msg.isRead ? 'Read' : '✓'}</span>}
                      </div>
                    </div>
                    
                    {msg.reactions?.length > 0 && (
                      <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-8'} flex flex-wrap gap-1 z-10`}>
                        {msg.reactions.map((r, i) => (
                          <div key={i} className="bg-[var(--pane-bg)] border border-[var(--pane-border)] rounded-full px-1.5 py-0.5 text-[10px] shadow-md animate-in zoom-in">{r.emoji}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Menu (Visible on Hover OR Tap) */}
                  <div className={`flex items-center gap-1 bg-[var(--pane-bg)]/90 backdrop-blur-md p-1 rounded-full border border-[var(--pane-border)] shadow-xl transition-all duration-200 z-30 self-center mx-2 ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 md:group-hover/bubble:opacity-100 md:group-hover/bubble:scale-100 pointer-events-none group-hover/bubble:pointer-events-auto'}`}>
                    <button onClick={() => { setReplyTo(msg); setActiveMenuId(null); }} className="p-1.5 hover:bg-sagar-blue/10 rounded-full text-sagar-blue transition-colors"><Reply size={14} /></button>
                    <div className="relative group/react">
                      <button onClick={(e) => { e.stopPropagation(); setReactionPickerFor(reactionPickerFor === msg._id ? null : msg._id); }} className="p-1.5 hover:bg-yellow-500/10 rounded-full text-yellow-500 transition-colors"><Smile size={14} /></button>
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--pane-bg)] border border-[var(--pane-border)] rounded-2xl p-2 shadow-2xl flex gap-2 animate-in zoom-in ${reactionPickerFor === msg._id ? 'flex' : 'hidden md:group-hover/react:flex'}`}>
                        {['❤️', '😂', '😮', '😢', '🔥', '👍'].map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg._id, emoji)} className="text-lg hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                        <div className="absolute top-full left-0 right-0 h-4" />
                      </div>
                    </div>
                    <button onClick={() => handleIndividualDelete(msg._id)} className="p-1.5 hover:bg-red-500/10 rounded-full text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--pane-bg)]/80 border-t border-[var(--pane-border)] relative z-20">
        {replyTo && (
          <div className="absolute bottom-full left-0 right-0 bg-sagar-blue/5 border-t border-[var(--pane-border)] p-3 px-6 flex items-center justify-between backdrop-blur-md animate-in slide-in-from-bottom-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <Reply size={14} className="text-sagar-blue shrink-0 rotate-180" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-sagar-blue uppercase tracking-wider">Replying...</p>
                <p className="text-xs opacity-60 truncate">{replyTo.messageType === 'text' ? replyTo.content : `Shared ${replyTo.messageType}`}</p>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-full"><X size={16} /></button>
          </div>
        )}
        <div className="max-w-[1000px] mx-auto">
          {isRecording ? (
            <div className="flex items-center gap-4 bg-red-500/10 p-3 px-6 rounded-2xl border border-red-500/20 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="flex-1 text-sm font-bold text-red-500 tracking-widest uppercase">Recording... {formatTime(recordingTime)}</span>
              <button onClick={stopRecording} className="bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-colors"><Square size={18} /></button>
            </div>
          ) : audioBlob ? (
            <div className="flex items-center gap-4 bg-sagar-blue/10 p-3 px-6 rounded-2xl border border-sagar-blue/20">
              <Mic size={18} className="text-sagar-blue" />
              <span className="flex-1 text-sm font-bold text-sagar-blue">Voice Message Ready</span>
              <div className="flex gap-2">
                <button onClick={() => setAudioBlob(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 size={18} /></button>
                <button onClick={sendAudioMessage} disabled={isUploading} className="bg-sagar-blue text-white p-2 px-6 rounded-xl shadow-lg font-bold text-xs uppercase tracking-widest">{isUploading ? 'Sending...' : 'Send Voice'}</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-500 hover:text-sagar-blue rounded-xl transition-colors"><ImageIcon size={22} /></button>
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 text-gray-500 hover:text-yellow-500 rounded-xl transition-colors"><Smile size={22} /></button>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full bg-[var(--input-bg)] border border-[var(--pane-border)] rounded-2xl p-3 px-4 focus:outline-none focus:ring-2 focus:ring-sagar-blue text-sm font-medium"
                  value={inputMessage}
                  onChange={(e) => { setInputMessage(e.target.value); handleTyping(); }}
                />
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--pane-border)]" ref={emojiPickerRef}>
                    <EmojiPicker onEmojiClick={(emojiData) => { setInputMessage(prev => prev + emojiData.emoji); setShowEmojiPicker(false); }} theme="auto" width={300} height={400} />
                  </div>
                )}
              </div>
              {!inputMessage.trim() ? (
                <button type="button" onClick={startRecording} className="bg-gray-500/10 text-gray-500 p-3 rounded-2xl hover:bg-sagar-blue/10 hover:text-sagar-blue transition-all"><Mic size={22} /></button>
              ) : (
                <button type="submit" disabled={isUploading} className="bg-sagar-blue text-white p-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={22} /></button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
