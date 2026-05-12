import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { MemoryEntry, PALETTES, AppSettings } from '../types';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchiveDrawer: React.FC<DrawerProps & { 
  memories: MemoryEntry[], 
  settings: AppSettings,
  isLoggedIn: boolean,
  onOpenMemory: (idx: number) => void,
  onEdit: (idx: number) => void,
  onDelete: (idx: number) => void,
  onVerify: (id: string, verified: boolean) => void,
  onExport: () => void
}> = ({ isOpen, onClose, memories, settings, isLoggedIn, onOpenMemory, onEdit, onDelete, onVerify, onExport }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const types = Array.from(new Set(memories.map(m => m.type)));

  const filtered = memories.filter(m => {
    const matchQ = !search || [m.name, m.place, m.object, m.memory].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchF = !activeFilter || m.type === activeFilter;
    return matchQ && matchF;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[190]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[600px] lg:w-[700px] bg-[#faf9f7] border-l border-black/10 z-[200] overflow-y-auto shadow-2xl pt-[60px]"
          >
            <div className="p-6 sm:p-10 md:p-16">
              <div className="flex justify-between items-start mb-8 gap-4">
                <div>
                  <h2 className="font-sans font-bold text-2xl md:text-3xl text-[#1a1917] tracking-tight">The Archive</h2>
                  <p className="text-[10px] md:text-[11px] text-[#b0ada8] tracking-widest uppercase mt-1">All memories offered to the kotangcha</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-[#6b6760]" />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0ada8]" />
                  <input 
                    type="text" 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, object, place…"
                    className="w-full pl-10 pr-4 py-3 bg-[#f2efe9]/30 border border-black/10 rounded-md text-sm outline-none focus:border-[#c4a882] transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {types.map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveFilter(activeFilter === t ? '' : t)}
                      className={`px-4 py-1.5 rounded-full text-[11px] tracking-wide border transition-all ${
                        activeFilter === t 
                          ? 'bg-[#1a1917] text-white border-[#1a1917]' 
                          : 'bg-transparent text-[#6b6760] border-black/10 hover:border-black/20'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  {isLoggedIn && (
                    <button 
                      onClick={onExport}
                      className="ml-auto px-4 py-1.5 rounded-md text-[11px] tracking-widest uppercase border border-black/10 text-[#6b6760] hover:bg-[#f2efe9] transition-colors"
                    >
                      Export
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-[#b0ada8] font-sans italic text-lg tracking-wide">
                    No memories found
                  </div>
                ) : (
                  filtered.map((m, i) => {
                    const originalIdx = memories.indexOf(m);
                    const pal = PALETTES[originalIdx % PALETTES.length];
                    return (
                      <div 
                        key={m.id}
                        onClick={() => onOpenMemory(originalIdx)}
                        className="group bg-white p-6 border border-black/5 hover:bg-[#f2efe9]/50 transition-colors cursor-pointer relative flex flex-col"
                      >
                        <div className="h-1 w-10 mb-4 rounded-full" style={{ backgroundColor: pal[1] }} />
                        <h3 className="font-sans font-medium text-lg mb-0.5 tracking-tight">{m.name}</h3>
                        <div className="text-[10px] text-[#b0ada8] uppercase tracking-widest mb-3 truncate">{m.place || 'Unknown'}</div>
                        <div className="text-[13px] text-[#6b6760] mb-2 leading-snug">{m.object}</div>
                        <div className="text-[12px] text-[#b0ada8] italic line-clamp-2 leading-relaxed flex-grow">
                          {m.memory}
                        </div>
                        {settings.showDate && (
                          <div className="mt-3 text-[10px] text-[#b0ada8] tracking-widest uppercase">{m.date}</div>
                        )}
                        <div className="flex gap-2 mt-4 items-center">
                          <div className="px-2 py-0.5 border border-black/10 rounded-sm text-[9px] text-[#b0ada8] uppercase tracking-widest">
                            {m.type}
                          </div>
                          {m.audio && (
                            <div className="flex items-center gap-1.5 text-[9px] text-[#c4a882] uppercase tracking-widest font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#c4a882] animate-pulse" />
                              Sound
                            </div>
                          )}
                          {m.verified === false && (
                            <div className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-sm text-[9px] text-amber-700 uppercase tracking-widest font-medium">
                              Pending
                            </div>
                          )}
                        </div>
                        {m.image && (
                          <img src={m.image} alt="" className="mt-4 w-full h-32 object-cover rounded-sm opacity-90" />
                        )}

                        {isLoggedIn && (
                          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {m.verified === false && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onVerify(m.id.toString(), true); }}
                                className="w-full py-2 bg-[#7a5c3a] text-white text-[10px] uppercase tracking-widest rounded-sm hover:opacity-90"
                              >
                                Verify Offering
                              </button>
                            )}
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(originalIdx); }}
                                className="flex-1 py-1.5 text-[10px] uppercase tracking-widest border border-black/10 text-[#6b6760] hover:bg-white rounded-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(originalIdx); }}
                                className="flex-1 py-1.5 text-[10px] uppercase tracking-widest border border-red-200 text-red-500 hover:bg-red-50 rounded-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const AboutDrawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[190]" />
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full md:w-[600px] bg-[#faf9f7] border-l border-black/10 z-[200] overflow-y-auto shadow-2xl pt-[60px]"
        >
          <div className="p-6 sm:p-10 md:p-16 max-w-[600px] mx-auto">
            <div className="flex justify-between items-start mb-12">
              <h2 className="font-sans font-bold text-3xl text-[#1a1917] tracking-tight uppercase tracking-[0.1em]">About</h2>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X className="w-5 h-5 text-[#6b6760]" /></button>
            </div>
            <div className="space-y-6">
              <h3 className="font-sans font-medium text-2xl text-[#1a1917] tracking-tight">What is a Kotangcha?</h3>
              <p className="text-sm text-[#6b6760] leading-relaxed">
                In Kinnaur, Himachal Pradesh, a <em>kotangcha</em> is a stone cairn built on mountain tops in memory of those who have passed away. Families climb to these sites once a year to leave food, objects, and offerings for their loved ones.
              </p>
              <p className="text-sm text-[#6b6760] leading-relaxed">
                This archive reimagines the kotangcha as a living, participatory structure — one that looks not only toward the past, but also toward the future. Each offering becomes a stone. Each stone carries a whisper. Together, they form something new.
              </p>
              <p className="text-sm text-[#6b6760] leading-relaxed">
                This project explores memory-making, collective memory, and how memory is carried through landscape, ritual, objects, and collective participation.
              </p>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const ConnectDrawer: React.FC<DrawerProps & { 
  user: any,
  onLogin: () => void,
  onAdd: (entry: Omit<MemoryEntry, 'id'>) => Promise<void> 
}> = ({ isOpen, onClose, user, onLogin, onAdd }) => {
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [formData, setFormData] = useState({
    name: '',
    place: '',
    object: '',
    memory: '',
    type: 'object',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onAdd({
        ...formData,
        imageFile,
        audioFile,
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        verified: false,
      } as any);
      setStep('success');
    } catch (err: any) {
      console.error("Submission failed:", err);
      let message = "Something went wrong. Please try again.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error && parsed.error.toLowerCase().includes('insufficient permissions')) {
          message = "Permission denied. You might need to sign in first.";
        } else if (parsed.error) {
          message = parsed.error;
        }
      } catch (e) {
        // Handle common Firebase Storage string errors
        if (err.message && err.message.includes('storage/unauthorized')) {
          message = "Storage permission denied. Please ensure the Storage bucket rules allow public uploads.";
        } else if (err.message) {
          message = err.message.length > 100 ? err.message.substring(0, 100) + '...' : err.message;
        }
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[190]" />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[600px] bg-[#faf9f7] border-l border-black/10 z-[200] overflow-y-auto shadow-2xl pt-[60px]"
          >
            <div className="p-6 sm:p-10 md:p-16 md:max-w-[640px] mx-auto">
              <div className="flex justify-between items-start mb-12">
                <h2 className="font-sans font-bold text-3xl text-[#1a1917] tracking-tight uppercase tracking-[0.1em]">Offer</h2>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X className="w-5 h-5 text-[#6b6760]" /></button>
              </div>

              {step === 'info' && (
                <div className="flex flex-col h-[calc(100vh-250px)] justify-between py-12 px-4 md:px-0">
                  <div className="text-center space-y-8">
                    <div className="w-[32px] h-[36px] mx-auto opacity-60 flex items-center justify-center">
                      <svg viewBox="0 0 100 140" className="w-full h-full fill-[#6b6760]">
                        {/* Ornament U-shape */}
                        <path d="M32 5h8v15h20V5h8v22H32V5z" />
                        <rect x="46" y="27" width="8" height="8" />
                        {/* Tier 1 (Top Narrow) */}
                        <rect x="28" y="35" width="44" height="25" />
                        {/* Tier 2 (Middle Wide) */}
                        <rect x="8" y="60" width="84" height="25" />
                        {/* Tier 3 (Bottom Narrow) */}
                        <rect x="28" y="85" width="44" height="25" />
                        {/* Tier 4 (Base Wide) */}
                        <rect x="8" y="110" width="84" height="30" />
                      </svg>
                    </div>
                    <p className="text-[13px] text-[#6b6760] leading-relaxed max-w-[360px] mx-auto font-sans">
                      Share a memory, an object, or a fragment of your history. Your offering will be verified and then placed on the kotangcha.
                    </p>
                    
                    <div className="flex flex-col gap-4 items-center pt-4">
                      <button 
                        onClick={() => setStep('form')}
                        className="w-full sm:w-auto inline-block px-12 py-4 bg-[#1a1917] text-white font-sans text-[10px] tracking-[0.2em] uppercase rounded-sm hover:opacity-90 transition-all font-medium"
                      >
                        Make an Offering
                      </button>
                    </div>
                  </div>

                  {!user && (
                    <div className="flex justify-center pt-12">
                      <button 
                        onClick={onLogin}
                        className="px-10 py-3.5 border border-black/10 text-[#6b6760] font-sans text-[9px] tracking-[0.25em] uppercase rounded-sm hover:bg-black/5 transition-all"
                      >
                        Artist Sign In ↗
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#b0ada8] uppercase tracking-widest ml-1">Your Name</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#b0ada8] uppercase tracking-widest ml-1">Place of Origin</label>
                      <input 
                        required
                        value={formData.place}
                        onChange={e => setFormData({ ...formData, place: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#b0ada8] uppercase tracking-widest ml-1">The Object</label>
                    <input 
                      required
                      placeholder="e.g. A silver ring, a piece of wood"
                      value={formData.object}
                      onChange={e => setFormData({ ...formData, object: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#b0ada8] uppercase tracking-widest ml-1">The Memory</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Write a brief memory associated with this object..."
                      value={formData.memory}
                      onChange={e => setFormData({ ...formData, memory: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-sm text-sm outline-none focus:border-[#c4a882] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#b0ada8] uppercase tracking-widest ml-1">Image of Object</label>
                      <div className="relative">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={e => setImageFile(e.target.files?.[0] || null)}
                          className="w-full text-[10px] md:text-[11px] text-[#6b6760] file:mr-2 md:file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-semibold file:bg-[#1a1917] file:text-white hover:file:opacity-80 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#b0ada8] uppercase tracking-widest ml-1">Whisper (Audio MP3)</label>
                      <div className="relative">
                        <input 
                          type="file"
                          accept="audio/*"
                          onChange={e => setAudioFile(e.target.files?.[0] || null)}
                          className="w-full text-[10px] md:text-[11px] text-[#6b6760] file:mr-2 md:file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-semibold file:bg-[#1a1917] file:text-white hover:file:opacity-80 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] text-[#b0ada8] leading-relaxed italic">
                      Note: Offerings are linked to Gmail through Google Form for verification. Please ensure your contact details match.
                    </p>
                  </div>

                  <div className="pt-6 flex flex-col gap-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] uppercase tracking-widest text-center rounded-sm">
                        {error}
                      </div>
                    )}
                    <div className="flex gap-4">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-[#1a1917] text-white py-4 rounded-sm text-[11px] uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-50 transition-all font-medium"
                      >
                        {isSubmitting ? 'Sending Request...' : 'Submit Offering'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStep('info')}
                        className="px-6 py-4 border border-black/10 text-[#6b6760] rounded-sm text-[11px] uppercase tracking-[0.2em] hover:bg-black/5"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="text-center space-y-8 py-12">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-20 h-20 bg-[#c4a882]/20 rounded-full flex items-center justify-center mx-auto"
                  >
                    <div className="w-4 h-4 bg-[#c4a882] rounded-full animate-pulse" />
                  </motion.div>
                  <div className="space-y-4">
                    <h3 className="font-sans font-medium text-2xl text-[#1a1917]">Offering Received</h3>
                    <p className="text-sm text-[#6b6760] leading-relaxed max-w-[400px] mx-auto">
                      Your object is received, it may take a few hours to update. Once it is verified then it will appear here.
                    </p>
                    <div className="pt-4">
                      <a 
                        href="https://forms.gle/oLLoJAc3wBjgRLsB6" 
                        target="_blank" 
                        rel="noopener"
                        className="text-[10px] text-[#a36910] underline tracking-widest uppercase font-medium hover:opacity-70 transition-opacity"
                      >
                        Complete Verification on Google Forms ↗
                      </a>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="inline-block px-10 py-4 border border-[#1a1917] text-[#1a1917] font-sans text-[11px] tracking-[0.2em] uppercase rounded-sm hover:bg-[#1a1917] hover:text-white transition-all font-medium"
                  >
                    Return to Kotangcha
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
