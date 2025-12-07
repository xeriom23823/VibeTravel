import { GoogleGenAI, Type } from "@google/genai";
import { User, Photo, Poll, Award, MemoryChallenge, UserStats } from "../types";

// Helper to get AI instance (handles Key selection for Veo/Pro models if needed)
const getAI = async (requirePaidKey: boolean = false) => {
  if (requirePaidKey) {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        throw new Error("API_KEY_MISSING");
      }
    }
  }
  // We assume the environment variable or the injected key is available
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateAwards = async (
  users: User[],
  photos: Photo[],
  polls: Poll[],
  stats?: Record<string, UserStats>
): Promise<Award[]> => {
  const ai = await getAI();
  
  // Format stats for the prompt
  let statsSummary = "";
  if (stats) {
    statsSummary = "User Statistics:\n" + users.map(u => {
      const s = stats[u.id];
      if (!s) return `${u.name}: No data`;
      return `${u.name} -> Edits: ${s.editItinerary}, Views: ${s.viewItinerary}, App Opens: ${s.openGroup}, Photos: ${s.photos}, Votes: ${s.votes}`;
    }).join('\n');
  }

  // Construct a narrative of the trip for the AI to analyze
  const tripSummary = `
    Users: ${users.map(u => u.name).join(', ')}.
    Photos taken: ${photos.length}.
    Polls created: ${polls.length}.
    Poll content: ${polls.map(p => p.question).join('; ')}.
    ${statsSummary}
  `;

  const prompt = `
    Based on the provided trip data and user statistics, create 3 fun and distinct awards.
    
    CRITICAL: You MUST use the "User Statistics" numbers to determine the winners logically.
    1. Look for the user with the most 'Edits' or 'Views' to give an award like "The Planner" or "The micromanager".
    2. Look for the user with the most 'Photos' for "Paparazzi" or similar.
    3. Look for the user with the most 'App Opens' or 'Votes' for "Most Excited" or "The Decider".
    
    If statistics are tied or 0, be creative based on the general vibe.
    Return JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${tripSummary}\n${prompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            winnerName: { type: Type.STRING, description: "Must be one of the provided User names" },
            reason: { type: Type.STRING },
            icon: { type: Type.STRING, description: "A single emoji representing the award" }
          }
        }
      }
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text) as Award[];
    } catch (e) {
      console.error("Failed to parse awards", e);
      return [];
    }
  }
  return [];
};

export const generateRecapVideo = async (
  prompt: string,
  imageBytes?: string
): Promise<{ videoUri: string | undefined }> => {
  const ai = await getAI(true); // Requires paid key check

  let operation;
  
  try {
    if (imageBytes) {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "A cinematic travel montage of a beautiful journey.",
        image: {
          imageBytes: imageBytes,
          mimeType: 'image/jpeg', // Assuming JPEG for simplicity in this demo
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    } else {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "A cinematic travel montage of a beautiful journey.",
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    }

    // Polling logic
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    // In a real app, we would fetch this blob. 
    // For this demo, we return the URI + key param to be used in a video tag or fetch
    return { videoUri: downloadLink ? `${downloadLink}&key=${process.env.API_KEY}` : undefined };

  } catch (error: any) {
    console.error("Video gen error", error);
    throw error;
  }
};

export const createMemoryChallenge = async (
  originalImageBase64: string
): Promise<MemoryChallenge | null> => {
  const ai = await getAI();

  // 1. Edit the image to create a difference
  const editPrompt = "Add a colorful parrot sitting somewhere in this scene naturally.";
  
  const editResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: originalImageBase64,
            mimeType: 'image/jpeg'
          }
        },
        { text: editPrompt }
      ]
    }
  });

  // Extract generated image
  let alteredImageBase64 = '';
  for (const part of editResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      alteredImageBase64 = part.inlineData.data;
      break;
    }
  }

  if (!alteredImageBase64) return null;

  // 2. Generate quiz options
  const quizResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `I edited a photo to: ${editPrompt}. Generate a JSON object for a quiz.
    {
      "question": "What changed in the photo?",
      "options": ["wrong answer 1", "wrong answer 2", "correct answer"],
      "correctAnswer": "correct answer"
    }`,
    config: { responseMimeType: "application/json" }
  });

  try {
    const quizData = JSON.parse(quizResponse.text || "{}");
    return {
      originalImage: originalImageBase64,
      alteredImage: alteredImageBase64,
      diffDescription: editPrompt,
      options: quizData.options,
      correctAnswer: quizData.correctAnswer
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const findPlaceFromQuery = async (query: string): Promise<string | null> => {
  const ai = await getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the precise location for: "${query}". Return ONLY the Name and Address in a single line. Do not add any conversational text.`,
      config: {
        tools: [{googleMaps: {}}],
      },
    });
    return response.text ? response.text.trim() : null;
  } catch (e) {
    console.error("Map search failed", e);
    return null;
  }
};