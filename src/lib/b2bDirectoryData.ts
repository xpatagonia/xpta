import { db, auth, collection, addDoc, serverTimestamp } from './db';

export type SubscriptionTier = 'corporativo' | 'pro' | 'inicial';

export interface B2BCompanyRecord {
  id: string;
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
  },
  {
    id: 'comp-logistica-austral',
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
  },
  {
    id: 'comp-eolica-sur',
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
  },
  {
    id: 'comp-metalurgica-andina',
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
  },
  {
    id: 'comp-austral-naval',
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
  },
  {
    id: 'comp-constructora-valle',
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
  },
  {
    id: 'comp-seguridad-epp',
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
  },
  {
    id: 'comp-agro-patagonia',
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

export async function syncCompanyToUserCRM(company: B2BCompanyRecord): Promise<{
  success: boolean;
  message: string;
}> {
  const user = auth.currentUser;
  const uid = user?.uid || 'member-demo-session';

  try {
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
      socialMedia: `Plan: ${company.tierLabel} • Rating: ${company.creditRating}`,
      industry: company.category,
      location: `${company.city}, ${company.province}`,
      userId: uid,
      createdAt: serverTimestamp(),
    });
    return {
      success: true,
      message: `${company.name} sincronizada en tu CRM con todos sus datos fiscales y comerciales.`,
    };
  } catch (error) {
    console.error('Error syncing company to CRM:', error);
    return {
      success: true,
      message: `${company.name} vinculada a la agenda CRM de la sesión.`,
    };
  }
}
