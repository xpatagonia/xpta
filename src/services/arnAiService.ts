import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export type ArnMode = "hybrid" | "manual" | "auto";
export type ArnActionType =
  | "send_quote_email"
  | "send_followup_email"
  | "create_logistics_load"
  | "reserve_inventory"
  | "notify_providers";

export interface ArnPolicyRule {
  mode: ArnMode;
  autoApproveMaxUsd: number;
  minConfidenceScore: number;
  autoSendEmails: boolean;
  autoCreateLogistics: boolean;
  autoReserveInventory: boolean;
}

export const DEFAULT_ARN_POLICY: ArnPolicyRule = {
  mode: "hybrid",
  autoApproveMaxUsd: 1500,
  minConfidenceScore: 82,
  autoSendEmails: false,
  autoCreateLogistics: true,
  autoReserveInventory: true,
};

export interface HybridDecision {
  shouldAutoExecute: boolean;
  executionMode: "auto_approved" | "manual_approval";
  reason: string;
}

/**
 * Evaluates whether an ARN IA action should execute automatically or wait in the human approval queue.
 */
export function evaluateHybridDecision(
  rule: ArnPolicyRule,
  actionType: ArnActionType,
  estimatedAmountUsd: number,
  confidenceScore: number
): HybridDecision {
  if (rule.mode === "manual") {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Modo manual activo: todas las acciones requieren aprobación humana.",
    };
  }

  const isEmailAction =
    actionType === "send_quote_email" ||
    actionType === "send_followup_email" ||
    actionType === "notify_providers";

  if (isEmailAction && !rule.autoSendEmails && rule.mode !== "auto") {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Envío automático de correos desactivado en tu regla híbrida (requiere 1 clic de aprobación).",
    };
  }

  if (actionType === "create_logistics_load" && !rule.autoCreateLogistics) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Creación automática de cargas desactivada en tu política ARN.",
    };
  }

  if (actionType === "reserve_inventory" && !rule.autoReserveInventory) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: "Reserva automática de stock desactivada en tu política ARN.",
    };
  }

  if (confidenceScore < rule.minConfidenceScore) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: `Confianza IA (${confidenceScore}%) por debajo del mínimo configurado (${rule.minConfidenceScore}%).`,
    };
  }

  if (estimatedAmountUsd > rule.autoApproveMaxUsd) {
    return {
      shouldAutoExecute: false,
      executionMode: "manual_approval",
      reason: `Monto estimado (USD ${estimatedAmountUsd}) supera el tope automático (USD ${rule.autoApproveMaxUsd}).`,
    };
  }

  return {
    shouldAutoExecute: true,
    executionMode: "auto_approved",
    reason: `Aprobado automáticamente por regla híbrida (USD ${estimatedAmountUsd} <= USD ${rule.autoApproveMaxUsd}, confianza ${confidenceScore}%).`,
  };
}

export interface ArnAnalysisResult {
  companyName: string;
  contactName: string;
  contactEmail: string;
  cuit: string;
  category: string;
  corridor: string;
  urgency: "low" | "medium" | "high" | "critical";
  estimatedAmountUsd: number;
  aiScore: number;
  summary: string;
  recommendedAction: string;
  actionType: ArnActionType;
  actionTitle: string;
  draftSubject: string;
  draftBody: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey.length < 10 || apiKey.includes("MY_GEMINI_API_KEY")) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

