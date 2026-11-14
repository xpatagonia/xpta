import { Link } from 'react-router-dom';
import { Search, FileText, Bot, Truck, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    id: '01.',
    title: 'Busca por Perfil y Corredor',
    description:
      'Filtra Empresas, Emprendimientos, Profesionales matriculados o Servicios técnicos según provincia y especialidad.',
    icon: Search,
    href: '/servicios',
  },
  {
    id: '02.',
    title: 'Califica con ARN IA + CRM',
    description:
      'Cada lead o correo comercial entra al CRM y a la cola híbrida de ARN IA con reglas automáticas por monto y confianza.',
    icon: Bot,
    href: '/dashboard?area=arn_crm',
  },
  {
    id: '03.',
    title: 'Cotiza con tu Equipo PyME',
    description:
      'Opera pedidos RFQ y presupuestos con hasta 2, 5 o 10 usuarios integrados en tu espacio organizacional.',
    icon: FileText,
    href: '/dashboard?area=team',
  },
  {
    id: '04.',
    title: 'Despacha con Flota & OSRM',
    description:
      'Calcula kilómetros reales, asigna transportistas con LINTI y controla contratos y retornos vacíos por Ruta 3, 22 y 40.',
    icon: Truck,
    href: '/logistica?tab=rutas',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 md:px-12 bg-white dark:bg-[#110E17] border-t border-slate-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
              Ciclo Operativo Unificado
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Cómo opera tu empresa dentro de xPatagonia
            </h2>
          </div>
          <Link
            to="/planes"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white hover:text-orange-500 transition-colors whitespace-nowrap"
          >
            <span>Ver membresías PyME y Logística</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <Link
              key={step.id}
              to={step.href}
              className="group p-6 rounded-2xl bg-slate-50 dark:bg-[#181424] border border-slate-200 dark:border-white/10 hover:border-orange-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-orange-500 transition-colors">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-400">
                    {step.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
              <div className="pt-4 mt-5 border-t border-slate-200/80 dark:border-white/5 flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>Ir al módulo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
