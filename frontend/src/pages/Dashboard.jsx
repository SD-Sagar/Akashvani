import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Moon, Sun, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, updateFriends } = useAuth();
  const [activeChatId, setActiveChatId] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { socket } = useSocket();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatOrder, setChatOrder] = useState([]);

  useEffect(() => {
    if (user) {
      setChatOrder(user.friends.map(f => f._id));
    }
  }, [user?._id]);

  useEffect(() => {
    if (socket) {
      socket.on('friend_added', (friendData) => {
        updateFriends(friendData);
        setChatOrder(prev => [friendData._id, ...prev]);
      });

      socket.on('receive_message', (message) => {
        const senderId = message.senderId._id || message.senderId;
        
        // Move sender to top of chat order
        setChatOrder(prev => {
          const filtered = prev.filter(id => id !== senderId);
          return [senderId, ...filtered];
        });

        if (activeChatId !== senderId) {
          setUnreadCounts(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }));
        }
      });

      return () => {
        socket.off('friend_added');
        socket.off('receive_message');
      };
    }
  }, [socket, activeChatId, updateFriends]);

  if (!user) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/messages/unread`);
        setUnreadCounts(res.data);
      } catch (err) {
        console.error("Fetch unread error", err);
      }
    };
    if (user) {
      const timer = setTimeout(fetchUnreadCounts, 200);
      return () => clearTimeout(timer);
    }
  }, [user?._id]);

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setUnreadCounts(prev => ({ ...prev, [id]: 0 })); // Clear unread
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Top Navbar */}
      <header className="h-16 px-4 md:px-6 glass flex items-center justify-between shrink-0 z-20 border-b border-[var(--pane-border)] relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 md:hidden rounded-lg hover:bg-[var(--pane-bg)] transition-colors"
          >
            <div className="relative">
              <Logo className="w-8 h-8" />
              {Object.values(unreadCounts).some(count => count > 0) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--pane-bg)]"></div>
              )}
            </div>
          </button>
          <div className="hidden md:block">
            <Logo className="w-10 h-10" />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-[var(--pane-bg)] transition-all duration-300 text-gray-500 hover:text-sagar-blue"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="h-8 w-[1px] bg-[var(--pane-border)] mx-1 hidden md:block"></div>

          <button 
            onClick={logout}
            className="hidden md:flex p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 items-center gap-2 font-bold text-sm px-4 group shadow-sm shadow-red-500/10"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-0 md:p-4 gap-4 max-w-[1600px] w-full mx-auto relative">
        {/* Decorative elements behind panes */}
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-sagar-blue/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[20%] w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Left Pane - Sidebar */}
        <div className={`
          absolute md:relative z-10 w-full md:w-1/3 md:max-w-[400px] h-full flex flex-col sidebar-transition
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar 
            activeChatId={activeChatId} 
            setActiveChatId={handleSelectChat} 
            unreadCounts={unreadCounts}
            chatOrder={chatOrder}
          />
        </div>

        {/* Right Pane - Chat Area */}
        <div className={`
          flex-1 h-full flex flex-col glass md:rounded-2xl overflow-hidden relative z-0 transition-all duration-300
          ${!isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <ChatArea activeChatId={activeChatId} onBack={() => setIsSidebarOpen(true)} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
