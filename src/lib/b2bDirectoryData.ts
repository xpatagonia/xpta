import { db, auth, collection, addDoc, serverTimestamp } from './db';
import { getApiUrl } from './apiConfig';
import { haversineKm } from './patagoniaRouting';
import type { CompanyServiceItem, TaxDisplayMode } from './taxPricing';

export type SubscriptionTier = 'corporativo' | 'pro' | 'inicial';
export type DirectoryEntityType = 'empresa' | 'emprendimiento' | 'profesional' | 'servicio';

export const ENTITY_TYPE_CONFIG: Record<
  DirectoryEntityType,
  {
    label: string;
    pluralLabel: string;
    description: string;
  }
> = {
  empresa: {
    label: 'Empresa',
    pluralLabel: 'Empresas',
    description: 'Contratistas, fabricantes y proveedoras industriales consolidadas.',
  },
  emprendimiento: {
    label: 'Emprendimiento',
    pluralLabel: 'Emprendimientos',
    description: 'Proyectos productivos, pymes nacientes y startups tecnológicas regionales.',
  },
  profesional: {
    label: 'Profesional',
    pluralLabel: 'Profesionales',
    description: 'Ingenieros, auditores ambientales, despachantes y especialistas matriculados.',
  },
  servicio: {
    label: 'Servicio Industrial',
    pluralLabel: 'Servicios',
    description: 'Prestaciones técnicas en campo, ensayos, izajes, calibración y mantenimiento.',
  },
};

export interface AdnComercial {
  ofrece: string[];
  demanda: string[];
  corredorLogistico: string;
  ciudadBase: string;
  lat: number;
  lng: number;
  isExtraRegional?: boolean;
}

export interface B2BCompanyRecord {
  id: string;
  entityType: DirectoryEntityType;
  name: string;
  cuit: string;
  tier: SubscriptionTier;
  tierPriority: number; // 1 = Corporativo, 2 = Pro Industrial, 3 = Inicial
  tierLabel: string;
  verified: boolean;
  category: string;
  subcategories: string[];
  province: string;
  city: string;
  employeeCount: string;
  credentialLabel?: string;
  serviceModality?: string;
  publicSummary: string;
  // Member-gated commercial & CRM fields
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  certifications: string[];
  paymentTerms: string;
  creditRating: string;
  adnComercial: AdnComercial;
  // Service catalog & tax pricing control
  priceDisplayMode?: TaxDisplayMode;
  defaultTaxRatePercent?: number;
  serviceItems?: CompanyServiceItem[];
  active?: boolean;
}

export const TIER_CONFIG: Record<
  SubscriptionTier,
  {
    label: string;
    priority: number;
    badgeBg: string;
    badgeText: string;
    borderAccent: string;
  }
> = {
  corporativo: {
    label: 'Plan Corporativo',
    priority: 1,
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    badgeText: 'text-purple-600 dark:text-purple-300',
    borderAccent: 'border-purple-500/40 dark:border-purple-500/30',
  },
  pro: {
    label: 'Plan Pro Industrial',
    priority: 2,
    badgeBg: 'bg-orange-500/15 border-orange-500/30',
    badgeText: 'text-orange-600 dark:text-orange-400',
    borderAccent: 'border-orange-500/35 dark:border-orange-500/25',
  },
  inicial: {
    label: 'Plan Inicial',
    priority: 3,
    badgeBg: 'bg-slate-200/70 dark:bg-white/10 border-slate-300 dark:border-white/10',
    badgeText: 'text-slate-600 dark:text-slate-400',
    borderAccent: 'border-slate-200 dark:border-white/10',
  },
};

