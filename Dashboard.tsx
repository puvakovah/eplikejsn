
import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, DayPlan } from './types';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Moon, Sun, CloudOff, CheckCircle2, Activity, Gift } from 'lucide-react';
import { calculateLevelData, getAvatarState, calculateReadiness, ASSET_STORE } from './gamificationConfig';
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

const Dashboard: React.FC<DashboardProps> = ({ user, setUser, plan, onNavigate, lang = 'sk', isOnline = true }) => {
  const t = (key: string) => translations[lang][key] || key;
  const today = new Date().toISOString().split('T')[0];
  
  const completedTasks = plan?.actualBlocks?.filter(b => b.isCompleted).length || 0;
  const totalTasks = plan?.plannedBlocks?.length || 1; 
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const levelData = calculateLevelData(user.xp);
  const healthToday = user.healthData?.[today];
  const contextToday = user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick };
  const readiness = calculateReadiness(healthToday, contextToday);

  const avatarState = getAvatarState(levelData.level, progress, readiness, user.isSick);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
          <div>
            <h1 className="text-3xl font-black text-txt dark:text-white uppercase tracking-tighter">{t('dash.welcome')}, {user.firstName || user.name}!</h1>
            <p className="text-txt-muted text-sm flex items-center gap-2">
                {isOnline ? <CheckCircle2 size={12} className="text-secondary" /> : <CloudOff size={12} className="text-red-400" />}
                <span className="font-bold text-primary">Lvl {levelData.level}</span> — {levelData.title}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => onNavigate('planner')} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20">
            {t('dash.open_planner')}
          </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="lg:col-span-1 bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm flex flex-col items-center justify-center dark:bg-dark-surface">
          <h3 className="text-xs font-black text-txt-muted uppercase tracking-widest mb-4">Dnešný Progres</h3>
          <div className="h-48 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{value: completedTasks}, {value: totalTasks - completedTasks}]} cx="50%" cy="50%" innerRadius={55} outerRadius={75} startAngle={90} endAngle={-270} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                    <Cell fill="#4A6D88" /><Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black">{progress}%</span>
                 <span className="text-[10px] font-bold text-txt-muted uppercase tracking-tighter">Úloh hotovo</span>
             </div>
          </div>
        </div>

        {/* ÚSTREDNÝ TWIN AVATAR */}
        <div className="lg:col-span-1 bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm flex flex-col items-center relative overflow-hidden dark:bg-dark-surface min-h-[350px]">
           <Avatar 
             user={user} 
             expression={avatarState.expression} 
             size="xl" 
           />
           <div className="mt-6 text-center">
                <div className="text-xs font-bold text-txt-muted uppercase tracking-widest">{levelData.title}</div>
                <div className="w-32 h-1.5 bg-canvas rounded-full mt-2 overflow-hidden dark:bg-dark-canvas">
                    <div className="h-full bg-primary" style={{ width: `${levelData.progressPercent}%` }}></div>
                </div>
           </div>
           <div className="absolute top-6 right-6 p-2 bg-primary/10 rounded-xl text-primary">
                {avatarState.isNight ? <Moon size={20} /> : <Sun size={20} />}
           </div>
        </div>

        {/* Readiness & Goal Card */}
        <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-surface p-6 rounded-[2rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-txt-muted">{t('dash.readiness')}</h4>
                    <Activity size={16} className="text-primary" />
                </div>
                <div className="text-3xl font-black text-primary">{readiness}%</div>
                <div className="w-full h-2 bg-canvas rounded-full mt-3 overflow-hidden dark:bg-dark-canvas">
                    <div className="h-full bg-secondary" style={{ width: `${readiness}%` }}></div>
                </div>
                <p className="text-[10px] text-txt-muted mt-3 font-medium italic">
                    {readiness > 70 ? "Si v plnej sile!" : "Dnes odporúčame regeneráciu."}
                </p>
            </div>
            
            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 dark:bg-primary/10">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Gift size={16} className="text-primary" /> Ďalšia odmena
                </h4>
                {ASSET_STORE.find(a => a.requirementLevel > levelData.level) ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-dark-surface rounded-xl flex items-center justify-center text-xl shadow-sm">
                            {ASSET_STORE.find(a => a.requirementLevel > levelData.level)?.icon}
                        </div>
                        <div>
                            <p className="text-xs font-bold">{ASSET_STORE.find(a => a.requirementLevel > levelData.level)?.name}</p>
                            <p className="text-[10px] text-txt-muted">Level {ASSET_STORE.find(a => a.requirementLevel > levelData.level)?.requirementLevel}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-txt-muted">Všetky vizuálne odmeny získané!</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
