
import { AvatarExpression, AggregatedHealthData, DailyContext } from "./types";

// Gamification System Configuration - Dynamic Progressive Growth
export const LEVELING_SYSTEM = {
    config: {
      maxHabitsPerDay: 10,
      maxBlocksPerDay: 12
    },
    xpValues: {
      PLAN_DAY: 50,
      CREATE_HABIT: 10,
      COMPLETE_WORK_BLOCK: 20,
      COMPLETE_REST_BLOCK: 10,
      COMPLETE_HABIT: 15,
      TRACK_REALITY: 5,
      PERFECT_DAY_BONUS: 100,
      STREAK_3_DAYS: 150,
      STREAK_7_DAYS: 500
    },
    // Titles based on level ranges
    titles: [
      { upTo: 3, title: "Novice Twin" },
      { upTo: 6, title: "Beginner Twin" },
      { upTo: 10, title: "Planner Twin" },
      { upTo: 15, title: "Consistent Twin" },
      { upTo: 20, title: "Master of Time" },
      { upTo: 999, title: "The Ideal Twin" }
    ]
};

/**
 * Calculates current level data based on total XP.
 * Formula for XP gap between levels: 500 + (level-1) * 250
 */
export const calculateLevelData = (totalXp: number) => {
    let level = 1;
    let accumulatedXp = 0;
    
    while (true) {
        const xpForNext = 500 + (level - 1) * 250;
        if (totalXp < accumulatedXp + xpForNext) {
            break;
        }
        accumulatedXp += xpForNext;
        level++;
    }

    const xpForThisLevel = 500 + (level - 1) * 250;
    const currentLevelXp = totalXp - accumulatedXp;
    const progressPercent = (currentLevelXp / xpForThisLevel) * 100;
    const xpRemaining = xpForThisLevel - currentLevelXp;
    const levelTitle = LEVELING_SYSTEM.titles.find(t => level <= t.upTo)?.title || "Legendary Twin";

    return {
        level,
        title: levelTitle,
        currentLevelXp,
        nextLevelXpThreshold: xpForThisLevel,
        totalXpRequiredForNext: accumulatedXp + xpForThisLevel,
        xpRemaining,
        progressPercent
    };
};

/**
 * Backward compatibility or simplified wrapper
 */
export const getLevelInfo = (xp: number) => {
    const data = calculateLevelData(xp);
    return {
        ...data,
        minXp: xp - data.currentLevelXp,
        maxXp: data.totalXpRequiredForNext,
        nextLevelXp: data.totalXpRequiredForNext,
        unlock: null,
        xpInLevel: data.currentLevelXp,
        nextLevelNeededGap: data.nextLevelXpThreshold
    };
};

/**
 * ADAPTIVE BODY MODEL
 */
export const calculateReadiness = (health?: AggregatedHealthData, context?: DailyContext): number => {
    let score = 70; // Base score

    if (health) {
        const sleepBonus = (health.sleepMinutes / 480) * 15;
        score += (sleepBonus - 15);
        if (health.avgHRV > 60) score += 10;
        else if (health.avgHRV < 35) score -= 20;
        if (health.avgHR < 60) score += 5;
        else if (health.avgHR > 85) score -= 15;
    }

    if (context) {
        score -= (context.stressLevel * 25);
        if (context.isIll) score -= 45;
    }

    return Math.min(100, Math.max(0, score));
};

/**
 * Predicts trends
 */
export const predictTrends = (currentReadiness: number, last3DaysReadiness: number[]) => {
    const avg = last3DaysReadiness.length > 0 
        ? last3DaysReadiness.reduce((a, b) => a + b, 0) / last3DaysReadiness.length 
        : currentReadiness;
    
    const delta = currentReadiness - avg;
    
    return {
        expectedFatigue: delta < -5 ? 'Rising' : (delta > 5 ? 'Low' : 'Stable'),
        performancePotential: currentReadiness > 75 ? 'High' : (currentReadiness < 40 ? 'Low' : 'Moderate'),
        recommendation: currentReadiness < 50 ? 'Rest day' : (currentReadiness > 85 ? 'Intense training' : 'Standard routine')
    };
};

// --- AVATAR LOGIC (Energy & Mood Simulation) ---
export const getAvatarState = (level: number, taskProgress: number, readiness: number = 70, isSick: boolean = false) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const baseScale = 0.5;
    const scale = baseScale + (level - 1) * 0.05;
  
    let simulatedEnergy = 0;
    
    if (currentHour >= 6 && currentHour < 23) {
        const hoursAwake = (currentHour - 6) + (currentMinute / 60);
        const depletionRate = (100 / 17) * (1.3 - (readiness / 100)); 
        simulatedEnergy = Math.max(0, 100 - (hoursAwake * depletionRate));
    } else {
        simulatedEnergy = 0; 
    }

    const displayEnergy = Math.round(simulatedEnergy);

    let expression: AvatarExpression = 'happy';
    let isNight = currentHour >= 20 || currentHour < 6;

    if (currentHour >= 23 || currentHour < 6) {
        expression = 'sleeping';
    } 
    else if (isSick) {
        expression = 'sad';
    }
    else if (currentHour >= 14 && (taskProgress < 20 || readiness < 35)) {
        expression = 'sad';
    }
    else if (currentHour >= 21 || displayEnergy < 35) {
        expression = 'sleepy';
    }
    else {
        expression = 'happy';
    }
  
    return { 
        scale, 
        expression, 
        displayEnergy, 
        isNight
    };
};
