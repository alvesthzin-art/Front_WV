
import React from 'react';
import { Target } from 'lucide-react';

export default function CardMetaMedicao({
  metaDefinida = false,
  valorMeta,
  unidade = 'V',
  onDefinirMeta,
}) {
  return (
    <article className="flex min-h-[126px] min-w-0 flex-col rounded-[20px] border border-[#263448] bg-[#0C141F] p-4 shadow-[0_2px_20px_0_rgba(0,0,0,0.25)]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#263448] bg-[#101827]">
        <Target size={17} strokeWidth={1.8} className="text-[#65758B]" />
      </div>

      {metaDefinida ? (
        <p className="mt-3 text-[15px] font-semibold text-[#C0C5C8]">
          {valorMeta} {unidade}
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-[#526176]">
          Nenhuma meta definida
        </p>
      )}

      <button
        type="button"
        onClick={onDefinirMeta}
        className="mt-1 w-fit text-left text-[12px] font-medium text-[#3979E8] transition hover:text-[#79A7FF] focus:outline-none focus:ring-2 focus:ring-[#5A8F97] rounded-sm"
      >
        {metaDefinida ? 'Editar meta →' : 'Definir agora →'}
      </button>
    </article>
  );
}
