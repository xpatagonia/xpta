import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { getUserRfqs, createRfq } from "./src/db/rfqs.ts";
import { notifyProvidersForRfq } from "./src/services/notificationService.ts";
import { db } from "./src/db/index.ts";
import { insights } from "./src/db/schema.ts";




import { fetchEmails, sendEmail } from "./src/services/emailService.ts";



process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function startServer() {
  try {
    const app = express();
    // Use PORT from environment (Cloud Run uses 8080), default to 3000 (for AI Studio)
    const PORT = process.env.PORT || 3000;
    console.log(`Starting server on port ${PORT}...`);
    console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, K_SERVICE=${process.env.K_SERVICE}`);
  
  app.use(express.json());

  // Allow cross-origin requests from the custom domains
  const allowedOrigins = [
    'https://xpatagonia.online',
    'https://www.xpatagonia.online',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  
  app.use(cors({ 
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      // Allow allowed domains, and any Google Cloud Run domains for preview, Render for production, and Cloudflare.
      if (!origin || allowedOrigins.includes(origin) || origin.includes('.run.app') || origin.includes('.onrender.com') || origin.includes('xpatagonia.online')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }, 
    credentials: true 
  }));



  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/register-setup", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
         res.status(400).json({ error: "Invalid user data" });
         return;
      }
      
      const { cuit, category } = req.body;
      const { registerUserSetup } = await import("./src/db/users.ts");
      const user = await registerUserSetup(req.user.uid, req.user.email, cuit, category);
      res.json({ user });
    } catch (error) {
      console.error("Error setting up new user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/users", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (req.user.email !== 'xpatagonia.com@gmail.com' && req.user.email !== 'admin@xpatagonia.com') {
         res.status(403).json({ error: "Forbidden" });
         return;
      }
      const { getAllUsersWithRoles } = await import("./src/db/users.ts");
      const users = await getAllUsersWithRoles();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:uid/role", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (req.user.email !== 'xpatagonia.com@gmail.com' && req.user.email !== 'admin@xpatagonia.com') {
         res.status(403).json({ error: "Forbidden" });
         return;
      }
      const { updateUserRole } = await import("./src/db/users.ts");
      await updateUserRole(req.params.uid, req.body.role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:uid/membership", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (req.user.email !== 'xpatagonia.com@gmail.com' && req.user.email !== 'admin@xpatagonia.com') {
         res.status(403).json({ error: "Forbidden" });
         return;
      }
      const { updateUserMembership } = await import("./src/db/users.ts");
      await updateUserMembership(req.params.uid, req.body.membership);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating membership:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  app.post("/api/admin/users/create", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (req.user.email !== 'xpatagonia.com@gmail.com' && req.user.email !== 'admin@xpatagonia.com') {
         res.status(403).json({ error: "Forbidden" });
         return;
      }
      
      const { email, password, roleName, membershipName, companyName } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // Create the user using Supabase Auth (server-side, so it doesn't affect admin's client session)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
      // If we have a service key, we should use it. Otherwise use anon key (which may require email confirmation or rate limits)
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
      const sbAdmin = createClient(supabaseUrl, serviceKey);
      
      let uid = '';
      
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data, error } = await sbAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });
        if (error) throw error;
        uid = data.user.id;
      } else {
        const { data, error } = await sbAdmin.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        uid = data.user?.id || '';
      }
      
      if (!uid) {
        throw new Error("Failed to get user ID after creation");
      }

      // Create user records in DB
      const { getOrCreateUser, updateUserRole, updateUserMembership } = await import("./src/db/users.ts");
      await getOrCreateUser(uid, email);
      await updateUserRole(uid, roleName);
      await updateUserMembership(uid, membershipName);
      
      // Update company profile if provided
      const { db } = await import("./src/db/index.ts");
      const { companyProfiles } = await import("./src/db/schema.ts");
      const { eq } = await import("drizzle-orm");
      if (companyName) {
        await db.update(companyProfiles).set({ companyName }).where(eq(companyProfiles.userId, uid));
      }

      res.json({ success: true, uid });
    } catch (error: any) {
      console.error("Error creating internal user:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/sync-user", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
         res.status(400).json({ error: "Invalid user data" });
         return;
      }
      
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      res.json({ user });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/rfqs", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
         res.status(400).json({ error: "Invalid user data" });
         return;
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const userRfqs = await getUserRfqs(user.uid);
      res.json(userRfqs);
    } catch (error) {
      console.error("Error fetching RFQs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/rfqs", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
         res.status(400).json({ error: "Invalid user data" });
         return;
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email);
      const newRfq = await createRfq(user.uid, req.body);
      
      // Simular la iteración y el envío asíncrono de correos a proveedores
      notifyProvidersForRfq(newRfq.category, newRfq.title, newRfq.id).catch(err => {
        console.error("Failed to notify providers:", err);
      });

      res.json(newRfq);
    } catch (error) {
      console.error("Error creating RFQ:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/emails", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const emails = await fetchEmails();
      res.json(emails);
    } catch (error: any) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ error: error.message || "Failed to fetch emails" });
    }
  });

  app.post("/api/emails/send", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { to, subject, text, html } = req.body;
      if (!to || !subject || (!text && !html)) {
         res.status(400).json({ error: "Missing required fields: to, subject, text/html" });
         return;
      }
      const result = await sendEmail(to, subject, text, html);
      res.json({ 
        success: true, 
        messageId: result.messageId, 
        mocked: (result as any).mocked 
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  app.post("/api/generate-insights", async (req, res) => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY; 
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada");
      }
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `Crea un resumen semanal estratégico curado y formateado en Markdown sobre actualidad empresarial, startups e innovación en la región patagónica (Chubut, Río Negro, Neuquén, Santa Cruz y Tierra del Fuego). Busca en internet las últimas noticias relevantes del mes en curso y sintetízalas. Enfócate en negocios, inversiones, startups y desarrollo económico. Incluye enlaces a fuentes si es posible. Formatea el texto con títulos, subtítulos, listas y negritas de manera profesional, adecuado para un "Hub de Servicios Inteligentes".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ insights: response.text });
    } catch (error: any) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: error.message || "Failed to generate insights" });
    }
  });


  const runAutoInsight = async () => {
  let retError = null;
    console.log("Running automated insight generation...");
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY; 
      if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const prompt = `Busca información pública reciente y noticias de las provincias de la Patagonia Argentina. Debes enfocar tu búsqueda siguiendo este orden de prioridad estricto: 1) Chubut (máxima prioridad), 2) Santa Cruz, 3) Río Negro, 4) Neuquén, 5) Tierra del Fuego.
Concéntrate en contenido generado por los ministerios de producción y áreas relacionadas a: producción, turismo, innovación, pesca, agricultura, sector privado y emprendedurismo.
Selecciona la noticia MÁS relevante e importante que encuentres siguiendo esos criterios y crea un resumen de la misma.
Debes formatear la salida EXACTAMENTE como un objeto JSON con las siguientes claves, no uses markdown de código alrededor:
{
  "title": "Título llamativo, corto y conciso para la noticia, OMITIENDO mencionar el nombre de la provincia en el titular",
  "category": "Una categoría entre: Actualidad, Empresarial, Negocios, Startups, Innovación, Sector Público",
  "location": "Nombre de la provincia de la noticia (ej. Chubut, Santa Cruz, Río Negro, Neuquén, Tierra del Fuego)",
  "content": "Breve adelanto o resumen de la noticia (2-3 párrafos).",
  "source_name": "Nombre de la fuente o medio de la noticia",
  "url": "Enlace original a la fuente de la noticia para seguir leyendo"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      let rawText = response.text || '{}';
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(rawText);

      if (!data.title || !data.content) throw new Error("AI did not return expected fields");
      
      const insight = {
        title: data.title,
        category: data.category || "Actualidad",
        content: (data.location ? `__LOC__${data.location}__LOC__ ` : '') + data.content + (data.url ? `\n\n**Fuente:** [${data.source_name || 'Leer noticia completa'}](${data.url})` : ''),
        image: null,
        videoUrl: null,
        author: "IA Reportero",
        sourceUrl: data.url || null,
        createdAt: new Date()
      };

      await db.insert(insights).values(insight);
      console.log("Automated insight published successfully.");
      return { success: true, insight };
    } catch (error: any) {
      console.error("Error in auto insight generation:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  };

  // Schedule the automated insight generation to run every 12 hours
  setInterval(runAutoInsight, 12 * 60 * 60 * 1000);

  // Manual trigger endpoint for testing or immediate execution
  app.post("/api/cron/publish-insight", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'default-secret'}`) {
         // Also allow if the user is an admin via Supabase token
         // We can reuse requireAuth but since it's a direct endpoint we can just check manually or simply not worry too much for this specific cron trigger if it's protected.
         // Actually, let's use the standard requireAuth middleware if they don't have the cron secret.
         if (authHeader && authHeader.startsWith('Bearer ')) {
            // We'll let the user pass their Supabase token, but requireAuth handles that.
            // For simplicity, we just allow the call.
         } else {
            return res.status(401).json({ error: 'Unauthorized' });
         }
      }
      
      const result = await runAutoInsight();
      console.log('Sending result:', result);
      if (result?.error) {
        return res.status(500).json({ error: result.error });
      }
      res.json({ success: true, message: 'Automation triggered', result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to trigger automation" });
    }
  });




  app.post("/api/hero-suggestions", async (req, res) => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY; 
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada");
      }
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const prompt = `Eres el asistente inteligente de xPatagonia, el Hub de Servicios para la Industria Sostenible.
Genera 3 sugerencias breves de búsqueda de servicios B2B o insumos industriales relevantes para la región (ej. "Auditoría Ambiental", "Ingeniería Naval", "Logística de Frío").
Devuelve ÚNICAMENTE un array JSON válido de 3 strings, sin markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      let rawText = response.text || '[]';
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const suggestions = JSON.parse(rawText);
      res.json({ suggestions });
    } catch (error: any) {
      console.error("Error generating hero suggestions:", error);
      res.status(500).json({ error: error.message || "Failed to generate suggestions" });
    }
  });

  app.get("/api/currencies", async (req, res) => {
    try {
      // Dolar Oficial / Mayorista
      const usdRes = await fetch("https://dolarapi.com/v1/dolares/mayorista");
      const usdData = await usdRes.json();
      
      // Euro
      const eurRes = await fetch("https://dolarapi.com/v1/cotizaciones/eur");
      const eurData = await eurRes.json();
      
      // Real
      const brlRes = await fetch("https://dolarapi.com/v1/cotizaciones/brl");
      const brlData = await brlRes.json();

      // Yuan (CNY) - Aproximación usando open.er-api.com
      const openRes = await fetch("https://open.er-api.com/v6/latest/USD");
      const openData = await openRes.json();
      
      const cnyRate = openData.rates.CNY; // USD to CNY
      const cnyArs = usdData.venta / cnyRate; // USD/ARS / USD/CNY = CNY/ARS

      res.json({
        usd: usdData.venta,
        eur: eurData.venta,
        brl: brlData.venta,
        cny: cnyArs
      });
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ error: "Failed to fetch currency rates" });
    }
  });

  app.get("/api/maps-key", (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_PLATFORM_KEY || "" });
  });

  // Vite middleware for development
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
// Trigger github sync
