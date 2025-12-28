import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile, DayPlan, AppView } from './types';
import { Activity, Zap, Loader2, Sparkles, CheckCircle2, CloudOff } from 'lucide-react';
import { calculateLevelData, calculateEnergy, CATEGORY_UNLOCKS } from './gamificationConfig';
import Avatar from './Avatar';
import { translations, Language } from './translations';

interface DashboardProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  plan: DayPlan;
  onNavigate: (view: AppView) => void;
  lang?: Language;
  isOnline?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, plan, onNavigate, lang = 'sk', isOnline = true }) => {
  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;

  const [nextLevelPerks, setNextLevelPerks] = useState<string[]>([]);

  if (!user || !plan) return (
    <div className="flex flex-col items-center justify-center p-20 text-primary h-full">
      <Loader2 className="animate-spin mb-2" size={40} />
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 italic">Načítavam...</p>
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  
  // VÝPOČET PROGRESU DŇA
  const plannedTasks = plan.plannedBlocks?.length || 0;
  const completedTasks = plan.actualBlocks?.filter(b => b.isCompleted).length || 0;
  const progressPercent = plannedTasks > 0 ? Math.min(Math.round((completedTasks / plannedTasks) * 100), 100) : 0;

  const levelData = calculateLevelData(user.xp || 0);
  const nextLevel = levelData.level + 1;
  const energyValue = calculateEnergy(user.healthData?.[today], user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick });

  // Parametre pre progres kruh (SVG)
  const radius = 75;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // DYNAMICKÉ ODOMYKANIE KATEGÓRIÍ
  useEffect(() => {
    const perks: string[] = [];
    const unlockedCategory = Object.entries(CATEGORY_UNLOCKS).find(([_, lvl]) => lvl === nextLevel);
    
    if (unlockedCategory) {
      const catKey = unlockedCategory[0];
      const catTranslations: Record<string, string> = {
        CLOTHING: lang === 'sk' ? '👕 Zmena oblečenia' : '👕 Change Outfit',
        SHOES: lang === 'sk' ? '👟 Kategória: Topánky' : '👟 Shoes unlocked',
        GLASSES: lang === 'sk' ? '👓 Kategória: Okuliare' : '👓 Glasses unlocked',
        HEADWEAR: lang === 'sk' ? '🧢 Kategória: Pokrývka hlavy' : '🧢 Headwear unlocked',
        ACCESSORIES: lang === 'sk' ? '💍 Nové doplnky' : '💍 Accessories unlocked'
      };
      if (catTranslations[catKey]) perks.push(catTranslations[catKey]);
    }

    if (perks.length === 0) {
      if (nextLevel % 2 === 0) perks.push(lang === 'sk' ? '⚡ +5% Limit energie' : '⚡ +5% Energy limit');
      else perks.push(lang === 'sk' ? '🧬 AI analýza dňa' : '🧬 AI Day Analysis');
    }
    setNextLevelPerks(perks);
  }, [nextLevel, lang]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-2xl font-semibold text-txt dark:text-white tracking-tight">
                {t('dash.welcome')}, {user.firstName || user.name}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 opacity-45 text-[10px] font-bold uppercase tracking-[0.15em]">
                {isOnline ? <CheckCircle2 size={12} className="text-secondary" /> : <CloudOff size={12} className="text-red-400" />}
                <span className="text-primary">{levelData.title}</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                <span>{t('dash.level')} {levelData.level}</span>
            </div>
          </motion.div>
          
          <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(AppView.PLANNER)} 
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20"
          >
              <Zap size={14} /> {t('dash.open_planner')}
          </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PROGRES KRUH - OČISTENÝ OD TEXTU POD KRUHOM */}
        <div className="lg:col-span-4 bg-surface dark:bg-dark-surface p-8 rounded-[2.5rem] border border-txt-light/5 shadow-sm flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
                <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                    <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="text-canvas dark:text-white/5"
                    />
                    <motion.circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="text-primary"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold tracking-tighter tabular-nums">{progressPercent}%</span>
                    <span className="text-[8px] font-black uppercase opacity-40">{completedTasks}/{plannedTasks}</span>
                </div>
            </div>
            {/* Priestor pod kruhom je teraz prázdny a čistý */}
        </div>

        {/* AVATAR CENTER */}
        <div className="lg:col-span-4 bg-surface dark:bg-dark-surface p-10 rounded-[3rem] border border-txt-light/5 shadow-lg flex flex-col items-center justify-center min-h-[400px]">
            <Avatar user={user} size="lg" />
            <div className="mt-8 text-center">
                <div className="text-[9px] font-black text-primary uppercase tracking-[0.3em] opacity-30 mb-1">{t('dash.energy')}</div>
                <div className="text-4xl font-light tracking-tighter tabular-nums">{energyValue}%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-txt-muted mt-2 opacity-60">
                  {energyValue > 70 ? t('dash.active') : energyValue > 35 ? t('dash.tired') : t('dash.sleeping')}
                </div>
            </div>
        </div>

        {/* XP A PREDIKCIA */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface dark:bg-dark-surface p-8 rounded-[2.5rem] border border-txt-light/5 shadow-sm flex-1">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-5xl font-medium tracking-tighter tabular-nums">{levelData.level}</span>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-txt-muted uppercase tracking-widest mb-1 opacity-50">{t('dash.points')}</p>
                        <p className="text-base font-medium text-primary tabular-nums">
                            {Math.round(levelData.currentLevelXp)} <span className="text-[10px] opacity-30">/ {500 + (levelData.level - 1) * 250}</span>
                        </p>
                    </div>
                </div>
                <div className="w-full h-1.5 bg-canvas dark:bg-dark-canvas rounded-full overflow-hidden mb-8">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${levelData.progressPercent}%` }} className="h-full bg-primary" />
                </div>
                
                <div className="p-5 bg-canvas dark:bg-dark-canvas/40 rounded-3xl border border-txt-light/5">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={13} className="text-primary opacity-70" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                          {lang === 'sk' ? `V Leveli ${nextLevel} odomkneš` : `Unlocks at Level ${nextLevel}`}
                        </span>
                    </div>
                    <ul className="space-y-2">
                        {nextLevelPerks.map((perk, i) => (
                            <li key={i} className="text-[11px] font-medium text-txt/70 dark:text-white/70 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-primary/40" />
                              {perk}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-primary text-white p-8 rounded-[2.5rem] flex flex-col justify-center shadow-lg shadow-primary/20">
                <Activity size={20} className="mb-4 opacity-50" />
                <p className="text-lg font-medium italic leading-snug">
                  "{energyValue > 80 ? t('dash.readiness.high') : t('dash.readiness.mid')}"
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;