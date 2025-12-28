import { GoogleGenAI } from "@google/genai";
import { 
    UserProfile, AvatarConfig, AvatarExpression
} from "./types";
import { Language } from "./translations";

const getApiKey = (): string | null => {
    // V Ionic/Capacitor prostredí používame window.process pre kompatibilitu s tvojím HTML
    const key = (window as any).process?.env?.API_KEY;
    if (!key || key === "" || key.includes("TVOJ_")) return null;
    return key;
};

// ... (ponechaj getDeterministicSeed bezo zmeny) ...

export const getPresetAvatarUrl = async (
    user: UserProfile,
    expression: AvatarExpression = 'happy'
): Promise<string> => {
    const config = user.avatarConfig;
    if (!config) return "";

    const seedValue = Math.random(); // Pre jednoduchosť, alebo použi svoj seed
    const prompt = `3D Pixar style avatar, ${config.gender}, ${config.hairStyle}`;

    // Pollinations je najistejší fallback pre mobilné aplikácie
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seedValue}`;
};

export const generateIdealDayPlan = async (goals: string[], preferences: string, lang: Language = 'en') => {
    const apiKey = getApiKey();
    if (!apiKey) return { blocks: [] };
    
    try {
        // --- OPRAVA TU: Odovzdávame objekt, nie string ---
        const genAI = new GoogleGenAI({ apiKey }); 
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash"
        });

        const prompt = `Generate daily schedule (JSON) for: ${goals.join(', ')}. Lang: ${lang}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text().replace(/```json|```/g, "").trim());
    } catch (e) {
        console.error("Build error fix:", e);
        return { blocks: [] };
    }
};

export const getHabitSuggestions = async (query: string, lang: Language = 'en') => {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "Missing API Key", sources: [] };
    
    try {
        // --- OPRAVA TU: Odovzdávame objekt, nie string ---
        const genAI = new GoogleGenAI({ apiKey });
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Habits for ${query} in ${lang}`);
        const res = await result.response;
        return { text: res.text(), sources: [] };
    } catch (e) {
        return { text: "Error", sources: [] };
    }
};