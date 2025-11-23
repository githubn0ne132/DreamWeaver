
import { GoogleGenAI, Type } from "@google/genai";
import { StoryStructure, StoryPage } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a short story idea based on character, theme, and age.
 */
export const generateStoryIdea = async (character: string, theme: string, age: number): Promise<string> => {
  const ai = getAIClient();
  
  const charStr = character ? `mettant en scène "${character}"` : "avec un personnage animal mignon";
  const themeStr = theme ? `sur le thème "${theme}"` : "";
  
  const prompt = `Donne-moi une seule phrase simple et créative résumant une idée d'histoire pour enfant de ${age} ans ${charStr} ${themeStr}. 
  Réponds uniquement par la phrase en Français, sans guillemets, sans titre.
  Exemple: "Une petite tortue veut apprendre à voler comme les oiseaux."`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (e) {
    console.error("Error getting idea", e);
    return "Une grande aventure pour trouver un trésor caché au fond du jardin.";
  }
};

/**
 * Generates the story structure (text and image prompts) using Gemini Flash.
 */
export const generateStory = async (
  character: string,
  premise: string,
  style: string,
  pageCount: number,
  age: number
): Promise<StoryStructure> => {
  const ai = getAIClient();

  const prompt = `
    Écris une courte histoire illustrée pour enfants (${pageCount} pages) en FRANÇAIS, adaptée à un enfant de ${age} ans.
    
    Inputs:
    - Personnage principal: ${character}
    - Sujet de l'histoire: ${premise}
    - Inspiration artistique: ${style}
    - Âge cible: ${age} ans

    Instructions:
    1. Crée un titre accrocheur en Français.
    2. Divise l'histoire en exactement ${pageCount} pages.
    3. Pour chaque page, écris le texte de l'histoire en FRANÇAIS. 
       - Adopte un vrai style narratif de livre de conte.
       - UTILISE DES SAUTS DE LIGNE (\n) pour séparer les paragraphes, aérer le texte et détacher les dialogues.
       - La complexité doit être adaptée :
       - 1-3 ans : Très simple, répétitif, rythmé, phrases courtes.
       - 4-6 ans : Phrases simples, action claire, petits dialogues.
       - 7-10 ans : Langage plus descriptif, paragraphes plus construits, vocabulaire riche.
    4. Pour chaque page, rédige un "imagePrompt" en ANGLAIS pour l'IA génératrice d'images.
       IMPORTANT pour l'imagePrompt: 
       - Décris la scène visuellement en détail.
       - Inclus la description physique du personnage principal (${character}) dans CHAQUE prompt pour assurer la cohérence.
       - Spécifie le style inspiré par : "${style}".
       - AJOUTE les contraintes suivantes : "no text, no words, accurate anatomy, no human hands on animals".

    Format de sortie JSON uniquement.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                },
                required: ['pageNumber', 'text', 'imagePrompt']
              }
            }
          },
          required: ['title', 'pages']
        }
      }
    });

    if (!response) {
      throw new Error("No response received from Gemini");
    }

    // Safely access text.
    let text: string | undefined;
    try {
      text = response.text;
    } catch (e) {
      console.warn("Could not access response.text directly:", e);
    }

    // Fallback: Check structure manually
    if (!text && response.candidates && response.candidates.length > 0) {
       const firstCandidate = response.candidates[0];
       if (firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.length > 0) {
          text = firstCandidate.content.parts[0].text;
       }
    }

    if (!text) {
      throw new Error("No text returned from Gemini. The content might have been blocked for safety reasons.");
    }

    // Sanitize JSON (remove markdown code blocks if present)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText) as StoryStructure;
    
    if (!data.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
      throw new Error("Story generation failed: No pages returned from AI.");
    }

    return data;

  } catch (error) {
    console.error("Error generating story structure:", error);
    throw error;
  }
};

/**
 * Generates an illustration for a specific page.
 * Supports Gemini 2.5 Flash Image, Gemini 3 Pro Image, and Imagen models.
 */
export const generatePageImage = async (
  imagePrompt: string,
  modelName: string = 'gemini-2.5-flash-image'
): Promise<string> => {
  const ai = getAIClient();
  
  // Enhanced prompt with specific negative constraints requested by user
  const enhancedPrompt = `${imagePrompt}. High quality, detailed, masterpiece. Exclude: text, words, signature, watermark, frame, border, humans, human hands, extra limbs, unnatural poses. Ensure anatomical correctness.`;

  try {
    // Handle Imagen Models
    if (modelName.includes('imagen')) {
      const response = await ai.models.generateImages({
        model: modelName,
        prompt: enhancedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64EncodeString) {
        return `data:image/jpeg;base64,${base64EncodeString}`;
      }
      throw new Error("No image data found in Imagen response.");
    } 
    // Handle Gemini Models
    else {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { text: enhancedPrompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1'
          }
        }
      });

      if (!response || !response.candidates || response.candidates.length === 0) {
          throw new Error("No response or candidates from Gemini Image model");
      }

      // Safely check for content parts
      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
          throw new Error("No content parts in image response.");
      }

      let textRefusal = '';

      // Iterate through parts to find the image
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        // Capture text responses which usually indicate a refusal or error description
        if (part.text) {
          textRefusal += part.text;
        }
      }

      if (textRefusal) {
        throw new Error(`Gemini refused to generate image: ${textRefusal}`);
      }

      throw new Error("No image data found in response.");
    }

  } catch (error) {
    console.error("Error generating image:", error);
    // Return a placeholder if generation fails to allow the book to still function
    return `https://picsum.photos/800/800?random=${Math.random()}`;
  }
};
