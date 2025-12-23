
import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, AvatarExpression } from './types';
import { calculateLevelData, getAvatarState, calculateEnergy } from './gamificationConfig';

interface AvatarProps {
  user: UserProfile;
  expression?: AvatarExpression;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar: React.FC<AvatarProps> = ({ user, expression, size = 'md' }) => {
  const levelData = calculateLevelData(user.xp);
  const currentLevel = levelData.level;
  
  const today = new Date().toISOString().split('T')[0];
  const energy = calculateEnergy(user.healthData?.[today], user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick });
  const state = getAvatarState(energy);
  const finalExpression = expression || state.expression;

  // Logika rastu avatara
  let ageType = 'adult'; // Default
  let avatarParams = '';

  if (currentLevel <= 5) {
    ageType = 'toddler';
    avatarParams = '&top[]=shortHair&mouth[]=smile&eyebrows[]=raised';
  } else if (currentLevel <= 10) {
    ageType = 'child';
    avatarParams = '&top[]=bob&mouth[]=smile&eyebrows[]=default';
  } else {
    ageType = 'adult';
    avatarParams = '&top[]=longHair&mouth[]=smile&eyebrows[]=default';
  }

  // Ak je nastavené pohlavie v configu
  const genderSeed = user.avatarConfig?.gender === 'Female' ? 'Maria' : 'Jack';
  const diceBearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || genderSeed}${avatarParams}`;

  const containerSizes = {
    sm: 'w-16 h-16', md: 'w-32 h-32', lg: 'w-48 h-48', xl: 'w-64 h-64'
  };

  const containerClass = `relative ${containerSizes[size]} flex items-center justify-center`;
  const energyFilters = energy < 30 ? 'saturate(0.5) brightness(0.9)' : '';

  return (
    <motion.div 
      className={containerClass}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1 + (currentLevel * 0.01), // Mierny rast veľkosti s levelom
        opacity: state.opacity 
      }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
      <motion.div 
        className="relative z-10 w-full h-full flex items-center justify-center"
        style={{ filter: energyFilters }}
        animate={{
            y: state.glow ? [0, -5, 0] : [0, 0]
        }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <img 
          src={user.avatarUrl && typeof user.avatarUrl === 'string' ? user.avatarUrl : diceBearUrl} 
          className="w-full h-full object-contain" 
          alt="Twin Avatar"
        />
        
        {/* Indikátor vekovej kategórie (Debug/Vizuálny prvok) */}
        <div className="absolute -bottom-2 bg-primary/10 text-[8px] px-2 py-0.5 rounded-full font-black uppercase text-primary/60 dark:bg-white/5">
            {ageType} Twin
        </div>
      </motion.div>

      {/* Sleep indicators */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {finalExpression === 'sleeping' && (
          <motion.div 
            animate={{ y: [-10, -30], opacity: [0, 1, 0], x: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 4 }} 
            className="absolute top-2 right-4 text-primary font-black text-xl select-none"
          >
            Zzz
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Avatar;
