
import React, { useEffect } from 'react';

interface HarpProps {
  onPlay: (note: string) => void;
  onStop: (note: string) => void;
  targetNote?: string;
}

const Harp: React.FC<HarpProps> = ({ onPlay, onStop, targetNote }) => {
  const notes = [
    { note: 'C4', key: '1' }, { note: 'D4', key: '2' }, { note: 'E4', key: '3' }, 
    { note: 'F4', key: '4' }, { note: 'G4', key: '5' }, { note: 'A4', key: '6' }, 
    { note: 'B4', key: '7' }, { note: 'C5', key: '8' }, { note: 'D5', key: '9' }, 
    { note: 'E5', key: '0' }, { note: 'F5', key: '-' }, { note: 'G5', key: '=' }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const match = notes.find(n => n.key === e.key);
      if (match) onPlay(match.note);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const match = notes.find(n => n.key === e.key);
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
    <div className="relative w-full max-w-2xl h-96 flex items-end justify-between px-10">
      {/* Decorative Frame */}
      <div className="absolute inset-0 border-[16px] border-amber-900/40 rounded-t-[100px] border-b-0 pointer-events-none" />
      
      {notes.map((item, idx) => {
        const height = 60 + (idx * 3);
        const isTarget = targetNote === item.note;
        return (
          <div 
            key={idx}
            className="group relative h-full flex flex-col items-center cursor-pointer"
            onMouseEnter={() => onPlay(item.note)}
            onMouseLeave={() => onStop(item.note)}
          >
            <span className="text-[8px] font-black text-amber-600/40 mb-2">{item.key}</span>
            <div className="flex-1 relative w-4 flex justify-center">
                {isTarget && <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-amber-400/20 blur-sm rounded-full animate-pulse" />}
                <div 
                className={`transition-all rounded-full active:animate-pluck ${
                    isTarget ? 'w-1 bg-white shadow-[0_0_15px_white] scale-x-125' : 'w-0.5 bg-amber-200/50 group-hover:bg-amber-400 group-hover:w-1'
                }`}
                style={{ height: `${height}%` }}
                />
            </div>
            <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-opacity ${
                isTarget ? 'opacity-100 text-white scale-110' : 'text-amber-500 opacity-0 group-hover:opacity-100'
            }`}>
                {item.note}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Harp;
