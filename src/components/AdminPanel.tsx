import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Square, Upload } from 'lucide-react';
import { MemoryEntry, OFFERING_TYPES } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: Omit<MemoryEntry, 'id'>) => void;
  onUpdateSettings: (showDate: boolean) => void;
  showDate: boolean;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, onAdd, onUpdateSettings, showDate, onExport, onImport, onClear 
}) => {
  const [form, setForm] = useState({
    name: '', place: '', object: '', memory: '', type: 'whisper'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
  };

  const handleSubmit = async () => {
    if (!form.name && !form.memory && !form.object) return;
    setIsSubmitting(true);
    try {
      await onAdd({
        ...form,
        imageFile: imageFile,
        audioFile: audioFile,
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      } as any); // Type assertion to handle temporary File transport
      setForm({ name: '', place: '', object: '', memory: '', type: 'whisper' });
      setImageFile(null);
      setAudioFile(null);
      setImagePreview(null);
      onClose();
    } catch (err) {
      console.error("Admin add failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[400] overflow-y-auto flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="bg-[#faf9f7] w-full max-w-[600px] rounded-sm p-6 md:p-10 relative max-h-full overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-[#6b6760] hover:bg-black/5 rounded-full"><X className="w-5 h-5" /></button>
            
            <h2 className="font-sans font-medium text-xl md:text-2xl mb-1 tracking-tight">Add a Memory</h2>
            <p className="text-[10px] md:text-[12px] text-[#b0ada8] uppercase tracking-widest mb-6 md:mb-8">Place a new stone on the kotangcha</p>

            <div className="space-y-6">
              {/* Image Upload */}
              <label className="block border-2 border-dashed border-black/10 rounded-sm p-6 text-center cursor-pointer hover:bg-[#f2efe9]/50 transition-colors">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="max-h-32 mx-auto rounded-sm" />
                ) : (
                  <div className="space-y-1">
                    <Upload className="mx-auto w-5 h-5 text-[#b0ada8] mb-2" />
                    <p className="text-[12px] font-medium text-[#6b6760]">Upload artwork or photograph</p>
                    <p className="text-[10px] text-[#b0ada8]">JPG, PNG — Optional</p>
                  </div>
                )}
              </label>

              {/* Audio Upload */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-medium tracking-widest text-[#6b6760]">Sound Offering</label>
                <label className="block border border-black/10 rounded-sm p-4 text-center cursor-pointer hover:bg-[#f2efe9]/50 transition-colors">
                  <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
                  {audioFile ? (
                    <div className="flex items-center gap-2 justify-center text-[12px] text-[#b0ada8]">
                      <div className="flex-1 truncate">{audioFile.name}</div>
                      <X onClick={(e) => { e.preventDefault(); setAudioFile(null); }} className="w-4 h-4 hover:text-red-500" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] text-[#6b6760]">Upload a sound</p>
                      <p className="text-[10px] text-[#b0ada8]">MP3, WAV, M4A — Optional</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-[#6b6760]">Name</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-[#6b6760]">Place</label>
                  <input 
                    type="text" 
                    value={form.place} 
                    onChange={e => setForm({ ...form, place: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-medium tracking-widest text-[#6b6760]">Object Remembered</label>
                <input 
                  type="text" 
                  value={form.object} 
                  onChange={e => setForm({ ...form, object: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-medium tracking-widest text-[#6b6760]">Memory / Note</label>
                <textarea 
                  value={form.memory} 
                  onChange={e => setForm({ ...form, memory: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-medium tracking-widest text-[#6b6760]">Offering Type</label>
                <div className="flex flex-wrap gap-2">
                  {OFFERING_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`px-4 py-1.5 rounded-full text-[11px] tracking-wide border transition-all ${
                        form.type === t ? 'bg-[#7a5c3a] text-white border-[#7a5c3a]' : 'bg-transparent text-[#6b6760] border-black/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#1a1917] text-white py-3 rounded-sm text-sm font-medium tracking-widest uppercase hover:opacity-80 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Placing Stone...' : 'Place Stone'}
                </button>
                <button 
                  onClick={onClose}
                  className="px-6 py-3 border border-black/10 text-[#6b6760] rounded-sm text-sm transition-colors hover:bg-[#f2efe9]"
                >
                  Cancel
                </button>
              </div>

              <div className="pt-12 border-t border-black/10 space-y-6">
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-[#b0ada8] font-medium mb-4">Archive Settings</h3>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative inline-block w-10 h-5">
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={showDate}
                        onChange={e => onUpdateSettings(e.target.checked)}
                      />
                      <div className={`absolute inset-0 rounded-full transition-colors ${showDate ? 'bg-[#7a5c3a]' : 'bg-black/10 group-hover:bg-black/20'}`} />
                      <motion.div 
                        animate={{ x: showDate ? 20 : 0 }}
                        className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                    <span className="text-xs text-[#6b6760]">Show date on archive cards</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[11px] uppercase tracking-widest text-[#b0ada8] font-medium">Data Management</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={onExport} className="px-4 py-2 border border-black/10 text-[11px] text-[#6b6760] rounded-sm hover:bg-[#f2efe9]">Export JSON</button>
                    <label className="px-4 py-2 border border-black/10 text-[11px] text-[#6b6760] rounded-sm hover:bg-[#f2efe9] cursor-pointer">
                      Import JSON
                      <input type="file" accept=".json" onChange={onImport} className="hidden" />
                    </label>
                    <button onClick={onClear} className="px-4 py-2 border border-red-200 text-[11px] text-red-500 rounded-sm hover:bg-red-50">Clear Archive</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
