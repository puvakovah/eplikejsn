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
  const today = new Date().toISOString().split('T')[0];
  const energy = calculateEnergy(user.healthData?.[today], user.dailyContext?.[today] || { stressLevel: 0.2, isIll: user.isSick });
  
  const state = getAvatarState(energy);
  const finalExpression = expression || state.expression;

  const containerSizes = {
    sm: 'w-16 h-16', md: 'w-32 h-32', lg: 'w-48 h-48', xl: 'w-64 h-64'
  };

  // Shadow glow instead of aura circle
  const glowStyle = state.glow ? 'drop-shadow-[0_0_12px_rgba(133,176,154,0.5)]' : '';
  const energyFilters = energy < 35 ? 'saturate(0.4) brightness(0.9)' : '';

  return (
    <motion.div 
      className={`relative ${containerSizes[size]} flex items-center justify-center`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1 + (levelData.level - 1) * 0.02, 
        opacity: state.opacity 
      }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <motion.div 
        className={`relative z-10 w-full h-full flex items-center justify-center ${glowStyle}`}
        style={{ filter: energyFilters }}
        animate={{
            scale: state.glow ? [1, 1.05, 1] : [1, 1.02, 1],
            rotate: energy < 35 ? [0, -1, 1, 0] : [0, 0]
        }}
        transition={{ 
            repeat: Infinity, 
            duration: 4 / state.animationSpeed,
            ease: "easeInOut"
        }}
      >
        <img 
          src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
          className="w-full h-full object-contain" 
          alt="Twin Avatar"
        />
      </motion.div>

      <div className="absolute inset-0 z-30 pointer-events-none">
        {finalExpression === 'sleeping' && (
          <motion.div animate={{ y: [-10, -30], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-0 right-4 text-primary font-black text-xl select-none">Zzz</motion.div>
        )}
        {finalExpression === 'sleepy' && (
          <div className="absolute top-0 right-0 text-xl animate-pulse select-none">🥱</div>
        )}
      </div>
    </motion.div>
  );
};

export default Avatar;
