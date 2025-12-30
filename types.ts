
export type AvatarExpression = 'happy' | 'sad' | 'sleepy' | 'sleeping';
export type AvatarGender = 'Male' | 'Female';
export type AvatarSkin = 'Fair' | 'Light' | 'Medium' | 'Olive' | 'Brown' | 'Dark';
export type AvatarHairColor = 'Blonde' | 'Brown' | 'Black' | 'Red' | 'Gray';
export type AvatarHairStyle = 'Short' | 'Long' | 'Straight' | 'Curly' | 'Spiky' | 'Bob' | 'Ponytail' | 'Wavy' | 'Bald';
export type AvatarEyeColor = 'Brown' | 'Blue' | 'Green';
export type AvatarGlasses = 'None' | 'Reading' | 'Sunglasses';
export type AvatarHeadwear = 'None' | 'Hat' | 'Cap' | 'Beanie';
export type AvatarTopType = 'T-Shirt' | 'Hoodie' | 'Shirt' | 'Jacket' | 'TankTop';
export type AvatarBottomType = 'Jeans' | 'Sweatpants' | 'Shorts' | 'Skirt' | 'Leggings';
export type AvatarShoesType = 'Sneakers' | 'Boots' | 'Sandals' | 'Heels';
export type AvatarClothingColor = 'Red' | 'Blue' | 'Black' | 'Green' | 'White' | 'Gray' | 'Denim' | 'Pink' | 'Yellow';


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

export interface HealthSyncConfig {
  enabled: boolean;
  provider: string | null;
  syncSteps: boolean;
  syncHeartRate: boolean;
  syncHRV: boolean;
  syncSleep: boolean;
  syncWorkouts: boolean;
  syncCalories: boolean;
  autoSync: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'sk' | 'en';
  notificationsEnabled: boolean;
  notificationsEmail: boolean;
  notificationsPush: boolean;
  bio?: string;
  healthSync: HealthSyncConfig;
}

export interface InboxMessage {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  type: 'achievement' | 'welcome' | 'system';
}

export interface AggregatedHealthData {
  steps: number;
  sleepMinutes: number;
  hrv?: number;
  avgHeartRate?: number;
}

export interface DailyContext {
  stressLevel: number;
  isIll: boolean;
  cycleDay?: number;
}

export type ActivityType = 'work' | 'rest' | 'habit' | 'exercise' | 'social' | 'health' | 'other';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: ActivityType;
  isCompleted: boolean;
  notes?: string;
}

export interface DayPlan {
  date: string;
  plannedBlocks: TimeBlock[];
  actualBlocks: TimeBlock[];
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[];
  frequency: 'daily' | 'weekly';
  category: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PLANNER = 'PLANNER',
  HABITS = 'HABITS',
  INBOX = 'INBOX',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  streetAddress?: string;
  city?: string;
  country?: string;
  goals: string[]; 
  
  preferences: UserPreferences; 
  
  avatarUrl: string | null; 
  avatarConfig?: AvatarConfig; 
  
  twinLevel: number; 
  levelTitle?: string; 
  xp: number; 
  xpToNextLevel: number; 
  energy: number; 
  
  isSick: boolean;
  isHealthSynced: boolean;
  stressLevel: number;

  lastActivityDate: string; 
  dailyHabitCount: number; 
  dailyBlockCount: number; 
  dailyPlanCreated: boolean; 
  
  messages: InboxMessage[];

  healthData: Record<string, AggregatedHealthData>;
  dailyContext: Record<string, DailyContext>;
}
