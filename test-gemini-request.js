import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    console.log("URL:", url);
    console.log("Headers:", options.headers);
    return originalFetch(url, options);
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
    });
  } catch (err) {
  }
}
main();
