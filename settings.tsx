
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, UserPreferences, HealthSyncConfig } from './types';
import { Settings as SettingsIcon, User, Moon, Bell, Globe, Shield, LogOut, Trash2, Save, Check, Info, Sun, AlertTriangle, Activity, Database, CheckCircle, RefreshCw, Smartphone, Loader2, Mail } from 'lucide-react';
import { translations, Language } from './translations';
import { db } from './db';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

interface SettingsProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onLogout: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
  lang: Language;
}

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'language' | 'health' | 'privacy';

const Settings: React.FC<SettingsProps> = ({ user, setUser, onLogout, onSync, isSyncing = false, lang = 'sk' }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const t = (key: string): string => translations[lang][key] || key;

  // Defensive init of preferences
  const [prefs, setPrefs] = useState<UserPreferences>(() => ({
    theme: user?.preferences?.theme || 'light',
    language: user?.preferences?.language || 'sk',
    notificationsEmail: user?.preferences?.notificationsEmail ?? true,
    notificationsPush: user?.preferences?.notificationsPush ?? false,
    bio: user?.preferences?.bio || '',
    healthSync: user?.preferences?.healthSync || {
      enabled: false,
      provider: null,
      syncSteps: true,
      syncHeartRate: true,
      syncHRV: true,
      syncSleep: true,
      syncWorkouts: true,
      syncCalories: true,
      autoSync: false
    }
  }));

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser: UserProfile = {
        ...user,
        ...formData,
        preferences: prefs
      };
      setUser(updatedUser);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setIsSaving(false);
      setErrorState("Chyba pri ukladaní.");
    }
  };

  const handlePushToggle = async () => {
    const isNative = Capacitor.isNativePlatform();
    const currentState = prefs.notificationsPush;
    
    // If turning ON and on a native platform
    if (!currentState && isNative) {
      try {
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive === 'granted') {
          setPrefs(prev => ({ ...prev, notificationsPush: true }));
          await PushNotifications.register();
        } else {
          alert("Prosím, povoľte notifikácie v nastaveniach systému.");
          return;
        }
      } catch (err) {
        console.error("Push Error:", err);
        alert("Nepodarilo sa aktivovať push notifikácie.");
        return;
      }
    } else if (!currentState && !isNative) {
      // In browser, just simulate or inform
      alert("Push notifikácie sú dostupné iba v mobilnej aplikácii. Vo webovej verzii používame Email notifikácie.");
      setPrefs(prev => ({ ...prev, notificationsPush: true }));
    } else {
      // Turning OFF
      setPrefs(prev => ({ ...prev, notificationsPush: false }));
    }
  };

  const updateHealthSync = (updates: Partial<HealthSyncConfig>) => {
    setPrefs(prev => ({
      ...prev,
      healthSync: { ...prev.healthSync, ...updates }
    }));
  };

  const handleManualSync = async () => {
    if (!db.isOnline()) {
      alert("Ste offline. Synchronizácia vyžaduje internetové pripojenie.");
      return;
    }
    if (onSync) {
      await onSync();
    }
  };

  const TabButton = ({ id, icon, label }: { id: SettingsTab, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setErrorState(null); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all
          ${activeTab === id 
              ? 'bg-primary-50 text-primary shadow-sm border border-primary-50 dark:bg-primary/20 dark:border-primary/10 dark:text-primary' 
              : 'text-txt-muted hover:bg-canvas hover:text-txt dark:text-txt-dark-muted dark:hover:bg-white/5 dark:hover:text-white'}
      `}
    >
      <span className={activeTab === id ? 'text-primary' : 'text-txt-muted dark:text-txt-dark-muted'}>{icon}</span>
      {label}
    </button>
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-surface rounded-2xl dark:bg-dark-surface">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-txt-muted">Načítavam profil...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20 h-full flex flex-col">
        <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold text-txt flex items-center gap-2 dark:text-txt-dark">
                <SettingsIcon className="text-primary" /> {t('settings.title')}
            </h2>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-2 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-sm
                    ${saveSuccess ? 'bg-green-500' : 'bg-primary hover:bg-primary-hover'}
                    ${isSaving ? 'opacity-70 cursor-wait' : ''}
                `}
            >
                {saveSuccess ? <Check size={18} /> : (isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />)}
                {saveSuccess ? t('settings.saved') : (isSaving ? t('settings.saving') : t('settings.save'))}
            </button>
        </div>

        {errorState && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle size={18} />
            <p className="text-sm font-medium">{errorState}</p>
            <button onClick={() => setErrorState(null)} className="ml-auto underline text-xs">Skúsiť znova</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-surface p-4 rounded-2xl shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-txt-light/10">
                    <div className="flex items-center gap-4 mb-6 p-2 border-b border-txt-light/10 pb-4 dark:border-txt-light/10">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <h3 className="font-bold text-txt dark:text-txt-dark">{user.name}</h3>
                            <p className="text-xs text-txt-muted dark:text-txt-dark-muted">{t('dash.level')} {user.twinLevel}</p>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        <TabButton id="profile" icon={<User size={18}/>} label={t('settings.account')} />
                        <TabButton id="appearance" icon={<Moon size={18}/>} label={t('settings.appearance')} />
                        <TabButton id="notifications" icon={<Bell size={18}/>} label={t('settings.notifications')} />
                        <TabButton id="health" icon={<Activity size={18}/>} label={t('settings.health')} />
                        <TabButton id="language" icon={<Globe size={18}/>} label={t('settings.language')} />
                        <TabButton id="privacy" icon={<Shield size={18}/>} label={t('settings.privacy')} />
                    </nav>
                </div>
                <div className="bg-surface p-4 rounded-2xl shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-txt-light/10">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 font-medium text-sm transition-colors dark:hover:bg-red-900/20">
                        <LogOut size={18} /> {t('nav.logout')}
                    </button>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' && (
                        <motion.section key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-2xl shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-txt-light/10">
                            <h3 className="text-lg font-bold text-txt mb-6 flex items-center gap-2 border-b border-txt-light/10 pb-4 dark:text-txt-dark dark:border-txt-light/10">
                                <User size={20} className="text-secondary" /> {t('settings.personal_info')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">{t('settings.name')}</label>
                                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full border border-txt-light/30 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-dark-canvas dark:text-txt-dark dark:border-txt-light/10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">{t('settings.surname')}</label>
                                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full border border-txt-light/30 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-dark-canvas dark:text-txt-dark dark:border-txt-light/10" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">{t('settings.email')}</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border border-txt-light/30 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-dark-canvas dark:text-txt-dark dark:border-txt-light/10" />
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.section key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-2xl shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-txt-light/10">
                            <h3 className="text-lg font-bold text-txt mb-6 flex items-center gap-2 border-b border-txt-light/10 pb-4 dark:text-txt-dark dark:border-txt-light/10">
                                <Bell size={20} className="text-secondary" /> Notifikácie
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Email Toggle */}
                                <div className="flex items-center justify-between p-4 bg-canvas dark:bg-dark-canvas rounded-2xl border border-txt-light/5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/30 dark:text-blue-400">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-txt dark:text-white">Emailové notifikácie</p>
                                            <p className="text-xs text-txt-muted dark:text-gray-400">Týždenné prehľady a dôležité míľniky.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setPrefs({...prefs, notificationsEmail: !prefs.notificationsEmail})}
                                        className={`w-14 h-7 rounded-full transition-all relative ${prefs.notificationsEmail ? 'bg-primary' : 'bg-txt-light/20'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${prefs.notificationsEmail ? 'left-8' : 'left-1'} shadow-sm`} />
                                    </button>
                                </div>

                                {/* Push Toggle */}
                                <div className="flex items-center justify-between p-4 bg-canvas dark:bg-dark-canvas rounded-2xl border border-txt-light/5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl dark:bg-purple-900/30 dark:text-purple-400">
                                            <Smartphone size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-txt dark:text-white">Push notifikácie</p>
                                            <p className="text-xs text-txt-muted dark:text-gray-400">Pripomienky na naplánované bloky a návyky.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handlePushToggle}
                                        className={`w-14 h-7 rounded-full transition-all relative ${prefs.notificationsPush ? 'bg-primary' : 'bg-txt-light/20'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${prefs.notificationsPush ? 'left-8' : 'left-1'} shadow-sm`} />
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'health' && (
                        <motion.section key="health" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-2xl shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-txt-light/10">
                            <div className="flex justify-between items-center mb-6 border-b border-txt-light/10 pb-4 dark:border-txt-light/10">
                                <h3 className="text-lg font-bold text-txt flex items-center gap-2 dark:text-txt-dark">
                                    <Activity size={20} className="text-secondary" /> {t('settings.health')}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleManualSync}
                                        disabled={isSyncing}
                                        className="p-2 rounded-lg bg-canvas dark:bg-dark-canvas hover:text-primary transition-all disabled:opacity-50"
                                        title="Synchronizovať dáta"
                                    >
                                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-primary-50/50 dark:bg-primary/5 rounded-2xl border border-primary/10">
                                    <div>
                                        <p className="text-sm font-bold text-txt dark:text-white">{t('settings.health.enable')}</p>
                                        <p className="text-xs text-txt-muted mt-1 dark:text-txt-dark-muted">{t('settings.health.desc')}</p>
                                    </div>
                                    <button 
                                        onClick={() => updateHealthSync({ enabled: !prefs.healthSync.enabled })}
                                        className={`w-14 h-7 rounded-full transition-all relative ${prefs.healthSync.enabled ? 'bg-primary' : 'bg-txt-light/20'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${prefs.healthSync.enabled ? 'left-8' : 'left-1'}`} />
                                    </button>
                                </div>

                                {prefs.healthSync.enabled ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SyncToggle label={t('settings.health.steps')} active={prefs.healthSync.syncSteps} onClick={() => updateHealthSync({ syncSteps: !prefs.healthSync.syncSteps })} />
                                        <SyncToggle label={t('settings.health.hr')} active={prefs.healthSync.syncHeartRate} onClick={() => updateHealthSync({ syncHeartRate: !prefs.healthSync.syncHeartRate })} />
                                        <SyncToggle label={t('settings.health.hrv')} active={prefs.healthSync.syncHRV} onClick={() => updateHealthSync({ syncHRV: !prefs.healthSync.syncHRV })} />
                                        <SyncToggle label={t('settings.health.sleep')} active={prefs.healthSync.syncSleep} onClick={() => updateHealthSync({ syncSleep: !prefs.healthSync.syncSleep })} />
                                    </div>
                                ) : (
                                    <div className="p-10 text-center text-txt-muted border-2 border-dashed border-txt-light/10 rounded-2xl dark:text-txt-dark-muted">
                                        <Smartphone size={40} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm">Prepojenie so senzormi telefónu je vypnuté.</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'appearance' && (
                        <motion.section key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-2xl shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-txt-light/10">
                            <h3 className="text-lg font-bold text-txt mb-6 flex items-center gap-2 border-b border-txt-light/10 pb-4 dark:text-txt-dark dark:border-txt-light/10">
                                <Moon size={20} className="text-secondary" /> {t('settings.appearance')}
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-txt dark:text-txt-dark">{t('settings.mode_title')}</p>
                                    <p className="text-xs text-txt-muted mt-1 dark:text-txt-dark-muted">{t('settings.mode_desc')}</p>
                                </div>
                                <div className="flex bg-canvas p-1 rounded-lg border border-txt-light/10 dark:bg-dark-canvas">
                                    <button onClick={() => setPrefs({...prefs, theme: 'light'})} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${prefs.theme === 'light' ? 'bg-white shadow-sm text-primary' : 'text-txt-muted'}`}>
                                        <Sun size={14} /> {t('settings.light')}
                                    </button>
                                    <button onClick={() => setPrefs({...prefs, theme: 'dark'})} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${prefs.theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-txt-muted'}`}>
                                        <Moon size={14} /> {t('settings.dark')}
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
                
                {!['profile', 'appearance', 'health', 'notifications'].includes(activeTab) && (
                   <div className="flex flex-col items-center justify-center p-20 bg-surface rounded-2xl border border-txt-light/10 dark:bg-dark-surface">
                      <Database size={40} className="text-txt-muted mb-4 opacity-30" />
                      <p className="text-sm text-txt-muted">Táto sekcia bude čoskoro dostupná.</p>
                      <button onClick={() => setActiveTab('profile')} className="mt-4 text-primary text-sm font-bold underline">Späť na profil</button>
                   </div>
                )}
            </div>
        </div>
    </div>
  );
};

const SyncToggle = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${active ? 'bg-white border-primary/20 shadow-sm dark:bg-dark-canvas' : 'bg-canvas border-transparent opacity-60'}`}
    >
        <span className="text-xs font-bold text-txt dark:text-white">{label}</span>
        {active ? <CheckCircle size={16} className="text-primary" /> : <div className="w-4 h-4 rounded-full border border-txt-light/40" />}
    </button>
);

export default Settings;
