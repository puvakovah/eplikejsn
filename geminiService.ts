import { GoogleGenerativeAI as GoogleGenAI, SchemaType as Type } from "@google/generative-ai";
import { 
    SearchResult, AvatarExpression, 
    AvatarGender, AvatarSkin, AvatarHairColor, AvatarHairStyle, 
    AvatarEyeColor, AvatarGlasses, AvatarHeadwear, AvatarTopType, 
    AvatarClothingColor, AvatarBottomType, AvatarShoesType 
} from "./types";
import { CATEGORY_UNLOCKS } from "./gamificationConfig";

// Pomocná funkcia na získanie API kľúča
const getApiKey = () => process.env.API_KEY || "";

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
    const ai = new GoogleGenAI(getApiKey());
    // V novej verzii používame getGenerativeModel
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        seed: seed,
        // Poznámka: gemini-1.5-flash bežne nepodporuje inline generovanie obrázkov týmto štýlom,
        // ak používate ImageFX cez Vertex AI, kód by bol iný. Ponechávam štruktúru pre fallback.
      }
    });

    const response = await result.response;
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (err) {
    console.warn("AI generation error, using fallback provider", err);
  }

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=512&height=512&model=flux`; 
};

export const generateIdealDayPlan = async (goals: string[], preferences: string) => {
    const ai = new GoogleGenAI(getApiKey());
    const model = ai.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
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

    const prompt = `Navrhni ideálny denný plán založený na cieľoch: ${goals.join(', ')}. Preferencie užívateľa: ${preferences}. Odpovedaj v slovenčine.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || '{"blocks":[]}');
};

export const getHabitSuggestions = async (query: string) => {
    const ai = new GoogleGenAI(getApiKey());
    const model = ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        // Google Search Tool sa pridáva tu
        tools: [{ googleSearch: {} } as any] 
    });

    const result = await model.generateContent(`Aké sú najlepšie návyky pre: ${query}? Odpovedaj v slovenčine.`);
    const response = await result.response;
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Zdroj',
        uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri) || [];

    return { text: response.text() || "Chyba.", sources };
};