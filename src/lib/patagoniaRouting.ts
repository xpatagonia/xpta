import { getApiUrl, getOsrmUrl } from './apiConfig';

export interface LogisticNode {
  id: string;
  name: string;
  shortName: string;
  province: string;
  corridor: 'RN3' | 'RN22' | 'RN40' | 'CENTRO_NORTE';
  lat: number;
  lng: number;
  isExtraRegional?: boolean;
  aliases: string[];
}

export const PATAGONIA_LOGISTIC_NODES: LogisticNode[] = [
  {
    id: 'caba',
    name: 'Buenos Aires (CABA / Puerto)',
    shortName: 'Buenos Aires',
    province: 'Buenos Aires',
    corridor: 'CENTRO_NORTE',
    lat: -34.6037,
    lng: -58.3816,
    isExtraRegional: true,
    aliases: ['caba', 'buenos aires', 'bsas', 'puerto buenos aires', 'amba'],
  },
  {
    id: 'rosario',
    name: 'Rosario (Polo Industrial)',
    shortName: 'Rosario',
    province: 'Santa Fe',
    corridor: 'CENTRO_NORTE',
    lat: -32.9442,
    lng: -60.6505,
    isExtraRegional: true,
    aliases: ['rosario', 'santa fe', 'san lorenzo'],
  },
  {
    id: 'cordoba',
    name: 'Córdoba Capital (Parque Industrial)',
    shortName: 'Córdoba',
    province: 'Córdoba',
    corridor: 'CENTRO_NORTE',
    lat: -31.4201,
    lng: -64.1888,
    isExtraRegional: true,
    aliases: ['cordoba', 'córdoba', 'ferreyra'],
  },
  {
    id: 'bahia-blanca',
    name: 'Bahía Blanca (Puerto / Petroquímico)',
    shortName: 'Bahía Blanca',
    province: 'Buenos Aires',
    corridor: 'RN3',
    lat: -38.7183,
    lng: -62.2663,
    isExtraRegional: true,
    aliases: ['bahia blanca', 'bahía blanca', 'ingeniero white'],
  },
  {
    id: 'viedma',
    name: 'Viedma (Valle Inferior)',
    shortName: 'Viedma',
    province: 'Río Negro',
    corridor: 'RN3',
    lat: -40.8135,
    lng: -62.9967,
    aliases: ['viedma', 'patagones'],
  },
  {
    id: 'cipolletti',
    name: 'Cipolletti / General Roca (Alto Valle)',
    shortName: 'Alto Valle',
    province: 'Río Negro',
    corridor: 'RN22',
    lat: -38.9339,
    lng: -67.9903,
    aliases: ['cipolletti', 'general roca', 'alto valle', 'allen'],
  },
  {
    id: 'neuquen',
    name: 'Neuquén Capital (Parque Industrial)',
    shortName: 'Neuquén',
    province: 'Neuquén',
    corridor: 'RN22',
    lat: -38.9516,
    lng: -68.0591,
    aliases: ['neuquen', 'neuquén', 'plottier', 'centenario'],
  },
  {
    id: 'anelo',
    name: 'Añelo (Hub Vaca Muerta)',
    shortName: 'Añelo',
    province: 'Neuquén',
    corridor: 'RN22',
    lat: -38.3522,
    lng: -68.7897,
    aliases: ['anelo', 'añelo', 'vaca muerta', 'loma campana'],
  },
  {
    id: 'rincon',
    name: 'Rincón de los Sauces',
    shortName: 'Rincón Sauces',
    province: 'Neuquén',
    corridor: 'RN40',
    lat: -37.3894,
    lng: -68.9242,
    aliases: ['rincon', 'rincón de los sauces'],
  },
  {
    id: 'bariloche',
    name: 'San Carlos de Bariloche (PITBA)',
    shortName: 'Bariloche',
    province: 'Río Negro',
    corridor: 'RN40',
    lat: -41.1335,
    lng: -71.3103,
    aliases: ['bariloche', 'pitba', 'dina huapi'],
  },
  {
    id: 'esquel',
    name: 'Esquel / Trevelin',
    shortName: 'Esquel',
    province: 'Chubut',
    corridor: 'RN40',
    lat: -42.9115,
    lng: -71.3195,
    aliases: ['esquel', 'trevelin'],
  },
  {
    id: 'madryn',
    name: 'Puerto Madryn (Puerto / Aluar)',
    shortName: 'Puerto Madryn',
    province: 'Chubut',
    corridor: 'RN3',
    lat: -42.7692,
    lng: -65.0385,
    aliases: ['madryn', 'puerto madryn'],
  },
  {
    id: 'trelew',
    name: 'Trelew / Rawson (VIRCh)',
    shortName: 'Trelew',
    province: 'Chubut',
    corridor: 'RN3',
    lat: -43.2489,
    lng: -65.3051,
    aliases: ['trelew', 'rawson', 'virch', 'dolavon', 'gaiman'],
  },
  {
    id: 'comodoro',
    name: 'Comodoro Rivadavia (Golfo San Jorge)',
    shortName: 'Comodoro',
    province: 'Chubut',
    corridor: 'RN3',
    lat: -45.8641,
    lng: -67.4966,
    aliases: ['comodoro', 'comodoro rivadavia', 'rada tilly', 'golfo san jorge'],
  },
  {
    id: 'caleta-olivia',
    name: 'Caleta Olivia',
    shortName: 'Caleta Olivia',
    province: 'Santa Cruz',
    corridor: 'RN3',
    lat: -46.4393,
    lng: -67.5281,
    aliases: ['caleta', 'caleta olivia'],
  },
  {
    id: 'pico-truncado',
    name: 'Pico Truncado / Las Heras',
    shortName: 'Pico Truncado',
    province: 'Santa Cruz',
    corridor: 'RN3',
    lat: -46.7989,
    lng: -67.9572,
    aliases: ['pico truncado', 'las heras', 'truncado'],
  },
  {
    id: 'deseado',
    name: 'Puerto Deseado',
    shortName: 'Pto. Deseado',
    province: 'Santa Cruz',
    corridor: 'RN3',
    lat: -47.7503,
    lng: -65.8938,
    aliases: ['deseado', 'puerto deseado'],
  },
  {
    id: 'rio-gallegos',
    name: 'Río Gallegos',
    shortName: 'Río Gallegos',
    province: 'Santa Cruz',
    corridor: 'RN3',
    lat: -51.6226,
    lng: -69.2181,
    aliases: ['rio gallegos', 'río gallegos', 'gallegos', 'punta loyola'],
  },
  {
    id: 'el-calafate',
    name: 'El Calafate',
    shortName: 'El Calafate',
    province: 'Santa Cruz',
    corridor: 'RN40',
    lat: -50.3379,
    lng: -72.2648,
    aliases: ['calafate', 'el calafate'],
  },
  {
    id: 'rio-grande',
    name: 'Río Grande (Polo Industrial Fueguino)',
    shortName: 'Río Grande',
    province: 'Tierra del Fuego',
    corridor: 'RN3',
    lat: -53.7877,
    lng: -67.7095,
    aliases: ['rio grande', 'río grande'],
  },
  {
    id: 'ushuaia',
    name: 'Ushuaia (Puerto Austral)',
    shortName: 'Ushuaia',
    province: 'Tierra del Fuego',
    corridor: 'RN3',
    lat: -54.8019,
    lng: -68.303,
    aliases: ['ushuaia', 'tierra del fuego'],
  },
];

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function resolveLocationNode(input: string): LogisticNode {
  const norm = normalizeText(input);
  const exact = PATAGONIA_LOGISTIC_NODES.find(
    (n) =>
      normalizeText(n.name) === norm ||
      normalizeText(n.shortName) === norm ||
      n.aliases.some((a) => norm.includes(normalizeText(a)))
  );
  if (exact) return exact;

  const partial = PATAGONIA_LOGISTIC_NODES.find(
    (n) =>
      normalizeText(n.name).includes(norm) ||
      normalizeText(n.province).includes(norm)
  );
  return partial || PATAGONIA_LOGISTIC_NODES[6]; // fallback Neuquén
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function inferPatagonianCorridor(
  origin: LogisticNode,
  dest: LogisticNode
): string {
  if (origin.isExtraRegional || dest.isExtraRegional) {
    if (origin.corridor === 'RN22' || dest.corridor === 'RN22') {
      return 'Corredor Centro-Norte → RN 152 / RN 22 (Vaca Muerta)';
    }
    return 'Corredor Centro-Norte → RN 3 (Eje Atlántico Patagónico)';
  }
  if (origin.corridor === 'RN40' || dest.corridor === 'RN40') {
    return 'Ruta Nacional 40 (Corredor Cordillerano)';
  }
  if (origin.corridor === 'RN22' || dest.corridor === 'RN22') {
    return 'Ruta Nacional 22 / RP 7 (Cuenca Neuquina)';
  }
  return 'Ruta Nacional 3 (Corredor Atlántico Austral)';
}

export interface RouteCalculationParams {
  originQuery: string;
  destQuery: string;
  weightKg?: number;
  fuelConsumptionL100?: number;
  fuelPriceArs?: number;
  truckType?: 'semirremolque' | 'termico' | 'chasis' | 'carreton';
}

export interface RouteCalculationResult {
  origin: LogisticNode;
  destination: LogisticNode;
  distanceKm: number;
  durationHours: number;
  formattedDuration: string;
  corridor: string;
  fuelLiters: number;
  fuelCostArs: number;
  estimatedFreightArs: number;
  emptyReturnFreightArs: number;
  ratePerKmArs: number;
  co2Kg: number;
  geometry: [number, number][]; // [lng, lat]
  engineUsed: 'Supermicro OSRM' | 'OpenStreetMap OSRM' | 'Modelo Vial RN';
  intermediateStops: string[];
}

function buildFallbackWaypoints(
  origin: LogisticNode,
  dest: LogisticNode
): { geometry: [number, number][]; stops: string[] } {
  const orderedAtlantic = [
    'caba',
    'bahia-blanca',
    'viedma',
    'madryn',
    'trelew',
    'comodoro',
    'caleta-olivia',
    'rio-gallegos',
    'rio-grande',
    'ushuaia',
  ];

  const idxA = orderedAtlantic.indexOf(origin.id);
  const idxB = orderedAtlantic.indexOf(dest.id);

  if (idxA !== -1 && idxB !== -1 && Math.abs(idxA - idxB) > 1) {
    const step = idxA < idxB ? 1 : -1;
    const pts: [number, number][] = [];
    const stops: string[] = [];
    for (let i = idxA; step > 0 ? i <= idxB : i >= idxB; i += step) {
      const node = PATAGONIA_LOGISTIC_NODES.find((n) => n.id === orderedAtlantic[i]);
      if (node) {
        pts.push([node.lng, node.lat]);
        if (node.id !== origin.id && node.id !== dest.id) {
          stops.push(node.shortName);
        }
      }
    }
    return { geometry: pts, stops: stops.slice(0, 4) };
  }

  // Generic interpolated curved corridor
  const midLng = (origin.lng + dest.lng) / 2;
  const midLat = (origin.lat + dest.lat) / 2;
  return {
    geometry: [
      [origin.lng, origin.lat],
      [midLng, midLat],
      [dest.lng, dest.lat],
    ],
    stops: [],
  };
}

export async function calculatePatagoniaRoute(
  params: RouteCalculationParams
): Promise<RouteCalculationResult> {
  const origin = resolveLocationNode(params.originQuery);
  const dest = resolveLocationNode(params.destQuery);
  const weightKg = Math.max(100, params.weightKg || 12000);
  const fuelL100 = Math.max(12, params.fuelConsumptionL100 || 34);
  const fuelPriceArs = Math.max(500, params.fuelPriceArs || 1380);
  const truckType = params.truckType || 'semirremolque';

  let distanceKm = 0;
  let durationHours = 0;
  let geometry: [number, number][] = [];
  let engineUsed: RouteCalculationResult['engineUsed'] = 'Modelo Vial RN';

  const coordsPath = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
  const osrmUrl = getOsrmUrl();
  const apiBase = getApiUrl();

  // 1. Try backend proxy (/api/logistics/route) first (same-origin on Vercel or external API), then direct OSRM
  const tryEndpoints: { url: string; label: RouteCalculationResult['engineUsed'] }[] = [
    {
      url: `${apiBase}/api/logistics/route?from=${origin.lng},${origin.lat}&to=${dest.lng},${dest.lat}`,
      label: 'Supermicro OSRM',
    },
  ];
  if (osrmUrl.includes('rutas.xpatagonia.online')) {
    tryEndpoints.push({
      url: `${osrmUrl}/route/v1/driving/${coordsPath}?overview=full&geometries=geojson`,
      label: 'Supermicro OSRM',
    });
  }
  tryEndpoints.push({
    url: `https://router.project-osrm.org/route/v1/driving/${coordsPath}?overview=full&geometries=geojson`,
    label: 'OpenStreetMap OSRM',
  });

  for (const endpoint of tryEndpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3800);
      const res = await fetch(endpoint.url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const data = await res.json();
      const route = data?.routes?.[0] || data?.route;
      if (route && route.distance > 0) {
        distanceKm = Math.round(route.distance / 1000);
        // Commercial heavy truck speed factor (~18% slower than passenger car ETA)
        durationHours = Number(((route.duration / 3600) * 1.18).toFixed(1));
        if (Array.isArray(route.geometry?.coordinates)) {
          geometry = route.geometry.coordinates;
        }
        engineUsed = data.engineUsed || endpoint.label;
        break;
      }
    } catch {
      // Fallback to next endpoint
    }
  }

  const fallbackInfo = buildFallbackWaypoints(origin, dest);
  if (distanceKm === 0) {
    const airKm = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    const roadFactor = origin.province === 'Tierra del Fuego' || dest.province === 'Tierra del Fuego' ? 1.32 : 1.21;
    distanceKm = Math.max(45, Math.round(airKm * roadFactor));
    durationHours = Number((distanceKm / 68).toFixed(1));
    geometry = fallbackInfo.geometry;
    engineUsed = 'Modelo Vial RN';
  } else if (geometry.length < 2) {
    geometry = fallbackInfo.geometry;
  }

  const days = Math.floor(durationHours / 12); // ~12hs conducción efectiva por día
  const remHours = Math.round(durationHours % 24);
  const formattedDuration =
    days >= 1
      ? `${durationHours} hs (${days}d ${remHours}h operativos)`
      : `${durationHours} hs de tránsito`;

  const truckMultiplier =
    truckType === 'carreton'
      ? 1.48
      : truckType === 'termico'
      ? 1.24
      : truckType === 'semirremolque'
      ? 1.0
      : 0.78;

  const fuelLiters = Math.round((distanceKm / 100) * fuelL100 * (truckType === 'carreton' ? 1.25 : 1));
  const fuelCostArs = fuelLiters * fuelPriceArs;

  // Base operating cost model: Fuel + Maintenance + Driver + Insurance + Margin scaled by load share (LTL vs FTL)
  const loadFactor = Math.min(1, Math.max(0.28, weightKg / 26000));
  const fullTruckCostPerKm = 2450 * truckMultiplier;
  const estimatedFreightArs = Math.round(distanceKm * fullTruckCostPerKm * loadFactor);
  const emptyReturnFreightArs = Math.round(estimatedFreightArs * 0.65); // -35% ahorro retorno vacío
  const ratePerKmArs = Math.round(estimatedFreightArs / Math.max(1, distanceKm));
  const co2Kg = Math.round(fuelLiters * 2.68); // 2.68 kg CO2 / litro gasoil

  return {
    origin,
    destination: dest,
    distanceKm,
    durationHours,
    formattedDuration,
    corridor: inferPatagonianCorridor(origin, dest),
    fuelLiters,
    fuelCostArs,
    estimatedFreightArs,
    emptyReturnFreightArs,
    ratePerKmArs,
    co2Kg,
    geometry,
    engineUsed,
    intermediateStops: fallbackInfo.stops,
  };
}

