
import React from 'react';

function StatCard({ item }) {
  const { label, value, detail, change, tone, icon: Icon } = item;

  // Cores baseadas no protótipo Watt Vision
  const iconColors = {
    blue: 'text-[#C0C5C8]',
    green: 'text-[#C0C5C8]',
    red: 'text-[#C0C5C8]',
    yellow: 'text-[#C0C5C8]',
  };

  const iconGradients = {
    blue: 'linear-gradient(135deg, #2C57A8 0%, #17315F 100%)',
    green: 'linear-gradient(135deg, #2A8246 0%, #102520 100%)',
    red: 'linear-gradient(135deg, #5A1C27 0%, #22181F 100%)',
    yellow: 'linear-gradient(135deg, #AFA183 0%, #4F3E1A 100%)',
  };

  const changeColors = {
    blue: 'border-[#2C57A8]/40 bg-[#17315F]/40 text-[#9DBBFA]',
    green: 'border-[#2A8246]/40 bg-[#102520] text-[#65C985]',
    red: 'border-[#5A1C27]/60 bg-[#22181F] text-[#E58B98]',
    yellow: 'border-[#AFA183]/40 bg-[#4F3E1A]/50 text-[#C9B98D]',
  };

  const toneKey = iconGradients[tone] ? tone : 'blue';

  return (
    <div
      className="
        relative flex h-[172px] min-w-0 w-full flex-col
        overflow-hidden rounded-[20px]
        border border-[#17315F]/70
        bg-[#0C141F]
        p-4
        shadow-[0_2px_20px_0_rgba(0,0,0,0.38)]
        transition-all duration-200
        hover:border-[#2C57A8]/70
      "
    >
      {/* Gradiente sutil no fundo do card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[20px]"
        style={{
          background:
            'linear-gradient(135deg, rgba(44,87,168,0.10) 0%, rgba(11,18,30,0.03) 45%, transparent 100%)',
        }}
      />

      {/* Ícone */}
      <div
        className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ${iconColors[toneKey]}`}
        style={{ background: iconGradients[toneKey] }}
      >
        {Icon && <Icon size={21} strokeWidth={2} />}
      </div>

      {/* Variação */}
      <div
        className={`absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${
          changeColors[toneKey]
        }`}
      >
        {change}
      </div>

      {/* Valor */}
      <div className="relative z-10 mt-2 text-[29px] font-bold leading-8 tracking-tight text-[#C0C5C8]">
        {value}
      </div>

      {/* Título */}
      <div className="relative z-10 mt-0.5 truncate text-[13px] font-medium leading-5 text-[#AFB5BA]">
        {label}
      </div>

      {/* Detalhe */}
      <div className="relative z-10 mt-auto truncate pt-2 text-[11px] text-[#9CA1A6]">
        {detail}
      </div>
    </div>
  );
}

export default StatCard;
