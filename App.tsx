import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView, DayPlan, UserProfile, Habit } from './types';
import Dashboard from './Dashboard';
import Planner from './Planner';
import Habits from './Habits';
import TwinProfile from './TwinProfile';
import Inbox from './Inbox';
// Corrected lowercase import
import Settings from './settings';
import Auth from './Auth';
import { db } from './db';
import { LayoutDashboard, Calendar, ListChecks, UserCircle, LogOut, Loader2, Mail, Settings as SettingsIcon, CloudOff, Cloud } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [lang, setLang] = useState<'sk' | 'en'>(() => {
    return (localStorage.getItem('ideal_twin_lang') as 'sk' | 'en') || 'sk';
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'xp' | 'lvl'}[]>([]);

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

  const handleSync = async () => {
    if (!currentUsername || !user) return;
    setIsSyncing(true);
    try {
        await db.saveUserData(currentUsername, { user, habits, dayPlan });
    } finally {
        setIsSyncing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const res = await db.getSession();
      if (res.success && res.data) {
        setCurrentUsername(res.username!);
        setUser(res.data.user);
        setHabits(res.data.habits || []);
        setDayPlan(res.data.dayPlan);
        setIsAuthenticated(true);
        
        // Initial theme logic
        const prefs = res.data.user.preferences;
        if (prefs?.theme) {
            const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', isDark);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-canvas dark:bg-dark-canvas text-primary">
      <Loader2 className="animate-spin" size={48} />
    </div>
  );

  if (!isAuthenticated) return <Auth onLogin={(u, d) => { setCurrentUsername(u); setUser(d.user); setHabits(d.habits); setDayPlan(d.dayPlan); setIsAuthenticated(true); }} />;

  const navLabels = {
    sk: { dash: 'Dashboard', plan: 'Plánovač', habits: 'Návyky', inbox: 'Inbox', profile: 'Profil', settings: 'Nastavenia', logout: 'Odhlásiť' },
    en: { dash: 'Dashboard', plan: 'Planner', habits: 'Habits', inbox: 'Inbox', profile: 'Profile', settings: 'Settings', logout: 'Logout' }
  }[lang];

  return (
    <div className="min-h-screen bg-canvas text-txt dark:bg-dark-canvas dark:text-white flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Toast Overlay */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="px-6 py-3 rounded-full shadow-2xl bg-primary text-white font-bold border border-white/20"
            >
              {toast.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-surface border-r border-txt-light/20 dark:bg-dark-surface p-6">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-2xl font-black text-primary tracking-tighter uppercase italic">IdealTwin</h1>
            {isOnline ? <Cloud className="text-secondary" size={18} /> : <CloudOff className="text-red-400" size={18} />}
          </div>
          
          <nav className="space-y-2 flex-1">
            <NavItem active={currentView === AppView.DASHBOARD} icon={<LayoutDashboard size={20}/>} label={navLabels.dash} onClick={() => setCurrentView(AppView.DASHBOARD)} />
            <NavItem active={currentView === AppView.PLANNER} icon={<Calendar size={20}/>} label={navLabels.plan} onClick={() => setCurrentView(AppView.PLANNER)} />
            <NavItem active={currentView === AppView.HABITS} icon={<ListChecks size={20}/>} label={navLabels.habits} onClick={() => setCurrentView(AppView.HABITS)} />
            <NavItem active={currentView === AppView.INBOX} icon={<Mail size={20}/>} label={navLabels.inbox} onClick={() => setCurrentView(AppView.INBOX)} />
            <NavItem active={currentView === AppView.PROFILE} icon={<UserCircle size={20}/>} label={navLabels.profile} onClick={() => setCurrentView(AppView.PROFILE)} />
            <NavItem active={currentView === AppView.SETTINGS} icon={<SettingsIcon size={20}/>} label={navLabels.settings} onClick={() => setCurrentView(AppView.SETTINGS)} />
          </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={currentView} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {currentView === AppView.DASHBOARD && <Dashboard user={user!} setUser={setUser} plan={dayPlan!} onNavigate={setCurrentView} isOnline={isOnline} lang={lang} />}
            {currentView === AppView.HABITS && <Habits habits={habits} setHabits={setHabits} user={user!} setUser={setUser} addToast={addToast} />}
            {currentView === AppView.PLANNER && <Planner plan={dayPlan!} setPlan={setDayPlan} user={user!} setUser={setUser} userGoals={user!.goals} userPreferences={JSON.stringify(user!.preferences)} isOnline={isOnline} lang={lang} />}
            {currentView === AppView.PROFILE && <TwinProfile user={user!} setUser={setUser} lang={lang} />}
            {currentView === AppView.INBOX && <Inbox user={user!} setUser={setUser} lang={lang} />}
            {currentView === AppView.SETTINGS && (
              <Settings 
                user={user!} 
                setUser={setUser} 
                onLogout={() => db.logout().then(() => window.location.reload())} 
                onSync={handleSync}
                isSyncing={isSyncing}
                lang={lang}
                setLang={setLang}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-txt-light/20 z-50 flex justify-around p-3 dark:bg-dark-surface">
        <MobileNavItem active={currentView === AppView.DASHBOARD} icon={<LayoutDashboard/>} onClick={() => setCurrentView(AppView.DASHBOARD)} />
        <MobileNavItem active={currentView === AppView.PLANNER} icon={<Calendar/>} onClick={() => setCurrentView(AppView.PLANNER)} />
        <MobileNavItem active={currentView === AppView.HABITS} icon={<ListChecks/>} onClick={() => setCurrentView(AppView.HABITS)} />
        <MobileNavItem active={currentView === AppView.PROFILE} icon={<UserCircle/>} onClick={() => setCurrentView(AppView.PROFILE)} />
        <button onClick={() => setCurrentView(AppView.SETTINGS)} className={`p-2 transition-all ${currentView === AppView.SETTINGS ? 'text-primary' : 'text-txt-muted'}`}>
            <SettingsIcon size={24} />
        </button>
      </nav>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${active ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-txt-muted hover:bg-canvas dark:text-txt-dark-muted dark:hover:bg-white/5'}`}>
        {icon} <span className="text-sm font-bold uppercase tracking-tight">{label}</span>
    </button>
);

const MobileNavItem = ({ active, icon, onClick }: any) => (
    <button onClick={onClick} className={`p-2 transition-all ${active ? 'text-primary scale-110' : 'text-txt-muted'}`}>
        {icon}
    </button>
);

export default App;