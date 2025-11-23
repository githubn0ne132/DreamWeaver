import { StoryStructure } from "../types";
import { predefinedCharacterSignatures } from "./characterLibrary";

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_OPENAI_API_KEY est requis dans les variables d'environnement.");
  }

  return apiKey;
};

const getBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1";
  return baseUrl.replace(/\/$/, "");
};

const openAIRequest = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${getBaseUrl()}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Requête OpenAI échouée (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * Builds a reusable visual signature for the main character so the model can
 * reuse the same colors, outfit, and accessories across all illustrations.
 *
 * - If the character is predefined, we return a curated signature string.
 * - Otherwise, we ask the language model to synthesize a concise, repeatable
 *   description that can be injected into every image prompt.
 */
export const buildCharacterSignature = async (
  character: string,
  style: string,
  modelName: string = "gpt-4o-mini"
): Promise<string> => {
  const trimmed = character.trim();

  if (!trimmed) return "";

  const predefinedSignature = predefinedCharacterSignatures[trimmed];
  if (predefinedSignature) return predefinedSignature;

  const prompt = `Create one concise, repeatable visual identity for the children's book character named "${trimmed}". Return a single sentence in English (max 60 words) that includes: species or type, dominant colors, fixed clothing and accessories, one unique prop, and an expression or posture. Note that the design must stay identical in every illustration. Keep it compatible with the ${style} art inspiration.`;

  try {
    const response = await openAIRequest<{ choices: { message?: { content?: string } }[] }>("chat/completions", {
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "You craft short, factual character sheets. Return only one sentence describing a consistent visual design to be reused across multiple images."
        },
        { role: "user", content: prompt }
      ]
    });

    return response.choices?.[0]?.message?.content?.trim() || `${trimmed} keeps the same outfit, colors, and accessories in every scene.`;
  } catch (e) {
    console.error("Error building character signature", e);
    return `${trimmed} keeps the same outfit, colors, and accessories in every scene.`;
  }
};

/**
 * Generates a short story idea based on character, theme, and age.
 */
export const generateStoryIdea = async (
  character: string,
  theme: string,
  age: number,
  modelName: string = "gpt-4o-mini"
): Promise<string> => {
  const charStr = character ? `mettant en scène "${character}"` : "avec un personnage animal mignon";
  const themeStr = theme ? `sur le thème "${theme}"` : "";

  const prompt = `Donne-moi une seule phrase simple et créative résumant une idée d'histoire pour enfant de ${age} ans ${charStr} ${themeStr}.
  Réponds uniquement par la phrase en Français, sans guillemets, sans titre.
  Exemple: "Une petite tortue veut apprendre à voler comme les oiseaux."`;

  try {
    const response = await openAIRequest<{ choices: { message?: { content?: string } }[] }>(
      "chat/completions",
      {
        model: modelName,
        messages: [{ role: "user", content: prompt }]
      }
    );

    const idea = response.choices?.[0]?.message?.content?.trim();
    if (idea) return idea;

    return "Une grande aventure pour trouver un trésor caché au fond du jardin.";
  } catch (e) {
    console.error("Error getting idea", e);
    return "Une grande aventure pour trouver un trésor caché au fond du jardin.";
  }
};

/**
 * Generates the story structure (text and image prompts) using OpenAI.
 */
export const generateStory = async (
  character: string,
  premise: string,
  style: string,
  pageCount: number,
  age: number,
  modelName: string = "gpt-4o-mini",
  characterSignature?: string
): Promise<StoryStructure> => {
  const prompt = `
    Écris une courte histoire illustrée pour enfants (${pageCount} pages) en FRANÇAIS, adaptée à un enfant de ${age} ans.

    Inputs:
    - Personnage principal: ${character}
    - Sujet de l'histoire: ${premise}
    - Inspiration artistique: ${style}
    - Âge cible: ${age} ans
    - Profil visuel constant à respecter dans les prompts d'image: ${characterSignature || character}

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
       - Réutilise exactement le profil visuel fourni (${characterSignature || "profil du personnage"}) pour que le personnage reste identique d'une page à l'autre et entre les livres.
       - Spécifie le style inspiré par : "${style}".
       - AJOUTE les contraintes suivantes : "no text, no words, accurate anatomy, no human hands on animals".

    Format de sortie JSON uniquement.
  `;

  try {
    const response = await openAIRequest<{ choices: { message?: { content?: string } }[] }>("chat/completions", {
      model: modelName,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu es un auteur de livres pour enfants. Retourne uniquement un JSON avec 'title' et une liste 'pages' contenant 'pageNumber', 'text' et 'imagePrompt'."
        },
        { role: "user", content: prompt }
      ]
    });

    const text = response.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("No text returned from OpenAI.");
    }

    const data = JSON.parse(text) as StoryStructure;

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
 * Uses OpenAI image generation models.
 */
export const generatePageImage = async (
  imagePrompt: string,
  modelName: string = "gpt-image-1"
): Promise<string> => {
  const enhancedPrompt = `${imagePrompt}. High quality, detailed, masterpiece. Exclude: text, words, signature, watermark, frame, border, humans, human hands, extra limbs, unnatural poses. Ensure anatomical correctness.`;

  try {
    const response = await openAIRequest<{ data: { b64_json?: string; url?: string }[] }>("images/generations", {
      model: modelName,
      prompt: enhancedPrompt,
      size: "1024x1024",
      n: 1,
      response_format: "b64_json"
    });

    const { b64_json: base64, url } = response.data?.[0] || {};

    if (base64) return `data:image/png;base64,${base64}`;
    if (url) return url;

    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Error generating image:", error);
    // Return a placeholder if generation fails to allow the book to still function
    return `https://picsum.photos/800/800?random=${Math.random()}`;
  }
};
