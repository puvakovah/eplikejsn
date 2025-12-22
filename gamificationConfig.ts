import { AvatarExpression, AggregatedHealthData, DailyContext } from "./types";

export interface VisualAsset {
    id: string;
    name: string;
    category: 'headwear' | 'accessory' | 'effect' | 'outfit' | 'hair' | 'bottom' | 'shoes';
    requirementLevel: number;
    icon: string;
    promptModifier: string;
    className?: string;
}

export const CATEGORY_UNLOCKS = {
    BASIC: 1,      // Pohlavie, pleť
    CLOTHING: 2,   // Viac druhov oblečenia
    SHOES: 3,      // Topánky
    GLASSES: 4,    // Okuliare
    HEADWEAR: 5,   // Pokrývky hlavy
    ACCESSORIES: 6  // Doplnky a Bundy
};

export const ASSET_STORE: VisualAsset[] = [
    { 
        id: 'outfit_lvl_2', 
        name: 'Módny Set', 
        category: 'outfit', 
        requirementLevel: 2, 
        icon: '👕',
        promptModifier: 'wearing modern trendy designer outfit'
    },
    { 
        id: 'shoes_lvl_3', 
        name: 'Bežecké Tenisky', 
        category: 'shoes', 
        requirementLevel: 3, 
        icon: '👟',
        promptModifier: 'wearing high-end athletic sneakers'
    },
    { 
        id: 'glasses_lvl_4', 
        name: 'Focus Okuliare', 
        category: 'accessory', 
        requirementLevel: 4, 
        icon: '👓',
        promptModifier: 'wearing smart tech glasses'
    },
    { 
        id: 'hat_level_5', 
        name: 'Šiltovka Ambície', 
        category: 'headwear', 
        requirementLevel: 5, 
        icon: '🧢',
        promptModifier: 'wearing a cool blue baseball cap'
    },
    { 
        id: 'jacket_level_6', 
        name: 'Štýlová Bunda', 
        category: 'outfit', 
        requirementLevel: 6, 
        icon: '🧥',
        promptModifier: 'wearing a stylish warm winter jacket'
    }
];

export const LEVELING_SYSTEM = {
    xpValues: {
      PLAN_DAY: 50,
      COMPLETE_WORK_BLOCK: 20,
      COMPLETE_HABIT: 15,
      PERFECT_DAY_BONUS: 100,
      CREATE_HABIT: 10,
      COMPLETE_REST_BLOCK: 10,
      TRACK_REALITY: 5,
      STREAK_3_DAYS: 30,
      STREAK_7_DAYS: 70
    },
    config: {
        maxBlocksPerDay: 10,
        maxHabitsPerDay: 5
    }
};

export const calculateLevelData = (totalXp: number) => {
    let level = 1;
    let accumulatedXp = 0;
    while (true) {
        const xpForNext = 500 + (level - 1) * 250;
        if (totalXp < accumulatedXp + xpForNext) break;
        accumulatedXp += xpForNext;
        level++;
    }
    const xpForThisLevel = 500 + (level - 1) * 250;
    const currentLevelXp = totalXp - accumulatedXp;
    
    return {
        level,
        currentLevelXp,
        progressPercent: (currentLevelXp / xpForThisLevel) * 100,
        unlockedAssets: ASSET_STORE.filter(a => level >= a.requirementLevel),
        title: level >= 10 ? "Ascended Twin" : level >= 5 ? "Master Twin" : "Novice Twin"
    };
};

export const getLevelInfo = (totalXp: number) => {
    const data = calculateLevelData(totalXp);
    return {
        level: data.level,
        nextLevelXp: 500 + (data.level - 1) * 250,
        title: data.title,
        unlock: data.level > 1 ? `Nové možnosti v Profile!` : null
    };
};

export const calculateEnergy = (health?: AggregatedHealthData, context?: DailyContext): number => {
    const now = new Date();
    const hour = now.getHours();
    const mins = now.getMinutes();
    const timeInHours = hour + mins / 60;

    // Ranný štart o 07:00 na 100%
    let startEnergy = 100;
    if (health && health.sleepMinutes < 360) {
        startEnergy = 75; // Slabší štart pri zlom spánku
    }

    const hoursActive = Math.max(0, timeInHours - 7);
    let drainRate = 4.8; // ~4.8% za hodinu

    if (context) {
        if (context.isIll || context.stressLevel > 0.6) {
            drainRate *= 2; 
        }
    }

    let energy = startEnergy - (hoursActive * drainRate);

    if (hour >= 23 || hour < 7) {
        energy = Math.min(energy, 10);
    }

    return Math.min(100, Math.max(0, Math.round(energy)));
};

export const getAvatarState = (energy: number): { expression: AvatarExpression; glow: boolean; opacity: number; animationSpeed: number } => {
    const hour = new Date().getHours();
    
    let expression: AvatarExpression = 'happy';
    let glow = false;
    let opacity = 1.0;
    let animationSpeed = 1.0;

    if (energy < 10 || hour >= 23 || hour < 6) {
        expression = 'sleeping';
        animationSpeed = 0.5;
        opacity = 0.8;
    } else if (energy < 35) {
        expression = 'sleepy';
        animationSpeed = 0.7;
        opacity = 0.95;
    } else if (energy >= 75) {
        expression = 'happy';
        glow = true;
        animationSpeed = 1.2;
    }

    return { expression, glow, opacity, animationSpeed };
};
