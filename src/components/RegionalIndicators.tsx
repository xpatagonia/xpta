import React from 'react';
import { TrendingUp, Wind, Anchor, Plane, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Euro, Coins, Banknote } from 'lucide-react';
import { motion } from 'motion/react';

const indicators = [
  {
    title: "Energía & Petróleo",
    metric: "Brent",
    value: "USD 82.40",
    change: "+1.2%",
    isPositive: true,
    icon: <Activity className="w-5 h-5" />,
    color: "from-orange-400 to-red-500",
    bgLight: "bg-orange-50 dark:bg-orange-500/10",
    textLight: "text-orange-600 dark:text-orange-400"
  },
  {
    title: "Exportación Pesquera",
    metric: "Langostino (Ref.)",
    value: "USD 6.80/kg",
    change: "+0.5%",
    isPositive: true,
    icon: <Anchor className="w-5 h-5" />,
    color: "from-blue-400 to-cyan-500",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
    textLight: "text-blue-600 dark:text-blue-400"
  },
  {
    title: "Renovables",
    metric: "Capacidad Eólica",
    value: "1.450 MW",
    change: "+120 MW",
    isPositive: true,
    icon: <Wind className="w-5 h-5" />,
    color: "from-emerald-400 to-green-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-500/10",
    textLight: "text-emerald-600 dark:text-emerald-400"
  },
  {
    title: "Turismo Receptivo",
    metric: "Ocupación (Invierno)",
    value: "85%",
    change: "-2.1%",
    isPositive: false,
    icon: <Plane className="w-5 h-5" />,
    color: "from-purple-400 to-indigo-500",
    bgLight: "bg-purple-50 dark:bg-purple-500/10",
    textLight: "text-purple-600 dark:text-purple-400"
  }
];

const currencyIndicators = [
  {
    title: "Dólar Americano",
    metric: "USD / ARS (Mayorista)",
    value: "$ 940.50",
    change: "+0.1%",
    isPositive: true,
    icon: <DollarSign className="w-5 h-5" />,
    color: "from-green-400 to-emerald-500",
    bgLight: "bg-green-50 dark:bg-green-500/10",
    textLight: "text-green-600 dark:text-green-400"
  },
  {
    title: "Euro",
    metric: "EUR / ARS (Oficial)",
    value: "$ 1.020.30",
    change: "+0.2%",
    isPositive: true,
    icon: <Euro className="w-5 h-5" />,
    color: "from-blue-400 to-indigo-500",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
    textLight: "text-blue-600 dark:text-blue-400"
  },
  {
    title: "Yuan Chino",
    metric: "CNY / ARS",
    value: "$ 129.50",
    change: "-0.1%",
    isPositive: false,
    icon: <Coins className="w-5 h-5" />,
    color: "from-red-400 to-rose-500",
    bgLight: "bg-red-50 dark:bg-red-500/10",
    textLight: "text-red-600 dark:text-red-400"
  },
  {
    title: "Real Brasileño",
    metric: "BRL / ARS",
    value: "$ 175.20",
    change: "+0.4%",
    isPositive: true,
    icon: <Banknote className="w-5 h-5" />,
    color: "from-yellow-400 to-amber-500",
    bgLight: "bg-yellow-50 dark:bg-yellow-500/10",
    textLight: "text-yellow-600 dark:text-yellow-400"
  }
];

export default function RegionalIndicators() {
  return (
    <section className="py-12 bg-slate-50 dark:bg-[#110E17] border-b border-slate-200 dark:border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Indicadores Estratégicos Patagonia
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
              Monitoreo semanal de las principales variables económicas y productivas que impulsan la inversión en la región.
            </p>
          </div>
          <button className="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            Ver reporte detallado <TrendingUp className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {indicators.map((indicator, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              key={indicator.title}
              className="bg-white dark:bg-[#1A1625] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${indicator.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-full blur-2xl z-0`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${indicator.bgLight} ${indicator.textLight}`}>
                    {indicator.icon}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${indicator.isPositive ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-100 dark:bg-rose-500/10'}`}>
                    {indicator.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {indicator.change}
                  </div>
                </div>
                
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                  {indicator.title}
                </h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                  {indicator.value}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {indicator.metric}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6">
            Mercado de Divisas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {currencyIndicators.map((indicator, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                key={indicator.title}
                className="bg-white dark:bg-[#1A1625] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${indicator.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-full blur-2xl z-0`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${indicator.bgLight} ${indicator.textLight}`}>
                      {indicator.icon}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${indicator.isPositive ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-100 dark:bg-rose-500/10'}`}>
                      {indicator.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {indicator.change}
                    </div>
                  </div>
                  
                  <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    {indicator.title}
                  </h3>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    {indicator.value}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {indicator.metric}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
