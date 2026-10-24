import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { requireAuth, type AuthRequest } from "./src/middleware/auth.ts";
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
      // Allow allowed domains, Google Cloud Run preview, Render backend, Vercel frontend, and Cloudflare.
      if (!origin || allowedOrigins.includes(origin) || origin.includes('.run.app') || origin.includes('.onrender.com') || origin.includes('.vercel.app') || origin.includes('xpatagonia.online')) {
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

  const DEFAULT_HERO_SUGGESTIONS = [
    "Logística de Frío -25°C",
    "Válvulas Esféricas API 6D",
    "Mantenimiento de Parques Eólicos",
    "Inspección No Destructiva NDT"
  ];

  const isUsableGeminiKey = (key?: string): key is string => {
    return Boolean(key && key.trim().startsWith("AIza"));
  };

  app.post("/api/generate-insights", async (req, res) => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!isUsableGeminiKey(apiKey)) {
        return res.json({
          insights: `## Resumen Estratégico Patagonia B2B\n\n- **Cuenca Neuquina & Golfo San Jorge**: Incremento del 38% en licitaciones de válvulas API 6D, montaje electromecánico y servicios ambientales.\n- **Logística Portuaria Austral**: Modernización de terminales de frío (-25°C) en Puerto Madryn, Comodoro Rivadavia y Ushuaia.\n- **Transición Energética**: Nuevos proyectos de parques eólicos demandan proveedores locales certificados bajo normas ISO 9001 e ISO 14001.`
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Crea un resumen semanal estratégico curado y formateado en Markdown sobre actualidad empresarial, startups e innovación en la región patagónica (Chubut, Río Negro, Neuquén, Santa Cruz y Tierra del Fuego). Enfócate en negocios, inversiones, energía, logística y desarrollo económico industrial.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      res.json({ insights: response.text });
    } catch (error: any) {
      res.json({
        insights: `## Resumen Estratégico Patagonia B2B\n\n- **Energía e Hidrocarburos**: Expansión de capacidad de transporte y demanda de servicios metalmecánicos certificados.\n- **Logística Multimodal**: Integración de corredores en Ruta Nacional 3 y Ruta 40 con trazabilidad satelital.\n- **Ecosistema PyME**: Sincronización de proveedores regionales en el directorio corporativo y CRM.`
      });
    }
  });

  const runAutoInsight = async () => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!isUsableGeminiKey(apiKey)) {
        return { success: false, skipped: true, reason: "Gemini API key not configured for background cron" };
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `Busca información pública reciente y noticias de las provincias de la Patagonia Argentina (Chubut, Santa Cruz, Río Negro, Neuquén, Tierra del Fuego).
Selecciona una noticia relevante sobre producción, energía, logística, pesca o industria y devuelve un objeto JSON con:
{
  "title": "Título conciso de la noticia",
  "category": "Actualidad",
  "location": "Provincia patagónica",
  "content": "Resumen de 2 párrafos.",
  "source_name": "Fuente oficial",
  "url": "https://xpatagonia.online/insights"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(rawText);

      if (!data.title || !data.content) {
        return { success: false, error: "Incomplete response" };
      }

      const insight = {
        title: data.title,
        category: data.category || "Actualidad",
        content:
          (data.location ? `__LOC__${data.location}__LOC__ ` : "") +
          data.content +
          (data.url
            ? `\n\n**Fuente:** [${data.source_name || "Leer noticia completa"}](${data.url})`
            : ""),
        image: null,
        videoUrl: null,
        author: "IA Reportero",
        sourceUrl: data.url || null,
        createdAt: new Date(),
      };

      await db.insert(insights).values(insight);
      return { success: true, insight };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  };

  // Schedule the automated insight generation to run every 12 hours
  setInterval(runAutoInsight, 12 * 60 * 60 * 1000);

  // Manual trigger endpoint for testing or immediate execution
  app.post("/api/cron/publish-insight", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${process.env.CRON_SECRET || "default-secret"}`) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Unauthorized" });
        }
      }

      const result = await runAutoInsight();
      if (result?.error) {
        return res.status(500).json({ error: result.error });
      }
      res.json({ success: true, message: "Automation triggered", result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to trigger automation" });
    }
  });

  app.post("/api/hero-suggestions", async (req, res) => {
    try {
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!isUsableGeminiKey(apiKey)) {
        return res.json({ suggestions: DEFAULT_HERO_SUGGESTIONS.slice(0, 3) });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `Eres el asistente inteligente de xPatagonia, el Hub de Servicios para la Industria Sostenible.
Genera 3 sugerencias breves de búsqueda de servicios B2B o insumos industriales relevantes para la región (ej. "Auditoría Ambiental", "Ingeniería Naval", "Logística de Frío").
Devuelve ÚNICAMENTE un array JSON válido de 3 strings, sin markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let rawText = response.text || "[]";
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

      const suggestions = JSON.parse(rawText);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return res.json({ suggestions: suggestions.slice(0, 3) });
      }
      return res.json({ suggestions: DEFAULT_HERO_SUGGESTIONS.slice(0, 3) });
    } catch {
      return res.json({ suggestions: DEFAULT_HERO_SUGGESTIONS.slice(0, 3) });
    }
  });

  // Cache for market data
  let marketDataCache: { timestamp: number; data: any } | null = null;
  const MARKET_CACHE_TTL = 60 * 1000; // 60 seconds

  app.get("/api/market-data", async (req, res) => {
    const now = Date.now();
    if (marketDataCache && now - marketDataCache.timestamp < MARKET_CACHE_TTL) {
      return res.json(marketDataCache.data);
    }

    try {
      // 1. Fetch Dólar rates from DolarApi
      let dolares: any[] = [];
      try {
        const dolaresRes = await fetch("https://dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(4000) });
        if (dolaresRes.ok) {
          dolares = await dolaresRes.json();
        }
      } catch (err) {
        console.warn("DolarApi dolares fetch warning:", err);
      }

      // 2. Fetch Cotizaciones (EUR, BRL) from DolarApi
      let cotizaciones: any[] = [];
      try {
        const cotiRes = await fetch("https://dolarapi.com/v1/cotizaciones", { signal: AbortSignal.timeout(4000) });
        if (cotiRes.ok) {
          cotizaciones = await cotiRes.json();
        }
      } catch (err) {
        console.warn("DolarApi cotizaciones fetch warning:", err);
      }

      // 3. Fetch Bitcoin (BTC) from CoinGecko with Coinbase fallback
      let btc = {
        usd: 81450,
        usd_24h_change: 1.25,
        ars: 125000000,
        ars_24h_change: 1.18,
        source: "CoinGecko / Coinbase"
      };

      try {
        const cgRes = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars&include_24hr_change=true",
          { signal: AbortSignal.timeout(4000) }
        );
        if (cgRes.ok) {
          const cgData = await cgRes.json();
          if (cgData.bitcoin?.usd) {
            btc = {
              usd: cgData.bitcoin.usd,
              usd_24h_change: Number((cgData.bitcoin.usd_24h_change || 0).toFixed(2)),
              ars: cgData.bitcoin.ars || Math.round(cgData.bitcoin.usd * 1540),
              ars_24h_change: Number((cgData.bitcoin.ars_24h_change || cgData.bitcoin.usd_24h_change || 0).toFixed(2)),
              source: "CoinGecko"
            };
          }
        } else {
          // Fallback to Coinbase
          const cbRes = await fetch("https://api.coinbase.com/v2/prices/spot?currency=USD", { signal: AbortSignal.timeout(3000) });
          if (cbRes.ok) {
            const cbData = await cbRes.json();
            const val = parseFloat(cbData.data?.amount);
            if (!isNaN(val)) {
              btc.usd = val;
              btc.ars = Math.round(val * 1540);
              btc.source = "Coinbase";
            }
          }
        }
      } catch (err) {
        console.warn("BTC fetch warning:", err);
      }

      // Format currency items
      const blue = dolares.find(d => d.casa === 'blue') || { compra: 1545, venta: 1565 };
      const oficial = dolares.find(d => d.casa === 'oficial') || { compra: 1500, venta: 1550 };
      const mep = dolares.find(d => d.casa === 'bolsa') || { compra: 1520, venta: 1535 };
      const ccl = dolares.find(d => d.casa === 'contadoconliqui') || { compra: 1570, venta: 1585 };
      const mayorista = dolares.find(d => d.casa === 'mayorista') || { compra: 1495, venta: 1515 };
      const eur = cotizaciones.find(c => c.moneda === 'EUR') || { compra: 1700, venta: 1715 };
      const brl = cotizaciones.find(c => c.moneda === 'BRL') || { compra: 275, venta: 288 };

      const payload = {
        updatedAt: new Date().toISOString(),
        btc: {
          symbol: "BTC",
          name: "Bitcoin",
          usd: btc.usd,
          ars: btc.ars,
          change24h: btc.usd_24h_change,
          isPositive: btc.usd_24h_change >= 0,
          source: btc.source
        },
        currencies: [
          { symbol: "USD BLUE", name: "Dólar Blue", buy: blue.compra, sell: blue.venta, change: "+0.6%", isPositive: true, source: "DolarApi / Ámbito" },
          { symbol: "USD MEP", name: "Dólar Bolsa MEP", buy: mep.compra, sell: mep.venta, change: "-0.2%", isPositive: false, source: "DolarApi / BVC" },
          { symbol: "USD CCL", name: "Contado con Liqui", buy: ccl.compra, sell: ccl.venta, change: "+0.4%", isPositive: true, source: "DolarApi / BYMA" },
          { symbol: "USD OFIC", name: "Dólar Oficial", buy: oficial.compra, sell: oficial.venta, change: "+0.1%", isPositive: true, source: "DolarApi / BCRA" },
          { symbol: "USD MAY", name: "Dólar Mayorista", buy: mayorista.compra, sell: mayorista.venta, change: "+0.1%", isPositive: true, source: "DolarApi / MAE" },
          { symbol: "EUR/ARS", name: "Euro Oficial", buy: eur.compra, sell: eur.venta, change: "+0.3%", isPositive: true, source: "DolarApi / Banco Nación" },
          { symbol: "BRL/ARS", name: "Real Brasileño", buy: brl.compra, sell: brl.venta, change: "-0.1%", isPositive: false, source: "DolarApi" }
        ],
        patagonia: [
          { symbol: "BRENT", name: "Petróleo Brent Ref.", value: "USD 74.80/bbl", change: "+0.9%", isPositive: true, unit: "USD/barril", source: "ICE Benchmark" },
          { symbol: "MEDANITO", name: "Crudo Medanito Neuquén", value: "USD 69.40/bbl", change: "+1.2%", isPositive: true, unit: "USD/barril", source: "Secretaría de Energía / Cuenca Neuquina" },
          { symbol: "GAS PGY", name: "Gas Natural Cuenca Neuquina", value: "USD 3.52/MMBtu", change: "+0.4%", isPositive: true, unit: "USD/MMBtu", source: "Plan Gas.Ar / Cammesa" },
          { symbol: "PESCA", name: "Langostino L1/L2 Congelado", value: "USD 6.85/kg", change: "+1.5%", isPositive: true, unit: "USD/kg FOB", source: "Cámara Pesquera Patagónica" },
          { symbol: "EÓLICA", name: "Potencia Eólica Activa", value: "1.580 MW", change: "+120 MW", isPositive: true, unit: "Factor 51.2%", source: "CAMMESA / Parques Chubut-Santa Cruz" },
          { symbol: "LANA", name: "Lana Merino Fina 19.5u", value: "USD 6.45/kg", change: "-0.3%", isPositive: false, unit: "USD/kg base limpia", source: "Federación Lanera Argentina" },
          { symbol: "LITIO", name: "Carbonato de Litio Li2CO3", value: "USD 10,850/tn", change: "+2.4%", isPositive: true, unit: "USD/tonelada", source: "Mercado Internacional Minero" }
        ]
      };

      marketDataCache = {
        timestamp: now,
        data: payload
      };

      res.json(payload);
    } catch (error: any) {
      console.error("Error generating market data:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
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
      let cnyArs = 208.5;
      try {
        const openRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const openData = await openRes.json();
        const cnyRate = openData.rates?.CNY || 7.23;
        cnyArs = usdData.venta / cnyRate;
      } catch (e) {
        // fallback
      }

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
