import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createApiApp } from "./src/server/createApp.ts";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

async function startServer() {
  try {
    const PORT = process.env.PORT || 3000;
    console.log(`Starting server on port ${PORT}...`);
    console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, K_SERVICE=${process.env.K_SERVICE}`);

    const { app, runAutoInsight } = createApiApp();

    // Background cron in long-running Node server (Cloud Run / Proxmox)
    setInterval(runAutoInsight, 12 * 60 * 60 * 1000);

    // Vite middleware for development or static SPA in Node production
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Fatal error starting server:", error);
    process.exit(1);
  }
}

startServer();
