import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async ask(prompt: string, context?: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemInstruction = `You are a professional financial assistant for a modern ledger application. 
    Help the user with accounting questions, transaction categorization, and financial analysis. 
    Be concise, technical but accessible, and maintain a professional tone.
    ${context ? `Current Context: ${context}` : ''}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async streamAsk(prompt: string, onChunk: (text: string) => void, context?: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemInstruction = `You are a professional financial assistant for a modern ledger application. 
    Help the user with accounting questions, transaction categorization, and financial analysis. 
    Be concise, technical but accessible, and maintain a professional tone.
    ${context ? `Current Context: ${context}` : ''}`;

    try {
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      let fullText = "";
      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk(fullText);
        }
      }
      return fullText;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
};
