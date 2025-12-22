
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView, DayPlan, UserProfile, Habit, UserPreferences } from './types';
import Dashboard from './Dashboard';
import Planner from './Planner';
import Habits from './Habits';
import TwinProfile from './TwinProfile';
import Inbox from './Inbox';
import Settings from './settings';
import Auth from './Auth';
import { db } from './db';
import { getLevelInfo, getAvatarState } from './gamificationConfig';
import { translations, Language } from './translations';
import { LayoutDashboard, Calendar, ListChecks, UserCircle, LogOut, Loader2, Mail, Settings as SettingsIcon, Zap, Star, CloudOff, Cloud, CheckCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  
  // Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'xp' | 'lvl'}[]>([]);

  // Monitor Connection
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

  // Centralized Sync Handler
  const handleSync = async () => {
    if (!currentUsername || !user) return;
    if (!navigator.onLine) {
        setSyncStatus('error');
        setSyncError('Ste offline');
        return;
    }
    
    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncError(null);

    try {
        const result = await db.saveUserData(currentUsername, { user, habits, dayPlan });
        if (result.success) {
            setSyncStatus('success');
            const session = await db.getSession();
            if (session.success && session.data) {
                setUser(session.data.user);
                setHabits(session.data.habits || []);
                setDayPlan(session.data.dayPlan);
            }
            setTimeout(() => setSyncStatus('idle'), 3000);
        } else {
            setSyncStatus('error');
            setSyncError(result.message || 'Sync zlyhal');
        }
    } catch (err: any) {
        setSyncStatus('error');
        setSyncError(err.message || 'Neočakávaná chyba');
    } finally {
        setIsSyncing(false);
    }
  };

  // LOAD DATA - OFFLINE FIRST
  useEffect(() => {
    const init = async () => {
      const res = await db.getSession();
      if (res.success && res.data) {
        setCurrentUsername(res.username!);
        setUser(res.data.user);
        setHabits(res.data.habits || []);
        setDayPlan(res.data.dayPlan);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-canvas dark:bg-dark-canvas">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <Loader2 className="text-primary" size={48} />
      </motion.div>
      <p className="mt-4 text-txt-muted animate-pulse">Načítavam tvoj svet...</p>
    </div>
  );

  if (!isAuthenticated) return <Auth onLogin={(u, d) => { setCurrentUsername(u); setUser(d.user); setHabits(d.habits); setDayPlan(d.dayPlan); setIsAuthenticated(true); }} />;

  return (
    <div className="min-h-screen bg-canvas text-txt dark:bg-dark-canvas dark:text-white flex flex-col md:flex-row transition-colors duration-300 overflow-x-hidden">
      
      {/* GLOBAL TOASTS */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 font-bold
                ${toast.type === 'lvl' ? 'bg-habit text-txt border-habit' : 'bg-primary text-white border-primary-hover'}
              `}
            >
              {toast.type === 'xp' ? <Zap size={18} fill="currentColor" /> : <Star size={18} fill="currentColor" />}
              {toast.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-surface border-r border-txt-light/20 dark:bg-dark-surface dark:border-white/10 p-6 relative">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-2xl font-bold text-primary">IdealTwin</h1>
            <div className="flex items-center gap-2">
                {isOnline ? <Cloud className="text-secondary" size={18} /> : <CloudOff className="text-red-400" size={18} />}
            </div>
          </div>
          
          <nav className="space-y-2 flex-1">
            <NavItem active={currentView === AppView.DASHBOARD} icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => setCurrentView(AppView.DASHBOARD)} />
            <NavItem active={currentView === AppView.PLANNER} icon={<Calendar size={20}/>} label="Plánovač" onClick={() => setCurrentView(AppView.PLANNER)} />
            <NavItem active={currentView === AppView.HABITS} icon={<ListChecks size={20}/>} label="Návyky" onClick={() => setCurrentView(AppView.HABITS)} />
            <NavItem active={currentView === AppView.INBOX} icon={<Mail size={20}/>} label="Inbox" onClick={() => setCurrentView(AppView.INBOX)} />
            <NavItem active={currentView === AppView.PROFILE} icon={<UserCircle size={20}/>} label="Profil" onClick={() => setCurrentView(AppView.PROFILE)} />
            <NavItem active={currentView === AppView.SETTINGS} icon={<SettingsIcon size={20}/>} label="Nastavenia" onClick={() => setCurrentView(AppView.SETTINGS)} />
          </nav>
          
          <div className="mt-auto space-y-4">
              <button 
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all border
                    ${syncStatus === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 
                      syncStatus === 'error' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-canvas dark:bg-white/5 border-txt-light/10 text-txt-muted hover:text-primary'}
                `}
              >
                  {isSyncing ? <Loader2 size={18} className="animate-spin" /> : 
                   syncStatus === 'success' ? <CheckCircle size={18} /> :
                   syncStatus === 'error' ? <CloudOff size={18} /> : <RefreshCw size={18} />}
                  
                  {isSyncing ? 'Synchronizujem...' : 
                   syncStatus === 'success' ? 'Uložené' :
                   syncStatus === 'error' ? 'Chyba' : 'Sync cloudu'}
              </button>
              <button onClick={() => db.logout().then(() => window.location.reload())} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <LogOut size={20}/> Odhlásiť
              </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === AppView.DASHBOARD && <Dashboard user={user!} setUser={setUser} plan={dayPlan!} onNavigate={setCurrentView} isOnline={isOnline} />}
            {currentView === AppView.HABITS && <Habits habits={habits} setHabits={setHabits} user={user!} setUser={setUser} addToast={addToast} />}
            {currentView === AppView.PLANNER && <Planner plan={dayPlan!} setPlan={setDayPlan} user={user!} setUser={setUser} userGoals={user!.goals} userPreferences={JSON.stringify(user!.preferences)} isOnline={isOnline} />}
            {currentView === AppView.PROFILE && <TwinProfile user={user!} setUser={setUser} />}
            {currentView === AppView.INBOX && <Inbox user={user!} setUser={setUser} />}
            {currentView === AppView.SETTINGS && (
              <Settings 
                user={user!} 
                setUser={setUser} 
                onLogout={() => db.logout().then(() => window.location.reload())} 
                onSync={handleSync}
                isSyncing={isSyncing}
                lang="sk" 
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
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-primary-50 text-primary font-bold shadow-sm dark:bg-primary/20' : 'text-txt-muted dark:text-gray-400 hover:bg-canvas dark:hover:bg-white/5'}`}>
        {icon} {label}
    </button>
);

const MobileNavItem = ({ active, icon, onClick }: any) => (
    <button type="button" onClick={onClick} className={`p-2 transition-all ${active ? 'text-primary scale-110' : 'text-txt-muted dark:text-gray-500'}`}>
        {icon}
    </button>
);

export default App;
