import { GoogleGenAI } from "@google/genai";
import { 
    UserProfile, AvatarConfig, AvatarExpression
} from "./types";
import { Language } from "./translations";

/**
 * Získanie kľúča s viacerými poistkami pre browser.
 */
const getApiKey = (): string | null => {
  // Skúsi process.env (Vite/Node fallback) alebo priamo window objekt
  const key = (window as any).process?.env?.API_KEY || (window as any).GEMINI_API_KEY;
  if (!key || key === "" || key.includes("TVOJ_")) return null;
  return key;
};

const getDeterministicSeed = (config: AvatarConfig, level: number): number => {
  const seedString = `${config.gender}-${config.skin}-${config.hairStyle}-${config.hairColor}-${config.eyeColor}-${config.topType}-${config.topColor}-${config.bottomType}-${config.bottomColor}-${config.shoesType}-${config.shoesColor}-${level}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  return Math.abs(hash);
};

/**
 * Avatar URL - Okamžitý návrat pre plynulosť UI.
 */
export const getPresetAvatarUrl = async (
    user: UserProfile,
    expression: AvatarExpression = 'happy',
    _lang: Language = 'en'
): Promise<string> => {
  const config = user.avatarConfig;
  if (!config) return "";

  const seedValue = getDeterministicSeed(config, user.twinLevel || 1);
  const ageStage = user.twinLevel >= 20 ? "sophisticated adult" : (user.twinLevel >= 10 ? "cool teenager" : "child");

  const prompt = `Full body 3D render, Pixar Disney style, ${ageStage} ${config.gender.toLowerCase()}, skin: ${config.skin}, eyes: ${config.eyeColor}, ${expression} expression, hair: ${config.hairStyle}, clothing: ${config.topColor} ${config.topType} and ${config.bottomColor} ${config.bottomType}, neutral background.`;

  // Gemini cez JS SDK nevie priamo generovať PNG/JPG súbory (iba text). 
  // Ideme priamo na Pollinations, aby sa aplikácia nezasekla na timeout-e.
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seedValue}&width=1024&height=1024&model=flux`; 
};

/**
 * Plán dňa - Gemini 2.0 (Textový výstup).
 */
export const generateIdealDayPlan = async (goals: string[], preferences: string, lang: Language = 'en') => {
    const apiKey = getApiKey();
    if (!apiKey) return { blocks: [] };
    
    try {
        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", // 1.5 je v browseri stabilnejšia
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Generate ideal daily schedule in JSON format for: ${goals.join(', ')}. Preferences: ${preferences}. Language: ${lang === 'sk' ? 'Slovak' : 'English'}. Format: {"blocks": [{"time": "HH:MM", "activity": "string", "duration": "string"}]}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        
        return JSON.parse(text);
    } catch (e) {
        console.error("AI Plan failed:", e);
        return { blocks: [] };
    }
};

/**
 * Návrhy zvykov s Google Search.
 */
export const getHabitSuggestions = async (query: string, lang: Language = 'en') => {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "API Key missing.", sources: [] };
    
    try {
        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent({ 
            contents: [{ 
                role: "user", 
                parts: [{ text: `Suggest science-backed habits for: ${query}. Respond in ${lang === 'sk' ? 'Slovak' : 'English'}.` }] 
            }],
            tools: [{ googleSearchRetrieval: {} }] as any
        });

        const res = await result.response;
        const text = res.text();
        
        const metadata = (res as any).candidates?.[0]?.groundingMetadata;
        const sources = metadata?.groundingChunks?.map((c: any) => ({
            title: c.web?.title || 'Zdroj',
            uri: c.web?.uri || ''
        })).filter((s: any) => s.uri) || [];

        return { text, sources };
    } catch (e) {
        console.error("Habit search failed:", e);
        return { text: "Error loading suggestions.", sources: [] };
    }
};