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
    return originalFetch(url, options);
  };

  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: "Hello",
    });
  } catch (err) {
    console.log(err.message);
  }
}
main();