export interface EmptyReturnOffer {
  id: string;
  carrier: string;
  origin: string;
  destination: string;
  corridor: string;
  truckType: string;
  availableTons: number;
  distanceKm: number;
  departureWindow: string;
  discountPercent: number;
  pricePerTonArs: number;
  verified: boolean;
}

export const INITIAL_EMPTY_RETURNS: EmptyReturnOffer[] = [
  {
    id: 'ret-1',
    carrier: 'Logística Austral Multimodal S.R.L.',
    origin: 'Comodoro Rivadavia (Golfo San Jorge)',
    destination: 'Añelo (Hub Vaca Muerta)',
    corridor: 'RN 3 → RN 22',
    truckType: 'Semirremolque Sider 28t',
    availableTons: 22,
    distanceKm: 1125,
    departureWindow: 'Hoy 18:00 hs',
    discountPercent: 36,
    pricePerTonArs: 89500,
    verified: true,
  },
  {
    id: 'ret-2',
    carrier: 'Cruz del Sur Logística Frío',
    origin: 'Puerto Madryn (Puerto / Aluar)',
    destination: 'Buenos Aires (CABA / Puerto)',
    corridor: 'RN 3 (Retorno Norte)',
    truckType: 'Furgón Térmico -25°C (24t)',
    availableTons: 18,
    distanceKm: 1320,
    departureWindow: 'Mañana 08:00 hs',
    discountPercent: 42,
    pricePerTonArs: 96000,
    verified: true,
  },
  {
    id: 'ret-3',
    carrier: 'Transportes del Centro LTL',
    origin: 'Rosario (Polo Industrial)',
    destination: 'Neuquén Capital (Parque Industrial)',
    corridor: 'RN 152 → RN 22 (Carga Consolidada)',
    truckType: 'Batea / Playo Petrolero 30t',
    availableTons: 14,
    distanceKm: 1185,
    departureWindow: 'Próximas 24 hs',
    discountPercent: 32,
    pricePerTonArs: 84000,
    verified: true,
  },
];
