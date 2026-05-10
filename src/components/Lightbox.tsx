import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Square } from 'lucide-react';
import { MemoryEntry, AppSettings, PALETTES } from '../types';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  memory: MemoryEntry | null;
  idx: number;
  settings: AppSettings;
  isLoggedIn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ 
  isOpen, onClose, memory, idx, settings, isLoggedIn, onEdit, onDelete 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && memory?.audio) {
      const audio = new Audio(memory.audio);
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      };
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };
      return () => {
        audio.pause();
        audioRef.current = null;
      };
    } else {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [isOpen, memory]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!memory) return null;

  const pal = PALETTES[idx % PALETTES.length];
  const metaParts = [memory.type, memory.place, settings.showDate ? memory.date : ''].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-6 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
            className="bg-[#faf9f7] w-full max-w-[520px] rounded-sm p-10 relative max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 text-[#6b6760] hover:bg-black/5 rounded-full"><X className="w-5 h-5" /></button>
            
            <div className="h-1 w-10 mb-6 rounded-full" style={{ backgroundColor: pal[1] }} />
            
            <h2 className="font-sans font-medium text-3xl mb-1 text-[#1a1917] tracking-tight">{memory.name}</h2>
            <div className="text-xs text-[#b0ada8] uppercase tracking-[0.15em] mb-8">{metaParts.join(' · ')}</div>

            <div className="space-y-8">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#c4a882] mb-1.5">Object remembered</div>
                <div className="text-sm leading-relaxed text-[#1a1917]">{memory.object || '—'}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#c4a882] mb-1.5 font-sans font-medium">Memory / Offering</div>
                <div className="text-[15px] leading-relaxed text-[#6b6760] italic font-sans font-light tracking-wide">&ldquo;{memory.memory || '—'}&rdquo;</div>
              </div>

              {memory.image && (
                <img src={memory.image} alt="" className="w-full h-auto rounded-sm shadow-md" />
              )}

              {memory.audio && (
                <div className="bg-[#f2efe9] border border-black/10 rounded-md p-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={toggleAudio}
                      className="w-10 h-10 flex items-center justify-center bg-[#1a1917] text-white rounded-full hover:opacity-80 transition-opacity"
                    >
                      {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-2">
                      <div className="text-[10px] uppercase tracking-widest text-[#6b6760]">Sound Offering</div>
                      <div className="relative h-1 bg-black/10 rounded-full cursor-pointer overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-[#c4a882]" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="text-[9px] text-[#b0ada8] tracking-widest font-mono">
                        {fmtTime(currentTime)} / {fmtTime(duration)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isLoggedIn && (
                <div className="flex gap-4 pt-8 border-t border-black/10">
                  <button onClick={onEdit} className="flex-1 py-3 border border-black/10 text-[11px] uppercase tracking-widest text-[#6b6760] hover:bg-black/5 rounded-sm">Edit Memory</button>
                  <button onClick={onDelete} className="flex-1 py-3 border border-red-200 text-[11px] uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-sm">Delete</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const fmtTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
