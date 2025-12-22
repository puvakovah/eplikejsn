
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserProfile, DayPlan, DailyContext } from './types';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Flame, Moon, Sun, Zap, CloudOff, CheckCircle2, Loader2, Star, Target, Activity, Heart, Thermometer, Brain, CalendarDays, TrendingUp, RefreshCw, Info } from 'lucide-react';
import { calculateLevelData, getAvatarState, calculateReadiness, predictTrends } from './gamificationConfig';
import { getPresetAvatarUrl } from './geminiService';
import { translations, Language } from './translations';
import { db } from './db';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  const completedTasks = plan.actualBlocks.filter(b => b.isCompleted).length;
  const totalTasks = plan.plannedBlocks.length || 1; 
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const levelData = calculateLevelData(user.xp);
  
  const healthToday = user.healthData?.[today];
  const contextToday = user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick };
  const readiness = calculateReadiness(healthToday, contextToday);
  
  // Simulated historical data for predictions
  const trends = predictTrends(readiness, []);

  const chartData = [
    { name: t('dash.completed'), value: completedTasks },
    { name: t('dash.remaining'), value: totalTasks - completedTasks },
  ];
  const COLORS = ['#4A6D88', '#e2e8f0'];

  // AVATAR LOGIC
  const avatarState = getAvatarState(user.twinLevel, progress, readiness, user.isSick);
  const { scale, expression, displayEnergy, isNight } = avatarState;
  
  let dynamicAvatarUrl = user.avatarUrl;
  if (user.avatarConfig) {
      dynamicAvatarUrl = getPresetAvatarUrl(
          user.avatarConfig.gender, user.avatarConfig.skin, 
          user.avatarConfig.hairStyle, user.avatarConfig.hairColor, user.avatarConfig.eyeColor,
          user.avatarConfig.glasses, user.avatarConfig.headwear,
          user.avatarConfig.topType, user.avatarConfig.topColor,
          user.avatarConfig.bottomType, user.avatarConfig.bottomColor,
          user.avatarConfig.shoesType, user.avatarConfig.shoesColor,
          expression
      );
  }

  const handleSync = async () => {
      setIsSyncing(true);
      setSyncMessage(null);
      try {
          await db.saveUserData(user.name, { user, habits: [], dayPlan: plan });
          const res = await db.getSession();
          if (res.success) {
              setSyncMessage("Dáta sú aktuálne");
              setTimeout(() => setSyncMessage(null), 3000);
          }
      } catch (err) {
          setSyncMessage("Sync zlyhal");
      } finally {
          setIsSyncing(false);
      }
  };

  const toggleSickStatus = () => {
      const updatedUser = { ...user, isSick: !user.isSick };
      setUser(updatedUser);
  };

  const handleStressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      const updatedUser = { ...user, stressLevel: val };
      setUser(updatedUser);
  };

  const getReadinessText = () => {
      if (readiness < 40) return t('dash.readiness.low');
      if (readiness < 75) return t('dash.readiness.mid');
      return t('dash.readiness.high');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center px-2">
          <div>
            <h1 className="text-3xl font-black text-txt dark:text-white">{t('dash.welcome')}, {user.name}!</h1>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-txt-muted text-sm flex items-center gap-1">
                    {isOnline ? <CheckCircle2 size={12} className="text-secondary" /> : <CloudOff size={12} className="text-red-400" />}
                    {isOnline ? "Všetky dáta sú synchronizované" : "Bežíš v lokálnom režime"}
                </p>
                <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:underline transition-all"
                >
                    {isSyncing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                    {isSyncing ? "Synchronizujem..." : syncMessage || "Sync"}
                </button>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('planner')}
            className="hidden sm:block bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-md"
          >
            {t('dash.open_planner')}
          </motion.button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Card */}
        <div className="lg:col-span-1 bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm flex flex-col items-center justify-center dark:bg-dark-surface">
          <h3 className="text-xs font-black text-txt-muted uppercase tracking-widest mb-4">{t('dash.progress')}</h3>
          <div className="h-48 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} startAngle={90} endAngle={-270} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                    {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black">{progress}%</span>
                 <span className="text-[10px] uppercase font-bold text-txt-muted">{completedTasks}/{totalTasks} úloh</span>
             </div>
          </div>
        </div>

        {/* Avatar Status Card */}
        <div className="lg:col-span-1 bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm flex flex-col items-center relative overflow-hidden dark:bg-dark-surface min-h-[400px]">
           <div className="flex justify-between w-full z-10">
               <span className="bg-canvas dark:bg-dark-canvas px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-txt-muted border border-txt-light/5">Lvl {levelData.level}</span>
               {isNight ? <Moon size={18} className="text-indigo-400" fill="currentColor" /> : <Sun size={18} className="text-habit" fill="currentColor" />}
           </div>

           <div className="flex-1 w-full flex items-end justify-center py-4">
               {dynamicAvatarUrl ? (
                   <motion.img 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, scale }}
                        transition={{ type: "spring", damping: 20 }}
                        src={dynamicAvatarUrl} 
                        className={`max-h-[300px] object-contain drop-shadow-2xl ${expression === 'sleeping' ? 'brightness-75' : ''} ${user.isSick ? 'sepia-[0.3]' : ''}`} 
                   />
               ) : <Loader2 className="animate-spin text-txt-muted" />}
           </div>

           <div className="w-full mt-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-txt-muted tracking-widest">
                  <span className="flex items-center gap-1"><Zap size={10} fill="currentColor" className="text-secondary" /> {t('dash.energy')}</span>
                  <span>{displayEnergy}%</span>
              </div>
              <div className="h-2 bg-canvas dark:bg-dark-canvas rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${displayEnergy}%` }}
                    className={`h-full rounded-full ${displayEnergy < 30 ? 'bg-red-400' : 'bg-secondary'}`} 
                  />
              </div>
           </div>
        </div>

        {/* Readiness & Predictions Column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-surface p-6 rounded-[2rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-txt-muted">{t('dash.readiness')}</h4>
                    <Activity size={16} className="text-primary" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-3xl font-black text-primary">{readiness}%</div>
                    <div className="text-xs text-txt-muted leading-relaxed italic border-l border-txt-light/20 pl-4">
                        {getReadinessText()}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-txt-light/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-canvas dark:bg-dark-canvas rounded-lg"><TrendingUp size={12} className="text-secondary" /></div>
                         <span className="text-[10px] font-bold text-txt-muted uppercase">{t('dash.prediction.performance')}: {trends.performancePotential}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <StatCard icon={<Flame className="text-habit" />} label={t('dash.streak')} value="5 dní" />
                <StatCard icon={<Trophy className="text-primary" />} label={t('dash.points')} value={user.xp.toLocaleString()} />
            </div>
            
            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 dark:bg-primary/10">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <Zap size={14} className="text-primary" /> {t('plan.twin_tip')}
                </h4>
                <p className="text-xs text-txt-muted leading-relaxed italic">
                    {user.isSick 
                        ? "Dnes si dopraj hlavne spánok a tekutiny. Tvoj dvojník potrebuje regeneráciu." 
                        : readiness > 80 
                            ? "Tvoje telo je v režime 'Flow'. Ideálny čas na najťažšie úlohy." 
                            : "Detekovaná únava. Skús pridať viac relaxu do plánu."}
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health & Stress Tracking */}
          <div className="bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface">
              <div className="flex items-center gap-3 mb-6">
                  <Brain size={24} className="text-secondary" />
                  <h3 className="text-xl font-black text-txt dark:text-white">Health & Stress</h3>
              </div>
              <div className="space-y-6">
                  <div>
                      <div className="flex justify-between text-xs font-bold text-txt-muted uppercase mb-2">
                          <span>Úroveň Stresu</span>
                          <span>{user.stressLevel} / 10</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="10" step="1" 
                        value={user.stressLevel}
                        onChange={handleStressChange}
                        className="w-full h-2 bg-canvas dark:bg-dark-canvas rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-canvas dark:bg-dark-canvas rounded-2xl border border-txt-light/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Thermometer size={18} className={user.isSick ? "text-red-500 animate-pulse" : "text-txt-muted"} />
                        <span className="text-sm font-bold">Cítim sa chorý / vyčerpaný</span>
                      </div>
                      <button 
                        onClick={toggleSickStatus}
                        className={`w-12 h-6 rounded-full transition-all relative ${user.isSick ? 'bg-red-500' : 'bg-txt-light/20'}`}
                      >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${user.isSick ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-canvas dark:bg-dark-canvas rounded-2xl flex items-center gap-3">
                            <CalendarDays size={18} className="text-primary" />
                            <span className="text-xs font-bold text-txt-muted">Dnes je {new Date().toLocaleDateString('sk-SK')}</span>
                        </div>
                        <div className="p-4 bg-canvas dark:bg-dark-canvas rounded-2xl flex items-center gap-3">
                            <Activity size={18} className="text-secondary" />
                            <span className="text-xs font-bold text-txt-muted">Readiness: {readiness}%</span>
                        </div>
                  </div>
              </div>
          </div>

          {/* Twin Progress Panel */}
          <div className="bg-surface p-8 rounded-[2.5rem] border border-txt-light/10 shadow-sm dark:bg-dark-surface">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                      <h3 className="text-xl font-black text-txt dark:text-white">Twin Progress</h3>
                      <p className="text-xs text-txt-muted font-bold uppercase tracking-widest">Level {levelData.level}: {levelData.title}</p>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="flex justify-between items-end">
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-txt-muted uppercase tracking-widest">Postup v Leveli</p>
                          <p className="text-2xl font-black text-primary">
                            {Math.floor(levelData.currentLevelXp)} <span className="text-sm text-txt-muted">/ {levelData.nextLevelXpThreshold} XP</span>
                          </p>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] font-black text-txt-muted uppercase tracking-widest">Do Levelu {levelData.level + 1}</p>
                          <p className="text-sm font-bold text-txt dark:text-white">{Math.ceil(levelData.xpRemaining)} XP</p>
                      </div>
                  </div>

                  <div className="relative h-6 bg-canvas dark:bg-dark-canvas rounded-full border border-txt-light/5 p-1 overflow-hidden shadow-inner">
                      <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${levelData.progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary rounded-full relative shadow-lg shadow-primary/20"
                      >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      </motion.div>
                  </div>

                  <div className="mt-6 flex items-start gap-2 text-[10px] text-txt-muted italic bg-canvas p-3 rounded-xl border border-txt-light/5">
                      <Info size={12} className="shrink-0 text-primary" />
                      <span>Plnením úloh a návykov získavaš XP. Vyšší level znamená silnejšieho a vplyvnejšieho Virtuálneho Dvojníka.</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
    <div className="bg-surface p-6 rounded-[2rem] border border-txt-light/10 shadow-sm flex items-center gap-4 dark:bg-dark-surface">
        <div className="p-4 bg-canvas dark:bg-dark-canvas rounded-2xl">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase text-txt-muted tracking-widest">{label}</p>
            <p className="text-xl font-black text-txt dark:text-white">{value}</p>
        </div>
    </div>
);

export default Dashboard;
