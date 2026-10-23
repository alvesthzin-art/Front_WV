
import React from 'react';

export default function CardMedicao({
  titulo,
  valor,
  unidade = 'V',
  descricao,
  icone: Icon,
  cor = 'blue',
}) {
  const cores = {
    blue: {
      icon: 'linear-gradient(135deg, #2C57A8 0%, #17315F 100%)',
      border: '#24344D',
    },
    green: {
      icon: 'linear-gradient(135deg, #2A8246 0%, #102520 100%)',
      border: '#243A35',
    },
    teal: {
      icon: 'linear-gradient(135deg, #285C68 0%, #132A38 100%)',
      border: '#29434D',
    },
  };

  const estilo = cores[cor] || cores.blue;

  return (
    <article className="relative flex min-h-[126px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#263448] bg-[#0C141F] p-4 shadow-[0_2px_20px_0_rgba(0,0,0,0.25)]">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
        style={{ background: estilo.icon }}
      >
        {Icon && (
          <Icon size={17} strokeWidth={1.8} className="text-[#8DA7C7]" />
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[22px] font-bold leading-7 tracking-tight text-[#C0C5C8]">
          {valor}
        </span>
        {unidade && (
          <span className="text-[11px] font-medium text-[#AFB5BA]">
            {unidade}
          </span>
        )}
      </div>

      <p className="text-[12px] leading-4 text-[#9CAFC4]">
        {titulo}
      </p>

      {descricao && (
        <p className="mt-1 text-[11px] text-[#68788D]">
          {descricao}
        </p>
      )}
    </article>
  );
}
