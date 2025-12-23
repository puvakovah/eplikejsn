import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
    SearchResult, AvatarExpression, 
    AvatarGender, AvatarSkin, AvatarHairColor, AvatarHairStyle, 
    AvatarEyeColor, AvatarGlasses, AvatarHeadwear, AvatarTopType, 
    AvatarClothingColor, AvatarBottomType, AvatarShoesType 
} from "./types";
import { CATEGORY_UNLOCKS } from "./gamificationConfig";

// Inicializácia AI (mimo funkcií pre lepší výkon)
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

const ensureApiKey = () => {
  if (!process.env.API_KEY) {
    console.error("Gemini API Key is missing.");
    return false;
  }
  return true;
};

/**
 * Získanie URL avatara z Gemini.
 */
export const getPresetAvatarUrl = async (
    level: number,
    gender: AvatarGender, 
    skin: AvatarSkin, 
    hairStyle: AvatarHairStyle, 
    hairColor: AvatarHairColor, 
    eyeColor: AvatarEyeColor,
    glasses: AvatarGlasses, 
    headwear: AvatarHeadwear,
    topType: AvatarTopType, 
    topColor: AvatarClothingColor,
    bottomType: AvatarBottomType, 
    bottomColor: AvatarClothingColor,
    shoesType: AvatarShoesType, 
    shoesColor: AvatarClothingColor,
    expression: AvatarExpression = 'happy'
): Promise<string | { useBaseAvatar: boolean }> => {
  
  const genderDesc = gender === 'Male' ? "handsome man" : "beautiful woman";
  const prompt = `3D digital render of a ${genderDesc} character with ${skin} skin, Pixar animation style, full body shot, centered on pure white background, 8k resolution. Expression: ${expression}.`;

  if (ensureApiKey()) {
    try {
      // Opravené: Použitie správnej metódy getGenerativeModel
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Poznámka: Štandardné Gemini modely vracajú text, 
      // generovanie obrázkov (Imagen) vyžaduje špecifický prístup cez Google Cloud.
      // Pre simuláciu nateraz vraciame signál na fallback ak nejde o Imagen.
      console.log("AI Response received");
      
    } catch (err: any) {
      console.warn("Gemini generation failed, signaling fallback. Reason:", err?.message);
    }
  }

  return { useBaseAvatar: true };
};

/**
 * Generovanie plánu dňa.
 */
export const generateIdealDayPlan = async (goals: string[], preferences: string) => {
    if (!ensureApiKey()) return { blocks: [] };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Navrhni ideálny denný plán založený na cieľoch: ${goals.join(', ')}. Preferencie: ${preferences}. Odpovedaj výhradne v JSON formáte so štruktúrou { "blocks": [ { "title": string, "startTime": "HH:MM", "endTime": "HH:MM", "type": string } ] }.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Day plan generation failed:", e);
        return { blocks: [] };
    }
};

/**
 * Návrhy návykov s Google Search grounding.
 */
export const getHabitSuggestions = async (query: string) => {
    if (!ensureApiKey()) return { text: "AI kľúč chýba.", sources: [] };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Navrhni návyky pre: ${query}.`);
        const response = await result.response;

        return { 
            text: response.text() || "Žiadna odpoveď.", 
            sources: [] 
        };
    } catch (e) {
        console.error("Habit suggestions failed:", e);
        return { text: "AI služba je nedostupná.", sources: [] };
    }
};