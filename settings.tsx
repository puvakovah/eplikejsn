
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, UserPreferences } from './types';
import { Settings as SettingsIcon, User, Moon, Sun, Globe, LogOut, Save, Check, Activity, Bell, Loader2, Smartphone, MapPin, Calendar, Mail } from 'lucide-react';
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

const Settings: React.FC<SettingsProps> = ({ user, setUser, onLogout, onSync, isSyncing = false, lang = 'sk', setLang }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const t = (key: string): string => translations[lang][key] || key;

  // Bezpečná inicializácia preferencií a nastavení
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    const defaultPrefs: UserPreferences = {
      theme: 'light',
      language: lang,
      notificationsEmail: true,
      notificationsPush: false,
      healthSync: { 
        enabled: false, provider: null, syncSteps: true, syncHeartRate: true, 
        syncHRV: true, syncSleep: true, syncWorkouts: true, syncCalories: true, autoSync: false 
      }
    };
    
    return {
      ...defaultPrefs,
      ...(user?.preferences || {}),
    };
  });

  // Lokálny stav pre formulár účtu
  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth || '',
    address: user?.address || '', // Predpokladáme pole address v UserProfile
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    try {
      setPrefs(prev => ({ ...prev, theme: newTheme }));
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      localStorage.setItem('ideal_twin_theme', newTheme);
    } catch (e) {
      console.error("Chyba pri zmene témy:", e);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('ideal_twin_lang', newLang);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser: UserProfile = {
        ...user,
        ...accountData,
        preferences: {
          ...prefs,
          language: lang
        }
      };
      
      setUser(updatedUser);
      await db.saveUserData(user.name, updatedUser);
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Chyba pri ukladaní:", e);
      setIsSaving(false);
      alert("Nepodarilo sa uložiť zmeny.");
    }
  };

  const TabButton = ({ id, icon, label }: { id: SettingsTab, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
          ${activeTab === id 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-txt-muted hover:bg-canvas dark:hover:bg-white/5'}
      `}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between">
             <h2 className="text-3xl font-black text-txt flex items-center gap-3 dark:text-white uppercase tracking-tighter">
                <SettingsIcon className="text-primary" /> Nastavenia
            </h2>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-8 py-3 rounded-2xl font-black text-white transition-all flex items-center gap-2 shadow-xl
                    ${saveSuccess ? 'bg-green-500' : 'bg-primary hover:bg-primary-hover'}
                `}
            >
                {saveSuccess ? <Check size={20} /> : (isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />)}
                {saveSuccess ? 'Uložené' : 'Uložiť'}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-surface p-4 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                    <nav className="space-y-1">
                        <TabButton id="account" icon={<User size={18}/>} label="Môj Účet" />
                        <TabButton id="appearance" icon={<Moon size={18}/>} label="Vzhľad" />
                        <TabButton id="language" icon={<Globe size={18}/>} label="Jazyk" />
                        <TabButton id="notifications" icon={<Bell size={18}/>} label="Notifikácie" />
                        <TabButton id="health" icon={<Activity size={18}/>} label="Zdravie" />
                    </nav>
                </div>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-8 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors dark:hover:bg-red-900/20">
                    <LogOut size={18} /> Odhlásiť sa
                </button>
            </div>

            <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'account' && (
                        <motion.section key="account" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">Profilové informácie</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider">Meno</label>
                                        <input 
                                          type="text" 
                                          value={accountData.firstName} 
                                          onChange={(e) => setAccountData({...accountData, firstName: e.target.value})}
                                          className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-2.5 dark:bg-dark-canvas dark:border-white/10 outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider">Priezvisko</label>
                                        <input 
                                          type="text" 
                                          value={accountData.lastName} 
                                          onChange={(e) => setAccountData({...accountData, lastName: e.target.value})}
                                          className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-2.5 dark:bg-dark-canvas dark:border-white/10 outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider flex items-center gap-1"><Mail size={12}/> Emailová adresa</label>
                                    <input 
                                      type="email" 
                                      value={accountData.email} 
                                      onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                                      className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-2.5 dark:bg-dark-canvas dark:border-white/10 outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider flex items-center gap-1"><Calendar size={12}/> Dátum narodenia</label>
                                    <input 
                                      type="date" 
                                      value={accountData.dateOfBirth} 
                                      onChange={(e) => setAccountData({...accountData, dateOfBirth: e.target.value})}
                                      className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-2.5 dark:bg-dark-canvas dark:border-white/10 outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-txt-muted mb-1 uppercase tracking-wider flex items-center gap-1"><MapPin size={12}/> Bydlisko / Adresa</label>
                                    <input 
                                      type="text" 
                                      value={accountData.address} 
                                      onChange={(e) => setAccountData({...accountData, address: e.target.value})}
                                      className="w-full bg-canvas border border-txt-light/20 rounded-xl px-4 py-2.5 dark:bg-dark-canvas dark:border-white/10 outline-none focus:ring-2 focus:ring-primary"
                                      placeholder="Mesto, Krajina"
                                    />
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'appearance' && (
                        <motion.section key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">Motív zobrazenia</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleThemeChange('light')} className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${prefs?.theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>
                                    <Sun size={32} /> <span className="text-sm font-black uppercase tracking-widest">Svetlý Režim</span>
                                </button>
                                <button onClick={() => handleThemeChange('dark')} className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${prefs?.theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>
                                    <Moon size={32} /> <span className="text-sm font-black uppercase tracking-widest">Tmavý Režim</span>
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'language' && (
                        <motion.section key="language" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">Jazyk aplikácie</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => handleLanguageChange('sk')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${lang === 'sk' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>
                                    <span className="font-bold">Slovenčina</span>
                                    {lang === 'sk' && <Check size={20}/>}
                                </button>
                                <button onClick={() => handleLanguageChange('en')} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${lang === 'en' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>
                                    <span className="font-bold">English</span>
                                    {lang === 'en' && <Check size={20}/>}
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.section key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight">Upozornenia</h3>
                            <div className="flex items-center justify-between p-6 bg-canvas dark:bg-dark-canvas rounded-3xl border border-txt-light/5">
                                <div>
                                    <p className="font-black text-txt dark:text-white">Push Notifikácie</p>
                                    <p className="text-xs text-txt-muted mt-1 italic">Upozornenia na dôležité udalosti.</p>
                                </div>
                                <button 
                                    onClick={() => setPrefs(prev => ({...prev, notificationsPush: !(prev?.notificationsPush ?? false)}))}
                                    className={`w-14 h-8 rounded-full transition-colors relative ${prefs?.notificationsPush ? 'bg-primary' : 'bg-txt-light/30'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${prefs?.notificationsPush ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </motion.section>
                    )}
                    
                    {activeTab === 'health' && (
                        <motion.section key="health" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-surface p-8 rounded-[2rem] shadow-sm border border-txt-light/10 dark:bg-dark-surface dark:border-white/10">
                            <h3 className="text-xl font-black text-txt mb-6 border-b border-txt-light/10 pb-4 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Smartphone size={20} className="text-primary" /> Zdravie (Sync)
                            </h3>
                            <p className="text-sm text-txt-muted mb-6">Prepojte svoje zdravotné dáta pre presnejšiu analýzu energie.</p>
                            <button className="w-full bg-primary text-white py-4 rounded-2xl font-black hover:bg-primary-hover transition-all">
                                Prepojiť s Google Health / Apple Health
                            </button>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
};

export default Settings;
