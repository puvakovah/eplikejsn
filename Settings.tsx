import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, UserPreferences } from './types';
import { Settings as SettingsIcon, User, Moon, Bell, Globe, LogOut, Save, Check, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { translations, Language } from './translations';
import { db } from './db';

interface SettingsProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onLogout: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
  lang: Language;
  setLang: (l: Language) => void;
}

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'language' | 'health';

const Settings: React.FC<SettingsProps> = ({ user, setUser, onLogout, onSync, isSyncing = false, lang = 'sk', setLang }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser: UserProfile = {
        ...user,
        ...formData,
        preferences: { ...prefs, language: lang }
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

  const handleHealthSyncAction = async () => {
    setIsSaving(true);
    setTimeout(() => {
        setIsSaving(false);
        const updatedUser = { ...user, isHealthSynced: true };
        setUser(updatedUser);
        alert("Zdravotné dáta boli úspešne prepojené.");
    }, 1500);
  };

  const TabButton = ({ id, icon, label }: { id: SettingsTab, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all
          ${activeTab === id 
              ? 'bg-primary-50 text-primary shadow-sm border border-primary-50 dark:bg-primary/20 dark:border-primary/10' 
              : 'text-txt-muted hover:bg-canvas dark:hover:bg-white/5'}
      `}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20">
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
                <div className="bg-surface p-4 rounded-3xl shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                    <nav className="space-y-1">
                        <TabButton id="profile" icon={<User size={18}/>} label={t('settings.account')} />
                        <TabButton id="appearance" icon={<Moon size={18}/>} label={t('settings.appearance')} />
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
                        <motion.section key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">
                                {t('settings.personal_info')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-txt-muted mb-1">{t('settings.name')}</label>
                                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full border border-txt-light/20 rounded-xl px-4 py-3 bg-canvas dark:bg-dark-canvas" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-txt-muted mb-1">{t('settings.surname')}</label>
                                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full border border-txt-light/20 rounded-xl px-4 py-3 bg-canvas dark:bg-dark-canvas" />
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'language' && (
                        <motion.section key="language" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">
                                {t('settings.language')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => { setLang('sk'); setPrefs({...prefs, language: 'sk'}); }} 
                                    className={`p-10 rounded-3xl border-2 font-black transition-all ${lang === 'sk' ? 'border-primary bg-primary/5 text-primary scale-105' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}
                                >
                                    Slovenčina
                                </button>
                                <button 
                                    onClick={() => { setLang('en'); setPrefs({...prefs, language: 'en'}); }} 
                                    className={`p-10 rounded-3xl border-2 font-black transition-all ${lang === 'en' ? 'border-primary bg-primary/5 text-primary scale-105' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}
                                >
                                    English
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'health' && (
                        <motion.section key="health" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">
                                Synchronizácia
                            </h3>
                            <div className="flex flex-col items-center text-center p-6 space-y-6">
                                <Activity size={48} className="text-primary" />
                                <div>
                                    <p className="font-black text-txt dark:text-white text-lg">Zdravotné dáta</p>
                                    <p className="text-sm text-txt-muted max-w-sm mt-2">Analýza spánku a HRV pre optimalizáciu tvojho dňa.</p>
                                </div>
                                <button 
                                    onClick={handleHealthSyncAction}
                                    className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-primary-hover flex items-center gap-2"
                                >
                                    <RefreshCw size={20} /> Prepojiť teraz
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
