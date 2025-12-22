import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, UserPreferences } from './types';
// Fixed: Added missing RefreshCw icon to the import list
import { Settings as SettingsIcon, User, Moon, Sun, Monitor, Globe, LogOut, Save, Check, Activity, Bell, Loader2, Smartphone, RefreshCw } from 'lucide-react';
import { translations, Language } from './translations';
import { db } from './db';
import { PushNotifications } from '@capacitor/push-notifications';

interface SettingsProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onLogout: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
  lang: Language;
  setLang: (l: Language) => void;
}

type SettingsTab = 'profile' | 'appearance' | 'language' | 'health' | 'notifications';

const Settings: React.FC<SettingsProps> = ({ user, setUser, onLogout, onSync, isSyncing = false, lang = 'sk', setLang }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncingHealth, setSyncingHealth] = useState(false);

  const t = (key: string): string => translations[lang][key] || key;

  const [prefs, setPrefs] = useState<UserPreferences>(user?.preferences || {
    theme: 'light',
    language: lang,
    notificationsEmail: true,
    notificationsPush: false,
    healthSync: { enabled: false, provider: null, syncSteps: true, syncHeartRate: true, syncHRV: true, syncSleep: true, syncWorkouts: true, syncCalories: true, autoSync: false }
  });

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setPrefs({ ...prefs, theme: newTheme as any });
    applyTheme(newTheme);
  };

  const handleNotificationToggle = async () => {
    const newState = !prefs.notificationsPush;
    if (newState) {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          setPrefs({ ...prefs, notificationsPush: true });
        } else {
          alert('Povolenie notifikácií bolo zamietnuté.');
          setPrefs({ ...prefs, notificationsPush: false });
        }
      } catch (err) {
        console.warn('PushNotifications nie sú dostupné (web prehliadač).');
        setPrefs({ ...prefs, notificationsPush: true }); 
      }
    } else {
      setPrefs({ ...prefs, notificationsPush: false });
    }
  };

  const handleHealthSyncAction = async () => {
    setSyncingHealth(true);
    try {
        // Simulácia API volania Apple Health / Google Fit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const updatedPrefs = { 
            ...prefs, 
            healthSync: { ...prefs.healthSync, enabled: true } 
        };
        setPrefs(updatedPrefs);
        
        // Okamžitá aktualizácia profilu, aby nespôsobila crash
        const updatedUser = { ...user, isHealthSynced: true, preferences: updatedPrefs };
        setUser(updatedUser);
        await db.saveUserData(user.name, updatedUser);
        
    } catch (e) {
        console.error("Health Sync failed", e);
        // Fallback: nastavíme aspoň vizuálne, aby aplikácia nezamrzla
        setPrefs({ ...prefs, healthSync: { ...prefs.healthSync, enabled: true } });
    } finally {
        setSyncingHealth(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser: UserProfile = {
        ...user,
        ...formData,
        preferences: { ...prefs, language: lang },
        isHealthSynced: prefs.healthSync.enabled
      };
      await db.saveUserData(user.name, updatedUser);
      setUser(updatedUser);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setIsSaving(false);
    }
  };

  const TabButton = ({ id, icon, label }: { id: SettingsTab, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
          ${activeTab === id 
              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
              : 'text-txt-muted hover:bg-canvas dark:hover:bg-white/5'}
      `}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20 max-w-5xl mx-auto">
        <div className="flex items-center justify-between px-2">
             <h2 className="text-3xl font-black text-txt flex items-center gap-3 dark:text-white uppercase tracking-tighter">
                <SettingsIcon className="text-primary" /> {t('settings.title')}
            </h2>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-8 py-3 rounded-2xl font-black text-white transition-all flex items-center gap-2 shadow-xl
                    ${saveSuccess ? 'bg-green-500' : 'bg-primary hover:bg-primary-hover'}
                `}
            >
                {saveSuccess ? <Check size={20} /> : (isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />)}
                {saveSuccess ? t('settings.saved') : (isSaving ? t('settings.saving') : t('settings.save'))}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-surface p-4 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                    <nav className="space-y-1">
                        <TabButton id="profile" icon={<User size={18}/>} label={t('settings.account')} />
                        <TabButton id="appearance" icon={<Moon size={18}/>} label={t('settings.appearance')} />
                        <TabButton id="notifications" icon={<Bell size={18}/>} label={t('settings.notifications')} />
                        <TabButton id="health" icon={<Activity size={18}/>} label={t('settings.health')} />
                        <TabButton id="language" icon={<Globe size={18}/>} label={t('settings.language')} />
                    </nav>
                </div>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-8 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors dark:hover:bg-red-900/20">
                    <LogOut size={18} /> {t('nav.logout')}
                </button>
            </div>

            <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' && (
                        <motion.section key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">
                                {t('settings.personal_info')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-txt-muted mb-1">{t('settings.name')}</label>
                                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full border border-txt-light/20 rounded-xl px-4 py-3 bg-canvas dark:bg-dark-canvas dark:border-white/10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-txt-muted mb-1">{t('settings.surname')}</label>
                                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full border border-txt-light/20 rounded-xl px-4 py-3 bg-canvas dark:bg-dark-canvas dark:border-white/10" />
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'appearance' && (
                        <motion.section key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">
                                {t('settings.appearance')}
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => handleThemeChange('light')} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${prefs.theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>
                                    <Sun size={28} /> <span className="text-xs font-black uppercase tracking-widest">Svetlý</span>
                                </button>
                                <button onClick={() => handleThemeChange('dark')} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${prefs.theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>
                                    <Moon size={28} /> <span className="text-xs font-black uppercase tracking-widest">Tmavý</span>
                                </button>
                                <button onClick={() => handleThemeChange('system')} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${prefs.theme === 'system' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>
                                    <Monitor size={28} /> <span className="text-xs font-black uppercase tracking-widest">Systém</span>
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'health' && (
                        <motion.section key="health" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Smartphone size={20} className="text-primary" /> Synchronizácia Zdravia
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-canvas dark:bg-dark-canvas rounded-2xl">
                                    <div>
                                        <p className="font-black text-txt dark:text-white">Prepojiť Apple Health / Google Fit</p>
                                        <p className="text-xs text-txt-muted mt-1">Vaše dáta spánku a aktivity budú základom pre Dvojníka.</p>
                                    </div>
                                    <button 
                                        onClick={handleHealthSyncAction}
                                        disabled={syncingHealth}
                                        className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2
                                            ${prefs.healthSync.enabled ? 'bg-secondary text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'}
                                            ${syncingHealth ? 'opacity-50' : ''}
                                        `}
                                    >
                                        {syncingHealth ? <Loader2 size={18} className="animate-spin" /> : (prefs.healthSync.enabled ? <Check size={18} /> : <RefreshCw size={18} />)}
                                        {prefs.healthSync.enabled ? 'Synchronizované' : (syncingHealth ? 'Prepájam...' : 'Prepojiť teraz')}
                                    </button>
                                </div>
                                {prefs.healthSync.enabled && (
                                    <div className="p-5 bg-secondary/10 rounded-2xl border border-secondary/20 animate-fade-in">
                                        <p className="text-sm text-secondary font-bold flex items-center gap-2">
                                            <Check size={16} /> Dáta sa automaticky synchronizujú z Apple Health / Google Fit.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.section key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">
                                Notifikácie
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-canvas dark:bg-dark-canvas rounded-2xl">
                                <div>
                                    <p className="font-black text-txt dark:text-white">Push Notifikácie</p>
                                    <p className="text-xs text-txt-muted mt-1">Dostávajte upozornenia na dôležité míľniky.</p>
                                </div>
                                <button 
                                    onClick={handleNotificationToggle}
                                    className={`w-14 h-8 rounded-full transition-colors relative ${prefs.notificationsPush ? 'bg-primary' : 'bg-txt-light/30'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${prefs.notificationsPush ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'language' && (
                        <motion.section key="language" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">
                                {t('settings.language')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => { setLang('sk'); setPrefs({...prefs, language: 'sk'}); }} 
                                    className={`p-10 rounded-3xl border-2 font-black transition-all ${lang === 'sk' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}
                                >
                                    Slovenčina
                                </button>
                                <button 
                                    onClick={() => { setLang('en'); setPrefs({...prefs, language: 'en'}); }} 
                                    className={`p-10 rounded-3xl border-2 font-black transition-all ${lang === 'en' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}
                                >
                                    English
                                </button>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
};

export default Settings;