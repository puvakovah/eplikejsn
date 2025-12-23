
import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Habit, UserProfile, SearchResult, InboxMessage } from './types';
import { LEVELING_SYSTEM, getLevelInfo } from './gamificationConfig';
import { getHabitSuggestions } from './geminiService';
import { Check, Flame, Trash2, Plus, Sparkles, Loader2, Search, X, ExternalLink, Mail, ArrowUpCircle, Save } from 'lucide-react';
import { translations, Language } from './translations';

interface HabitsProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  addToast: (msg: string, type?: 'xp' | 'lvl') => void;
  lang?: Language;
}

const Habits: React.FC<HabitsProps> = ({ habits, setHabits, user, setUser, addToast, lang = 'sk' }) => {
  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  // AI Search state for grounding features
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ text: string, sources: SearchResult[] } | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    try { 
        await Haptics.impact({ style }); 
    } catch { 
        if(navigator.vibrate) navigator.vibrate(style === ImpactStyle.Heavy ? 30 : 10); 
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    try {
        const result = await getHabitSuggestions(searchQuery);
        setSuggestions(result);
    } catch (e) {
        addToast("Nepodarilo sa vygenerovať odporúčania.");
    } finally {
        setLoadingSearch(false);
    }
  };

  const handleToggle = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.completedDates.includes(today)) return;

    await triggerHaptic(ImpactStyle.Medium);

    const xpGain = LEVELING_SYSTEM.xpValues.COMPLETE_HABIT;
    
    setHabits(prev => prev.map(h => h.id === id ? { 
        ...h, 
        streak: h.streak + 1, 
        completedDates: [...h.completedDates, today] 
    } : h));
    
    const newXp = user.xp + xpGain;
    const info = getLevelInfo(newXp);
    const isLevelUp = info.level > user.twinLevel;

    setUser(prev => ({
        ...prev,
        xp: newXp,
        twinLevel: info.level,
        xpToNextLevel: info.nextLevelXp,
        energy: isLevelUp ? 100 : Math.min(100, prev.energy + 5),
        dailyHabitCount: prev.dailyHabitCount + 1
    }));

    addToast(`+${xpGain} XP`, 'xp');
    if (isLevelUp) {
        addToast(`LEVEL UP! Úroveň ${info.level}`, 'lvl');
        triggerHaptic(ImpactStyle.Heavy);
    }
  };

  const handleCreate = async () => {
    if(!newTitle.trim()) return;
    
    await triggerHaptic(ImpactStyle.Light);
    const xpReward = LEVELING_SYSTEM.xpValues.CREATE_HABIT;
    
    const newHabit: Habit = { 
        id: Date.now().toString(), 
        title: newTitle, 
        streak: 0, 
        completedDates: [], 
        frequency: 'daily', 
        category: 'productivity' 
    };

    setHabits(prev => [...prev, newHabit]);
    addToast(`Návyk pridaný! +${xpReward} XP`);
    
    const info = getLevelInfo(user.xp + xpReward);
    setUser(prev => ({ ...prev, xp: prev.xp + xpReward, twinLevel: info.level, xpToNextLevel: info.nextLevelXp }));
    
    setNewTitle('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
      if (confirm("Naozaj vymazať tento návyk?")) {
          await triggerHaptic(ImpactStyle.Light);
          setHabits(prev => prev.filter(h => h.id !== id));
      }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4">
        <div>
            <h2 className="text-2xl font-bold">{t('habits.title')}</h2>
            <p className="text-xs text-txt-muted">Buduj konzistentnosť, získavaj XP.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAiSearch(!showAiSearch)}
                className="flex-1 sm:flex-none bg-canvas border border-primary/20 text-primary px-4 py-3 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold text-sm dark:bg-dark-canvas"
            >
                <Search size={18} /> <span className="hidden sm:inline">{t('habits.find_ai')}</span>
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAdding(true)}
                className="flex-1 sm:flex-none bg-primary text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
                <Plus size={20} /> <span className="hidden sm:inline text-sm font-bold">{t('habits.new_habit')}</span>
            </motion.button>
        </div>
      </div>

      <AnimatePresence>
          {showAiSearch && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface p-6 rounded-[2.5rem] shadow-md border border-txt-light/10 dark:bg-dark-surface mx-2"
              >
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Sparkles size={20} />
                    <h3 className="font-bold">{t('habits.ai_title')}</h3>
                  </div>
                  <p className="text-sm text-txt-muted mb-4">
                    {t('habits.ai_desc')} Napr. "ako zlepšiť hlboký spánok".
                  </p>
                  
                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 bg-canvas border border-txt-light/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-sm dark:bg-dark-canvas dark:border-white/10"
                      placeholder={t('habits.search_placeholder')}
                    />
                    <button 
                      onClick={handleSearch}
                      disabled={loadingSearch}
                      className="bg-primary hover:bg-primary-hover text-white px-6 rounded-xl font-bold disabled:opacity-50 transition-colors"
                    >
                      {loadingSearch ? <Loader2 className="animate-spin" size={20} /> : t('habits.search_btn')}
                    </button>
                  </div>

                  {suggestions && (
                    <div className="bg-canvas p-5 rounded-2xl border border-txt-light/10 dark:bg-dark-canvas dark:border-white/5">
                      <p className="text-txt dark:text-txt-dark text-sm leading-relaxed whitespace-pre-wrap">{suggestions.text}</p>
                      
                      {suggestions.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-txt-light/10 dark:border-white/10">
                          <p className="text-[10px] font-black text-txt-muted uppercase tracking-widest mb-3">{t('habits.sources')}</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.sources.map((source, idx) => (
                              <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-txt-light/10 rounded-full text-xs text-primary hover:bg-primary/5 transition-colors dark:bg-dark-surface"
                              >
                                <ExternalLink size={12} />
                                {source.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </motion.div>
          )}
      </AnimatePresence>

      <LayoutGroup>
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {habits.map(habit => {
              const done = habit.completedDates.includes(today);
              return (
                <motion.div
                  layout
                  key={habit.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  className={`group relative overflow-hidden bg-surface p-5 rounded-3xl border transition-all duration-300 dark:bg-dark-surface
                    ${done ? 'bg-secondary/5 border-secondary/20 shadow-inner' : 'border-txt-light/10 shadow-sm hover:shadow-md hover:border-primary/30'}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <motion.div layout className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] uppercase font-bold text-txt-muted bg-canvas dark:bg-dark-canvas px-2 py-0.5 rounded-lg border border-txt-light/5">{t('habits.daily')}</span>
                         <div className="flex items-center gap-1 text-habit font-bold text-xs">
                           <Flame size={14} fill="currentColor" className={habit.streak > 0 ? "animate-pulse" : ""} /> {habit.streak}
                         </div>
                      </motion.div>
                      <motion.h3 
                        layout
                        className={`text-lg font-bold transition-all ${done ? 'opacity-40 line-through text-txt-muted' : 'text-txt dark:text-white'}`}
                      >
                        {habit.title}
                      </motion.h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {!done && (
                            <button 
                                onClick={() => handleDelete(habit.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-txt-light hover:text-red-500 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => handleToggle(habit.id)}
                            disabled={done}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm
                            ${done ? 'bg-secondary text-white border-none' : 'bg-canvas text-txt-light border border-txt-light/20 dark:bg-dark-canvas dark:border-white/10'}
                            `}
                        >
                            {done ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={28} strokeWidth={4} /></motion.div> : <Check size={24} />}
                        </motion.button>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-1 justify-between">
                      {[...Array(7)].map((_, i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < (habit.streak % 8) ? 'bg-primary' : 'bg-canvas dark:bg-dark-canvas'}`}></div>
                      ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-md flex items-end md:items-center justify-center p-4"
          >
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="bg-surface w-full max-w-md p-8 rounded-t-[3rem] md:rounded-[2.5rem] shadow-2xl dark:bg-dark-surface border-t border-white/20"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">{t('habits.new_habit')}</h3>
                    <button onClick={() => setIsAdding(false)} className="p-2 bg-canvas dark:bg-dark-canvas rounded-full"><X size={20}/></button>
                </div>
                
                <input 
                  autoFocus
                  className="w-full bg-canvas border border-txt-light/20 p-5 rounded-2xl mb-6 outline-none focus:ring-4 focus:ring-primary/20 text-lg transition-all dark:bg-dark-canvas dark:border-white/10"
                  placeholder={t('habits.name_placeholder')}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                
                <div className="flex gap-4">
                    <button onClick={() => setIsAdding(false)} className="flex-1 p-5 font-bold text-txt-muted hover:bg-canvas rounded-2xl transition-colors">{t('habits.cancel')}</button>
                    <button 
                        onClick={handleCreate}
                        disabled={!newTitle.trim()}
                        className="flex-1 bg-primary text-white p-5 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                        {t('habits.save')}
                    </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Habits;
