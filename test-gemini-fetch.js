import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  const newOptions = { ...options };
  if (newOptions.headers) {
    // Override whatever the SDK set
    if (newOptions.headers instanceof Headers) {
      newOptions.headers.set('user-agent', 'aistudio-build');
    } else {
      newOptions.headers['user-agent'] = 'aistudio-build';
    }
  }
  return originalFetch(url, newOptions);
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello",
    });
    console.log(response.text);
  } catch (err) {
    console.error(err.message || err);
  }
}
main();
