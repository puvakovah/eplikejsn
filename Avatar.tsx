
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

  // Evolučná logika vizuálnych parametrov Dicebear
  let evolutionParams = '';

  if (currentLevel < 10) {
    evolutionParams = '&top[]=bob&mouth[]=smile&eyebrows[]=default';
  } else if (currentLevel < 20) {
    evolutionParams = '&top[]=shortHair&mouth[]=smile&clothing[]=hoodie';
  } else {
    evolutionParams = '&top[]=longHair&mouth[]=smile&clothing[]=blazer&accessories[]=shades';
  }

  const genderSeed = user.avatarConfig?.gender === 'Female' ? 'Maria' : 'Jack';
  const diceBearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || genderSeed}${evolutionParams}`;

  const containerSizes = {
    sm: 'w-16 h-16', md: 'w-32 h-32', lg: 'w-48 h-48', xl: 'w-64 h-64'
  };

  const containerClass = `relative ${containerSizes[size]} flex items-center justify-center`;
  const energyFilters = energy < 30 ? 'grayscale(0.3) brightness(0.9)' : '';

  return (
    <motion.div 
      className={containerClass}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1 + (currentLevel * 0.005), // Decentný vizuálny rast
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
          className="w-full h-full object-contain drop-shadow-2xl" 
          alt="Twin Avatar"
        />
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
