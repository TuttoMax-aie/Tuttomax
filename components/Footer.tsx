
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-6 relative z-10">
      <div className="container mx-auto px-4 text-center">
        <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
          TuttoMax Android Convert &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};