export const B2B_COMPANIES: B2BCompanyRecord[] = [
  {
    id: 'comp-petrosur',
    entityType: 'empresa',
    name: 'PetroSur Ingeniería & Fluidos S.A.',
    cuit: '30-71489210-9',
    tier: 'corporativo',
    tierPriority: 1,
    tierLabel: 'Plan Corporativo',
    verified: true,
    category: 'Hidrocarburos (Oil & Gas)',
    subcategories: ['Válvulas API 6D', 'Montaje de Ductos', 'Telemetría de Pozos'],
    province: 'Neuquén',
    city: 'Añelo / Neuquén Capital',
    employeeCount: '201-500',
    publicSummary:
      'Ingeniería de superficie, provisión de válvulas de alta presión y mantenimiento integral para yacimientos en Cuenca Neuquina y Golfo San Jorge.',
    contactName: 'Ing. Carlos Mendoza',
    contactRole: 'Director Comercial & Licitaciones',
    email: 'cmendoza@petrosur-b2b.com.ar',
    phone: '+54 9 299 482-9100',
    whatsapp: '+5492994829100',
    website: 'https://petrosur-b2b.com.ar',
    certifications: ['ISO 9001', 'ISO 14001', 'API Spec Q1'],
    paymentTerms: 'Cuenta Corriente 30/60 días • Factura A / MiPyME',
    creditRating: 'AAA+ (Riesgo Corporativo Auditado)',
    adnComercial: {
      ofrece: ['Válvulas API 6D', 'Montaje de Ductos', 'Telemetría'],
      demanda: ['Mecanizado CNC', 'Bridas Forjadas', 'Flete Pesado desde Rosario'],
      corredorLogistico: 'RN 22 / Añelo (Vaca Muerta)',
      ciudadBase: 'Añelo (Hub Vaca Muerta)',
      lat: -38.3522,
      lng: -68.7897,
    },
  },
  {
    id: 'comp-logistica-austral',
    entityType: 'empresa',
    name: 'Logística Austral Multimodal S.R.L.',
    cuit: '30-68923415-4',
    tier: 'corporativo',
    tierPriority: 1,
    tierLabel: 'Plan Corporativo',
    verified: true,
    category: 'Logística',
    subcategories: ['Cargas Especiales', 'Cadena de Frío -25°C', 'Depósito Fiscal'],
    province: 'Chubut',
    city: 'Comodoro Rivadavia / Puerto Madryn',
    employeeCount: '51-200',
    publicSummary:
      'Operador logístico patagónico con flota propia de carretones, transporte refrigerado para exportación pesquera y bases operativas en Ruta 3 y Ruta 40.',
    contactName: 'Lic. Valeria Albornoz',
    contactRole: 'Gerente de Operaciones B2B',
    email: 'valbornoz@logisticaaustral.com.ar',
    phone: '+54 9 297 431-8820',
    whatsapp: '+5492974318820',
    website: 'https://logisticaaustral.com.ar',
    certifications: ['ISO 9001', 'SENASA Hab. Frío', 'Cargas Peligrosas IMO'],
    paymentTerms: 'Transferencia / Echeq 30 días • Convenio Flota',
    creditRating: 'AA+ (Cumplimiento Verificado)',
    adnComercial: {
      ofrece: ['Flete LTL Consolidado', 'Retorno Vacío RN 3', 'Cadena de Frío -25°C'],
      demanda: ['Cargas Norte → Sur', 'Insumos de Flota', 'Paletizado Isotérmico'],
      corredorLogistico: 'Ruta Nacional 3 (Buenos Aires ↔ Ushuaia)',
      ciudadBase: 'Comodoro Rivadavia (Golfo San Jorge)',
      lat: -45.8641,
      lng: -67.4966,
    },
  },
  {
    id: 'comp-eolica-sur',
    entityType: 'empresa',
    name: 'RenovaPatagonia Electromecánica S.A.',
    cuit: '30-71550932-1',
    tier: 'corporativo',
    tierPriority: 1,
    tierLabel: 'Plan Corporativo',
    verified: true,
    category: 'Energías Renovables',
    subcategories: ['Subestaciones', 'Mantenimiento Aerogeneradores', 'Paneles Industriales'],
    province: 'Santa Cruz',
    city: 'Río Gallegos / Pico Truncado',
    employeeCount: '51-200',
    publicSummary:
      'Montaje electromecánico de parques eólicos, tendido de líneas de media y alta tensión e integración de sistemas híbridos industriales.',
    contactName: 'Ing. Martín Echeverría',
    contactRole: 'Jefe de Desarrollo de Negocios',
    email: 'mecheverria@renovapatagonia.com.ar',
    phone: '+54 9 2966 55-1490',
    whatsapp: '+5492966551490',
    website: 'https://renovapatagonia.com.ar',
    certifications: ['ISO 45001', 'IRAM', 'CAMMESA Homologado'],
    paymentTerms: 'Certificación por Avance de Obra • 15/45 días',
    creditRating: 'AAA (Proveedor Homologado)',
    adnComercial: {
      ofrece: ['Subestaciones MT/AT', 'Tableros SCADA', 'Montaje Eólico'],
      demanda: ['Transformadores desde Córdoba', 'Carretones Especiales', 'EPP Altura'],
      corredorLogistico: 'RN 3 / Pico Truncado - Río Gallegos',
      ciudadBase: 'Río Gallegos',
      lat: -51.6226,
      lng: -69.2181,
    },
  },
  {
    id: 'comp-rosario-forja',
    entityType: 'empresa',
    name: 'Forja & Válvulas del Paraná S.A. (Proveedor Extra-Regional)',
    cuit: '30-70841299-8',
    tier: 'corporativo',
    tierPriority: 1,
    tierLabel: 'Plan Corporativo',
    verified: true,
    category: 'Metalúrgica',
    subcategories: ['Bridas Forjadas ANSI', 'Mecanizado CNC Pesado', 'Válvulas de Proceso'],
    province: 'Santa Fe (Envío Patagonia)',
    city: 'Rosario, Santa Fe → Corredor Sur',
    employeeCount: '51-200',
    publicSummary:
      'Fabricante santafesino de bridas forjadas, cuerpos de válvulas API y repuestos mecanizados CNC con despacho consolidado LTL hacia Cuenca Neuquina y Golfo San Jorge.',
    contactName: 'Ing. Federico Brizuela',
    contactRole: 'Gerente de Cuentas Patagónicas',
    email: 'fbrizuela@forjaparana.com.ar',
    phone: '+54 9 341 590-4410',
    whatsapp: '+5493415904410',
    website: 'https://forjaparana.com.ar',
    certifications: ['ISO 9001', 'API 6A / 6D', 'ASME VIII'],
    paymentTerms: 'Cuenta Corriente 45 días • Flete Consolidado LTL',
    creditRating: 'AA+ (Exportador / Proveedor Industrial)',
    adnComercial: {
      ofrece: ['Bridas Forjadas', 'Mecanizado CNC', 'Cuerpos API 6D'],
      demanda: ['Flete Consolidado Rosario → Añelo', 'Depósito Cross-Docking Neuquén'],
      corredorLogistico: 'Rosario → RN 152 → Neuquén / Añelo',
      ciudadBase: 'Rosario (Polo Industrial)',
      lat: -32.9442,
      lng: -60.6505,
      isExtraRegional: true,
    },
  },
  {
    id: 'comp-metalurgica-andina',
    entityType: 'empresa',
    name: 'Metalúrgica Golfo San Jorge S.A.',
    cuit: '30-70112984-7',
    tier: 'pro',
    tierPriority: 2,
    tierLabel: 'Plan Pro Industrial',
    verified: true,
    category: 'Metalúrgica',
    subcategories: ['Mecanizado CNC', 'Estructuras Metálicas', 'Tanques API'],
    province: 'Chubut',
    city: 'Parque Industrial Comodoro Rivadavia',
    employeeCount: '11-50',
    publicSummary:
      'Fabricación de estructuras metálicas pesadas, skids de bombeo, recipientes sometidos a presión y tornería CNC de precisión.',
    contactName: 'Téc. Roberto Mansilla',
    contactRole: 'Responsable de Presupuestos',
    email: 'cotizaciones@metalgolfo.com.ar',
    phone: '+54 9 297 492-3310',
    whatsapp: '+5492974923310',
    website: 'https://metalgolfo.com.ar',
    certifications: ['ISO 9001', 'Soldadura Calificada ASME IX'],
    paymentTerms: '50% Anticipo / 50% Contra Entrega (Echeq 30 días)',
    creditRating: 'AA (Verificado en Red)',
    adnComercial: {
      ofrece: ['Mecanizado CNC', 'Skids de Bombeo', 'Tanques API'],
      demanda: ['Chapa Naval / Acero F24', 'Electrodos Especiales', 'Flete LTL'],
      corredorLogistico: 'RN 3 / Cuenca Golfo San Jorge',
      ciudadBase: 'Comodoro Rivadavia (Golfo San Jorge)',
      lat: -45.8641,
      lng: -67.4966,
    },
  },
  {
    id: 'comp-cordoba-electromec',
    entityType: 'empresa',
    name: 'Potencia & Transformadores Córdoba S.A. (Proveedor Extra-Regional)',
    cuit: '30-69441822-3',
    tier: 'pro',
    tierPriority: 2,
    tierLabel: 'Plan Pro Industrial',
    verified: true,
    category: 'Equipamiento Industrial',
    subcategories: ['Transformadores MT', 'Celdas de Media Tensión', 'Grupos Electrógenos'],
    province: 'Córdoba (Envío Patagonia)',
    city: 'Córdoba Capital → Corredor Patagónico',
    employeeCount: '51-200',
    publicSummary:
      'Ingeniería eléctrica industrial desde Córdoba para parques eólicos, yacimientos y plantas pesqueras en Patagonia con despacho por carga consolidada.',
    contactName: 'Ing. Marcos Villagra',
    contactRole: 'Director Comercial Regional',
    email: 'mvillagra@potenciacba.com.ar',
    phone: '+54 9 351 478-9200',
    whatsapp: '+5493514789200',
    website: 'https://potenciacba.com.ar',
    certifications: ['ISO 9001', 'IRAM 2250'],
    paymentTerms: 'Anticipo 30% + Echeq 30/60 días',
    creditRating: 'AA (Verificado en Red)',
    adnComercial: {
      ofrece: ['Transformadores MT', 'Grupos Electrógenos', 'Celdas Eléctricas'],
      demanda: ['Carretón Córdoba → Santa Cruz', 'Flete Retorno Vacío RN 40/RN 3'],
      corredorLogistico: 'Córdoba → RN 158 / RN 35 → Patagonia',
      ciudadBase: 'Córdoba Capital (Parque Industrial)',
      lat: -31.4201,
      lng: -64.1888,
      isExtraRegional: true,
    },
  },
  {
    id: 'comp-austral-naval',
    entityType: 'empresa',
    name: 'Servicios Navales & Pesqueros Australes S.R.L.',
    cuit: '30-71204918-3',
    tier: 'pro',
    tierPriority: 2,
    tierLabel: 'Plan Pro Industrial',
    verified: true,
    category: 'Industria Pesquera',
    subcategories: ['Refrigeración Naval', 'Insumos de Planta', 'Envases Exportación'],
    province: 'Tierra del Fuego',
    city: 'Ushuaia / Río Grande',
    employeeCount: '11-50',
    publicSummary:
      'Provisión de equipamiento frigorífico para buques factoría, repuestos navales y packaging isotérmico para plantas procesadoras.',
    contactName: 'Hernán Giordano',
    contactRole: 'Socio Gerente Comercial',
    email: 'hgiordano@navalesaustrales.com.ar',
    phone: '+54 9 2901 61-2040',
    whatsapp: '+5492901612040',
    website: 'https://navalesaustrales.com.ar',
    certifications: ['Prefectura Naval Reg.', 'SENASA'],
    paymentTerms: 'Cuenta Corriente 30 días • USD Oficial',
    creditRating: 'AA (Verificado en Red)',
    adnComercial: {
      ofrece: ['Refrigeración Industrial', 'Packaging Isotérmico', 'Repuestos Navales'],
      demanda: ['Cadena de Frío -25°C hacia Buenos Aires', 'Gases Refrigerantes'],
      corredorLogistico: 'RN 3 / Canal Beagle → Puerto Madryn / CABA',
      ciudadBase: 'Ushuaia (Puerto Austral)',
      lat: -54.8019,
      lng: -68.303,
    },
  },
  {
    id: 'comp-constructora-valle',
    entityType: 'empresa',
    name: 'Obras Civiles & Movimiento de Suelos Alto Valle S.A.',
    cuit: '30-69884120-2',
    tier: 'pro',
    tierPriority: 2,
    tierLabel: 'Plan Pro Industrial',
    verified: true,
    category: 'Construcción',
    subcategories: ['Locaciones Petroleras', 'Hormigón Elaborado', 'Naves Industriales'],
    province: 'Río Negro',
    city: 'Cipolletti / General Roca',
    employeeCount: '51-200',
    publicSummary:
      'Construcción de plateas industriales, apertura de trazas, movimiento de suelos con flota Caterpillar y montaje de galpones llave en mano.',
    contactName: 'Arq. Lucía Ferreyra',
    contactRole: 'Gerencia Técnica & Licitaciones',
    email: 'lferreyra@obrasaltovalle.com.ar',
    phone: '+54 9 299 512-7740',
    whatsapp: '+5492995127740',
    website: 'https://obrasaltovalle.com.ar',
    certifications: ['Registro Nacional de Constructores', 'ISO 9001'],
    paymentTerms: 'Certificación Quincenal / Mensual',
    creditRating: 'AA (Verificado en Red)',
    adnComercial: {
      ofrece: ['Locaciones Petroleras', 'Naves Industriales', 'Hormigón Elaborado'],
      demanda: ['Estructuras Metálicas', 'Indumentaria Ignífuga', 'Alquiler de Maquinaria'],
      corredorLogistico: 'RN 22 / Alto Valle → Vaca Muerta',
      ciudadBase: 'Cipolletti / General Roca (Alto Valle)',
      lat: -38.9339,
      lng: -67.9903,
    },
  },
  {
    id: 'comp-seguridad-epp',
    entityType: 'empresa',
    name: 'Seguridad Industrial Sur & EPP S.R.L.',
    cuit: '30-71609211-5',
    tier: 'inicial',
    tierPriority: 3,
    tierLabel: 'Plan Inicial',
    verified: false,
    category: 'Seguridad e Higiene (EPP)',
    subcategories: ['Indumentaria Ignífuga', 'Detectores de Gases', 'Calzado Dielectrico'],
    province: 'Neuquén',
    city: 'Neuquén Capital',
    employeeCount: '1-10',
    publicSummary:
      'Distribución mayorista de indumentaria ignífuga certificada, protección respiratoria y elementos de seguridad en altura.',
    contactName: 'Diego Quiroga',
    contactRole: 'Ventas Corporativas',
    email: 'ventas@eppsur.com.ar',
    phone: '+54 9 299 419-0023',
    whatsapp: '+5492994190023',
    website: 'https://eppsur.com.ar',
    certifications: ['Sello IRAM'],
    paymentTerms: 'Contado / Transferencia / Echeq 15 días',
    creditRating: 'A (Inicial)',
    adnComercial: {
      ofrece: ['Indumentaria Ignífuga', 'EPP Altura', 'Detectores de Gases'],
      demanda: ['Logística Última Milla Vaca Muerta', 'Stock Térmico'],
      corredorLogistico: 'RN 22 / Neuquén - Añelo',
      ciudadBase: 'Neuquén Capital (Parque Industrial)',
      lat: -38.9516,
      lng: -68.0591,
    },
  },
  {
    id: 'comp-agro-patagonia',
    entityType: 'empresa',
    name: 'AgroTecnología Valle Inferior S.A.',
    cuit: '30-70991823-6',
    tier: 'inicial',
    tierPriority: 3,
    tierLabel: 'Plan Inicial',
    verified: false,
    category: 'Agroindustria',
    subcategories: ['Riego Automatizado', 'Insumos Ganaderos', 'Telemetría Rural'],
    province: 'Río Negro',
    city: 'Viedma',
    employeeCount: '11-50',
    publicSummary:
      'Sistemas de riego por pivote central, bombas solares sumergibles e insumos para establecimientos ovinos y bovinos.',
    contactName: 'Ing. Agr. Sofía Peralta',
    contactRole: 'Asesora Técnica Comercial',
    email: 'speralta@agrovalle.com.ar',
    phone: '+54 9 2920 44-8910',
    whatsapp: '+5492920448910',
    website: 'https://agrovalle.com.ar',
    certifications: ['INTI'],
    paymentTerms: 'Canje Cereal / Tarjetas Agro / 30 días',
    creditRating: 'A (Inicial)',
    adnComercial: {
      ofrece: ['Bombas Solares', 'Riego Automatizado', 'Telemetría Rural'],
      demanda: ['Retorno Vacío Viedma → Buenos Aires', 'Tableros Solares'],
      corredorLogistico: 'RN 3 / Viedma - Bahía Blanca',
      ciudadBase: 'Viedma (Valle Inferior)',
      lat: -40.8135,
      lng: -62.9967,
    },
  },
  {
    id: 'emp-sensores-vaca-muerta',
    entityType: 'emprendimiento',
    name: 'Patagonia IoT & Telemetría de Campo (Emprendimiento)',
    cuit: '30-71834012-4',
    tier: 'pro',
    tierPriority: 2,
    tierLabel: 'Plan Pro Industrial',
    verified: true,
    category: 'Tecnología e Innovación',
    subcategories: ['Sensores LoRaWAN', 'Monitoreo de Tanques', 'Telemetría Solar'],
    province: 'Neuquén',
    city: 'Neuquén Capital',
    employeeCount: '1-10',
    credentialLabel: 'Incubado Polo Tecnológico Neuquén · Estadio Escalado',
    serviceModality: 'Despliegue rápido en yacimientos y plantas',
    publicSummary:
      'Emprendimiento de base tecnológica dedicado a sensores autónomos con panel solar para medición de nivel, presión y temperatura en baterías y cisternas remotas.',
    contactName: 'Ing. Tomás Benítez',
    contactRole: 'Co-fundador & Arquitectura IoT',
    email: 'tbenitez@patagoniaiot.com.ar',
    phone: '+54 9 299 583-1190',
    whatsapp: '+5492995831190',
    website: 'https://patagoniaiot.com.ar',
    certifications: ['ENACOM Homologado', 'IP67 ATEX Zona 2'],
    paymentTerms: 'Suscripción Hardware-as-a-Service o Compra Directa',
    creditRating: 'AA (Emprendimiento Validado)',
    adnComercial: {
      ofrece: ['Sensores LoRaWAN', 'Telemetría de Tanques', 'Alertas en Campo'],
      demanda: ['Gabinetes Estancos', 'Baterías LiFePO4', 'Montaje Eléctrico'],
      corredorLogistico: 'RN 22 / Neuquén - Añelo',
      ciudadBase: 'Neuquén Capital',
      lat: -38.9516,
      lng: -68.0591,
    },
  },
  {
    id: 'emp-ecored-marina',
    entityType: 'emprendimiento',
    name: 'EcoRed Austral · Economía Circular Pesquera',
    cuit: '30-71802914-9',
    tier: 'inicial',
    tierPriority: 3,
    tierLabel: 'Plan Inicial',
    verified: true,
    category: 'Medio Ambiente y Sustentabilidad',
    subcategories: ['Reciclaje de Redes', 'Pallets Plásticos', 'Trazabilidad Triple Impacto'],
    province: 'Chubut',
    city: 'Puerto Madryn',
    employeeCount: '1-10',
    credentialLabel: 'Certificación Triple Impacto · Planta Piloto Madryn',
    serviceModality: 'Retiro programado en puertos patagónicos',
    publicSummary:
      'Emprendimiento industrial que recupera cajones, cabos y redes pesqueras en desuso para fabricar pellets y pallets plásticos industriales resistentes al frío extremo.',
    contactName: 'Lic. Camila Herrera',
    contactRole: 'Directora Productiva',
    email: 'cherrera@ecoredaustral.com.ar',
    phone: '+54 9 280 462-8830',
    whatsapp: '+5492804628830',
    website: 'https://ecoredaustral.com.ar',
    certifications: ['Registro Ambiental Chubut', 'Triple Impacto'],
    paymentTerms: 'Canje por Gestión de Residuo / Cuenta 15 días',
    creditRating: 'A+ (Verificado)',
    adnComercial: {
      ofrece: ['Pallets Plásticos Frío', 'Certificados de Valorización', 'Recolección Portuaria'],
      demanda: ['Transporte Retorno Puerto Madryn → Rawson', 'Molienda Industrial'],
      corredorLogistico: 'RN 3 / Puerto Madryn - Rawson',
      ciudadBase: 'Puerto Madryn',
      lat: -42.7692,
      lng: -65.0385,
    },
  },
  {
    id: 'prof-eia-bariloche',
    entityType: 'profesional',
    name: 'Ing. Amb. Mariana Ledesma · Consultora Ambiental',
    cuit: '27-31445908-3',
    tier: 'corporativo',
    tierPriority: 1,
    tierLabel: 'Plan Corporativo',
    verified: true,
    category: 'Medio Ambiente y Sustentabilidad',
    subcategories: ['Estudios EIA', 'Auditoría ISO 14001', 'Gestión de Efluentes'],
    province: 'Río Negro',
    city: 'San Carlos de Bariloche / Alto Valle',
    employeeCount: 'Profesional Matriculado',
    credentialLabel: 'Matrícula Profesional RN-4418 · Perito Ambiental',
    serviceModality: 'Auditoría en campo y dirección técnica remota',
    publicSummary:
      'Ingeniera ambiental matriculada con 14 años en evaluación de impacto ambiental, habilitaciones provinciales para locaciones hidrocarburíferas y planes de cierre.',
    contactName: 'Ing. Mariana Ledesma',
    contactRole: 'Titular & Auditora Líder ISO 14001',
    email: 'mledesma@consultora-andes.com.ar',
    phone: '+54 9 294 455-7120',
    whatsapp: '+5492944557120',
    website: 'https://consultora-andes.com.ar',
    certifications: ['Registro Provincial EIA', 'Auditora IRAM ISO 14001'],
    paymentTerms: 'Honorarios por Etapa / Factura A',
    creditRating: 'AAA (Matrícula Verificada)',
    adnComercial: {
      ofrece: ['Estudios de Impacto Ambiental', 'Auditoría ISO 14001', 'Habilitaciones'],
      demanda: ['Muestreo de Suelos Certificado', 'Laboratorios Químicos', 'Drones LiDAR'],
      corredorLogistico: 'RN 40 / Bariloche - Neuquén',
      ciudadBase: 'San Carlos de Bariloche',
      lat: -41.1335,
      lng: -71.3103,
    },
  },
  {
    id: 'prof-aduanero-ushuaia',
    entityType: 'profesional',
    name: 'Lic. Esteban Márquez · Despachante de Aduana & Comex',
    cuit: '20-28903411-7',
    tier: 'pro',
    tierPriority: 2,
    tierLabel: 'Plan Pro Industrial',
    verified: true,
    category: 'Servicios Profesionales',
    subcategories: ['Despacho Aduanero', 'Subrégimen Tierra del Fuego', 'Importación Temporal'],
    province: 'Tierra del Fuego',
    city: 'Río Grande / Ushuaia',
    employeeCount: 'Profesional Matriculado',
    credentialLabel: 'Matrícula ARCA/Aduana TDF-892 · Comex Austral',
    serviceModality: 'Gestión aduanera en puertos y pasos fronterizos',
    publicSummary:
      'Especialista en nacionalización de maquinaria pesada, importación temporal de equipos para yacimientos y operatoria aduanera Ley 19.640 en Tierra del Fuego.',
    contactName: 'Lic. Esteban Márquez',
    contactRole: 'Despachante Matriculado',
    email: 'emarquez@comexaustral.com.ar',
    phone: '+54 9 2964 41-8890',
    whatsapp: '+5492964418890',
    website: 'https://comexaustral.com.ar',
    certifications: ['Registro Despachantes ARCA', 'OEA Asesor'],
    paymentTerms: 'Honorarios Mensuales o por Despacho',
    creditRating: 'AA+ (Matrícula Verificada)',
    adnComercial: {
      ofrece: ['Importación Maquinaria', 'Tránsito Aduanero RN 3', 'Subrégimen Industrial'],
      demanda: ['Transporte Carretero Internacional', 'Depósito Fiscal', 'Seguros Caución'],
      corredorLogistico: 'RN 3 / San Sebastián - Río Grande - Ushuaia',
      ciudadBase: 'Río Grande',
      lat: -53.7877,
      lng: -67.7095,
    },
  },
  {
    id: 'serv-ndt-golfo',
    entityType: 'servicio',
    name: 'Austral NDT · Ensayos No Destructivos & Calibración',
    cuit: '30-71330845-2',
    tier: 'corporativo',
    tierPriority: 1,
    tierLabel: 'Plan Corporativo',
    verified: true,
    category: 'Servicios',
    subcategories: ['Ultrasonido Phased Array', 'Gammagrafía Industrial', 'Calibración Válvulas'],
    province: 'Chubut',
    city: 'Comodoro Rivadavia / Las Heras',
    employeeCount: '11-50',
    credentialLabel: 'Laboratorio Móvil ISO/IEC 17025 · Nivel III ASNT',
    serviceModality: 'Unidades móviles 24/7 en boca de pozo y planta',
    publicSummary:
      'Servicio técnico especializado en inspección de soldaduras en ductos, ultrasonido Phased Array, partículas magnetizables y calibración trazable de válvulas de seguridad.',
    contactName: 'Ing. Claudio Salgado',
    contactRole: 'Gerente Técnico de Campo',
    email: 'csalgado@australndt.com.ar',
    phone: '+54 9 297 444-6210',
    whatsapp: '+5492974446210',
    website: 'https://australndt.com.ar',
    certifications: ['ARN Radioprotección', 'ASNT Nivel III', 'ISO 9001'],
    paymentTerms: 'Certificación por Jornada / Contrato Marco 30 días',
    creditRating: 'AAA (Homologado Operadoras)',
    adnComercial: {
      ofrece: ['Ultrasonido Ductos', 'Gammagrafía', 'Calibración PSV In Situ'],
      demanda: ['Camionetas 4x4 Equipadas', 'EPP Ignífugo', 'Gases de Calibración'],
      corredorLogistico: 'RN 3 / Comodoro Rivadavia - Pico Truncado - Las Heras',
      ciudadBase: 'Comodoro Rivadavia (Golfo San Jorge)',
      lat: -45.8641,
      lng: -67.4966,
    },
  },
  {
    id: 'serv-izajes-neuquen',
    entityType: 'servicio',
    name: 'Grúas & Izajes Técnicos Vaca Muerta S.R.L.',
    cuit: '30-71510922-8',
    tier: 'pro',
    tierPriority: 2,
    tierLabel: 'Plan Pro Industrial',
    verified: true,
    category: 'Logística',
    subcategories: ['Grúas Hidráulicas 120tn', 'Montaje Industrial', 'Transporte Sobredimensionado'],
    province: 'Neuquén',
    city: 'Añelo / Plottier',
    employeeCount: '11-50',
    credentialLabel: 'Habilitación Vialidad Nacional + Certificación Grúas IRAM',
    serviceModality: 'Cobertura en locación con operador certificado',
    publicSummary:
      'Servicio de izajes críticos hasta 120 toneladas, movimiento de tanques, generadores y bombas de fractura con planes de izaje certificados.',
    contactName: 'Facundo Quiroga',
    contactRole: 'Coordinador de Despacho',
    email: 'operaciones@izajesvacamuerta.com.ar',
    phone: '+54 9 299 470-3321',
    whatsapp: '+5492994703321',
    website: 'https://izajesvacamuerta.com.ar',
    certifications: ['IRAM 3921 Operadores', 'ART Yacimientos', 'VTV/RTO Al Día'],
    paymentTerms: 'Por Hora Operativa / Abono Mensual',
    creditRating: 'AA (Flota Auditada)',
    adnComercial: {
      ofrece: ['Grúas hasta 120tn', 'Planes de Izaje', 'Carretones Cama Baja'],
      demanda: ['Eslingas y Grilletes Certificados', 'Mantenimiento Hidráulico', 'Permisos Viales'],
      corredorLogistico: 'RN 7 / Plottier - Centenario - Añelo',
      ciudadBase: 'Añelo (Hub Vaca Muerta)',
      lat: -38.3522,
      lng: -68.7897,
    },
  },
];

