
import React from 'react';

function StatCard({ item }) {
  const { label, value, detail, change, tone, icon: Icon } = item;

  const iconGradients = {
    blue: 'linear-gradient(145deg, #315FAE 0%, #17315F 100%)',
    green: 'linear-gradient(145deg, #267447 0%, #12372D 100%)',
    red: 'linear-gradient(145deg, #632632 0%, #2A1822 100%)',
    yellow: 'linear-gradient(145deg, #A99A76 0%, #51462F 100%)',
  };

  const changeColors = {
    blue: 'border-[#244C88]/40 bg-[#17315F]/50 text-[#78B5FF]',
    green: 'border-[#185C38]/40 bg-[#103324]/70 text-[#42C879]',
    red: 'border-[#652632]/50 bg-[#351B25]/80 text-[#E47D8B]',
    yellow: 'border-[#79602B]/50 bg-[#49391B]/80 text-[#D5B86C]',
  };

  const toneKey = iconGradients[tone] ? tone : 'blue';

  return (
    <div
      className="
        group relative flex h-[138px] min-w-0 w-full flex-col
        overflow-hidden rounded-[16px]
        border border-[#1B2A40]
        bg-[#0C141F]
        p-3
        shadow-[0_2px_20px_rgba(0,0,0,0.32)]
        transition-all duration-300
        hover:border-[#31558A]/70
        hover:shadow-[0_4px_24px_rgba(24,64,125,0.12)]
      "
    >
      {/* Iluminação azul no topo do card */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[linear-gradient(180deg,rgba(36,73,130,0.13)_0%,rgba(15,27,44,0.05)_38%,transparent_75%)]
        "
      />

      {/* Reflexo sutil no canto superior esquerdo */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -left-8 -top-12
          h-24 w-36 rounded-full
          bg-[#2856A0]/[0.07] blur-2xl
          transition-opacity duration-300
          group-hover:bg-[#356EC5]/[0.12]
        "
      />

      {/* Ícone */}
      <div
        className="
          relative z-10 flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-[11px]
          border border-white/[0.07]
          shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
        "
        style={{ background: iconGradients[toneKey] }}
      >
        {Icon && (
          <Icon
            size={18}
            strokeWidth={1.8}
            className="text-[#D0D8E2]"
          />
        )}
      </div>

      {/* Variação */}
      {change && (
        <div
          className={`
            absolute right-3 top-3 z-10
            flex items-center gap-1
            rounded-full border
            px-1.5 py-[3px]
            text-[9px] font-semibold leading-none
            ${changeColors[toneKey]}
          `}
        >
          {change}
        </div>
      )}

      {/* Valor */}
      <div className="relative z-10 mt-2 text-[25px] font-bold leading-[29px] tracking-tight text-[#C0C5C8]">
        {value}
      </div>

      {/* Título */}
      <div className="relative z-10 mt-0.5 truncate text-[11px] font-medium leading-4 text-[#AFB5BA]">
        {label}
      </div>

      {/* Detalhe */}
      {detail && (
        <div className="relative z-10 mt-auto truncate pt-1.5 text-[10px] leading-4 text-[#8191A5]">
          {detail}
        </div>
      )}

      {/* Brilho discreto na borda inferior */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-x-4 bottom-0
          h-px bg-gradient-to-r
          from-transparent via-[#31558A]/30 to-transparent
        "
      />
    </div>
  );
}

export default StatCard;
