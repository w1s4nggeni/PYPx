
import React, { useEffect } from 'react';

interface ChimesProps {
  onPlay: (note: string) => void;
  onStop: (note: string) => void;
  targetNote?: string;
}

const Chimes: React.FC<ChimesProps> = ({ onPlay, onStop, targetNote }) => {
  const chimes = [
    { note: 'C5', height: 'h-64', key: '1' },
    { note: 'E5', height: 'h-60', key: '2' },
    { note: 'G5', height: 'h-56', key: '3' },
    { note: 'B5', height: 'h-52', key: '4' },
    { note: 'D5', height: 'h-48', key: '5' },
    { note: 'F5', height: 'h-44', key: '6' },
    { note: 'A5', height: 'h-40', key: '7' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const match = chimes.find(c => c.key === e.key);
      if (match) onPlay(match.note);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const match = chimes.find(c => c.key === e.key);
      if (match) onStop(match.note);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPlay, onStop]);

  return (
    <div className="flex gap-6 items-start h-96">
      {chimes.map((c, idx) => {
        const isTarget = targetNote === c.note;
        return (
          <div 
            key={idx}
            className="group flex flex-col items-center cursor-crosshair"
            onMouseEnter={() => onPlay(c.note)}
            onMouseLeave={() => onStop(c.note)}
          >
            <span className="text-[10px] font-black text-slate-600/40 mb-2">{c.key}</span>
            {/* Thread */}
            <div className={`w-px h-10 ${isTarget ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
            {/* The Tube */}
            <div 
              className={`${c.height} w-4 rounded-full border transition-all shadow-xl ${
                isTarget 
                  ? 'bg-gradient-to-b from-amber-200 to-amber-500 border-amber-300 ring-4 ring-amber-400/30 scale-110 -translate-y-2' 
                  : 'bg-gradient-to-b from-slate-400 to-slate-600 border-slate-500 group-hover:translate-x-1 group-hover:rotate-3'
              }`}
            />
            <span className={`mt-4 text-[10px] font-bold transition-opacity ${
                isTarget ? 'opacity-100 text-amber-400 scale-125' : 'text-slate-500 opacity-0 group-hover:opacity-100'
            }`}>
              {c.note}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Chimes;
