import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, DayPlan } from './types';
import { CheckCircle2, Activity, Gift, Zap, CloudOff } from 'lucide-react';
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
  const t = (key: string) => translations[lang][key] || key;
  const today = new Date().toISOString().split('T')[0];
  
  const completedTasks = plan?.actualBlocks?.filter(b => b.isCompleted).length || 0;
  const totalTasks = plan?.plannedBlocks?.length || 1; 
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const levelData = calculateLevelData(user.xp);
  const healthToday = user.healthData?.[today];
  const contextToday = user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick };
  const energy = calculateEnergy(healthToday, contextToday);

  // Dynamic next reward logic
  const nextReward = ASSET_STORE
    .filter(a => a.requirementLevel > levelData.level)
    .sort((a, b) => a.requirementLevel - b.requirementLevel)[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4">
          <div>
            <h1 className="text-4xl font-black text-txt dark:text-white uppercase tracking-tighter">
                {t('dash.welcome')}, {user.firstName || user.name}!
            </h1>
            <p className="text-txt-muted text-sm flex items-center gap-2 mt-1">
                {isOnline ? <CheckCircle2 size={14} className="text-secondary" /> : <CloudOff size={14} className="text-red-400" />}
                <span className="font-bold text-primary">{levelData.title}</span> — Level {levelData.level}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => onNavigate('planner')} 
                className="flex-1 md:flex-none bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
                <Zap size={18} /> {t('dash.open_planner')}
            </motion.button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Card */}
        <div className="lg:col-span-4 bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-txt-muted uppercase tracking-widest mb-6">Úroveň & Skúsenosti</h3>
            <div className="flex items-end justify-between mb-2">
                <span className="text-5xl font-black text-txt dark:text-white">{levelData.level}</span>
                <span className="text-sm font-bold text-txt-muted">{Math.floor(levelData.currentLevelXp)} / {500 + (levelData.level - 1) * 250} XP</span>
            </div>
            <div className="w-full h-4 bg-canvas dark:bg-dark-canvas rounded-full overflow-hidden mb-4">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${levelData.progressPercent}%` }}
                    className="h-full bg-primary"
                />
            </div>
          </div>
          
          <div className="pt-6 border-t border-txt-light/10 dark:border-white/10">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-txt-muted">Dnešný progres</h4>
                <span className="text-lg font-bold">{progress}%</span>
             </div>
             <div className="w-full h-2 bg-canvas dark:bg-dark-canvas rounded-full overflow-hidden">
                <motion.div 
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-secondary"
                />
             </div>
          </div>
        </div>

        {/* Central Display */}
        <div className="lg:col-span-4 bg-surface p-10 rounded-[3rem] border border-txt-light/10 shadow-lg flex flex-col items-center justify-center relative dark:bg-dark-surface">
           <Avatar user={user} size="xl" />
           <div className="mt-8 text-center">
                <div className="text-xl font-black text-txt dark:text-white uppercase tracking-tighter">
                  {energy > 75 ? 'Dvojník je Nabitý' : energy > 35 ? 'Dvojník je Aktívny' : 'Dvojník je Unavený'}
                </div>
                <div className="text-sm text-txt-muted mt-1 font-bold">Aktuálna energia: {energy}%</div>
           </div>
        </div>

        {/* Rewards & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-txt-muted">Energia</h4>
                    <Activity size={20} className="text-primary" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-5xl font-black text-primary">{energy}%</div>
                    <div className="text-xs text-txt-muted font-medium italic max-w-[140px]">
                        {energy > 80 ? "Plná sila na dôležité ciele!" : energy > 40 ? "Udržuj tempo a nezabúdaj piť." : "Už len to najdôležitejšie."}
                    </div>
                </div>
            </div>
            
            <div className="bg-habit/5 p-8 rounded-[2.5rem] border border-habit/20 dark:bg-habit/10 flex-1 flex flex-col justify-center">
                <h4 className="font-black text-xs uppercase tracking-widest text-habit mb-4 flex items-center gap-2">
                    <Gift size={18} /> Ďalšia vizuálna odmena
                </h4>
                {nextReward ? (
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white dark:bg-dark-surface rounded-2xl flex items-center justify-center text-3xl shadow-md border border-habit/20">
                            {nextReward.icon}
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight text-txt dark:text-white">{nextReward.name}</p>
                            <p className="text-xs text-txt-muted font-bold mt-1">Level {nextReward.requirementLevel}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm font-bold text-habit">Všetky odmeny získané!</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
