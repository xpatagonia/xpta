import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: "Hello",
    });
    console.log(interaction.output_text);
  } catch (err) {
    console.error(err.message || err);
  }
}
main();
