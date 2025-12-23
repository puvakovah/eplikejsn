
import { GoogleGenAI } from "@google/genai";
import { 
    AvatarExpression, AvatarGender, AvatarSkin, AvatarHairColor, 
    AvatarHairStyle, AvatarEyeColor, AvatarGlasses, AvatarHeadwear, 
    AvatarTopType, AvatarClothingColor, AvatarBottomType, AvatarShoesType 
} from "./types";
import { CATEGORY_UNLOCKS } from "./gamificationConfig";

// Inicializácia Gemini API podľa prísnych pravidiel (výhradne cez process.env.API_KEY)
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

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
): Promise<string> => {
  
  // Evolučná logika podľa levelu
  let ageStage = "child";
  if (level >= 20) ageStage = "adult";
  else if (level >= 10) ageStage = "teenager";

  const genderDesc = gender === 'Male' ? `${ageStage} male` : `${ageStage} female`;
  const hairDesc = (level >= CATEGORY_UNLOCKS.CLOTHING && hairStyle !== 'Bald') ? `${hairStyle} ${hairColor} hair` : "simple hair";
  const clothingDesc = level >= CATEGORY_UNLOCKS.CLOTHING ? `wearing ${topColor} ${topType} and ${bottomColor} ${bottomType}` : "simple casual clothes";
  const shoesDesc = level >= CATEGORY_UNLOCKS.SHOES ? `with ${shoesColor} ${shoesType}` : "barefoot";
  
  const prompt = `3D digital character render, ${genderDesc}, ${skin} skin, ${hairDesc}, ${clothingDesc}, ${shoesDesc}, Pixar/Disney style, 8k, detailed textures, white background.`;

  const uniqueString = `${level}-${gender}-${skin}-${hairStyle}-${hairColor}-${eyeColor}-${expression}`;
  let seed = 0;
  for (let i = 0; i < uniqueString.length; i++) {
    seed = (uniqueString.charCodeAt(i) + ((seed << 5) - seed));
  }
  seed = Math.abs(seed);
  
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=512&height=512&model=flux`; 
};

export const generateIdealDayPlan = async (goals: string[], preferences: string) => {
    if (!process.env.API_KEY) return { blocks: [] };

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Navrhni ideálny denný plán pre užívateľa s cieľmi: ${goals.join(', ')}. Preferencie: ${preferences}. Odpovedaj výhradne v čistom JSON formáte: {"blocks": [{"title": "Názov", "startTime": "HH:MM", "endTime": "HH:MM", "type": "work|rest|habit|exercise"}]}`
        });
        
        const text = response.text || "{}";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("AI Plan Generation failed:", e);
        return { blocks: [] };
    }
};

export const getHabitSuggestions = async (query: string) => {
    if (!process.env.API_KEY) return { text: "Chýba API kľúč.", sources: [] };

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({ 
            model: "gemini-3-flash-preview",
            contents: `Navrhni vedecky podložené návyky pre zlepšenie v oblasti: ${query}. Použi Google Search pre overenie faktov.`,
            config: { 
                tools: [{ googleSearch: {} }] 
            }
        });

        // Extrakcia URL zo search grounding podľa pravidiel
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || 'Zdroj',
            uri: chunk.web?.uri || ''
        })).filter((s: any) => s.uri) || [];

        return { text: response.text || "", sources };
    } catch (e) {
        console.error("AI Habit suggestions failed:", e);
        return { text: "Nepodarilo sa získať nápady.", sources: [] };
    }
};
