
import { GoogleGenAI, Type } from "@google/genai";
import { InstrumentType, Recording, Tutorial } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log("ENV CHECK:", API_KEY);

if (!API_KEY) {
  alert("Gemini API key is missing!");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

const getInstrumentNotes = (type: InstrumentType): string[] => {
  switch (type) {
    case InstrumentType.PIANO: return ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C#4', 'D#4', 'F#4', 'G#4', 'A#4'];
    case InstrumentType.DRUMS: return ['kick', 'snare', 'hihat'];
    case InstrumentType.VIOLIN: return ['G4', 'D4', 'A4', 'E5'];
    case InstrumentType.HARP: return ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
    case InstrumentType.CHIMES: return ['C5', 'E5', 'G5', 'B5', 'D5', 'F5', 'A5'];
    default: return [];
  }
};

export const getTutorResponse = async (userPrompt: string, currentInstrument: InstrumentType) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: `You are Maestro Spark, a friendly, encouraging, and highly knowledgeable music tutor. 
        The student is currently playing the ${currentInstrument}. 
        Provide short, inspiring tips on how to play better, theory bits, or fun facts. 
        If the student asks to learn a song, tell them to use the "Song Academy" panel!
        Keep responses under 3 sentences unless asked for complex theory. 
        Use musical emojis! 🎵🎹🎻`,
      },
    });
    return response.text || "I'm momentarily lost in thought! Let's keep practicing.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the musical heavens right now. Let's keep playing!";
  }
};

export const generateTutorial = async (instrument: InstrumentType, songName?: string, genre: string = 'Classical'): Promise<Tutorial> => {
  const availableNotes = getInstrumentNotes(instrument).join(', ');
  const prompt = songName 
    ? `Generate a tutorial for the song "${songName}" in a ${genre} style played on the ${instrument}. 
       Adapt the melody or rhythm to fit the ${genre} genre (e.g., Jazz might have more swing or blue notes, Rock might be more driving).
       Translate the melody into a sequence of notes. 
       Use ONLY these exact note names: ${availableNotes}. 
       Include enough notes to make the main melody recognizable (up to 32 notes).`
    : `Generate a beginner 5-8 note melody tutorial for the ${instrument} in the style of ${genre} music. 
       Use ONLY these exact note names: ${availableNotes}. 
       Give the melody a fun name.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The song title or melody name" },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  note: { type: Type.STRING, description: "The note to play" },
                  label: { type: Type.STRING, description: "Short descriptive instruction" }
                },
                required: ["note"]
              }
            }
          },
          required: ["title", "steps"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Tutorial Generation Error:", error);
    return {
      title: songName || "Simple Scale",
      steps: getInstrumentNotes(instrument).slice(0, 5).map(n => ({ note: n }))
    };
  }
};

export const reviewRecording = async (recording: Recording) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The student just recorded a performance on the ${recording.instrument}. 
      They played these notes: ${recording.notes.map(n => n.note).join(', ')}.
      Analyze this loosely (it's a learner) and provide a 'Maestro's Appreciation' badge description and a 2-sentence feedback.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            badgeName: { type: Type.STRING },
            feedback: { type: Type.STRING },
            starRating: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { badgeName: "Rising Star", feedback: "Wonderful performance! Your dedication to music is inspiring.", starRating: 5 };
  }
};
