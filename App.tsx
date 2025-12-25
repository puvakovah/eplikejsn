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
import { LayoutDashboard, Calendar, ListChecks, UserCircle, LogOut, Loader2, Mail, Settings as SettingsIcon, CloudOff, Cloud, AlertCircle, RefreshCcw } from 'lucide-react';
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
  const [habits, setHabits] = useState<Habit[]>([]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'xp' | 'lvl'}[]>([]);

  // Ref pre debounce autosave
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
      const userData = rawData.user || rawData; 
      if (!userData || !userData.name) return false;

      setUser(userData);
      setHabits(rawData.habits || userData.habits || []);
      setDayPlan(rawData.dayPlan || userData.currentPlan || {
        date: new Date().toISOString().split('T')[0],
        plannedBlocks: [],
        actualBlocks: []
      });
      return true;
    } catch (e) {
      console.error("Error processing data:", e);
      return false;
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (!currentUsername || !user || !dayPlan) return;
    setIsSyncing(true);
    try {
        const fullProfile = { user, habits, dayPlan };
        await db.saveUserData(currentUsername, fullProfile);
    } catch (e) {
        console.error("Autosave failed", e);
    } finally {
        setIsSyncing(false);
    }
  }, [currentUsername, user, habits, dayPlan]);

  // AUTOSAVE LOGIKA: Pri každej zmene stavu počkaj 2 sekundy a ulož
  useEffect(() => {
    if (isAuthenticated && user && habits && dayPlan) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        handleSync();
      }, 2000);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [user, habits, dayPlan, isAuthenticated, handleSync]);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res = await db.getSession();
        if (res.success && res.data) {
          processIncomingData(res.data);
          if (res.username) setCurrentUsername(res.username);
        } else {
          const cachedUser = localStorage.getItem('ideal_twin_username');
          if (!cachedUser) setIsAuthenticated(false);
          else setLoadError("Relácia vypršala.");
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
    if (processIncomingData(data)) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    await db.logout();
    localStorage.clear();
    window.location.reload();
  };

  if (loadError) return (
    <div className="h-screen flex flex-col items-center justify-center bg-canvas p-6 dark:bg-dark-canvas">
      <AlertCircle size={64} className="text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2 dark:text-white">{loadError}</h2>
      <button onClick={() => window.location.reload()} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2">
        <RefreshCcw size={20} /> Skúsiť znova
      </button>
    </div>
  );

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  if (isLoading || !user || !dayPlan) return (
    <div className="h-screen flex flex-col items-center justify-center bg-canvas dark:bg-dark-canvas text-primary">
      <Loader2 size={48} className="animate-spin" />
      <p className="mt-4 font-bold text-xs uppercase tracking-widest">Prebúdzam tvojho Dvojníka...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-txt dark:bg-dark-canvas dark:text-white flex flex-col md:flex-row">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} className="px-6 py-3 rounded-full bg-primary text-white font-bold shadow-2xl border border-white/20">
              {toast.msg}
            </motion.div>
          ))}
          {isSyncing && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-2 rounded-full bg-secondary text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mx-auto">
               <RefreshCcw size={10} className="animate-spin" /> Synchronizujem...
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside className="hidden md:flex flex-col w-72 bg-surface border-r border-txt-light/20 dark:bg-dark-surface p-6">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-2xl font-black text-primary tracking-tighter uppercase italic">IdealTwin</h1>
            {isOnline ? <Cloud className="text-secondary" size={18} /> : <CloudOff className="text-red-400" size={18} />}
          </div>
          <nav className="space-y-2 flex-1">
            <NavItem active={currentView === AppView.DASHBOARD} icon={<LayoutDashboard size={20}/>} label={t('nav.dashboard')} onClick={() => setCurrentView(AppView.DASHBOARD)} />
            <NavItem active={currentView === AppView.PLANNER} icon={<Calendar size={20}/>} label={t('nav.planner')} onClick={() => setCurrentView(AppView.PLANNER)} />
            <NavItem active={currentView === AppView.HABITS} icon={<ListChecks size={20}/>} label={t('nav.habits')} onClick={() => setCurrentView(AppView.HABITS)} />
            <NavItem active={currentView === AppView.INBOX} icon={<Mail size={20}/>} label={t('nav.inbox')} onClick={() => setCurrentView(AppView.INBOX)} />
            <NavItem active={currentView === AppView.PROFILE} icon={<UserCircle size={20}/>} label={t('nav.profile')} onClick={() => setCurrentView(AppView.PROFILE)} />
            <NavItem active={currentView === AppView.SETTINGS} icon={<SettingsIcon size={20}/>} label={t('nav.settings')} onClick={() => setCurrentView(AppView.SETTINGS)} />
          </nav>
          <button onClick={handleLogout} className="flex items-center gap-3 p-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-all dark:hover:bg-red-900/10">
            <LogOut size={20} /> {t('nav.logout')}
          </button>
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {currentView === AppView.DASHBOARD && <Dashboard user={user} setUser={setUser} plan={dayPlan} onNavigate={setCurrentView} isOnline={isOnline} lang={lang} />}
            {currentView === AppView.HABITS && <Habits habits={habits} setHabits={setHabits} user={user} setUser={setUser} addToast={addToast} lang={lang} />}
            {currentView === AppView.PLANNER && <Planner plan={dayPlan} setPlan={setDayPlan} user={user} setUser={setUser} userGoals={user.goals || []} userPreferences={JSON.stringify(user.preferences || {})} isOnline={isOnline} lang={lang} />}
            {currentView === AppView.PROFILE && <TwinProfile user={user} setUser={setUser} lang={lang} />}
            {currentView === AppView.INBOX && <Inbox user={user} setUser={setUser} lang={lang} />}
            {currentView === AppView.SETTINGS && <Settings user={user} setUser={setUser} onLogout={handleLogout} onSync={handleSync} isSyncing={isSyncing} lang={lang} setLang={setLang} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t p-3 flex justify-around dark:bg-dark-surface z-50">
        <MobileNavItem active={currentView === AppView.DASHBOARD} icon={<LayoutDashboard/>} onClick={() => setCurrentView(AppView.DASHBOARD)} />
        <MobileNavItem active={currentView === AppView.PLANNER} icon={<Calendar/>} onClick={() => setCurrentView(AppView.PLANNER)} />
        <MobileNavItem active={currentView === AppView.HABITS} icon={<ListChecks/>} onClick={() => setCurrentView(AppView.HABITS)} />
        <MobileNavItem active={currentView === AppView.PROFILE} icon={<UserCircle/>} onClick={() => setCurrentView(AppView.PROFILE)} />
        <button onClick={() => setCurrentView(AppView.SETTINGS)} className={`p-2 ${currentView === AppView.SETTINGS ? 'text-primary' : 'text-txt-muted'}`}><SettingsIcon size={24} /></button>
      </nav>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${active ? 'bg-primary text-white font-bold' : 'text-txt-muted hover:bg-canvas dark:text-txt-dark-muted'}`}>
        {icon} <span className="text-sm font-bold uppercase">{label}</span>
    </button>
);

const MobileNavItem = ({ active, icon, onClick }: any) => (
    <button onClick={onClick} className={`p-2 ${active ? 'text-primary' : 'text-txt-muted'}`}>{icon}</button>
);

export default App;