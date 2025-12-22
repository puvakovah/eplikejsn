
import { UserProfile, Habit, DayPlan } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DB_KEY = 'ideal_twin_local_cache_v1';
const SESSION_KEY = 'ideal_twin_session_active';

const SUPABASE_URL = "https://zdzfopzntvnxsesucmnm.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkemZvcHpudHZueHNlc3VjbW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY1NjIsImV4cCI6MjA3OTc2MjU2Mn0.QyeOTZibLYrHdiULid8p16OuTbfwAyv-LDrUILj6Nyw"; 

export interface DbResult {
  success: boolean;
  data?: any;
  message?: string;
  username?: string;
  isFromCache?: boolean;
}

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error("Supabase init failed:", e);
  }
}

const Cache = {
  set: (username: string, data: any) => {
    try {
      const payload = { ...data, _timestamp: Date.now() };
      localStorage.setItem(`${DB_KEY}_${username}`, JSON.stringify(payload));
      localStorage.setItem(SESSION_KEY, username);
    } catch (e) {
      console.error("Cache save failed", e);
    }
  },
  get: (username: string) => {
    try {
        const raw = localStorage.getItem(`${DB_KEY}_${username}`);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
  },
  getActiveUser: () => localStorage.getItem(SESSION_KEY),
  remove: (username: string) => {
      localStorage.removeItem(`${DB_KEY}_${username}`);
      localStorage.removeItem(SESSION_KEY);
  }
};

export const db = {
  getProviderType: () => supabase ? 'supabase' : 'local',
  isOnline: () => window.navigator.onLine,

  register: async (data: any): Promise<DbResult> => {
    if (!supabase) return { success: false, message: 'Offline mode active' };
    const { username, email, password, firstName, lastName } = data;
    try {
        const { data: authData, error } = await supabase.auth.signUp({ 
            email, 
            password, 
            options: { 
              data: { username, firstName, lastName },
              emailRedirectTo: window.location.origin // Zabezpečí návrat do apky
            } 
        });
        
        if (error) return { success: false, message: error.message };
        
        // Ak je email_confirmed_at null, vyžadujeme verifikáciu
        if (authData.user && !authData.user.email_confirmed_at) {
            return { success: true, message: 'verification_required' };
        }
        
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
  },

  resendVerificationEmail: async (email: string): Promise<DbResult> => {
    if (!supabase) return { success: false, message: 'Databáza nedostupná' };
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  login: async (usernameOrEmail: string, password: string): Promise<DbResult> => {
    const cachedData = Cache.get(usernameOrEmail);
    if (!navigator.onLine && cachedData) {
        localStorage.setItem(SESSION_KEY, usernameOrEmail);
        return { success: true, data: cachedData, username: usernameOrEmail, isFromCache: true };
    }
    if (!supabase) return { success: false, message: 'Databáza nedostupná' };
    try {
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email: usernameOrEmail, password });
        
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            return { success: false, message: 'email_not_confirmed' };
          }
          return { success: false, message: error.message };
        }

        // Dodatočná kontrola potvrdenia emailu
        if (auth.user && !auth.user.email_confirmed_at) {
          await supabase.auth.signOut();
          return { success: false, message: 'email_not_confirmed' };
        }

        const { data: profile } = await supabase.from('profiles').select('data, username').eq('id', auth.user.id).maybeSingle();
        const username = profile?.username || auth.user.user_metadata?.username || usernameOrEmail;
        const userData = profile?.data;
        if (userData) Cache.set(username, userData);
        return { success: true, data: userData, username };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
  },

  getSession: async (): Promise<DbResult> => {
    try {
        const activeUser = Cache.getActiveUser();
        const cachedData = activeUser ? Cache.get(activeUser) : null;
        if (cachedData && !navigator.onLine) return { success: true, data: cachedData, username: activeUser!, isFromCache: true };
        if (!supabase || !navigator.onLine) return { success: !!cachedData, data: cachedData, username: activeUser || undefined };
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { success: false };

        // Ak relácia existuje ale email nie je potvrdený (teoreticky by nemalo nastať pri zapnutom auth)
        if (!session.user.email_confirmed_at) return { success: false };

        const { data: profile } = await supabase.from('profiles').select('data, username').eq('id', session.user.id).maybeSingle();
        if (profile?.data) {
          const uname = profile.username || session.user.email;
          Cache.set(uname, profile.data);
          return { success: true, data: profile.data, username: uname };
        }
        return { success: false };
    } catch (e) {
        return { success: false };
    }
  },

  saveUserData: async (username: string, data: any): Promise<{success: boolean, message?: string}> => {
    try {
        Cache.set(username, data);
        if (!supabase || !navigator.onLine) return { success: true, message: 'Uložené lokálne' };
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.email_confirmed_at) {
            const { error } = await supabase.from('profiles').upsert({ id: session.user.id, data, username, updated_at: new Date().toISOString() });
            if (error) throw error;
            return { success: true };
        }
        return { success: false, message: 'Relácia vypršala alebo email nie je potvrdený' };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    if (supabase) await supabase.auth.signOut();
  }
};
