
import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, DayPlan } from './types';
import { CheckCircle2, Activity, Gift, Zap, CloudOff, Star } from 'lucide-react';
import { calculateLevelData, calculateEnergy, ASSET_STORE } from './gamificationConfig';
import Avatar from './Avatar';
import { translations, Language } from './translations';

interface DashboardProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  plan: DayPlan;
  onNavigate: (view: any) => void;
  lang?: Language;
  isOnline?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, plan, onNavigate, lang = 'sk', isOnline = true }) => {
  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;
  const today = new Date().toISOString().split('T')[0];
  
  const completedTasks = plan?.actualBlocks?.filter(b => b.isCompleted).length || 0;
  const totalTasks = plan?.plannedBlocks?.length || 1; 
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const levelData = calculateLevelData(user.xp);
  const healthToday = user.healthData?.[today];
  const contextToday = user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick };
  const energyValue = calculateEnergy(healthToday, contextToday);

  // Výpočet XP pre aktuálny level
  const xpForNext = 500 + (levelData.level - 1) * 250;
  const currentXpInLevel = Math.round(levelData.currentLevelXp);

  const nextReward = ASSET_STORE
    .filter(a => a.requirementLevel > levelData.level)
    .sort((a, b) => a.requirementLevel - b.requirementLevel)[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-txt dark:text-white uppercase tracking-tighter">
                {t('dash.welcome')}, {user.firstName || user.name}!
            </h1>
            <p className="text-txt-muted text-sm flex items-center gap-2 mt-1 font-bold">
                {isOnline ? <CheckCircle2 size={14} className="text-secondary" /> : <CloudOff size={14} className="text-red-400" />}
                <span className="text-primary">{levelData.title}</span> — {t('dash.level')} {levelData.level}
            </p>
          </div>
          <motion.button 
              whileTap={{ scale: 0.95 }} 
              onClick={() => onNavigate('planner')} 
              className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
              <Zap size={18} /> {t('dash.open_planner')}
          </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* XP Progress Card */}
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
            {/* XP Progress Bar */}
            <div className="w-full h-4 bg-canvas dark:bg-dark-canvas rounded-full overflow-hidden mb-4 border border-txt-light/5 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${levelData.progressPercent}%` }} className="h-full bg-primary shadow-[0_0_10px_rgba(74,109,136,0.5)]" />
            </div>
          </div>
          <div className="pt-6 border-t border-txt-light/10 dark:border-white/10 flex justify-between">
             <span className="text-[10px] font-black uppercase text-txt-muted tracking-widest">{t('dash.completed')}: {completedTasks}</span>
             <span className="text-[10px] font-black uppercase text-secondary tracking-widest">{progress}% {t('dash.completed')}</span>
          </div>
        </div>

        {/* Avatar & Energy Center */}
        <div className="lg:col-span-4 bg-surface p-10 rounded-[3rem] border border-txt-light/10 shadow-lg flex flex-col items-center justify-center relative dark:bg-dark-surface overflow-hidden">
           <Avatar user={user} size="xl" />
           <div className="mt-8 text-center space-y-1">
                <div className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t('dash.energy')}</div>
                <div className="text-4xl font-black text-txt dark:text-white tracking-tighter">{energyValue}%</div>
                <div className="text-[10px] text-txt-muted font-black uppercase tracking-widest pt-1">
                  {energyValue > 70 ? t('dash.active') : energyValue > 35 ? t('dash.tired') : t('dash.sleeping')}
                </div>
           </div>
        </div>

        {/* Info Panels */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-txt-muted">{t('dash.readiness')}</h4>
                    <Activity size={20} className="text-primary" />
                </div>
                <p className="text-sm font-bold text-txt dark:text-white leading-snug italic">
                    {energyValue > 80 ? t('dash.readiness.high') : energyValue > 35 ? t('dash.readiness.mid') : t('dash.readiness.low')}
                </p>
            </div>
            
            <div className="bg-habit/5 p-8 rounded-[2.5rem] border border-habit/20 dark:bg-habit/10 flex-1 flex flex-col justify-center">
                <h4 className="font-black text-xs uppercase tracking-widest text-habit mb-4 flex items-center gap-2">
                    <Gift size={18} /> {t('profile.outfit')}
                </h4>
                {nextReward ? (
                    <div className="flex items-center gap-5">
                        <div className="text-3xl bg-white dark:bg-dark-surface p-3 rounded-2xl shadow-sm">{nextReward.icon}</div>
                        <div>
                            <p className="text-sm font-black text-txt dark:text-white uppercase tracking-tight">{nextReward.name}</p>
                            <p className="text-xs text-txt-muted font-bold">{t('profile.lock_at')} Lvl {nextReward.requirementLevel}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm font-bold text-habit">Všetky odmeny odomknuté!</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
