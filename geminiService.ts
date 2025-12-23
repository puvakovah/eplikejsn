import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
    AvatarExpression, AvatarGender, AvatarSkin, AvatarHairColor, 
    AvatarHairStyle, AvatarEyeColor, AvatarGlasses, AvatarHeadwear, 
    AvatarTopType, AvatarClothingColor, AvatarBottomType, AvatarShoesType 
} from "./types";
import { CATEGORY_UNLOCKS } from "./gamificationConfig";

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

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
  
  const genderDesc = gender === 'Male' ? "handsome man" : "beautiful woman";
  const hairDesc = (level >= CATEGORY_UNLOCKS.CLOTHING && hairStyle !== 'Bald') ? `${hairStyle} ${hairColor} hair` : "short basic hair";
  const clothingDesc = level >= CATEGORY_UNLOCKS.CLOTHING ? `wearing ${topColor} ${topType} and ${bottomColor} ${bottomType}` : "wearing simple clothes";
  const shoesDesc = level >= CATEGORY_UNLOCKS.SHOES ? `with ${shoesColor} ${shoesType}` : "standing barefoot";
  const glassesDesc = (level >= CATEGORY_UNLOCKS.GLASSES && glasses !== 'None') ? `wearing ${glasses} glasses` : "";
  const headDesc = (level >= CATEGORY_UNLOCKS.HEADWEAR && headwear !== 'None') ? `wearing a ${headwear}` : "";

  let exprPrompt = "happy smile";
  if (expression === 'sad') exprPrompt = "unhappy face";
  if (expression === 'sleepy') exprPrompt = "tired eyes";
  if (expression === 'sleeping') exprPrompt = "eyes closed";

  const prompt = `3D render, ${genderDesc}, ${skin} skin, ${hairDesc}, ${clothingDesc}, ${shoesDesc}, ${glassesDesc}, ${headDesc}, ${exprPrompt}, Pixar style, white background.`;

  const uniqueString = `${level}-${gender}-${skin}-${hairStyle}-${hairColor}-${eyeColor}-${glasses}-${headwear}-${topType}-${topColor}-${bottomType}-${bottomColor}-${shoesType}-${shoesColor}-${expression}`;
  let seed = 0;
  for (let i = 0; i < uniqueString.length; i++) {
    seed = (uniqueString.charCodeAt(i) + ((seed << 5) - seed));
  }
  seed = Math.abs(seed);
  
  // Keďže Gemini priamo v SDK generovanie obrázkov nepodporuje rovnako ako text,
  // zachovávame tvoj Pollinations fallback ako primárny zdroj.
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=512&height=512&model=flux`; 
};

export const generateIdealDayPlan = async (goals: string[], preferences: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Navrhni plán pre: ${goals.join(', ')}. Preferencie: ${preferences}. Odpovedaj v JSON: {"blocks": [{"title": "string", "startTime": "HH:MM", "endTime": "HH:MM", "type": "string"}]}` }] }],
            // OPRAVA: 'seed' tu neexistuje v typoch, ak ho chceš poslať, musíš pretypovať na any
            generationConfig: { responseMimeType: "application/json" } as any
        });
        return JSON.parse(result.response.text());
    } catch (e) {
        console.error(e);
        return { blocks: [] };
    }
};

export const getHabitSuggestions = async (query: string) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            tools: [{ googleSearchRetrieval: {} }] as any
        });
        const result = await model.generateContent(`Návyky pre: ${query}`);
        const response = result.response;
        
        // OPRAVA: Log ti písal preklep 'groundingChuncks' - vyriešime to cez any
        const metadata = (response as any).candidates?.[0]?.groundingMetadata;
        const chunks = metadata?.groundingChunks || metadata?.groundingChuncks || [];

        const sources = chunks.map((chunk: any) => ({
            title: chunk.web?.title || 'Zdroj',
            uri: chunk.web?.uri || ''
        })).filter((s: any) => s.uri) || [];

        return { text: response.text(), sources };
    } catch (e) {
        return { text: "Chyba.", sources: [] };
    }
};