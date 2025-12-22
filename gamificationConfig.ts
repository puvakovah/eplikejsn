import { AvatarExpression, AggregatedHealthData, DailyContext } from "./types";

export interface VisualAsset {
    id: string;
    name: string;
    category: 'headwear' | 'accessory' | 'effect' | 'outfit' | 'hair' | 'bottom' | 'shoes';
    requirementLevel: number;
    icon: string;
    promptModifier: string;
}

export const LEVELING_SYSTEM = {
    xpValues: {
        PLAN_DAY: 50,
        COMPLETE_WORK_BLOCK: 15,
        COMPLETE_REST_BLOCK: 5,
        TRACK_REALITY: 2,
        PERFECT_DAY_BONUS: 100,
        COMPLETE_HABIT: 15,
        CREATE_HABIT: 10,
        STREAK_3_DAYS: 30,
        STREAK_7_DAYS: 70
    },
    config: {
        maxBlocksPerDay: 12,
        maxHabitsPerDay: 8
    }
};

export const CATEGORY_UNLOCKS = {
    BASIC: 1,      // Pohlavie, pleť
    CLOTHING: 2,   // Oblečenie
    SHOES: 3,      // Topánky
    GLASSES: 4,    // Okuliare
    HEADWEAR: 5,   // Šiltovky
    ACCESSORIES: 6 // Doplnky
};

export const ASSET_STORE: VisualAsset[] = [
    { id: 'outfit_lvl_2', name: 'Módny Set', category: 'outfit', requirementLevel: 2, icon: '👕', promptModifier: 'modern trendy outfit' },
    { id: 'shoes_lvl_3', name: 'Bežecké Tenisky', category: 'shoes', requirementLevel: 3, icon: '👟', promptModifier: 'high-end athletic sneakers' },
    { id: 'glasses_lvl_4', name: 'Focus Okuliare', category: 'accessory', requirementLevel: 4, icon: '👓', promptModifier: 'smart tech glasses' },
    { id: 'hat_level_5', name: 'Šiltovka Ambície', category: 'headwear', requirementLevel: 5, icon: '🧢', promptModifier: 'cool blue baseball cap' },
    { id: 'jacket_level_6', name: 'Štýlová Bunda', category: 'outfit', requirementLevel: 6, icon: '🧥', promptModifier: 'stylish warm winter jacket' }
];

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
    let decayRate = 4.5; // ~4.5% za hodinu

    // Zrýchlený pokles pri vysokom strese (ak sú dáta syncnuté)
    if (context && context.stressLevel > 0.6) {
        decayRate *= 1.6;
    }
    if (health && health.avgHeartRate && health.avgHeartRate > 90) {
        decayRate *= 1.25;
    }

    let energy = startEnergy - (hoursActive * decayRate);

    // Nočný režim
    if (hour >= 23 || hour < 7) {
        energy = Math.min(energy, 15);
    }

    return Math.min(100, Math.max(0, Math.round(energy)));
};

export const getAvatarState = (energy: number): { expression: AvatarExpression; glow: boolean; opacity: number; animationSpeed: number } => {
    const hour = new Date().getHours();
    
    let expression: AvatarExpression = 'happy';
    let glow = false;
    let opacity = 1.0;
    let animationSpeed = 1.0;

    if (hour >= 22 || hour < 6 || energy < 15) {
        expression = 'sleeping';
        animationSpeed = 0.5;
        opacity = 0.8;
    } else if (energy < 30) {
        expression = 'sleepy';
        animationSpeed = 0.75;
        opacity = 0.95;
    } else if (energy >= 80) {
        expression = 'happy';
        glow = true;
        animationSpeed = 1.2;
    }

    return { expression, glow, opacity, animationSpeed };
}