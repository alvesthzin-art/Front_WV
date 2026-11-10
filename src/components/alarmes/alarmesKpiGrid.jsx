import React from 'react';

function AlarmesKpiGrid({ kpis }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id || item.label}
            className="relative flex flex-col justify-between p-4 rounded-xl bg-[#0C141F] border border-[#1B2A40] shadow-[0_2px_20px_rgba(0,0,0,0.32)]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[#17315F]/40 text-[#78B5FF] border border-[#244C88]/40">
                {Icon && <Icon className="w-5 h-5" />}
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-white tracking-tight">{item.value}</span>
              <h4 className="text-sm font-semibold text-slate-200 mt-1">{item.label}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default AlarmesKpiGrid;