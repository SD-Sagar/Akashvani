import React from 'react';

const Logo = ({ className = 'w-12 h-12' }) => {
  const isCol = className.includes('flex-col');
  return (
    <div className={`flex items-center gap-3 group ${className} ${isCol ? 'items-center text-center' : ''}`}>
      <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-sagar-blue/30 rounded-full blur-xl group-hover:bg-sagar-blue/50 transition-all duration-500 animate-pulse"></div>
        
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-[0_0_12px_rgba(0,123,255,0.6)]"
        >
          <defs>
            <linearGradient id="cosmicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#007BFF" />
              <stop offset="50%" stopColor="#00D2FF" />
              <stop offset="100%" stopColor="#007BFF" />
            </linearGradient>
            
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Rotating Signal Rings */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="url(#cosmicGradient)" 
            strokeWidth="2" 
            strokeDasharray="10 20" 
            className="animate-[spin_12s_linear_infinite] opacity-30"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            stroke="url(#cosmicGradient)" 
            strokeWidth="3" 
            strokeDasharray="40 10" 
            className="animate-[spin_6s_linear_infinite_reverse] opacity-50"
          />

          {/* Core Signal Pulse */}
          <path
            d="M50 15 C65 15 85 35 85 50 C85 65 65 85 50 85 C35 85 15 65 15 50 C15 35 35 15 50 15Z"
            fill="url(#cosmicGradient)"
            className="animate-[pulse_3s_ease-in-out_infinite]"
            style={{ transformOrigin: 'center' }}
          />
          
          {/* Central 'Vani' (Voice/Signal) Wave */}
          <path
            d="M35 50 Q42.5 35 50 50 Q57.5 65 65 50"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            className="animate-[pulse_1.5s_ease-in-out_infinite]"
          />
          
          {/* Orbiting Satellite Dot */}
          <g className="animate-[spin_4s_linear_infinite]">
            <circle cx="85" cy="50" r="5" fill="white" filter="url(#neonGlow)" />
          </g>
        </svg>
      </div>
      
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-none">
          <span className="text-[var(--foreground)]">Akash</span>
          <span className="text-sagar-blue drop-shadow-[0_0_8px_rgba(0,123,255,0.4)]">vani</span>
        </h1>
        <div className="flex items-center gap-1.5">
          <div className="h-[1px] w-4 bg-sagar-blue/40"></div>
          <span className="text-[9px] font-bold tracking-[0.3em] opacity-40 uppercase whitespace-nowrap">
            Celestial Messaging
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