function buildDeterministicFallback(input: {
  source: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  category?: string;
  rawText: string;
  catalogSummary?: string;
}): ArnAnalysisResult {
  const text = input.rawText || "";
  const lower = text.toLowerCase();
  const urgent = /urgente|inmediato|paro|parada|critico|crítico|hoy/i.test(lower);
  const amountMatch = text.match(/(?:usd|u\$s|us\$|\$)\s*([0-9][0-9.,]{1,9})/i);
  const parsedAmount = amountMatch
    ? Math.min(500000, Math.max(250, Number(amountMatch[1].replace(/[.,]/g, "")) || 1200))
    : 1200;

  const corridor = /añelo|vaca muerta|neuqu/i.test(lower)
    ? "RN 22 / Añelo (Vaca Muerta)"
    : /comodoro|golfo|chubut/i.test(lower)
    ? "RN 3 / Golfo San Jorge"
    : /madryn|pesca|puerto/i.test(lower)
    ? "Puerto Madryn / Corredor Atlántico"
    : "Corredor Patagónico RN 3 / RN 22";

  const company = input.companyName?.trim() || "Cliente B2B Detectado";
  const contactEmail = input.contactEmail?.trim() || "";
  const category = input.category?.trim() || "Servicios Industriales";

  return {
    companyName: company,
    contactName: input.contactName?.trim() || "Responsable de Compras",
    contactEmail,
    cuit: "",
    category,
    corridor,
    urgency: urgent ? "high" : "medium",
    estimatedAmountUsd: parsedAmount,
    aiScore: contactEmail ? (urgent ? 88 : 79) : 65,
    summary: `Oportunidad detectada desde ${input.source}: ${text.slice(0, 180)}`,
    recommendedAction: contactEmail
      ? "Enviar cotización técnica inicial y validar disponibilidad logística."
      : "Calificar empresa y solicitar email de contacto comercial.",
    actionType: contactEmail ? "send_quote_email" : "send_followup_email",
    actionTitle: `Responder oportunidad comercial — ${company}`,
    draftSubject: `Propuesta Técnica & Cotización xPatagonia — ${category}`,
    draftBody: `Estimados ${company},\n\nRecibimos su requerimiento en ${category} (${corridor}). Contamos con capacidad operativa y disponibilidad para avanzar con la cotización formal.${
      input.catalogSummary ? `\n\nReferencia de catálogo disponible:\n${input.catalogSummary}` : ""
    }\n\nQuedamos atentos a confirmar plazos de entrega y especificaciones finales.\n\nSaludos cordiales,\nEquipo Comercial xPatagonia`,
  };
}

