import React from 'react';
import { MapPin, Navigation2, Route } from 'lucide-react';
import {
  PATAGONIA_LOGISTIC_NODES,
  RouteCalculationResult,
  LogisticNode,
} from '../lib/patagoniaRouting';

interface PatagoniaRouteMapProps {
  route: RouteCalculationResult | null;
  onSelectHub?: (node: LogisticNode) => void;
}

// Bounding box covering Córdoba/Rosario/CABA down to Ushuaia
const MIN_LNG = -73.8;
const MAX_LNG = -56.5;
const MAX_LAT = -30.5;
const MIN_LAT = -55.8;

const SVG_W = 540;
const SVG_H = 620;

function projectPoint(lng: number, lat: number): [number, number] {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * SVG_W;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * SVG_H;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

// Simplified geographic silhouette of Central-Southern Argentina & Patagonia Atlantic/Andes border
const CONTINENTAL_SILHOUETTE_COORDS: [number, number][] = [
  [-64.5, -31.0],
  [-60.2, -32.2],
  [-58.1, -34.4],
  [-57.3, -36.3],
  [-58.5, -38.5],
  [-62.1, -38.9],
  [-62.5, -40.8],
  [-64.9, -41.1],
  [-64.2, -42.8],
  [-65.2, -43.3],
  [-66.5, -45.1],
  [-67.4, -45.9],
  [-67.4, -46.8],
  [-65.8, -47.8],
  [-67.7, -49.3],
  [-68.6, -50.8],
  [-69.0, -51.7],
  [-68.5, -52.4],
  [-67.6, -53.8],
  [-66.2, -54.8],
  [-68.6, -55.0],
  [-71.2, -53.9],
  [-72.8, -51.6],
  [-73.2, -49.5],
  [-71.9, -46.8],
  [-71.7, -43.2],
  [-71.8, -41.0],
  [-71.2, -38.8],
  [-70.3, -36.5],
  [-69.8, -33.0],
  [-66.5, -31.2],
  [-64.5, -31.0],
];

// Reference corridors (RN3 Atlantic, RN22 Valley, RN40 Andes)
const RN3_LINE: [number, number][] = [
  [-58.38, -34.6],
  [-62.26, -38.71],
  [-62.99, -40.81],
  [-65.03, -42.76],
  [-65.3, -43.24],
  [-67.49, -45.86],
  [-67.52, -46.43],
  [-69.21, -51.62],
  [-67.7, -53.78],
  [-68.3, -54.8],
];

const RN22_LINE: [number, number][] = [
  [-62.26, -38.71],
  [-67.99, -38.93],
  [-68.05, -38.95],
  [-68.78, -38.35],
];

const RN40_LINE: [number, number][] = [
  [-68.92, -37.38],
  [-71.31, -41.13],
  [-71.31, -42.91],
  [-70.6, -46.5],
  [-72.26, -50.33],
  [-69.21, -51.62],
];

function coordsToSvgPath(coords: [number, number][]): string {
  if (!coords.length) return '';
  // Downsample long OSRM geometries cleanly for smooth SVG rendering
  const step = Math.max(1, Math.floor(coords.length / 180));
  const sampled = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
  return sampled
    .map(([lng, lat], idx) => {
      const [x, y] = projectPoint(lng, lat);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export default function PatagoniaRouteMap({
  route,
  onSelectHub,
}: PatagoniaRouteMapProps) {
  const landPath = coordsToSvgPath(CONTINENTAL_SILHOUETTE_COORDS);
  const rn3Path = coordsToSvgPath(RN3_LINE);
  const rn22Path = coordsToSvgPath(RN22_LINE);
  const rn40Path = coordsToSvgPath(RN40_LINE);

  const activeRoutePath = route ? coordsToSvgPath(route.geometry) : '';
  const originPt = route
    ? projectPoint(route.origin.lng, route.origin.lat)
    : null;
  const destPt = route
    ? projectPoint(route.destination.lng, route.destination.lat)
    : null;

  const keyNodes = PATAGONIA_LOGISTIC_NODES.filter((n) =>
    [
      'caba',
      'rosario',
      'cordoba',
      'bahia-blanca',
      'neuquen',
      'anelo',
      'bariloche',
      'madryn',
      'comodoro',
      'rio-gallegos',
      'ushuaia',
    ].includes(n.id)
  );

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg flex flex-col">
      {/* Top Map Toolbar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/90">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Route className="w-4 h-4 text-orange-400" />
          <span>Mapa Vial Patagónico & Corredor Centro-Norte</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {route ? route.engineUsed : 'OpenStreetMap / OSRM'}
        </span>
      </div>

      {/* Interactive SVG Map */}
      <div className="relative w-full aspect-[540/560] max-h-[490px] flex items-center justify-center bg-[#090d16] p-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-full select-none"
          role="img"
          aria-label="Mapa interactivo de rutas logísticas en Patagonia y corredores nacionales"
        >
          <defs>
            <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="activeRouteGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* Subtle Latitude/Longitude Grid */}
          {[-35, -40, -45, -50, -55].map((lat) => {
            const [, y] = projectPoint(MIN_LNG, lat);
            return (
              <g key={lat}>
                <line
                  x1={0}
                  y1={y}
                  x2={SVG_W}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="3 4"
                />
                <text
                  x={8}
                  y={y - 4}
                  fill="#475569"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {Math.abs(lat)}°S
                </text>
              </g>
            );
          })}

          {/* Continental Mass */}
          <path
            d={landPath}
            fill="url(#landGrad)"
            stroke="#334155"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Base National Highways */}
          <path
            d={rn3Path}
            fill="none"
            stroke="#334155"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
          <path
            d={rn22Path}
            fill="none"
            stroke="#334155"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
          <path
            d={rn40Path}
            fill="none"
            stroke="#334155"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />

          {/* Active Calculated OSRM Route */}
          {activeRoutePath && (
            <>
              <path
                d={activeRoutePath}
                fill="none"
                stroke="#f97316"
                strokeOpacity="0.25"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={activeRoutePath}
                fill="none"
                stroke="url(#activeRouteGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Strategic Industrial & Port Nodes */}
          {keyNodes.map((node) => {
            const [x, y] = projectPoint(node.lng, node.lat);
            const isOrigin = route?.origin.id === node.id;
            const isDest = route?.destination.id === node.id;
            const labelRight = node.lng > -66.5;

            return (
              <g
                key={node.id}
                onClick={() => onSelectHub?.(node)}
                className="cursor-pointer group"
              >
                {(isOrigin || isDest) && (
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill={isOrigin ? '#f97316' : '#10b981'}
                    fillOpacity="0.25"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isOrigin || isDest ? 5.5 : 3.5}
                  fill={
                    isOrigin
                      ? '#f97316'
                      : isDest
                      ? '#10b981'
                      : node.isExtraRegional
                      ? '#a855f7'
                      : '#94a3b8'
                  }
                  stroke="#090d16"
                  strokeWidth="1.5"
                />
                <text
                  x={labelRight ? x + 8 : x - 8}
                  y={y + 3}
                  textAnchor={labelRight ? 'start' : 'end'}
                  fill={isOrigin || isDest ? '#ffffff' : '#94a3b8'}
                  fontSize={isOrigin || isDest ? '10.5' : '9'}
                  fontWeight={isOrigin || isDest ? '700' : '500'}
                >
                  {node.shortName}
                </text>
              </g>
            );
          })}

          {/* Exact Origin & Destination Markers if node not in keyNodes */}
          {originPt && (
            <circle
              cx={originPt[0]}
              cy={originPt[1]}
              r="5.5"
              fill="#f97316"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          )}
          {destPt && (
            <circle
              cx={destPt[0]}
              cy={destPt[1]}
              r="5.5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* Floating Route Telemetry Strip */}
        {route ? (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Navigation2 className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">
                  {route.origin.shortName} → {route.destination.shortName}
                </div>
                <div className="text-[11px] text-slate-400">{route.corridor}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-slate-400 block">Distancia</span>
                <span className="font-bold text-white">
                  {route.distanceKm.toLocaleString('es-AR')} km
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tiempo</span>
                <span className="font-bold text-emerald-400">
                  {route.durationHours} hs
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-400 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>
              Haz clic en un nodo o ingresa origen y destino para trazar la ruta OSRM sobre OpenStreetMap.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
