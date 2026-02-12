
import React, { useState, useRef, useEffect } from 'react';
import { InstrumentType, TutorMessage } from '../types';
import { getTutorResponse } from '../services/geminiService';

interface AITutorProps {
  activeInstrument: InstrumentType;
}

const AITutor: React.FC<AITutorProps> = ({ activeInstrument }) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    { role: 'ai', content: "Greetings, apprentice! I am Maestro Spark. Ready to make some magic with the " + activeInstrument.toLowerCase() + "?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: TutorMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const aiResponse = await getTutorResponse(input, activeInstrument);
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="glass rounded-3xl flex flex-col h-[400px] overflow-hidden">
      <div className="p-4 bg-amber-500/10 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-bold text-amber-400 text-sm">Maestro Spark</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-amber-600 text-slate-50 rounded-tr-none' 
                : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
            <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
            </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the Maestro..."
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-amber-500/50"
        />
        <button 
          onClick={handleSend}
          className="bg-amber-500 text-slate-950 p-2 rounded-full hover:scale-105 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AITutor;
