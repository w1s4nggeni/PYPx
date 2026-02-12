
import React, { useEffect } from 'react';

interface PianoProps {
  onPlay: (note: string) => void;
  onStop: (note: string) => void;
  targetNote?: string;
}

const Piano: React.FC<PianoProps> = ({ onPlay, onStop, targetNote }) => {
  const whiteKeys = [
    { note: 'C4', key: 'a' }, { note: 'D4', key: 's' }, { note: 'E4', key: 'd' }, 
    { note: 'F4', key: 'f' }, { note: 'G4', key: 'g' }, { note: 'A4', key: 'h' }, 
    { note: 'B4', key: 'j' }, { note: 'C5', key: 'k' }, { note: 'D5', key: 'l' }, 
    { note: 'E5', key: ';' }, { note: 'F5', key: "'" }, { note: 'G5', key: 'z' }, 
    { note: 'A5', key: 'x' }, { note: 'B5', key: 'c' }
  ];
  
  const blackKeys = [
    { note: 'C#4', offset: 'left-[7%]', key: 'w' },
    { note: 'D#4', offset: 'left-[14%]', key: 'e' },
    { note: 'F#4', offset: 'left-[28.5%]', key: 't' },
    { note: 'G#4', offset: 'left-[35.5%]', key: 'y' },
    { note: 'A#4', offset: 'left-[42.5%]', key: 'u' },
    { note: 'C#5', offset: 'left-[57%]', key: 'o' },
    { note: 'D#5', offset: 'left-[64%]', key: 'p' },
    { note: 'F#5', offset: 'left-[78.5%]', key: '[' },
    { note: 'G#5', offset: 'left-[85.5%]', key: ']' },
    { note: 'A#5', offset: 'left-[92.5%]', key: '\\' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const whiteMatch = whiteKeys.find(k => k.key === key);
      const blackMatch = blackKeys.find(k => k.key === key);
      
      if (whiteMatch) onPlay(whiteMatch.note);
      if (blackMatch) onPlay(blackMatch.note);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const whiteMatch = whiteKeys.find(k => k.key === key);
      const blackMatch = blackKeys.find(k => k.key === key);
      
      if (whiteMatch) onStop(whiteMatch.note);
      if (blackMatch) onStop(blackMatch.note);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPlay, onStop]);

  return (
    <div className="relative w-full max-w-4xl h-80 flex bg-slate-900 p-4 rounded-xl shadow-2xl">
      {whiteKeys.map((item) => (
        <button
          key={item.note}
          onMouseDown={() => onPlay(item.note)}
          onMouseUp={() => onStop(item.note)}
          onMouseLeave={() => onStop(item.note)}
          className={`flex-1 border border-slate-300 rounded-b-lg hover:bg-slate-100 active:bg-amber-200 active:scale-[0.98] transition-all relative group ${
            targetNote === item.note ? 'bg-amber-100 ring-4 ring-amber-400 ring-inset z-20 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : 'bg-white'
          }`}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase">
            {item.key}
          </div>
          <span className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] transition-colors uppercase font-bold ${
            targetNote === item.note ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            {item.note}
          </span>
        </button>
      ))}
      
      {blackKeys.map((k) => (
        <button
          key={k.note}
          onMouseDown={() => onPlay(k.note)}
          onMouseUp={() => onStop(k.note)}
          onMouseLeave={() => onStop(k.note)}
          className={`absolute ${k.offset} top-4 w-[5%] h-48 border-x border-b border-slate-900 rounded-b-lg hover:bg-slate-700 active:bg-amber-600 active:scale-[0.98] transition-all z-10 shadow-lg flex flex-col items-center justify-start pt-4 ${
            targetNote === k.note ? 'bg-amber-600 ring-2 ring-amber-400 z-30 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : 'bg-slate-800'
          }`}
        >
          <span className="text-[10px] font-black text-slate-500 uppercase">{k.key}</span>
        </button>
      ))}
    </div>
  );
};

export default Piano;
