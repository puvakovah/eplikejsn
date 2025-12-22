
// --- AVATAR TYPES ---
export type AvatarGender = 'Male' | 'Female';
export type AvatarSkin = 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark';
export type AvatarHairColor = 'Brown' | 'Black' | 'Blonde' | 'Red' | 'Grey' | 'White' | 'Blue' | 'Pink';
export type AvatarHairStyle = 'Short' | 'Long' | 'Curly' | 'Straight' | 'Bald' | 'Ponytail' | 'Messy' | 'Wavy';
export type AvatarEyeColor = 'Brown' | 'Blue' | 'Green' | 'Hazel' | 'Grey';

export type AvatarGlasses = 'None' | 'Reading Glasses' | 'Sunglasses' | 'Round Glasses' | 'Square Glasses';
export type AvatarHeadwear = 'None' | 'Cap' | 'Beanie' | 'Headphones' | 'Bandana' | 'Hat';

export type AvatarClothingColor = 'Black' | 'White' | 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Pink' | 'Grey' | 'Beige' | 'Navy' | 'Burgundy';
export type AvatarTopType = 'T-Shirt' | 'Hoodie' | 'Shirt' | 'Suit Jacket' | 'Sweater' | 'Tank Top' | 'Vest' | 'Polo' | 'Lab Coat';
export type AvatarBottomType = 'Jeans' | 'Shorts' | 'Trousers' | 'Skirt' | 'Joggers' | 'Leggings';
export type AvatarShoesType = 'Sneakers' | 'Boots' | 'Formal Shoes' | 'Sandals' | 'Loafers';

export type AvatarExpression = 'happy' | 'sad' | 'sleepy' | 'sleeping';

export interface AvatarConfig {
    gender: AvatarGender;
    skin: AvatarSkin;
    hairColor: AvatarHairColor;
    hairStyle: AvatarHairStyle;
    eyeColor: AvatarEyeColor;
    glasses: AvatarGlasses;
    headwear: AvatarHeadwear;
    topType: AvatarTopType;
    topColor: AvatarClothingColor;
    bottomType: AvatarBottomType;
    bottomColor: AvatarClothingColor;
    shoesType: AvatarShoesType;
    shoesColor: AvatarClothingColor;
}

// --- APP TYPES ---

export type ActivityType = 'work' | 'rest' | 'habit' | 'exercise' | 'social' | 'health' | 'other';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: ActivityType;
  isCompleted: boolean; // For "Reality" tracking
  notes?: string;
}

export interface DayPlan {
  date: string;
  plannedBlocks: TimeBlock[];
  actualBlocks: TimeBlock[]; // For Plan vs Reality comparison
  score: number; // calculated based on completion
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedDates: string[]; // ISO date strings (YYYY-MM-DD)
  category: 'health' | 'productivity' | 'mindfulness';
  aiTip?: string; // AI generated tip
}

export interface InboxMessage {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  type: 'general' | 'achievement' | 'welcome';
}

export interface HealthSyncConfig {
    enabled: boolean;
    provider: 'apple' | 'google' | null;
    syncSteps: boolean;
    syncHeartRate: boolean;
    syncHRV: boolean;
    syncSleep: boolean;
    syncWorkouts: boolean;
    syncCalories: boolean;
    autoSync: boolean;
    lastSyncAt?: string;
}

export interface DailyContext {
    stressLevel: number; // 0-1
    isIll: boolean;
    cycleDay?: number;
    specialEvent?: string;
}

export interface AggregatedHealthData {
    steps: number;
    avgHR: number;
    avgHRV: number;
    sleepMinutes: number;
    caloriesBurned: number;
    readinessScore: number; // 0-100 calculated internal metric
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: 'sk' | 'en';
    notificationsEmail: boolean;
    notificationsPush: boolean;
    bio?: string;
    healthSync: HealthSyncConfig;
}

export interface UserProfile {
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  goals: string[]; 
  
  preferences: UserPreferences; 
  
  avatarUrl: string | null; 
  avatarConfig?: AvatarConfig; 
  
  // Gamification Stats
  twinLevel: number; 
  levelTitle?: string; 
  xp: number; 
  xpToNextLevel: number; 
  energy: number; 
  
  // Health Status
  isSick: boolean;
  stressLevel: number; // 0 - 10

  // Anti-Cheat & Daily Tracking
  lastActivityDate: string; 
  dailyHabitCount: number; 
  dailyBlockCount: number; 
  dailyPlanCreated: boolean; 
  
  messages: InboxMessage[];

  // Extended Health & Context
  healthData: Record<string, AggregatedHealthData>; // Keyed by YYYY-MM-DD
  dailyContext: Record<string, DailyContext>; // Keyed by YYYY-MM-DD
}

export interface SearchResult {
  title: string;
  uri: string;
}

export enum AppView {
  DASHBOARD = 'dashboard',
  PLANNER = 'planner',
  HABITS = 'habits',
  PROFILE = 'profile',
  INBOX = 'inbox',
  SETTINGS = 'settings'
}
