
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, UserPreferences } from './types';
import { 
  Settings as SettingsIcon, User, Moon, Sun, Globe, LogOut, Save, Check, 
  Activity, Bell, Loader2, MapPin, Mail, Cake, ToggleRight, ToggleLeft 
} from 'lucide-react';
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

type SettingsTab = 'account' | 'appearance' | 'language' | 'health' | 'notifications';

const Settings: React.FC<SettingsProps> = ({ user, setUser, onLogout, lang, setLang }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const t = (key: string): string => translations[lang][key as keyof typeof translations.en] || key;

  // Lokálny stav pre editáciu
  const [prefs, setPrefs] = useState<UserPreferences>(() => ({
    ...user.preferences,
    notificationsEnabled: user.preferences?.notificationsEnabled ?? true,
    theme: (localStorage.getItem('ideal_twin_theme') as 'light' | 'dark') || user.preferences?.theme || 'light'
  }));

  const [accountData, setAccountData] = useState({
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    streetAddress: user.streetAddress || '',
    city: user.city || '',
    country: user.country || '',
    dateOfBirth: user.dateOfBirth || ''
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setPrefs(prev => ({ ...prev, theme: newTheme }));
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('ideal_twin_theme', newTheme);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('ideal_twin_lang', newLang);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedUser: UserProfile = {
        ...user,
        ...accountData,
        preferences: { 
          ...prefs, 
          language: lang,
        }
      };
      
      // 1. Update global state
      setUser(updatedUser);

      // 2. Database/Server Sync (Supabase + Local Cache)
      // Fix: UserProfile interface uses 'name' instead of 'username'
      const result = await db.saveUserData(user.name || 'user', updatedUser);
      
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("General Save Error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const TabButton = ({ id, icon, label }: { id: SettingsTab, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
          ${activeTab === id 
              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
              : 'text-txt-muted hover:bg-canvas dark:text-txt-dark-muted dark:hover:bg-white/5'}
      `}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between">
             <h2 className="text-3xl font-black text-txt flex items-center gap-3 dark:text-white uppercase tracking-tighter">
                <SettingsIcon className="text-primary" /> {t('nav.settings')}
            </h2>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-8 py-3 rounded-2xl font-black text-white transition-all flex items-center gap-2 shadow-xl
                    ${saveSuccess ? 'bg-green-500' : 'bg-primary hover:bg-primary-hover'}
                    ${isSaving ? 'opacity-70 cursor-wait' : ''}
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
                        <TabButton id="account" icon={<User size={18}/>} label={t('settings.account')} />
                        <TabButton id="appearance" icon={<Moon size={18}/>} label={t('settings.appearance')} />
                        <TabButton id="language" icon={<Globe size={18}/>} label={t('settings.language')} />
                        <TabButton id="notifications" icon={<Bell size={18}/>} label={t('settings.notifications')} />
                        <TabButton id="health" icon={<Activity size={18}/>} label={t('settings.health')} />
                    </nav>
                </div>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-8 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors dark:hover:bg-red-900/20">
                    <LogOut size={18} /> {t('nav.logout')}
                </button>
            </div>

            <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'account' && (
                        <motion.section key="account" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10 space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">{t('settings.personal_info')}</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider">{t('settings.name')}</label>
                                            <input 
                                              type="text" 
                                              value={accountData.firstName} 
                                              onChange={(e) => setAccountData({...accountData, firstName: e.target.value})}
                                              className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 dark:bg-dark-canvas dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider">{t('settings.surname')}</label>
                                            <input 
                                              type="text" 
                                              value={accountData.lastName} 
                                              onChange={(e) => setAccountData({...accountData, lastName: e.target.value})}
                                              className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 dark:bg-dark-canvas dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider flex items-center gap-1"><Mail size={12}/> {t('settings.email')}</label>
                                            <input 
                                              type="email" 
                                              value={accountData.email} 
                                              onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                                              className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 dark:bg-dark-canvas dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider flex items-center gap-1"><Cake size={12}/> {t('settings.dob')}</label>
                                            <input 
                                              type="date" 
                                              value={accountData.dateOfBirth} 
                                              onChange={(e) => setAccountData({...accountData, dateOfBirth: e.target.value})}
                                              className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 dark:bg-dark-canvas dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight flex items-center gap-2"><MapPin size={20} className="text-primary"/> {t('settings.address_info')}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider">{t('settings.street')}</label>
                                        <input 
                                          type="text" 
                                          value={accountData.streetAddress} 
                                          onChange={(e) => setAccountData({...accountData, streetAddress: e.target.value})}
                                          className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 dark:bg-dark-canvas dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                          placeholder="Hlavná 123"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider">{t('settings.city')}</label>
                                            <input 
                                              type="text" 
                                              value={accountData.city} 
                                              onChange={(e) => setAccountData({...accountData, city: e.target.value})}
                                              className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 dark:bg-dark-canvas dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                              placeholder="Bratislava"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider">{t('settings.country')}</label>
                                            <input 
                                              type="text" 
                                              value={accountData.country} 
                                              onChange={(e) => setAccountData({...accountData, country: e.target.value})}
                                              className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 dark:bg-dark-canvas dark:border-white/10 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                              placeholder="Slovensko"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'appearance' && (
                        <motion.section key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">{t('settings.mode_title')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleThemeChange('light')} className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${prefs.theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas dark:text-white'}`}>
                                    <Sun size={32} /> <span className="text-sm font-black uppercase tracking-widest">{t('settings.light')}</span>
                                </button>
                                <button onClick={() => handleThemeChange('dark')} className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${prefs.theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas dark:text-white'}`}>
                                    < Moon size={32} /> <span className="text-sm font-black uppercase tracking-widest">{t('settings.dark')}</span>
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'language' && (
                        <motion.section key="language" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">{t('settings.lang_title')}</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => handleLanguageChange('sk')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${lang === 'sk' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas dark:text-white'}`}>
                                    <span className="font-bold text-lg">Slovenčina</span>
                                    {lang === 'sk' && <Check size={24} className="text-primary"/>}
                                </button>
                                <button onClick={() => handleLanguageChange('en')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${lang === 'en' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas dark:text-white'}`}>
                                    <span className="font-bold text-lg">English</span>
                                    {lang === 'en' && <Check size={24} className="text-primary"/>}
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.section key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">{t('settings.notifications')}</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-canvas rounded-2xl dark:bg-dark-canvas border border-txt-light/5 shadow-inner">
                                    <div>
                                        <p className="font-bold text-txt dark:text-white">{t('settings.notif_toggle')}</p>
                                        <p className="text-xs text-txt-muted">{t('settings.notif_push_desc')}</p>
                                    </div>
                                    <button 
                                        onClick={() => setPrefs(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
                                        className={`transition-all ${prefs.notificationsEnabled ? 'text-primary' : 'text-txt-light'}`}
                                    >
                                        {prefs.notificationsEnabled ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                                    </button>
                                </div>
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