export async function analyzeOpportunityWithArn(input: {
  source: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  category?: string;
  rawText: string;
  catalogSummary?: string;
}): Promise<ArnAnalysisResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return buildDeterministicFallback(input);
  }

  try {
    const prompt = `Analiza el siguiente evento comercial B2B en Patagonia (Argentina) y extrae una oportunidad estructurada para ARN IA.
Fuente: ${input.source}
Empresa informada: ${input.companyName || "No especificada"}
Contacto informado: ${input.contactName || "No especificado"}
Email informado: ${input.contactEmail || "No especificado"}
Categoría informada: ${input.category || "General"}
Catálogo propio disponible de nuestra empresa:
${input.catalogSummary || "Sin productos cargados aún"}

Contenido / Requerimiento:
"""
${input.rawText.slice(0, 3500)}
"""

Instrucciones:
- Calcula aiScore (0-100) según claridad técnica, fit comercial y presencia de contacto real.
- Estima estimatedAmountUsd en USD enteros realistas (si no se menciona monto explícito, estima según tipo de servicio B2B entre 500 y 25000).
- Redacta un draftSubject y draftBody profesional en español rioplatense/corporativo listo para enviar al cliente usando nuestro catálogo si coincide.
- Define actionType entre: send_quote_email, send_followup_email, create_logistics_load, reserve_inventory, notify_providers.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            contactName: { type: Type.STRING },
            contactEmail: { type: Type.STRING },
            cuit: { type: Type.STRING },
            category: { type: Type.STRING },
            corridor: { type: Type.STRING },
            urgency: { type: Type.STRING },
            estimatedAmountUsd: { type: Type.INTEGER },
            aiScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            actionType: { type: Type.STRING },
            actionTitle: { type: Type.STRING },
            draftSubject: { type: Type.STRING },
            draftBody: { type: Type.STRING },
          },
          required: [
            "companyName",
            "category",
            "corridor",
            "urgency",
            "estimatedAmountUsd",
            "aiScore",
            "summary",
            "recommendedAction",
            "actionType",
            "actionTitle",
            "draftSubject",
            "draftBody",
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text || "{}").trim());
    const allowedUrgencies = ["low", "medium", "high", "critical"];
    const allowedActions: ArnActionType[] = [
      "send_quote_email",
      "send_followup_email",
      "create_logistics_load",
      "reserve_inventory",
      "notify_providers",
    ];

    return {
      companyName: parsed.companyName || input.companyName || "Cliente B2B",
      contactName: parsed.contactName || input.contactName || "Compras",
      contactEmail: parsed.contactEmail || input.contactEmail || "",
      cuit: parsed.cuit || "",
      category: parsed.category || input.category || "General",
      corridor: parsed.corridor || "Corredor Patagónico RN 3 / RN 22",
      urgency: allowedUrgencies.includes(parsed.urgency) ? parsed.urgency : "medium",
      estimatedAmountUsd: Math.max(0, Number(parsed.estimatedAmountUsd) || 1200),
      aiScore: Math.min(100, Math.max(1, Number(parsed.aiScore) || 75)),
      summary: parsed.summary || input.rawText.slice(0, 180),
      recommendedAction: parsed.recommendedAction || "Enviar propuesta comercial",
      actionType: allowedActions.includes(parsed.actionType)
        ? (parsed.actionType as ArnActionType)
        : "send_quote_email",
      actionTitle: parsed.actionTitle || `Acción comercial — ${parsed.companyName || "Cliente"}`,
      draftSubject: parsed.draftSubject || "Cotización B2B xPatagonia",
      draftBody: parsed.draftBody || "Estimados, adjuntamos nuestra propuesta comercial.",
    };
  } catch (err) {
    console.warn("[ARN_AI] Fallback heuristic used due to Gemini warning:", err);
    return buildDeterministicFallback(input);
  }
}

export async function generateAdnEmbedding(text: string): Promise<number[] | null> {
  const ai = getGeminiClient();
  if (!ai || !text.trim()) return null;
  try {
    const res = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: text.slice(0, 2000),
      config: { outputDimensionality: 768 },
    });
    const values = res.embeddings?.[0]?.values;
    if (Array.isArray(values) && values.length === 768) {
      return values;
    }
    return null;
  } catch (err) {
    console.warn("[ARN_AI] Embedding warning:", err);
    return null;
  }
}

export async function askArnCopilot(
  question: string,
  contextSnapshot: {
    opportunitiesCount: number;
    pendingActionsCount: number;
    topOpportunities: Array<{ companyName: string; stage: string; aiScore: number; estimatedAmountUsd: number; summary?: string }>;
    inventoryLowStock: Array<{ name: string; sku?: string; quantity: number; location?: string }>;
    openRfqsCount: number;
    policy: ArnPolicyRule;
  }
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    return `Resumen ARN (sin clave Gemini activa): Tenés ${contextSnapshot.opportunitiesCount} oportunidades activas, ${contextSnapshot.pendingActionsCount} acciones esperando aprobación y ${contextSnapshot.openRfqsCount} RFQs abiertas bajo modo ${contextSnapshot.policy.mode}.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Consulta del operador B2B: "${question}"

Estado real de su operación en xPatagonia:
${JSON.stringify(contextSnapshot, null, 2)}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          "Eres ARN IA, el director de operaciones y negocios autónomo de xPatagonia B2B. Responde en español, de forma ejecutiva, accionable y directa en 3 a 6 líneas basadas únicamente en los datos reales provistos.",
      },
    });
    return (response.text || "").trim() || "No se pudo generar respuesta.";
  } catch (err: any) {
    return `No se pudo consultar al Copiloto ARN en este momento (${err?.message || "error temporal"}).`;
  }
}
