import { useMemo, useState } from 'react';
import { MapPin, Navigation2, LocateFixed, ExternalLink } from 'lucide-react';
import type { B2BCompanyRecord } from '../lib/b2bDirectoryData';
import { getNavigationDeepLinks } from '../lib/mobileDirectoryDownloads';
import { haversineKm } from '../lib/patagoniaRouting';

interface PatagoniaDirectoryMapProps {
  companies: B2BCompanyRecord[];
  selectedCompanyId: string | null;
  onSelectCompany: (company: B2BCompanyRecord) => void;
  userCoords: { lat: number; lng: number; label: string } | null;
  onRequestGps: () => void;
  isMemberAuthorized: boolean;
}

type MapFocusRegion = 'all' | 'neuquen' | 'chubut' | 'austral';

const REGION_VIEWBOX: Record<MapFocusRegion, { minLng: number; maxLng: number; maxLat: number; minLat: number; label: string }> = {
  all: { minLng: -73.8, maxLng: -56.5, maxLat: -30.5, minLat: -55.8, label: 'Toda la Red' },
  neuquen: { minLng: -72.2, maxLng: -66.5, maxLat: -36.8, minLat: -41.8, label: 'Vaca Muerta / NQN' },
  chubut: { minLng: -72.0, maxLng: -64.2, maxLat: -42.0, minLat: -47.2, label: 'Golfo San Jorge / Chubut' },
  austral: { minLng: -73.6, maxLng: -66.0, maxLat: -47.0, minLat: -55.5, label: 'Patagonia Austral' },
};

const SVG_W = 540;
const SVG_H = 580;

const CONTINENTAL_SILHOUETTE_COORDS: [number, number][] = [
  [-64.5, -31.0], [-60.2, -32.2], [-58.1, -34.4], [-57.3, -36.3],
  [-58.5, -38.5], [-62.1, -38.9], [-62.5, -40.8], [-64.9, -41.1],
  [-64.2, -42.8], [-65.2, -43.3], [-66.5, -45.1], [-67.4, -45.9],
  [-67.4, -46.8], [-65.8, -47.8], [-67.7, -49.3], [-68.6, -50.8],
  [-69.0, -51.7], [-68.5, -52.4], [-67.6, -53.8], [-66.2, -54.8],
  [-68.6, -55.0], [-71.2, -53.9], [-72.8, -51.6], [-73.2, -49.5],
  [-71.9, -46.8], [-71.7, -43.2], [-71.8, -41.0], [-71.2, -38.8],
  [-70.3, -36.5], [-69.8, -33.0], [-66.5, -31.2], [-64.5, -31.0],
];

const RN3_LINE: [number, number][] = [
  [-58.38, -34.6], [-62.26, -38.71], [-62.99, -40.81], [-65.03, -42.76],
  [-65.3, -43.24], [-67.49, -45.86], [-67.52, -46.43], [-69.21, -51.62],
  [-67.7, -53.78], [-68.3, -54.8],
];
const RN22_LINE: [number, number][] = [
  [-62.26, -38.71], [-67.99, -38.93], [-68.05, -38.95], [-68.78, -38.35],
];
const RN40_LINE: [number, number][] = [
  [-68.92, -37.38], [-71.31, -41.13], [-71.31, -42.91], [-70.6, -46.5],
  [-72.26, -50.33], [-69.21, -51.62],
];

