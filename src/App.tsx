import React, { useState, useEffect } from 'react';
import { ThreeStage } from './components/ThreeStage';
import { ArchiveDrawer, AboutDrawer, ConnectDrawer } from './components/Drawers';
import { AdminPanel } from './components/AdminPanel';
import { Lightbox } from './components/Lightbox';
import { MemoryEntry, AppSettings } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  auth, 
  googleProvider, 
  OperationType, 
  handleFirestoreError,
  uploadFile
} from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  User
} from 'firebase/auth';

const SETTINGS_KEY = 'kotangcha_settings';
const ADMIN_EMAIL = 'amanshurag@gmail.com';

export default function App() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ showDate: false });
  const [user, setUser] = useState<User | null>(null);
  const [isCurator, setIsCurator] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [lightboxMemoryIdx, setLightboxMemoryIdx] = useState<number | null>(null);

  // Auth State
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsCurator(u?.email === ADMIN_EMAIL);
    });
  }, []);

  // Load Settings
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  // Sync Memories from Firestore
  useEffect(() => {
    const memoriesRef = collection(db, 'memories');
    // Public view: only verified. Curator view: all.
    const q = isCurator 
      ? query(memoriesRef, orderBy('createdAt', 'desc'))
      : query(memoriesRef, where('verified', '==', true), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as MemoryEntry[];
      
      setMemories(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'memories');
    });

    return unsubscribe;
  }, [isCurator]);

  const addMemory = async (entry: Omit<MemoryEntry, 'id'> & { imageFile?: File, audioFile?: File }) => {
    try {
      const { imageFile, audioFile, ...data } = entry;
      let imageUrl = (data as any).image || null;
      let audioUrl = (data as any).audio || null;

      // Handle File Uploads
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'images');
      }
      if (audioFile) {
        audioUrl = await uploadFile(audioFile, 'audio');
      }

      const memoryData: any = {
        ...data,
        image: imageUrl,
        audio: audioUrl,
        verified: isCurator, // Auto-verify if added by creator/curator
        createdAt: serverTimestamp(),
      };

      if (user?.uid) {
        memoryData.userId = user.uid;
      }

      const memoriesRef = collection(db, 'memories');
      await addDoc(memoriesRef, memoryData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'memories');
    }
  };

  const updateSettings = (showDate: boolean) => {
    const newSettings = { ...settings, showDate };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLogin(false);
    } catch (err: any) {
      console.error('Login failed:', err);
      // More descriptive error for users
      if (err.code === 'auth/popup-blocked') {
        alert('The login popup was blocked by your browser. Please enable popups and try again.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // Silently ignore as the user intentionally closed it or cancelled it
        console.log('Login cancelled or closed by user');
      } else if (err.code === 'auth/unauthorized-domain') {
        alert('Unauthorized Domain: This domain is not whitelisted in the Firebase console. Please add ' + window.location.hostname + ' to your Firebase Authorized Domains.');
      } else if (err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
        alert('A network error occurred. Please check your internet connection and try again.');
      } else {
        alert(`Authentication error: ${err.message || 'Please try again later.'}\n\nTip: On mobile, ensure that you don't close the sign-in window before authentication completes.`);
      }
    }
  };

  const verifyMemory = async (id: string, verified: boolean) => {
    if (!isCurator) return;
    try {
      const memoryRef = doc(db, 'memories', id);
      await updateDoc(memoryRef, { verified });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memories/${id}`);
    }
  };

  const deleteMemory = async (idx: number) => {
    if (!isCurator) return;
    const m = memories[idx];
    if (confirm(`Remove "${m.name}"'s memory? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'memories', m.id.toString()));
        setLightboxMemoryIdx(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `memories/${m.id}`);
      }
    }
  };

  const logout = () => signOut(auth);

  return (
    <div className="relative min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full h-[60px] z-[250] flex items-center justify-between px-4 sm:px-6 md:px-8 bg-[#faf9f7]/95 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center h-full gap-3 sm:gap-4 md:gap-8 font-sans font-medium text-[10px] md:text-[11px] tracking-[0.1em] md:tracking-[0.15em] uppercase text-[#b0ada8] whitespace-nowrap">
          <div className="flex items-center gap-1.5 h-full">
            <span className="text-[#a36910] font-semibold">{memories.length}</span>
            <span className="hidden xs:inline">MEMORIES</span>
          </div>
          <button onClick={() => setActiveDrawer('archive')} className="hover:text-[#1a1917] transition-colors cursor-pointer">ARCHIVE</button>
          <button onClick={() => setActiveDrawer('about')} className="hover:text-[#1a1917] transition-colors cursor-pointer">ABOUT</button>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 text-center h-[20px] flex items-center justify-center pointer-events-none">
          <a href="#" className="font-serif text-[18px] sm:text-[24px] tracking-tight text-[#1a1917] h-auto w-auto leading-none pointer-events-auto">
            <span className="text-[#a36910]">K</span>otangcha
          </a>
        </div>

        <div className="flex items-center justify-end h-full font-sans font-medium text-[10px] md:text-[11px] tracking-[0.1em] md:tracking-[0.15em] uppercase">
          {user ? (
            <div className="flex items-center gap-3">
              {isCurator ? (
                <button onClick={() => setIsAdminOpen(true)} className="text-[#a36910] hover:opacity-80 transition-opacity cursor-pointer">
                  CURATOR
                </button>
              ) : (
                <span className="text-[#b0ada8] cursor-default border border-black/5 px-2 py-1 rounded-sm bg-black/5">
                  ARTIST
                </span>
              )}
              <button 
                onClick={() => setActiveDrawer('connect')} 
                className="text-[#b0ada8] hover:text-[#7a5c3a] transition-colors flex items-center gap-1 cursor-pointer ml-2"
              >
                OFFER <span className="text-[11px] md:text-[12px] leading-none mb-0.5">↗</span>
              </button>
              <button onClick={logout} className="text-[#b0ada8] hover:text-[#1a1917] transition-colors cursor-pointer">
                LOGOUT
              </button>
            </div>
          ) : (
            <button onClick={() => setActiveDrawer('connect')} className="text-[#b0ada8] hover:text-[#7a5c3a] transition-colors flex items-center gap-1 cursor-pointer">
              <span className="hidden sm:inline">OFFER</span> <span className="text-[11px] md:text-[12px] leading-none mb-0.5">↗</span>
            </button>
          )}
        </div>
      </nav>

      <div className="pt-[60px]">
        <ThreeStage memories={memories} />
      </div>

      <footer className="fixed bottom-6 md:bottom-10 inset-x-0 z-10 text-center pointer-events-none px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="max-w-md mx-auto"
        >
          <p className="text-[10px] md:text-[12px] leading-relaxed text-[#6b6760] font-sans font-light tracking-[0.05em]">
            Each stone is a remembered object, a whispered name, a fragment of history. The kotangcha grows with every offering — you are invited to add your own.
          </p>
        </motion.div>
      </footer>

      <ArchiveDrawer 
        isOpen={activeDrawer === 'archive'} 
        onClose={() => setActiveDrawer(null)}
        memories={memories}
        settings={settings}
        isLoggedIn={isCurator}
        onOpenMemory={(idx) => { setActiveDrawer(null); setLightboxMemoryIdx(idx); }}
        onEdit={(idx) => { setActiveDrawer(null); setLightboxMemoryIdx(idx); }}
        onDelete={deleteMemory}
        onVerify={verifyMemory}
        onExport={() => {}} // Could reimplement if needed
      />
      
      <AboutDrawer isOpen={activeDrawer === 'about'} onClose={() => setActiveDrawer(null)} />
      <ConnectDrawer 
        isOpen={activeDrawer === 'connect'} 
        onClose={() => setActiveDrawer(null)} 
        user={user}
        onLogin={() => setShowLogin(true)}
        onAdd={addMemory}
      />

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#faf9f7] w-full max-w-[340px] rounded-sm p-10 text-center shadow-2xl"
            >
              <h2 className="font-serif text-xl mb-1">Curator Access</h2>
              <p className="text-[12px] text-[#b0ada8] mb-8 tracking-wide">Sign in with your Google account to access the archive</p>
              
              <button 
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-3 bg-[#1a1917] text-white py-3 rounded-sm text-[12px] uppercase tracking-widest hover:opacity-90 transition-all font-medium"
              >
                Sign in with Google
              </button>
              
              <p className="mt-4 text-[10px] text-[#b0ada8] italic leading-tight">
                Mobile Tip: Ensure popups are allowed and keep the sign-in window open until finished.
              </p>
              
              <button 
                onClick={() => setShowLogin(false)}
                className="mt-4 text-[11px] text-[#b0ada8] uppercase tracking-widest hover:text-[#6b6760]"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAdd={addMemory}
        onUpdateSettings={updateSettings}
        showDate={settings.showDate}
        onExport={() => {}} 
        onImport={() => {}}
        onClear={() => {}}
      />

      <Lightbox 
        isOpen={lightboxMemoryIdx !== null}
        onClose={() => setLightboxMemoryIdx(null)}
        memory={lightboxMemoryIdx !== null ? memories[lightboxMemoryIdx] : null}
        idx={lightboxMemoryIdx ?? 0}
        settings={settings}
        isLoggedIn={isCurator}
        onEdit={() => {}} 
        onDelete={() => deleteMemory(lightboxMemoryIdx!)}
      />
    </div>
  );
}
