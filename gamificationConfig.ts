
// DO NOT use or import GoogleGenerativeAI from @google/genai

import { AvatarExpression, AggregatedHealthData, DailyContext } from "./types";

export interface VisualAsset {
    id: string;
    name: string;
    category: 'headwear' | 'accessory' | 'effect' | 'outfit';
    requirementLevel: number;
    icon: string;
    className?: string; // Pre špeciálne CSS efekty
    // Added promptModifier to support AI image generation in geminiService
    promptModifier: string;
}

// --- AGILE ASSET REGISTRY ---
// Pridanie novej odmeny je otázkou jedného riadku sem.
export const ASSET_STORE: VisualAsset[] = [
    { 
        id: 'hat_level_2', 
        name: 'Šiltovka Ambície', 
        category: 'headwear', 
        requirementLevel: 2, 
        icon: '🧢',
        promptModifier: 'wearing a cool blue baseball cap'
    },
    { 
        id: 'glasses_level_3', 
        name: 'Focus Okuliare', 
        category: 'accessory', 
        requirementLevel: 3, 
        icon: '👓',
        promptModifier: 'wearing smart reading glasses'
    },
    { 
        id: 'headphones_level_4', 
        name: 'Deep Work Headset', 
        category: 'accessory', 
        requirementLevel: 4, 
        icon: '🎧',
        promptModifier: 'wearing high-tech noise-canceling headphones'
    },
    { 
        id: 'aura_level_5', 
        name: 'Zlatá Aura', 
        category: 'effect', 
        requirementLevel: 5, 
        icon: '✨',
        className: 'animate-pulse bg-yellow-400/20 blur-xl',
        promptModifier: 'surrounded by a glowing mystical golden aura'
    }
];

export const LEVELING_SYSTEM = {
    config: {
      maxHabitsPerDay: 10,
      maxBlocksPerDay: 12,
    },
    xpValues: {
      PLAN_DAY: 50,
      CREATE_HABIT: 10,
      COMPLETE_WORK_BLOCK: 20,
      COMPLETE_REST_BLOCK: 10,
      COMPLETE_HABIT: 15,
      TRACK_REALITY: 5,
      PERFECT_DAY_BONUS: 100,
    },
    titles: [
      { upTo: 3, title: "Novice Twin" },
      { upTo: 6, title: "Beginner Twin" },
      { upTo: 10, title: "Planner Twin" },
      { upTo: 15, title: "Consistent Twin" },
      { upTo: 20, title: "Master of Time" },
      { upTo: 999, title: "The Ideal Twin" }
    ]
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
        title: LEVELING_SYSTEM.titles.find(t => level <= t.upTo)?.title || "Legendary Twin",
        currentLevelXp,
        nextLevelXpThreshold: xpForThisLevel,
        progressPercent: (currentLevelXp / xpForThisLevel) * 100,
        unlockedAssets: ASSET_STORE.filter(a => level >= a.requirementLevel)
    };
};

export const getLevelInfo = (totalXp: number) => {
    const data = calculateLevelData(totalXp);
    // Find what was newly unlocked at this level to provide as feedback in the planner
    const newUnlocks = ASSET_STORE.filter(a => a.requirementLevel === data.level);
    return {
        level: data.level,
        title: data.title,
        nextLevelXp: data.nextLevelXpThreshold,
        // Added unlock property to fix TypeScript error in Planner.tsx
        unlock: newUnlocks.length > 0 ? newUnlocks.map(a => a.name).join(", ") : undefined
    };
};

export const getAvatarState = (level: number, taskProgress: number, readiness: number = 70, isSick: boolean = false) => {
    const now = new Date();
    const currentHour = now.getHours();
    
    let expression: AvatarExpression = 'happy';
    if (currentHour >= 23 || currentHour < 6) expression = 'sleeping';
    else if (isSick) expression = 'sad';
    else if (taskProgress < 20 && currentHour > 14) expression = 'sad';
    else if (readiness < 40) expression = 'sleepy';

    return { 
        expression, 
        isNight: currentHour >= 20 || currentHour < 6,
        scale: 1 + (level - 1) * 0.05 // Twin rastie s levelom
    };
};

export const calculateReadiness = (health?: AggregatedHealthData, context?: DailyContext): number => {
    let score = 70;
    if (health) {
        score += ((health.sleepMinutes / 480) * 15) - 15;
    }
    if (context) {
        score -= (context.stressLevel * 25);
        if (context.isIll) score -= 45;
    }
    return Math.min(100, Math.max(0, score));
};
