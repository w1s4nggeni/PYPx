
import React, { useEffect } from 'react';

interface ViolinProps {
  onPlay: (note: string) => void;
  onStop: (note: string) => void;
  targetNote?: string;
}

const Violin: React.FC<ViolinProps> = ({ onPlay, onStop, targetNote }) => {
  const strings = [
    { note: 'E5', color: 'bg-amber-100', key: '4' },
    { note: 'A4', color: 'bg-amber-200', key: '3' },
    { note: 'D4', color: 'bg-amber-300', key: '2' },
    { note: 'G4', color: 'bg-amber-400', key: '1' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const match = strings.find(s => s.key === e.key);
      if (match) onPlay(match.note);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const match = strings.find(s => s.key === e.key);
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
    <div className="relative h-full w-48 flex bg-orange-900/40 rounded-full py-20 px-4 border border-orange-800/30">
      <div className="flex-1 flex justify-around">
        {strings.map((s, idx) => (
          <div 
            key={idx} 
            className="relative h-full w-4 group cursor-pointer" 
            onMouseEnter={() => onPlay(s.note)}
            onMouseLeave={() => onStop(s.note)}
          >
            {/* String Shadow */}
            <div className="absolute inset-0 bg-black/40 blur-sm translate-x-1" />
            
            {/* Target Highlight Glow */}
            {targetNote === s.note && (
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-amber-400/20 blur-md animate-pulse" />
            )}

            {/* The String */}
            <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all group-hover:w-1 group-hover:scale-x-150 active:animate-pluck ${
               targetNote === s.note ? 'w-1.5 bg-white shadow-[0_0_10px_white]' : `w-0.5 ${s.color}`
            }`} />
            
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-[10px] font-bold transition-opacity ${
                targetNote === s.note ? 'opacity-100 text-amber-300 scale-125' : 'text-orange-200 opacity-0 group-hover:opacity-100'
            }`}>
                {s.note} ({s.key})
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-[10px] font-black text-orange-400/30">
              {s.key}
            </div>
          </div>
        ))}
      </div>
      
      {/* Violin Body Bridges (Visual) */}
      <div className="absolute top-1/4 left-0 w-full h-2 bg-orange-950/80 rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-full h-2 bg-orange-950/80 rounded-full" />
    </div>
  );
};

export default Violin;
