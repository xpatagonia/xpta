import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log("URL:", url);
  console.log("Headers before:");
  if (options.headers instanceof Headers) {
    for (let [k,v] of options.headers.entries()) console.log(k, v);
  } else {
    console.log(options.headers);
  }
  
  if (options.headers instanceof Headers) {
    options.headers.set('User-Agent', 'aistudio-build');
    options.headers.set('user-agent', 'aistudio-build');
  }
  
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
