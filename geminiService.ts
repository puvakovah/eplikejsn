
import { GoogleGenAI, Type } from "@google/genai";
import { 
    SearchResult, AvatarExpression, 
    AvatarGender, AvatarSkin, AvatarHairColor, AvatarHairStyle, 
    AvatarEyeColor, AvatarGlasses, AvatarHeadwear, AvatarTopType, 
    AvatarClothingColor, AvatarBottomType, AvatarShoesType 
} from "./types";
import { CATEGORY_UNLOCKS } from "./gamificationConfig";

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
    expression: AvatarExpression = 'happy',
    activeAssetIds: string[] = []
): Promise<string> => {
  
  const genderDesc = gender === 'Male' ? "handsome man" : "beautiful woman";
  const hairDesc = (level >= CATEGORY_UNLOCKS.CLOTHING && hairStyle !== 'Bald') ? `${hairStyle} ${hairColor} hair` : "short basic hair";
  
  const clothingDesc = level >= CATEGORY_UNLOCKS.CLOTHING 
    ? `wearing a ${topColor} ${topType} and ${bottomColor} ${bottomType}` 
    : "wearing a simple basic gray t-shirt and dark pants";

  const shoesDesc = level >= CATEGORY_UNLOCKS.SHOES ? `with ${shoesColor} ${shoesType}` : "standing barefoot";
  const glassesDesc = (level >= CATEGORY_UNLOCKS.GLASSES && glasses !== 'None') ? `wearing ${glasses} glasses` : "";
  const headDesc = (level >= CATEGORY_UNLOCKS.HEADWEAR && headwear !== 'None') ? `wearing a ${headwear}` : "";

  let exprPrompt = "happy confident smile, looking at camera";
  if (expression === 'sad') exprPrompt = "unhappy face, disappointed expression";
  if (expression === 'sleepy') exprPrompt = "yawning face, very tired eyes";
  if (expression === 'sleeping') exprPrompt = "sleeping peacefully, eyes closed";

  const prompt = `3D digital render of a ${genderDesc} character with ${skin} skin, ${hairDesc}, ${clothingDesc}, ${shoesDesc}, ${glassesDesc}, ${headDesc}, ${exprPrompt}, pure white background, cinematic lighting, 8k high resolution, Pixar animation style character design, full body shot, centered.`;

  const uniqueString = `${level}-${gender}-${skin}-${hairStyle}-${hairColor}-${eyeColor}-${glasses}-${headwear}-${topType}-${topColor}-${bottomType}-${bottomColor}-${shoesType}-${shoesColor}-${expression}`;
  
  let seed = 0;
  for (let i = 0; i < uniqueString.length; i++) {
    seed = (uniqueString.charCodeAt(i) + ((seed << 5) - seed));
  }
  seed = Math.abs(seed);
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { seed: seed, imageConfig: { aspectRatio: "1:1" } }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (err) {
    console.warn("AI generation error, using fallback provider", err);
  }

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=512&height=512&model=flux`; 
};

export const generateIdealDayPlan = async (goals: string[], preferences: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Navrhni ideálny denný plán založený na cieľoch: ${goals.join(', ')}. Preferencie užívateľa: ${preferences}. Odpovedaj v slovenčine.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    blocks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                startTime: { type: Type.STRING },
                                endTime: { type: Type.STRING },
                                type: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ["title", "startTime", "endTime", "type"]
                        }
                    }
                },
                required: ["blocks"]
            }
        }
    });
    return JSON.parse(response.text || '{"blocks":[]}');
};

export const getHabitSuggestions = async (query: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Aké sú najlepšie návyky pre: ${query}? Odpovedaj v slovenčine.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Zdroj',
        uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri) || [];

    return { text: response.text || "Chyba.", sources };
};
