
import React, { useRef } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div 
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center w-full h-64 
          border-2 border-dashed rounded-[3rem] cursor-pointer 
          transition-all duration-300 relative overflow-hidden
          ${isLoading 
            ? 'bg-white/5 border-white/10 cursor-not-allowed' 
            : 'bg-gradient-to-b from-blue-600/5 to-transparent border-white/10 active:scale-[0.98] shadow-2xl hover:border-blue-500/50'}
        `}
      >
        <div className="flex flex-col items-center text-center pointer-events-none p-6">
          <div className="mb-4 p-5 bg-blue-500/10 rounded-full text-blue-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h3 className="text-xl text-white font-black uppercase italic tracking-tight">Carica file GPX</h3>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Tocca per selezionare dal dispositivo</p>
        </div>
        <input ref={inputRef} type="file" className="hidden" accept=".gpx" onChange={handleFileChange} disabled={isLoading} />
      </div>

      <div className="bg-slate-900/30 p-6 rounded-[2rem] border border-white/5 shadow-inner">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Come funziona</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Seleziona un file .gpx esportato dal tuo navigatore. L'app estrarrà automaticamente il percorso e i punti di interesse per creare un itinerario navigabile su Google Maps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
