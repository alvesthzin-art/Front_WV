import React from 'react';
import { Server, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';

const CARDS_CONFIG = [
  {
    key: 'total',
    label: 'Total de Dispositivos',
    sublabel: 'dispositivos cadastrados',
    icon: Server,
    iconStyle: 'bg-[#17315F]/40 text-[#5A8F97] border-[#17315F]',
  },
  {
    key: 'online',
    label: 'Online',
    sublabel: 'comunicando normalmente',
    icon: CheckCircle2,
    iconStyle: 'bg-[#102520] text-[#2A8246] border-[#2A8246]/30',
  },
  {
    key: 'instaveis',
    label: 'Instáveis',
    sublabel: 'com falhas intermitentes',
    icon: AlertTriangle,
    iconStyle: 'bg-[#4F3E1A]/40 text-[#AFA183] border-[#AFA183]/30',
  },
  {
    key: 'offline',
    label: 'Offline',
    sublabel: 'sem comunicação',
    icon: WifiOff,
    iconStyle: 'bg-[#1F242D] text-[#9ca1a6] border-slate-700/50',
  },
];

export function ConectividadeKpiGrid({ metricas }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
      {CARDS_CONFIG.map((cfg) => {
        const Icon = cfg.icon;
        return (
          <div
            key={cfg.key}
            className="p-5 rounded-2xl bg-[#0C141F] border border-[#17315F]/50 shadow-[0_2px_20px_0_rgba(0,0,0,0.38)] flex flex-col justify-between"
          >
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${cfg.iconStyle}`}>
              <Icon size={18} />
            </div>
            <div>
              <span className="text-3xl font-bold text-white tracking-tight">
                {metricas[cfg.key] ?? 0}
              </span>
              <h3 className="text-sm font-semibold text-[#C0C5C8] mt-1">{cfg.label}</h3>
              <p className="text-xs text-[#4A525B] mt-0.5">{cfg.sublabel}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
export default ConectividadeKpiGrid;