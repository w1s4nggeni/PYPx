
import React, { useEffect } from 'react';

interface DrumsProps {
  onPlay: (note: string) => void;
  targetNote?: string;
}

const Drums: React.FC<DrumsProps> = ({ onPlay, targetNote }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === ' ') {
        e.preventDefault();
        onPlay('kick');
      }
      if (key === 's') onPlay('snare');
      if (key === 'h') onPlay('hihat');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlay]);

  return (
    <div className="relative w-full max-w-2xl aspect-square grid grid-cols-2 grid-rows-2 gap-4">
      {/* Hi-Hat */}
      <button 
        onMouseDown={() => onPlay('hihat')}
        className={`col-span-1 row-span-1 glass flex flex-col items-center justify-center rounded-full hover:bg-amber-500/20 active:scale-95 transition-all border-amber-500/30 relative ${
          targetNote === 'hihat' ? 'ring-4 ring-amber-400 bg-amber-500/10 shadow-[0_0_30px_rgba(251,191,36,0.4)]' : ''
        }`}
      >
        <span className="absolute top-6 text-[10px] font-black text-amber-500 opacity-50 uppercase tracking-widest">[H]</span>
        <div className={`w-24 h-4 rounded-full shadow-lg mb-2 ${targetNote === 'hihat' ? 'bg-amber-300' : 'bg-amber-400'}`} />
        <span className={`text-xs font-bold ${targetNote === 'hihat' ? 'text-amber-300' : 'text-amber-500'}`}>HI-HAT</span>
      </button>

      {/* Snare */}
      <button 
        onMouseDown={() => onPlay('snare')}
        className={`col-span-1 row-span-1 glass flex flex-col items-center justify-center rounded-full hover:bg-slate-400/20 active:scale-95 transition-all border-slate-400/30 relative ${
          targetNote === 'snare' ? 'ring-4 ring-amber-400 bg-amber-500/10 shadow-[0_0_30px_rgba(251,191,36,0.4)]' : ''
        }`}
      >
        <span className="absolute top-6 text-[10px] font-black text-slate-500 opacity-50 uppercase tracking-widest">[S]</span>
        <div className={`w-32 h-32 rounded-full border-8 bg-white shadow-inner flex items-center justify-center ${targetNote === 'snare' ? 'border-amber-400' : 'border-slate-700'}`}>
             <div className="w-24 h-24 rounded-full border-2 border-slate-200 bg-slate-50" />
        </div>
        <span className={`mt-2 text-xs font-bold ${targetNote === 'snare' ? 'text-amber-400' : 'text-slate-400'}`}>SNARE</span>
      </button>

      {/* Kick */}
      <button 
        onMouseDown={() => onPlay('kick')}
        className={`col-span-2 row-span-1 glass flex flex-col items-center justify-center rounded-full hover:bg-slate-800/50 active:scale-95 transition-all border-slate-700/30 relative ${
          targetNote === 'kick' ? 'ring-4 ring-amber-400 bg-amber-500/10 shadow-[0_0_30px_rgba(251,191,36,0.4)]' : ''
        }`}
      >
        <span className="absolute top-8 text-[10px] font-black text-slate-500 opacity-50 uppercase tracking-widest">[SPACE]</span>
        <div className={`w-48 h-48 rounded-full border-[12px] bg-slate-900 shadow-xl flex items-center justify-center ${targetNote === 'kick' ? 'border-amber-500' : 'border-slate-800'}`}>
            <div className={`w-32 h-32 rounded-full border-4 opacity-50 ${targetNote === 'kick' ? 'border-amber-400' : 'border-slate-700'}`} />
        </div>
        <span className={`mt-4 text-xs font-bold ${targetNote === 'kick' ? 'text-amber-400' : 'text-slate-500'}`}>BASS DRUM</span>
      </button>
    </div>
  );
};

export default Drums;
