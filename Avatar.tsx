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

  // Avatar filtre pri nízkej energii
  const energyFilters = energy < 30 ? 'saturate(0.4) brightness(0.9) contrast(1.1)' : '';

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
        className="relative z-10 w-full h-full flex items-center justify-center"
        style={{ filter: energyFilters }}
        animate={{
            scale: state.glow ? [1, 1.05, 1] : [1, 1.02, 1],
            rotate: energy < 30 ? [0, -1, 1, 0] : [0, 0]
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
          <motion.div 
            animate={{ y: [-10, -40], opacity: [0, 1, 0] }} 
            transition={{ repeat: Infinity, duration: 3 }} 
            className="absolute top-0 right-4 text-primary font-black text-2xl select-none"
          >
            Zzz
          </motion.div>
        )}
        {finalExpression === 'sleepy' && (
          <div className="absolute top-0 right-0 text-xl animate-pulse select-none">🥱</div>
        )}
      </div>
    </motion.div>
  );
};

export default Avatar;