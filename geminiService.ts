
import { GoogleGenerativeAI as GoogleGenAI, SchemaType as Type } from "@google/generative-ai";
import { 
    SearchResult, AvatarExpression, 
    AvatarGender, AvatarSkin, AvatarHairColor, AvatarHairStyle, 
    AvatarEyeColor, AvatarGlasses, AvatarHeadwear, AvatarTopType, 
    AvatarClothingColor, AvatarBottomType, AvatarShoesType 
} from "./types";
import { CATEGORY_UNLOCKS } from "./gamificationConfig";

const ensureApiKey = () => {
  if (!process.env.API_KEY) {
    console.error("Gemini API Key is missing.");
    return false;
  }
  return true;
};

/**
 * Získanie URL avatara z Gemini. Pri chybe vracia signál pre použitie základného avatara.
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (err: any) {
      console.warn("Gemini generation failed, signaling fallback. Reason:", err?.message);
    }
  }

  return { useBaseAvatar: true };
};

/**
 * Generovanie plánu dňa. Oprava chyby 400 odstránením responseMimeType ak zlyháva.
 */
export const generateIdealDayPlan = async (goals: string[], preferences: string) => {
    if (!ensureApiKey()) return { blocks: [] };

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Navrhni ideálny denný plán založený na cieľoch: ${goals.join(', ')}. Preferencie: ${preferences}. Odpovedaj výhradne v JSON formáte so štruktúrou { "blocks": [ { "title": string, "startTime": "HH:MM", "endTime": "HH:MM", "type": string } ] }.`,
            config: {
                // Odstránené explicitné application/json pre zvýšenie kompatibility pri chybách 400
                temperature: 0.7,
            }
        });
        
        const text = response.text || '{"blocks":[]}';
        // Manuálne vyčistenie JSONu z markdownu ak je prítomný
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Day plan generation failed:", e);
        return { blocks: [] };
    }
};

export const getHabitSuggestions = async (query: string) => {
    if (!ensureApiKey()) return { text: "AI kľúč chýba.", sources: [] };

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Navrhni návyky pre: ${query}.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || 'Zdroj',
            uri: chunk.web?.uri || ''
        })).filter((s: any) => s.uri) || [];

        return { text: response.text || "Žiadna odpoveď.", sources };
    } catch (e) {
        console.error("Habit suggestions failed:", e);
        return { text: "AI služba je nedostupná.", sources: [] };
    }
};
