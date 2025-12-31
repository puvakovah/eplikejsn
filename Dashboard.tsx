import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, DayPlan, AppView } from './types';
import { CheckCircle2, Activity, Gift, Zap, CloudOff, Star, Loader2 } from 'lucide-react';
import { calculateLevelData, calculateEnergy, ASSET_STORE } from './gamificationConfig';
import Avatar from './Avatar';
import { translations, Language } from './translations';

interface DashboardProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  plan: DayPlan | null; // Zmena na null-able
  onNavigate: (view: AppView) => void;
  lang?: Language;
  isOnline?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, plan, onNavigate, lang = 'en', isOnline = true }) => {
  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;

  // Ak nemáme plán, vytvoríme si prázdny, aby sme mohli vykresliť UI
  const safePlan = plan || {
    date: new Date().toISOString().split('T')[0],
    plannedBlocks: [],
    actualBlocks: []
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center p-20 text-primary h-full">
      <Loader2 className="animate-spin mb-2" size={40} />
      <p className="text-xs font-bold uppercase tracking-widest opacity-50">{t('dash.loading')}</p>
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  const completedTasks = safePlan.actualBlocks?.filter(b => b.isCompleted).length || 0;
  const totalTasks = safePlan.plannedBlocks?.length || 1; 
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const levelData = calculateLevelData(user.xp || 0);
  const healthToday = user.healthData?.[today];
  const contextToday = user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick };
  const energyValue = calculateEnergy(healthToday, contextToday);

  const xpForNext = 500 + (levelData.level - 1) * 250;
  const currentXpInLevel = Math.round(levelData.currentLevelXp);

  const nextReward = ASSET_STORE
    .filter(a => a.requirementLevel > levelData.level)
    .sort((a, b) => a.requirementLevel - b.requirementLevel)[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-black text-txt dark:text-white uppercase tracking-tighter">
                {t('dash.welcome')}, {user.firstName || user.name}!
            </h1>
            <p className="text-txt-muted text-sm flex items-center gap-2 mt-1 font-bold">
                {isOnline ? <CheckCircle2 size={14} className="text-secondary" /> : <CloudOff size={14} className="text-red-400" />}
                <span className="text-primary">{levelData.title}</span> — {t('dash.level')} {levelData.level}
            </p>
          </motion.div>
          <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }} 
              onClick={() => onNavigate(AppView.PLANNER)} 
              className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
              <Zap size={18} /> {t('dash.open_planner')}
          </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-txt-muted uppercase tracking-widest">{t('dash.progress')}</h3>
                <Star className="text-primary" size={16} />
            </div>
            <div className="flex items-end justify-between mb-3">
                <span className="text-6xl font-black text-txt dark:text-white leading-none tracking-tighter">{levelData.level}</span>
                <div className="text-right">
                    <p className="text-xs font-bold text-txt-muted uppercase">{t('dash.points')}</p>
                    <p className="text-sm font-black text-primary">{currentXpInLevel} / {xpForNext} XP</p>
                </div>
            </div>
            <div className="w-full h-4 bg-canvas dark:bg-dark-canvas rounded-full overflow-hidden mb-4 border border-txt-light/5 shadow-inner">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${levelData.progressPercent}%` }} 
                    className="h-full bg-primary" 
                />
            </div>
          </div>
          <div className="pt-6 border-t dark:border-white/10 flex justify-between">
             <span className="text-[10px] font-black uppercase text-txt-muted tracking-widest">{t('dash.completed')}: {completedTasks}</span>
             <span className="text-[10px] font-black uppercase text-secondary tracking-widest">{progress}%</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface p-10 rounded-[3rem] border border-txt-light/10 shadow-lg flex flex-col items-center justify-center dark:bg-dark-surface overflow-hidden min-h-[300px]">
            <Avatar user={user} size="xl" />
            <div className="mt-8 text-center">
                <div className="text-xs font-black text-primary uppercase tracking-widest">{t('dash.energy')}</div>
                <div className="text-4xl font-black text-txt dark:text-white tracking-tighter">{energyValue}%</div>
            </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface">
                <h4 className="text-xs font-black uppercase tracking-widest text-txt-muted mb-2">{t('dash.readiness')}</h4>
                <p className="text-sm font-bold text-txt dark:text-white italic leading-snug">
                  {energyValue > 70 ? t('dash.readiness.high') : t('dash.readiness.low')}
                </p>
            </div>
            <div className="bg-habit/10 p-8 rounded-[2.5rem] border border-habit/20 flex-1">
                <h4 className="font-black text-xs uppercase tracking-widest text-habit mb-4 flex items-center gap-2">
                    <Gift size={18} /> {t('profile.outfit')}
                </h4>
                {nextReward && (
                  <div className="flex items-center gap-4">
                    <div className="text-3xl bg-white dark:bg-dark-surface p-3 rounded-2xl">{nextReward.icon}</div>
                    <p className="text-xs font-bold uppercase">{nextReward.name} (Lvl {nextReward.requirementLevel})</p>
                  </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;