
import { GoogleGenAI, Type } from "@google/genai";
import { 
    SearchResult, AvatarExpression, 
    AvatarGender, AvatarSkin, AvatarHairColor, AvatarHairStyle, 
    AvatarEyeColor, AvatarGlasses, AvatarHeadwear, AvatarTopType, 
    AvatarClothingColor, AvatarBottomType, AvatarShoesType 
} from "./types";
import { ASSET_STORE } from "./gamificationConfig";

// World-class AI client initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPresetAvatarUrl = (
    gender: AvatarGender, skin: AvatarSkin, 
    hairStyle: AvatarHairStyle, hairColor: AvatarHairColor, eyeColor: AvatarEyeColor,
    glasses: AvatarGlasses, headwear: AvatarHeadwear,
    topType: AvatarTopType, topColor: AvatarClothingColor,
    bottomType: AvatarBottomType, bottomColor: AvatarClothingColor,
    shoesType: AvatarShoesType, shoesColor: AvatarClothingColor,
    expression: AvatarExpression = 'happy',
    activeAssetIds: string[] = [] // Nový parameter pre odomknuté veci
): string => {
  
  const genderDesc = gender === 'Male' ? "handsome man" : "beautiful woman";
  const hairDesc = hairStyle === 'Bald' ? "bald head" : `${hairStyle} ${hairColor} hair`;
  const outfitDesc = `wearing a ${topColor} ${topType}, ${bottomColor} ${bottomType}, and ${shoesColor} ${shoesType}`;
  
  // Dynamické pridanie odomknutých assetov do promptu
  const assetModifiers = ASSET_STORE
    .filter(a => activeAssetIds.includes(a.id))
    .map(a => a.promptModifier)
    .join(", ");

  let exprPrompt = "happy face, confident smile, looking at camera";
  if (expression === 'sad') exprPrompt = "sad face, disappointed expression, looking down";
  if (expression === 'sleepy') exprPrompt = "tired face, sleepy eyes, yawning";
  if (expression === 'sleeping') exprPrompt = "sleeping peacefully, eyes closed";

  const prompt = `3D render of a ${genderDesc} with ${hairDesc} and ${eyeColor} eyes, ${outfitDesc}, ${assetModifiers ? assetModifiers + ',' : ''} ${exprPrompt}, ${skin} skin tone, white background, soft lighting, Pixar Disney style, high quality 8k, full body shot, standing pose`;

  const uniqueString = `${gender}-${skin}-${hairStyle}-${hairColor}-${eyeColor}-${glasses}-${headwear}-${topType}-${topColor}-${bottomType}-${bottomColor}-${shoesType}-${shoesColor}-${activeAssetIds.sort().join('')}`;
  
  let seed = 0;
  for (let i = 0; i < uniqueString.length; i++) {
    seed = (uniqueString.charCodeAt(i) + ((seed << 5) - seed));
  }
  seed = Math.abs(seed);
  
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=256&height=512&model=flux`; 
};

// --- Missing Gemini AI Services Implementation ---

/**
 * Generates an ideal daily plan using Gemini 3 Flash.
 */
export const generateIdealDayPlan = async (goals: string[], preferences: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
                                startTime: { type: Type.STRING, description: "Formát HH:mm" },
                                endTime: { type: Type.STRING, description: "Formát HH:mm" },
                                type: { type: Type.STRING, description: "work|rest|habit|exercise|social|health|other" },
                                reason: { type: Type.STRING, description: "Stručné vysvetlenie prečo je tento blok v pláne" }
                            },
                            required: ["title", "startTime", "endTime", "type"]
                        }
                    }
                },
                required: ["blocks"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned empty plan");
    return JSON.parse(text);
};

/**
 * Fetches habit suggestions using Google Search grounding.
 */
export const getHabitSuggestions = async (query: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Aké sú najlepšie návyky pre: ${query}? Odpovedaj v slovenčine.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Webový zdroj',
        uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri) || [];

    return {
        text: response.text || "Nepodarilo sa vygenerovať odporúčania.",
        sources
    };
};

/**
 * Generates a motivational video using Veo 3.1.
 */
export const generateMotivationVideo = async (prompt: string, imageUri: string | null) => {
    // Check for API key selection as per guidelines for Veo models
    if (typeof window !== 'undefined' && window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
    }

    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const request: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'A cinematic visualization of personal growth and achievement',
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    };

    if (imageUri) {
        try {
            const imgResp = await fetch(imageUri);
            const blob = await imgResp.blob();
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });
            request.image = {
                imageBytes: base64Data,
                mimeType: blob.type || 'image/png'
            };
        } catch (e) {
            console.error("Failed to load reference image for video", e);
        }
    }

    let operation = await videoAi.models.generateVideos(request);
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await videoAi.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    return `${downloadLink}&key=${process.env.API_KEY}`;
};
