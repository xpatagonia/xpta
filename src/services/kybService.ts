export function validateArgentineCuit(cuit: string): boolean {
  const clean = String(cuit || "").replace(/\D/g, "");
  if (clean.length !== 11) return false;
  const digits = clean.slice(0, 10).split("").map(Number);
  const verifier = Number(clean[10]);
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = digits.reduce((acc, d, idx) => acc + d * weights[idx], 0);
  const mod = sum % 11;
  const expected = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;
  return expected === verifier;
}

export interface KybVerificationResult {
  validFormat: boolean;
  cuitDigits: string;
  cuitFormatted: string;
  legalName: string | null;
  fiscalCondition: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  claeCodes: string[];
  bcraSituation: string;
  bcraSituationCode: number | null;
  bcraTotalDebtArs: number;
  rejectedChecksCount: number;
  arcaLive: boolean;
  bcraLive: boolean;
  verifiedBadge: boolean;
  checkedAt: string;
  message: string;
}

export function formatCuit(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (clean.length !== 11) return digits;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
}

export function mapBcraSituationLabel(code: number | null): string {
  switch (code) {
    case 1:
      return "Situación 1 · Normal (Sin atrasos)";
    case 2:
      return "Situación 2 · Riesgo bajo / Seguimiento";
    case 3:
      return "Situación 3 · Riesgo medio";
    case 4:
      return "Situación 4 · Riesgo alto";
    case 5:
      return "Situación 5 · Irrecuperable";
    case 6:
      return "Situación 6 · Irrecuperable disp. técnica";
    default:
      return "Sin deudas informadas en BCRA";
  }
}

async function queryBcraPublic(cuitDigits: string): Promise<{
  live: boolean;
  denominacion: string | null;
  worstSituation: number | null;
  totalDebtArs: number;
  rejectedChecksCount: number;
}> {
  let denominacion: string | null = null;
  let worstSituation: number | null = null;
  let totalDebtArs = 0;
  let rejectedChecksCount = 0;
  let live = false;

  try {
    const res = await fetch(
      `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuitDigits}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4500),
      }
    );
    if (res.ok) {
      const json: any = await res.json();
      live = true;
      const results = json?.results;
      if (results?.denominacion) {
        denominacion = String(results.denominacion).trim();
      }
      const latestPeriod = Array.isArray(results?.periodos) ? results.periodos[0] : null;
      const entities = Array.isArray(latestPeriod?.entidades) ? latestPeriod.entidades : [];
      for (const ent of entities) {
        const sit = Number(ent?.situacion || 0);
        if (sit > 0 && (worstSituation === null || sit > worstSituation)) {
          worstSituation = sit;
        }
        totalDebtArs += Number(ent?.monto || 0) * 1000;
      }
    } else if (res.status === 404) {
      live = true; // Consulted successfully, no active banking debt reported
    }
  } catch {
    // BCRA timeout or unreachable
  }

  try {
    const chkRes = await fetch(
      `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cuitDigits}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (chkRes.ok) {
      const chkJson: any = await chkRes.json();
      const causales = Array.isArray(chkJson?.results?.causales) ? chkJson.results.causales : [];
      for (const c of causales) {
        const entidades = Array.isArray(c?.entidades) ? c.entidades : [];
        for (const e of entidades) {
          rejectedChecksCount += Array.isArray(e?.detalle) ? e.detalle.length : 1;
        }
      }
    }
  } catch {
    // Optional rejected checks lookup
  }

  return { live, denominacion, worstSituation, totalDebtArs, rejectedChecksCount };
}

