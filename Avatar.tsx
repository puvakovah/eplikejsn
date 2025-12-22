
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, AvatarExpression } from './types';
import { calculateLevelData, ASSET_STORE } from './gamificationConfig';

interface AvatarProps {
  user: UserProfile;
  expression?: AvatarExpression;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar: React.FC<AvatarProps> = ({ user, expression = 'happy', size = 'md' }) => {
  const levelData = calculateLevelData(user.xp);
  const isMale = user.avatarConfig?.gender === 'Male';
  const skinColor = user.avatarConfig?.skin?.toLowerCase().replace(' ', '') || 'medium';
  
  // XP Glow Effect: Rastie s XP nazbieraným dnes
  const dailyActivity = user.dailyBlockCount + user.dailyHabitCount;
  const glowIntensity = Math.min(dailyActivity * 5, 40);

  const containerSizes = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  return (
    <motion.div 
      className={`relative ${containerSizes[size]} flex items-center justify-center`}
      style={{ scale: 1 + (levelData.level - 1) * 0.05 }}
    >
      {/* VRSTVA 0: Aura (Odomknutá na Lvl 5 alebo cez XP Glow) */}
      <AnimatePresence>
        {levelData.level >= 5 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1.2 }}
            className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl z-0"
          />
        )}
      </AnimatePresence>
      
      {/* XP Glow Ring */}
      {dailyActivity > 0 && (
        <div 
          className="absolute inset-[-10%] rounded-full opacity-20 z-0 animate-pulse"
          style={{ 
            boxShadow: `0 0 ${glowIntensity}px ${glowIntensity/2}px var(--tw-color-primary)`,
            backgroundColor: 'rgba(74, 109, 136, 0.1)'
          }}
        />
      )}

      {/* VRSTVA 1: Základná postava (Base Body) */}
      <motion.div 
        className="relative z-10 w-full h-full"
        animate={user.isSick ? { filter: 'grayscale(1) opacity(0.7)' } : { filter: 'none' }}
      >
        <img 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&gender=${isMale ? 'male' : 'female'}&skinColor=${skinColor}&topType=${user.avatarConfig?.topType?.replace(' ', '') || 'TShirt'}`}
          className="w-full h-full object-contain drop-shadow-xl"
          alt="Ideal Twin Base"
        />
      </motion.div>

      {/* VRSTVA 2: Agile Overlays (Doplnky z registra) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {levelData.unlockedAssets.map(asset => (
          <motion.div 
            key={asset.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Logika poziciovania podľa kategórie */}
            {asset.category === 'headwear' && (
              <div className="absolute top-[5%] text-4xl">{asset.icon}</div>
            )}
            {asset.category === 'accessory' && (
              <div className="absolute top-[30%] right-[15%] text-2xl">{asset.icon}</div>
            )}
            {asset.className && <div className={`absolute inset-0 rounded-full ${asset.className}`} />}
          </motion.div>
        ))}
      </div>

      {/* VRSTVA 3: Expresie / Emócie */}
      {expression === 'sleeping' && (
        <motion.div 
          animate={{ y: [-20, -40], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-4 right-4 text-primary font-bold z-30"
        >
          Zzz
        </motion.div>
      )}
      {user.isSick && (
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 text-xl z-30">🤒</div>
      )}
    </motion.div>
  );
};

export default Avatar;