export default function PatagoniaDirectoryMap({
  companies,
  selectedCompanyId,
  onSelectCompany,
  userCoords,
  onRequestGps,
  isMemberAuthorized,
}: PatagoniaDirectoryMapProps) {
  const [region, setRegion] = useState<MapFocusRegion>('all');
  const bounds = REGION_VIEWBOX[region];

  const projectPoint = (lng: number, lat: number): [number, number] => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * SVG_W;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * SVG_H;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  };

  const coordsToPath = (coords: [number, number][]) =>
    coords
      .map(([lng, lat], idx) => {
        const [x, y] = projectPoint(lng, lat);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) || companies[0] || null,
    [companies, selectedCompanyId]
  );

  // Offset overlapping city pins deterministically in a compact radial spiral so every actor can be clicked
  const positionedCompanies = useMemo(() => {
    const coordCount = new Map<string, number>();
    return companies.map((company) => {
      const lat = Number(company.adnComercial?.lat ?? -45.8641);
      const lng = Number(company.adnComercial?.lng ?? -67.4966);
      const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      const seen = coordCount.get(key) || 0;
      coordCount.set(key, seen + 1);
      const [baseX, baseY] = projectPoint(lng, lat);
      const angle = seen * 1.15;
      const radius = seen === 0 ? 0 : Math.min(18, 6 + seen * 2.2);
      const x = baseX + Math.cos(angle) * radius;
      const y = baseY + Math.sin(angle) * radius;
      return { company, x, y, lat, lng };
    });
  }, [companies, region]);

  const userPoint = userCoords ? projectPoint(userCoords.lng, userCoords.lat) : null;
  const selectedLinks = selectedCompany ? getNavigationDeepLinks(selectedCompany) : null;
  const distanceFromUserKm =
    selectedCompany && userCoords
      ? Math.round(
          haversineKm(
            userCoords.lat,
            userCoords.lng,
            Number(selectedCompany.adnComercial?.lat ?? -45.8641),
            Number(selectedCompany.adnComercial?.lng ?? -67.4966)
          ) * 1.24
        )
      : null;

  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
          <span>Mapa Georreferenciado B2B ({companies.length})</span>
        </div>
        <button
          type="button"
          onClick={onRequestGps}
          className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          {userCoords ? userCoords.label : 'Mi GPS'}
        </button>
      </div>

      {/* Region Zoom Pills */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto">
        {(Object.keys(REGION_VIEWBOX) as MapFocusRegion[]).map((regKey) => (
          <button
            key={regKey}
            type="button"
            onClick={() => setRegion(regKey)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              region === regKey
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {REGION_VIEWBOX[regKey].label}
          </button>
        ))}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[540/520] max-h-[500px] bg-[#090d16] p-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-full select-none"
          role="img"
          aria-label="Mapa georreferenciado de empresas y profesionales en Patagonia"
        >
          <defs>
            <linearGradient id="dirLandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.96" />
            </linearGradient>
          </defs>

          {[-35, -40, -45, -50, -55].map((lat) => {
            const [, y] = projectPoint(bounds.minLng, lat);
            if (y < 0 || y > SVG_H) return null;
            return (
              <g key={lat}>
                <line x1={0} y1={y} x2={SVG_W} y2={y} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 4" />
                <text x={8} y={y - 4} fill="#475569" fontSize="9" fontFamily="monospace">
                  {Math.abs(lat)}°S
                </text>
              </g>
            );
          })}

          <path
            d={coordsToPath(CONTINENTAL_SILHOUETTE_COORDS)}
            fill="url(#dirLandGrad)"
            stroke="#334155"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          <path d={coordsToPath(RN3_LINE)} fill="none" stroke="#334155" strokeWidth="1.4" strokeDasharray="4 3" />
          <path d={coordsToPath(RN22_LINE)} fill="none" stroke="#334155" strokeWidth="1.4" strokeDasharray="4 3" />
          <path d={coordsToPath(RN40_LINE)} fill="none" stroke="#334155" strokeWidth="1.4" strokeDasharray="4 3" />

          {/* User GPS Beacon */}
          {userPoint && userPoint[0] >= 0 && userPoint[0] <= SVG_W && userPoint[1] >= 0 && userPoint[1] <= SVG_H && (
            <g>
              <circle cx={userPoint[0]} cy={userPoint[1]} r="13" fill="#06b6d4" fillOpacity="0.22" />
              <circle cx={userPoint[0]} cy={userPoint[1]} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* Company Pins */}
          {positionedCompanies.map(({ company, x, y }) => {
            if (x < -10 || x > SVG_W + 10 || y < -10 || y > SVG_H + 10) return null;
            const isSelected = selectedCompany?.id === company.id;
            const pinColor = isSelected
              ? '#10b981'
              : company.tier === 'corporativo'
              ? '#a855f7'
              : company.tier === 'pro'
              ? '#f97316'
              : '#94a3b8';

            return (
              <g
                key={company.id}
                onClick={() => onSelectCompany(company)}
                className="cursor-pointer"
              >
                {isSelected && (
                  <circle cx={x} cy={y} r="13" fill="#10b981" fillOpacity="0.28" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6.5 : 4.5}
                  fill={pinColor}
                  stroke="#090d16"
                  strokeWidth="1.6"
                />
                {isSelected && (
                  <text
                    x={x > SVG_W * 0.65 ? x - 10 : x + 10}
                    y={y + 3}
                    textAnchor={x > SVG_W * 0.65 ? 'end' : 'start'}
                    fill="#ffffff"
                    fontSize="10.5"
                    fontWeight="700"
                  >
                    {company.city}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend Strip */}
        <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-sm border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />Corp</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Pro</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Activo</span>
        </div>
      </div>

      {/* Active Pin Card + Native Navigation Deep Links */}
      {selectedCompany && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-orange-400">
                {selectedCompany.city}, {selectedCompany.province}
                {distanceFromUserKm !== null && (
                  <span className="font-mono tabular-nums text-emerald-400">
                    {' '}· ~{distanceFromUserKm.toLocaleString('es-AR')} km
                  </span>
                )}
              </p>
              <h3 className="text-sm font-bold text-white truncate">{selectedCompany.name}</h3>
              <p className="text-[11px] text-slate-400">
                {selectedCompany.adnComercial.corredorLogistico}
                {isMemberAuthorized && (
                  <span className="font-mono tabular-nums text-slate-300">
                    {' '}· {Number(selectedCompany.adnComercial.lat).toFixed(4)},{' '}
                    {Number(selectedCompany.adnComercial.lng).toFixed(4)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {selectedLinks && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-400 inline-flex items-center gap-1">
                <Navigation2 className="w-3.5 h-3.5 text-emerald-400" /> Abrir ruta en:
              </span>
              <a
                href={selectedLinks.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold inline-flex items-center gap-1"
              >
                Google Maps <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={selectedLinks.waze}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold inline-flex items-center gap-1"
              >
                Waze <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={selectedLinks.openStreetMap}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1"
              >
                OSM <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
