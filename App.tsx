import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView, DayPlan, UserProfile, Habit } from './types';
import Dashboard from './Dashboard';
import Planner from './Planner';
import Habits from './Habits';
import TwinProfile from './TwinProfile';
import Inbox from './Inbox';
import Settings from './settings';
import Auth from './Auth';
import { db } from './db';
import { LayoutDashboard, Calendar, ListChecks, UserCircle, LogOut, Loader2, Mail, Settings as SettingsIcon, RefreshCcw } from 'lucide-react';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('ideal_twin_auth') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUsername, setCurrentUsername] = useState<string | null>(localStorage.getItem('ideal_twin_username'));
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('ideal_twin_lang') as Language) || 'sk');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  
  // ODSTRÁNENÉ: const [habits, setHabits] = useState<Habit[]>([]); 
  // Používame už len user.habits

  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'xp' | 'lvl'}[]>([]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const addToast = useCallback((msg: string, type: 'xp' | 'lvl' = 'xp') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const processIncomingData = useCallback((data: any) => {
    if (!data) return false;
    try {
      const rawData = data.data || data;
      let userData = rawData.user || rawData; 
      if (!userData || !userData.name) return false;

      if (userData.messages && Array.isArray(userData.messages)) {
        userData.messages = userData.messages.map((m: any) => {
          if (m.type === 'welcome' && !m.subject.startsWith('msg.')) {
            return { ...m, sender: 'msg.reg.sender', subject: 'msg.reg.subject', body: 'msg.reg.body' };
          }
          return m;
        });
      }

      if (userData.preferences?.language) {
        setLang(userData.preferences.language as Language);
        localStorage.setItem('ideal_twin_lang', userData.preferences.language);
      }

      // Zabezpečíme, aby habits boli vždy pole vovnútri usera
      const finalUser = {
        ...userData,
        habits: rawData.habits || userData.habits || []
      };

      setUser(finalUser);
      setDayPlan(rawData.dayPlan || userData.currentPlan || {
        date: new Date().toISOString().split('T')[0],
        plannedBlocks: [],
        actualBlocks: []
      });
      return true;
    } catch (e) {
      console.error("Data process error:", e);
      return false;
    }
  }, []);

  // SYNCHRONIZÁCIA - Upravená tak, aby brala habits priamo z user objektu
 // Upravený handleSync pre istotu
const handleSync = useCallback(async () => {
  if (!currentUsername || !user || !dayPlan) return;
  setIsSyncing(true);
  try {
    // Posielame presnú kópiu aktuálneho stavu
    await db.saveUserData(currentUsername, { 
      user: { ...user }, 
      habits: [...(user.habits || [])], 
      dayPlan: { ...dayPlan } 
    });
  } catch (e) {
    console.error("Sync failed", e);
  } finally {
    setIsSyncing(false);
  }
}, [currentUsername, user, dayPlan]);

  // Autosave - sledovanie zmien v user objektu (vrátane habits)
  useEffect(() => {
    if (isAuthenticated && user && dayPlan) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => handleSync(), 2000);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [user, dayPlan, isAuthenticated, handleSync]);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) { setIsLoading(false); return; }
      try {
        const res = await db.getSession();
        if (res.success && res.data) {
          processIncomingData(res.data);
          if (res.username) setCurrentUsername(res.username);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) { setLoadError("Chyba pripojenia."); }
      finally { setIsLoading(false); }
    };
    init();
  }, [isAuthenticated, processIncomingData]);

  const handleLogin = (username: string, data: any) => {
    localStorage.setItem('ideal_twin_username', username);
    localStorage.setItem('ideal_twin_auth', 'true');
    setCurrentUsername(username);
    if (processIncomingData(data)) setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await db.logout();
    localStorage.clear();
    window.location.reload();
  };

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;
  
  if (isLoading || !user || !dayPlan) return (
    <div className="h-screen flex flex-col items-center justify-center bg-canvas dark:bg-dark-canvas text-primary">
      <Loader2 size={48} className="animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-txt dark:bg-dark-canvas dark:text-white flex flex-col md:flex-row">
      
      <aside className="hidden md:flex flex-col w-72 bg-surface border-r border-txt-light/10 dark:bg-dark-surface p-6 z-40 relative overflow-hidden">
        <div className="relative mb-12 px-2 py-4">
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/15 rounded-full blur-2xl -z-10" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                <RefreshCcw size={24} />
            </div>
            <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter leading-none dark:text-white uppercase">IdealTwin</span>
                <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-secondary' : 'bg-red-400'}`} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
          </div>
        </div>

        <nav className="space-y-2 flex-1 relative z-10">
          <NavItem active={currentView === AppView.DASHBOARD} icon={<LayoutDashboard size={20}/>} label={t('nav.dashboard')} onClick={() => setCurrentView(AppView.DASHBOARD)} />
          <NavItem active={currentView === AppView.PLANNER} icon={<Calendar size={20}/>} label={t('nav.planner')} onClick={() => setCurrentView(AppView.PLANNER)} />
          <NavItem active={currentView === AppView.HABITS} icon={<ListChecks size={20}/>} label={t('nav.habits')} onClick={() => setCurrentView(AppView.HABITS)} />
          <NavItem active={currentView === AppView.INBOX} icon={<Mail size={20}/>} label={t('nav.inbox')} onClick={() => setCurrentView(AppView.INBOX)} />
          <NavItem active={currentView === AppView.PROFILE} icon={<UserCircle size={20}/>} label={t('nav.profile')} onClick={() => setCurrentView(AppView.PROFILE)} />
        </nav>

        <div className="pt-6 border-t border-txt-light/10 space-y-2 relative z-10">
            <NavItem active={currentView === AppView.SETTINGS} icon={<SettingsIcon size={20}/>} label={t('nav.settings')} onClick={() => setCurrentView(AppView.SETTINGS)} />
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-all dark:hover:bg-red-900/10">
                <LogOut size={20} /> {t('nav.logout')}
            </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto">
            {currentView === AppView.DASHBOARD && <Dashboard user={user} setUser={setUser} plan={dayPlan} onNavigate={setCurrentView} isOnline={isOnline} lang={lang} />}
            
            {/* OPRAVENÉ: Habits teraz priamo menia user.habits */}
            {/* OPRAVENÉ: Habits teraz s garantovanou aktualizáciou referencie */}
            {currentView === AppView.HABITS && (
  <Habits 
    // Používame priamo user.habits, aby sme mali "Single Source of Truth"
    habits={user.habits || []} 
    setHabits={(update) => {
      setUser(prev => {
        if (!prev) return null;
        const currentHabits = prev.habits || [];
        // Vyriešime, či update je funkcia alebo hodnota
        const nextHabits = typeof update === 'function' ? update(currentHabits) : update;
        
        // KLÚČOVÉ: Vytvoríme úplne nový objekt usera s novým poľom habits
        return { 
          ...prev, 
          habits: [...nextHabits] 
        };
      });
    }} 
    user={user} 
    setUser={setUser} 
    addToast={addToast} 
    lang={lang} 
  />
)}
            {currentView === AppView.PLANNER && <Planner plan={dayPlan} setPlan={setDayPlan} user={user} setUser={setUser} userGoals={user.goals || []} userPreferences={JSON.stringify(user.preferences || {})} isOnline={isOnline} lang={lang} />}
            {currentView === AppView.PROFILE && <TwinProfile user={user} setUser={setUser} lang={lang} />}
            {currentView === AppView.INBOX && <Inbox user={user} setUser={setUser} lang={lang} />}
            {currentView === AppView.SETTINGS && (
              <Settings 
                user={user} 
                setUser={setUser} 
                onLogout={handleLogout} 
                onSync={handleSync} 
                isSyncing={isSyncing} 
                lang={lang} 
                setLang={(newLang: Language) => {
                  setLang(newLang);
                  localStorage.setItem('ideal_twin_lang', newLang);
                  if (user) {
                    setUser({ ...user, preferences: { ...user.preferences, language: newLang } });
                  }
                }} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t p-3 flex justify-around dark:bg-dark-surface/90 z-50">
        <MobileNavItem active={currentView === AppView.DASHBOARD} icon={<LayoutDashboard/>} onClick={() => setCurrentView(AppView.DASHBOARD)} />
        <MobileNavItem active={currentView === AppView.PLANNER} icon={<Calendar/>} onClick={() => setCurrentView(AppView.PLANNER)} />
        <MobileNavItem active={currentView === AppView.HABITS} icon={<ListChecks/>} onClick={() => setCurrentView(AppView.HABITS)} />
        <MobileNavItem active={currentView === AppView.PROFILE} icon={<UserCircle/>} onClick={() => setCurrentView(AppView.PROFILE)} />
        <button onClick={() => setCurrentView(AppView.SETTINGS)} className={`p-2 rounded-xl ${currentView === AppView.SETTINGS ? 'text-primary' : 'text-txt-muted'}`}><SettingsIcon size={24} /></button>
      </nav>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${active ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' : 'text-txt-muted hover:bg-canvas dark:text-txt-dark-muted dark:hover:bg-white/5'}`}>
        {icon} <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
);

const MobileNavItem = ({ active, icon, onClick }: any) => (
    <button onClick={onClick} className={`p-2 rounded-xl ${active ? 'bg-primary/10 text-primary' : 'text-txt-muted'}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </button>
);

export default App;