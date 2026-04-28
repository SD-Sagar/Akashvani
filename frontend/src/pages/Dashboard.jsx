import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!user) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setIsSidebarOpen(false); // Close sidebar on mobile when chat selected
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
            <Logo className="w-8 h-8" />
          </button>
          <div className="hidden md:block">
            <Logo className="w-10 h-10" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--pane-bg)] transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <span className="font-medium opacity-80 hidden sm:block">{user.username}</span>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sagar-blue flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-0 md:p-4 gap-4 max-w-[1600px] w-full mx-auto relative">
        {/* Decorative elements behind panes */}
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-sagar-blue/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[20%] w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Left Pane - Sidebar */}
        <div className={`
          absolute md:relative z-10 w-full md:w-1/3 md:max-w-[400px] h-full flex flex-col transition-all duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar activeChatId={activeChatId} setActiveChatId={handleSelectChat} />
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
