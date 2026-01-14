import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3 border-b border-white/5">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          </div>
          <h1 className="text-lg font-black tracking-tight italic">
            <span className="text-blue-500">TuttoMax</span>
            <span className="text-yellow-400">Android</span>
            <span className="text-white">Convert</span>
          </h1>
        </div>
      </div>
    </header>
  );
};