export function sortCompaniesBySubscriptionTier<
  T extends { tierPriority?: number; verified?: boolean; name?: string }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const prioA = a.tierPriority ?? 3;
    const prioB = b.tierPriority ?? 3;
    if (prioA !== prioB) return prioA - prioB;
    if (Boolean(a.verified) !== Boolean(b.verified)) {
      return a.verified ? -1 : 1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

export interface AdnMatchResult {
  company: B2BCompanyRecord;
  compatibilityPercent: number;
  matchReason: string;
  estimatedRoadKm: number;
  corridorSynergy: string;
}

/**
 * Simula localmente el cruce vectorial (pgvector) entre oferta, demanda y corredor vial
 * para recomendar oportunidades comerciales + consolidación de flete en Patagonia.
 */
export function computeAdnMatches(params: {
  myOffers: string[];
  myDemands: string[];
  myLat?: number;
  myLng?: number;
}): AdnMatchResult[] {
  const offersNorm = params.myOffers.map((s) => s.toLowerCase());
  const demandsNorm = params.myDemands.map((s) => s.toLowerCase());
  const originLat = params.myLat ?? -45.8641; // Comodoro default
  const originLng = params.myLng ?? -67.4966;

  return B2B_COMPANIES.map((comp) => {
    let score = 52;
    const reasons: string[] = [];

    // Cruzamos lo que la otra empresa OFRECE contra lo que YO DEMANDO
    for (const off of comp.adnComercial.ofrece) {
      const lowOff = off.toLowerCase();
      if (demandsNorm.some((d) => lowOff.includes(d) || d.includes(lowOff.split(' ')[0]))) {
        score += 24;
        reasons.push(`Provee "${off}"`);
      }
    }

    // Cruzamos lo que la otra empresa DEMANDA contra lo que YO OFREZCO
    for (const dem of comp.adnComercial.demanda) {
      const lowDem = dem.toLowerCase();
      if (offersNorm.some((o) => lowDem.includes(o) || o.includes(lowDem.split(' ')[0]))) {
        score += 20;
        reasons.push(`Demanda "${dem}"`);
      }
    }

    if (comp.tier === 'corporativo') score += 6;
    if (comp.adnComercial.isExtraRegional) score += 5;

    const airKm = haversineKm(originLat, originLng, comp.adnComercial.lat, comp.adnComercial.lng);
    const estimatedRoadKm = Math.max(25, Math.round(airKm * 1.21));

    const cappedScore = Math.min(98, Math.max(58, score));
    const matchReason =
      reasons.length > 0
        ? reasons.slice(0, 2).join(' · ')
        : `Sinergia sectorial en ${comp.category}`;

    return {
      company: comp,
      compatibilityPercent: cappedScore,
      matchReason,
      estimatedRoadKm,
      corridorSynergy: comp.adnComercial.corredorLogistico,
    };
  })
    .sort((a, b) => b.compatibilityPercent - a.compatibilityPercent)
    .slice(0, 5);
}

export async function syncCompanyToUserCRM(company: B2BCompanyRecord): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const token = await auth.getToken();
    if (token) {
      const res = await fetch(`${getApiUrl()}/api/arn/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source: 'directory_b2b',
          companyName: company.name,
          contactName: company.contactName,
          contactEmail: company.email,
          category: company.category,
          rawText: `Vinculación B2B desde Directorio: ${company.name} (${company.city}, ${company.province}). Ofrece: ${company.adnComercial.ofrece.join(', ')}. Demanda: ${company.adnComercial.demanda.join(', ')}. Corredor: ${company.adnComercial.corredorLogistico}.`,
          metadata: {
            companyId: company.id,
            cuit: company.cuit,
            corridor: company.adnComercial.corredorLogistico,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.decision?.shouldAutoExecute
            ? `${company.name} guardada en Contactos CRM, enlazada con ARN IA y auto-ejecutada según regla.`
            : `${company.name} guardada en Contactos CRM y enviada a la Cola Híbrida de ARN IA.`,
        };
      }
    }

    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'crm_contacts'), {
        entityType: 'company',
        name: company.contactName,
        company: company.name,
        role: company.contactRole,
        email: company.email,
        phone: company.phone,
        type: 'external',
        status: 'active',
        website: company.website,
        cuitRut: company.cuit,
        socialMedia: `Plan: ${company.tierLabel} • Corredor: ${company.adnComercial.corredorLogistico}`,
        industry: company.category,
        location: `${company.city}, ${company.province}`,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      return {
        success: true,
        message: `${company.name} vinculada a tu red comercial.`,
      };
    }

    return {
      success: false,
      message: 'Inicia sesión con membresía activa para enviar empresas a ARN IA.',
    };
  } catch (error) {
    console.error('Error syncing company to ARN IA:', error);
    return {
      success: false,
      message: 'No se pudo conectar con ARN IA en este momento.',
    };
  }
}
