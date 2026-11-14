import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "http";
import { createApiApp } from "./createApp.ts";

let cachedApp: ReturnType<typeof createApiApp>["app"] | null = null;

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!cachedApp) {
      cachedApp = createApiApp().app;
    }
    return cachedApp(req as any, res as any);
  } catch (err: any) {
    console.error("Vercel API initialization error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Serverless function initialization failed",
        message: err?.message || String(err),
      })
    );
  }
}
