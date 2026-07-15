import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  options.headers = options.headers || new Headers();
  let apiKey = '';
  if (options.headers instanceof Headers) {
    apiKey = options.headers.get('x-goog-api-key');
    if (apiKey) {
      options.headers.delete('x-goog-api-key');
      options.headers.set('Authorization', `Bearer ${apiKey}`);
    }
    options.headers.set('user-agent', 'aistudio-build');
  }
  console.log(options.headers);
  return originalFetch(url, options);
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