async function queryArcaGateway(cuitDigits: string): Promise<{
  live: boolean;
  legalName: string | null;
  fiscalCondition: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  claeCodes: string[];
}> {
  const apiUrl = String(process.env.ARCA_API_URL || "").trim();
  const apiKey = String(process.env.ARCA_API_KEY || "").trim();
  if (!apiUrl) {
    return {
      live: false,
      legalName: null,
      fiscalCondition: null,
      province: null,
      city: null,
      address: null,
      claeCodes: [],
    };
  }

  try {
    const endpoint = apiUrl.includes("{cuit}")
      ? apiUrl.replace("{cuit}", cuitDigits)
      : `${apiUrl}${apiUrl.includes("?") ? "&" : "?"}cuit=${cuitDigits}`;

    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return {
        live: false,
        legalName: null,
        fiscalCondition: null,
        province: null,
        city: null,
        address: null,
        claeCodes: [],
      };
    }

    const d: any = await res.json();
    const root = d?.data || d?.contribuyente || d;
    const legalName =
      root?.razonSocial || root?.razon_social || root?.nombre || root?.denominacion || null;
    const fiscalCondition =
      root?.condicionIva || root?.condicion_iva || root?.impuestoIva || null;
    const dom = root?.domicilioFiscal || root?.domicilio || {};
    const province = dom?.provincia || root?.provincia || null;
    const city = dom?.localidad || root?.localidad || null;
    const address = dom?.direccion || root?.direccion || null;
    const rawActivities = Array.isArray(root?.actividades) ? root.actividades : [];
    const claeCodes = rawActivities
      .map((a: any) =>
        typeof a === "string"
          ? a
          : `${a?.codigo || a?.id || ""} ${a?.descripcion || a?.desc || ""}`.trim()
      )
      .filter(Boolean);

    return {
      live: true,
      legalName: legalName ? String(legalName).trim() : null,
      fiscalCondition: fiscalCondition ? String(fiscalCondition).trim() : null,
      province: province ? String(province).trim() : null,
      city: city ? String(city).trim() : null,
      address: address ? String(address).trim() : null,
      claeCodes,
    };
  } catch {
    return {
      live: false,
      legalName: null,
      fiscalCondition: null,
      province: null,
      city: null,
      address: null,
      claeCodes: [],
    };
  }
}

export async function verifyCuitKyb(rawCuit: string): Promise<KybVerificationResult> {
  const cuitDigits = String(rawCuit || "").replace(/\D/g, "");
  const validFormat = validateArgentineCuit(cuitDigits);
  const cuitFormatted = formatCuit(cuitDigits);
  const checkedAt = new Date().toISOString();

  if (!validFormat) {
    return {
      validFormat: false,
      cuitDigits,
      cuitFormatted,
      legalName: null,
      fiscalCondition: null,
      province: null,
      city: null,
      address: null,
      claeCodes: [],
      bcraSituation: "CUIT inválido",
      bcraSituationCode: null,
      bcraTotalDebtArs: 0,
      rejectedChecksCount: 0,
      arcaLive: false,
      bcraLive: false,
      verifiedBadge: false,
      checkedAt,
      message: "El CUIT no supera la validación matemática de dígito verificador ARCA/AFIP.",
    };
  }

  const [bcra, arca] = await Promise.all([
    queryBcraPublic(cuitDigits),
    queryArcaGateway(cuitDigits),
  ]);

  const legalName = arca.legalName || bcra.denominacion || null;
  const bcraSituation = mapBcraSituationLabel(bcra.worstSituation);
  const cleanBcra = bcra.worstSituation === null || bcra.worstSituation <= 2;
  const verifiedBadge = Boolean(
    validFormat && (arca.live || (bcra.live && cleanBcra && bcra.rejectedChecksCount === 0))
  );

  const parts: string[] = ["Dígito verificador ARCA válido"];
  if (arca.live) parts.push("Padrón ARCA consultado en vivo");
  if (bcra.live) parts.push(`BCRA: ${bcraSituation}`);
  if (bcra.rejectedChecksCount > 0) parts.push(`${bcra.rejectedChecksCount} cheque(s) rechazado(s)`);

  return {
    validFormat: true,
    cuitDigits,
    cuitFormatted,
    legalName,
    fiscalCondition: arca.fiscalCondition,
    province: arca.province,
    city: arca.city,
    address: arca.address,
    claeCodes: arca.claeCodes,
    bcraSituation,
    bcraSituationCode: bcra.worstSituation,
    bcraTotalDebtArs: bcra.totalDebtArs,
    rejectedChecksCount: bcra.rejectedChecksCount,
    arcaLive: arca.live,
    bcraLive: bcra.live,
    verifiedBadge,
    checkedAt,
    message: parts.join(" · "),
  };
}
