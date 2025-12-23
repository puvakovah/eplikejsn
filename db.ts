import { UserProfile, Habit, DayPlan } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DB_KEY = 'ideal_twin_local_cache_v1';
const SESSION_KEY = 'ideal_twin_session_active';
const CACHE_TTL = 300000; // 5 minút

const SUPABASE_URL = "https://zdzfopzntvnxsesucmnm.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkemZvcHpudHZueHNlc3VjbW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY1NjIsImV4cCI6MjA3OTc2MjU2Mn0.QyeOTZibLYrHdiULid8p16OuTbfwAyv-LDrUILj6Nyw"; 

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const Cache = {
  set: (username: string, data: any) => {
    try {
      const payload = { ...data, _timestamp: Date.now() };
      localStorage.setItem(`${DB_KEY}_${username}`, JSON.stringify(payload));
      localStorage.setItem(SESSION_KEY, username);
    } catch (e) { console.error("Cache set failed", e); }
  },
  get: (username: string) => {
    try {
        const raw = localStorage.getItem(`${DB_KEY}_${username}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const isStale = Date.now() - parsed._timestamp > CACHE_TTL;
        return { data: parsed, isStale };
    } catch (e) { return null; }
  },
  getActiveUser: () => localStorage.getItem(SESSION_KEY)
};

export const db = {
  isOnline: () => window.navigator.onLine,

  getProviderType: () => 'supabase',

  resendVerificationEmail: async (email: string) => {
    if (!supabase) return { success: false, message: 'Offline' };
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  getSession: async () => {
    const username = Cache.getActiveUser();
    if (!username) return { success: false };
    
    const cached = Cache.get(username);
    if (cached && !cached.isStale) {
      return { success: true, username, data: cached.data };
    }
    
    if (supabase && navigator.onLine) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('profiles').select('data').eq('id', session.user.id).single();
                if (data) {
                    Cache.set(username, data.data);
                    return { success: true, username, data: data.data };
                }
            }
        } catch (e) {
            console.warn("Supabase session fetch failed, falling back to cache.");
        }
    }

    return cached ? { success: true, username, data: cached.data } : { success: false };
  },

  register: async (params: any) => {
    if (!supabase) return { success: false, message: 'Offline' };
    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            username: params.username,
            first_name: params.firstName,
            last_name: params.lastName
          }
        }
      });
      if (error) return { success: false, message: error.message };

      const initialData = {
        user: {
          name: params.username,
          firstName: params.firstName,
          lastName: params.lastName,
          email: params.email,
          preferences: { theme: 'light', language: 'sk', notificationsEmail: true, notificationsPush: false, healthSync: { enabled: false } },
          twinLevel: 1,
          xp: 0,
          xpToNextLevel: 500,
          energy: 100,
          messages: [],
          healthData: {},
          dailyContext: {},
          isSick: false,
          stressLevel: 0,
          lastActivityDate: new Date().toISOString().split('T')[0],
          dailyHabitCount: 0,
          dailyBlockCount: 0,
          dailyPlanCreated: false,
          avatarUrl: null,
          goals: []
        },
        habits: [],
        dayPlan: {
          date: new Date().toISOString().split('T')[0],
          plannedBlocks: [],
          actualBlocks: []
        }
      };

      await db.saveUserData(params.username, initialData);
      return { success: true };
    } catch (err: any) { return { success: false, message: err.message }; }
  },

  login: async (email: string, password: string) => {
    if (!supabase) return { success: false, message: 'Offline' };
    try {
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, message: error.message };

        const { data: profile } = await supabase.from('profiles').select('data, username').eq('id', auth.user.id).maybeSingle();
        const userData = profile?.data;
        if (userData) Cache.set(profile.username || email, userData);
        
        return { success: true, data: userData, username: profile?.username || email };
    } catch (err: any) { return { success: false, message: err.message }; }
  },

  saveUserData: async (username: string, data: any) => {
    // 1. Lokálne uloženie pre okamžitú odozvu
    Cache.set(username, data);

    // 2. Kontrola pripojenia a inicializácie
    if (!supabase || !navigator.onLine) return { success: true };

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { success: false, message: "No active session" };

        // Synchronizácia do Supabase - OPRAVENÁ DESTRUKTURALIZÁCIA ERROR
        const { error } = await supabase.from('profiles').upsert({ 
            id: session.user.id, 
            data, 
            username, 
            updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

        if (error) throw error;
        
        return { success: true };
    } catch (err: any) { 
        console.error("Sync error:", err.message);
        return { success: false, message: err.message }; 
    }
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    if (supabase) await supabase.auth.signOut();
  }
};