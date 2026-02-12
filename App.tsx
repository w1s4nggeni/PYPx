
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { InstrumentType, Recording, NoteEvent, Tutorial } from './types';
import Piano from './components/Piano';
import Drums from './components/Drums';
import Violin from './components/Violin';
import Harp from './components/Harp';
import Chimes from './components/Chimes';
import AITutor from './components/AITutor';
import { audioService } from './services/audioService';
import { reviewRecording, generateTutorial } from './services/geminiService';

const GENRES = ['Classical', 'Pop', 'Jazz', 'Rock', 'Lo-fi', 'Folk', 'Electronic'];

const App: React.FC = () => {
  const [activeInstrument, setActiveInstrument] = useState<InstrumentType>(InstrumentType.PIANO);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<NoteEvent[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [lastReview, setLastReview] = useState<{ badgeName: string, feedback: string, starRating: number } | null>(null);
  
  // Tutorial State
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isGeneratingTutorial, setIsGeneratingTutorial] = useState(false);
  const [songSearch, setSongSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);

  // MIDI State
  const [midiDevice, setMidiDevice] = useState<string | null>(null);
  
  // Refs for MIDI to avoid re-binding listeners every render
  const handlersRef = useRef({
    play: (note: string) => {},
    stop: (note: string) => {},
    instrument: activeInstrument
  });

  const completeTutorial = useCallback(async (tutorial: Tutorial) => {
    const notes: NoteEvent[] = tutorial.steps.map((s, i) => ({ note: s.note, timestamp: Date.now() + i * 500 }));
    const newRec: Recording = {
      id: "tut-" + Math.random().toString(36).substr(2, 5),
      instrument: handlersRef.current.instrument,
      notes: notes,
      timestamp: Date.now()
    };
    setActiveTutorial(null);
    setRecordings(prev => [newRec, ...prev]);
    const review = await reviewRecording(newRec);
    setLastReview(review);
  }, []);

  const handlePlayNote = useCallback((note: string) => {
    audioService.startNote(activeInstrument, note);
    
    if (isRecording) {
      setCurrentRecording(prev => [...prev, { note, timestamp: Date.now() }]);
    }

    if (activeTutorial) {
      const targetNote = activeTutorial.steps[tutorialStep].note;
      if (note === targetNote) {
        if (tutorialStep === activeTutorial.steps.length - 1) {
          completeTutorial(activeTutorial);
        } else {
          setTutorialStep(prev => prev + 1);
        }
      }
    }
  }, [activeInstrument, isRecording, activeTutorial, tutorialStep, completeTutorial]);

  const handleStopNote = useCallback((note: string) => {
    audioService.stopNote(note);
  }, []);

  // Update refs whenever dependencies change
  useEffect(() => {
    handlersRef.current = {
      play: handlePlayNote,
      stop: handleStopNote,
      instrument: activeInstrument
    };
  }, [handlePlayNote, handleStopNote, activeInstrument]);

  // Web MIDI Setup - Only runs once
  useEffect(() => {
    let midiAccess: any = null;

    const midiToNoteString = (midi: number): string => {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      let octave = Math.floor(midi / 12) - 1;
      const noteName = notes[midi % 12];
      if (octave < 4) octave = 4;
      if (octave > 5) octave = 5;
      return `${noteName}${octave}`;
    };

    const onMIDIMessage = (message: any) => {
      const [command, note, velocity] = message.data;
      if (command === 144 && velocity > 0) {
        handlersRef.current.play(midiToNoteString(note));
      } else if (command === 128 || (command === 144 && velocity === 0)) {
        handlersRef.current.stop(midiToNoteString(note));
      }
    };

    const startMIDI = async () => {
      if (navigator.requestMIDIAccess) {
        try {
          midiAccess = await navigator.requestMIDIAccess();
          const inputs = midiAccess.inputs.values();
          for (const input of inputs) {
            setMidiDevice(input.name || 'External Keyboard');
            input.onmidimessage = onMIDIMessage;
          }
          midiAccess.onstatechange = (e: any) => {
            if (e.port.state === 'connected' && e.port.type === 'input') {
              setMidiDevice(e.port.name);
              e.port.onmidimessage = onMIDIMessage;
            } else if (e.port.state === 'disconnected') {
              setMidiDevice(null);
            }
          };
        } catch (err) {
          console.warn("MIDI Access Denied", err);
        }
      }
    };

    startMIDI();

    return () => {
      if (midiAccess) {
        const inputs = midiAccess.inputs.values();
        for (const input of inputs) {
          input.onmidimessage = null;
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (currentRecording.length > 0) {
        const newRec: Recording = {
          id: Math.random().toString(36).substr(2, 9),
          instrument: activeInstrument,
          notes: [...currentRecording],
          timestamp: Date.now()
        };
        saveRecording(newRec);
      }
      setIsRecording(false);
      setCurrentRecording([]);
    } else {
      setIsRecording(true);
      setCurrentRecording([]);
      setLastReview(null);
      setActiveTutorial(null);
    }
  };

  const startNewTutorial = async (songName?: string) => {
    setIsGeneratingTutorial(true);
    setIsRecording(false);
    setLastReview(null);
    const tut = await generateTutorial(activeInstrument, songName, selectedGenre);
    setActiveTutorial(tut);
    setTutorialStep(0);
    setIsGeneratingTutorial(false);
    setSongSearch('');
  };

  const saveRecording = async (rec: Recording) => {
    setRecordings(prev => [rec, ...prev]);
    const review = await reviewRecording(rec);
    setLastReview(review);
  };

  const renderInstrument = () => {
    const targetNote = activeTutorial ? activeTutorial.steps[tutorialStep].note : undefined;
    switch (activeInstrument) {
      case InstrumentType.PIANO: return <Piano onPlay={handlePlayNote} onStop={handleStopNote} targetNote={targetNote} />;
      case InstrumentType.DRUMS: return <Drums onPlay={handlePlayNote} targetNote={targetNote} />;
      case InstrumentType.VIOLIN: return <Violin onPlay={handlePlayNote} onStop={handleStopNote} targetNote={targetNote} />;
      case InstrumentType.HARP: return <Harp onPlay={handlePlayNote} onStop={handleStopNote} targetNote={targetNote} />;
      case InstrumentType.CHIMES: return <Chimes onPlay={handlePlayNote} onStop={handleStopNote} targetNote={targetNote} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-4 gap-4 bg-slate-950 overflow-hidden">
      {/* Sidebar Controls */}
      <div className="lg:w-1/4 flex flex-col gap-4">
        <header className="glass p-6 rounded-3xl">
          <h1 className="text-3xl font-serif text-amber-400 mb-1">Maestro Spark</h1>
          <p className="text-slate-400 text-xs tracking-widest uppercase font-bold opacity-50">Academy of Sound</p>
        </header>

        <div className="glass p-4 rounded-3xl">
           <div className="flex items-center justify-between px-2 mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">MIDI Connection</h2>
              <div className={`w-2 h-2 rounded-full ${midiDevice ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`} />
           </div>
           {midiDevice ? (
             <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in">
                <span className="text-xl">🎹</span>
                <div>
                   <p className="text-[10px] text-green-400 font-bold uppercase tracking-tighter">Connected Hardware</p>
                   <p className="text-xs text-slate-200 truncate font-medium">{midiDevice}</p>
                </div>
             </div>
           ) : (
             <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Keyboard Mode Active</p>
             </div>
           )}
        </div>

        <nav className="glass p-4 rounded-3xl flex flex-col gap-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-2">Instruments</h2>
          {(Object.keys(InstrumentType) as Array<keyof typeof InstrumentType>).map((key) => (
            <button
              key={key}
              onClick={() => {
                setActiveInstrument(InstrumentType[key]);
                setActiveTutorial(null);
              }}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                activeInstrument === InstrumentType[key] 
                  ? 'bg-amber-500 text-slate-950 font-bold scale-105 shadow-[0_10px_20px_rgba(245,158,11,0.2)]' 
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span className="text-xl">
                {key === 'PIANO' && '🎹'}
                {key === 'DRUMS' && '🥁'}
                {key === 'VIOLIN' && '🎻'}
                {key === 'HARP' && '🎼'}
                {key === 'CHIMES' && '🔔'}
              </span>
              <span className="text-sm">{key.charAt(0) + key.slice(1).toLowerCase()}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto">
            <AITutor activeInstrument={activeInstrument} />
        </div>
      </div>

      <main className="flex-1 flex flex-col gap-4 relative">
        <div className="glass p-5 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <button
              onClick={toggleRecording}
              disabled={isGeneratingTutorial || !!activeTutorial}
              className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${
                isRecording ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-30`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
              {isRecording ? 'Stop Rec' : 'Start Rec'}
            </button>

            <div className="h-10 w-px bg-slate-800 hidden md:block" />

            <div className="flex flex-col gap-2 flex-1 md:flex-none">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter ml-1">Academy Search</span>
              <div className="flex items-center bg-slate-900/80 rounded-2xl border border-slate-700/50 p-1.5 focus-within:border-amber-500/50 transition-colors">
                <input 
                  type="text"
                  placeholder="Song name..."
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && songSearch && startNewTutorial(songSearch)}
                  className="bg-transparent text-sm px-4 outline-none w-full md:w-64 text-slate-200"
                  disabled={isGeneratingTutorial || isRecording}
                />
                <button
                  onClick={() => startNewTutorial(songSearch)}
                  disabled={isGeneratingTutorial || isRecording || !songSearch}
                  className="bg-amber-500 text-slate-950 h-8 px-5 rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform disabled:opacity-30"
                >
                  Learn
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter ml-1">Genre Style</span>
              <select 
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                disabled={isGeneratingTutorial || isRecording}
                className="bg-slate-900/80 text-slate-200 text-xs px-4 py-2.5 rounded-2xl border border-slate-700/50 outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          
          <button
            onClick={() => startNewTutorial()}
            disabled={isGeneratingTutorial || isRecording}
            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-slate-800 text-amber-500 transition-all border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30`}
          >
            {isGeneratingTutorial ? '✨ Tuning...' : '🎲 Random'}
          </button>
        </div>

        <div className="flex-1 glass rounded-[48px] flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {activeTutorial && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 z-30">
                <div className="glass p-6 rounded-[32px] border-amber-500/40 shadow-[0_20px_40px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-top-6 duration-500">
                  <div className="flex justify-between items-end mb-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">MELODY</span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{selectedGenre} Style</span>
                      </div>
                      <h3 className="text-2xl font-serif text-amber-400 truncate max-w-sm">{activeTutorial.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-500 text-xl font-black">{Math.round((tutorialStep / activeTutorial.steps.length) * 100)}%</div>
                      <div className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter">Progress</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2.5 h-20 overflow-x-auto pb-4 scrollbar-hide mask-fade-edges">
                    {activeTutorial.steps.map((step, idx) => {
                      const isPlayed = idx < tutorialStep;
                      const isActive = idx === tutorialStep;
                      return (
                        <div 
                          key={idx}
                          className={`flex-none w-16 flex flex-col items-center justify-center rounded-2xl border transition-all duration-500 ${
                            isPlayed ? 'bg-green-500/10 border-green-500/40 text-green-400 opacity-40 scale-90' :
                            isActive ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse scale-110 shadow-[0_0_20px_rgba(251,191,36,0.2)]' :
                            'bg-slate-800/40 border-slate-700/50 text-slate-600'
                          }`}
                        >
                          <span className="text-sm font-black tracking-tighter">{step.note}</span>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isPlayed ? 'bg-green-500' : isActive ? 'bg-amber-500' : 'bg-slate-800'}`} />
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <span className="text-amber-500 text-sm animate-bounce">🎹</span>
                      </div>
                      <p className="text-slate-200 text-sm font-medium">
                        Play the <strong className="text-amber-400 underline decoration-amber-400/30 underline-offset-4">{activeTutorial.steps[tutorialStep].note}</strong> key
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTutorial(null)}
                      className="text-slate-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-500/10"
                    >
                      Exit Lesson
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1)_0%,_transparent_70%)]" />
                <svg width="100%" height="100%" className="text-slate-800">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
            
            <div className="w-full h-full flex items-center justify-center pt-40 scale-110">
                {renderInstrument()}
            </div>

            {lastReview && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-50 animate-in fade-in duration-500 p-8">
                    <div className="glass p-16 rounded-[64px] max-w-xl text-center border-amber-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        <div className="relative inline-block mb-8">
                          <div className="absolute inset-0 bg-amber-400 blur-[80px] opacity-20 animate-pulse" />
                          <div className="text-8xl relative drop-shadow-2xl">🌟</div>
                        </div>
                        <h2 className="text-5xl font-serif text-amber-400 mb-4 leading-tight">{lastReview.badgeName}</h2>
                        <div className="flex justify-center gap-3 mb-8">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-4xl transition-all duration-700 delay-[${i*100}ms] ${i < lastReview.starRating ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-110' : 'text-slate-900'}`}>★</span>
                            ))}
                        </div>
                        <p className="text-slate-300 text-xl italic mb-10 leading-relaxed max-w-md mx-auto">"{lastReview.feedback}"</p>
                        <div className="flex flex-col items-center gap-4">
                          <button 
                              onClick={() => setLastReview(null)}
                              className="group relative bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-[0.2em] px-14 py-5 rounded-full hover:scale-105 hover:shadow-[0_15px_30px_rgba(245,158,11,0.3)] transition-all active:scale-95"
                          >
                              Master Next Melody
                              <div className="absolute inset-0 rounded-full border border-white/20 scale-105 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                          </button>
                          <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Academy Records Updated</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
