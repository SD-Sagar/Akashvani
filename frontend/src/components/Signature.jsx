import React from 'react';

const Signature = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center gap-1.5 py-3 opacity-40 hover:opacity-100 transition-all duration-500 cursor-default group ${className}`}>
      <span className="text-[10px] tracking-widest uppercase font-medium">Crafted with</span>
      <span className="text-sagar-blue animate-pulse text-xs">💙</span>
      <span className="text-[10px] tracking-widest uppercase font-bold group-hover:text-sagar-blue transition-colors">by Sagar Dey</span>
      <span className="text-[8px] opacity-70 ml-0.5">© {new Date().getFullYear()}</span>
    </div>
  );
};

export default Signature;
