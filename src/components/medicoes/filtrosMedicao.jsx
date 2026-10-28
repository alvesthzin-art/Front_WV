
import React from 'react';
import { Target } from 'lucide-react';

export default function FiltrosMedicao({
  locais = ['Todos os locais'],
  setores = ['Todos os setores'],
  equipamentos = ['Todos'],
  onDefinirMeta,
  filtros,
  onFiltrosChange,
}) {
  const valoresIniciais = {
    local: 'Todos os locais',
    setor: 'Todos os setores',
    equipamento: 'Todos',
    periodo: 'Hoje',
    grandeza: 'Tensão',
  };

  const valores = { ...valoresIniciais, ...filtros };

  function atualizar(campo, valor) {
    onFiltrosChange?.({
      ...valores,
      [campo]: valor,
    });
  }

  const estiloSelect =
    'min-w-0 max-w-full cursor-pointer appearance-none rounded-xl border border-[#1D2C42] bg-[#101827] px-3 py-2.5 text-xs text-[#C0C5C8] outline-none transition hover:border-[#34517A] focus:border-[#5A8F97]';

  const estiloLabel = 'text-[#65758B]';

 

  return (
    <section className="w-full min-w-0 rounded-[20px] border border-[#263448] bg-[#0C141F] p-3.5 sm:p-4">
      <div className="flex w-full min-w-0 flex-col gap-2.5 xl:flex-row xl:flex-nowrap xl:items-center">
  
        {/* Filtros de localização */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:flex xl:flex-nowrap">
          <label className={`${estiloSelect} flex min-w-0 items-center gap-1.5`}>
            <span className={estiloLabel}>Local:</span>
            <select
              className="w-full min-w-0 flex-1 bg-transparent text-[#C0C5C8] outline-none"
              value={valores.local}
              onChange={(e) => atualizar('local', e.target.value)}
            >
              {locais.map((item) => (
                <option key={item} value={item} className="bg-[#0C141F]">
                  {item}
                </option>
              ))}
            </select>
          </label>
  
          <label className={`${estiloSelect} flex min-w-0 items-center gap-1.5`}>
            <span className={estiloLabel}>Setor:</span>
            <select
              className="w-full min-w-0 flex-1 bg-transparent text-[#C0C5C8] outline-none"
              value={valores.setor}
              onChange={(e) => atualizar('setor', e.target.value)}
            >
              {setores.map((item) => (
                <option key={item} value={item} className="bg-[#0C141F]">
                  {item}
                </option>
              ))}
            </select>
          </label>
  
          <label className={`${estiloSelect} col-span-2 flex min-w-0 items-center gap-1.5 sm:col-span-1`}>
            <span className={estiloLabel}>Equipamento:</span>
            <select
              className="w-full min-w-0 flex-1 bg-transparent text-[#C0C5C8] outline-none"
              value={valores.equipamento}
              onChange={(e) => atualizar('equipamento', e.target.value)}
            >
              {equipamentos.map((item) => (
                <option key={item} value={item} className="bg-[#0C141F]">
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
  
        {/* Período, grandeza e botão */}
        <div className="grid grid-cols-2 items-center gap-2.5 sm:grid-cols-3 xl:flex xl:flex-nowrap">
          <label className={`${estiloSelect} flex min-w-0 items-center gap-1.5`}>
            <span className={estiloLabel}>Período:</span>
            <select
              className="w-full min-w-0 flex-1 bg-transparent text-[#C0C5C8] outline-none"
              value={valores.periodo}
              onChange={(e) => atualizar('periodo', e.target.value)}
            >
              {['Hoje', 'Ontem', 'Últimos 7 dias', 'Últimos 30 dias'].map(
                (item) => (
                  <option key={item} value={item} className="bg-[#0C141F]">
                    {item}
                  </option>
                )
              )}
            </select>
          </label>
  
          <label className={`${estiloSelect} flex min-w-0 items-center gap-1.5`}>
            <span className={estiloLabel}>Grandeza:</span>
            <select
              className="w-full min-w-0 flex-1 bg-transparent text-[#C0C5C8] outline-none"
              value={valores.grandeza}
              onChange={(e) => atualizar('grandeza', e.target.value)}
            >
              {[
                'Tensão',
                'Corrente',
                'Potência',
                'Energia',
                'Frequência',
                'Fator de potência',
              ].map((item) => (
                <option key={item} value={item} className="bg-[#0C141F]">
                  {item}
                </option>
              ))}
            </select>
          </label>
  
          <button
            type="button"
            onClick={onDefinirMeta}
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#24498B] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#305BA5] focus:outline-none focus:ring-2 focus:ring-[#5A8F97] sm:col-span-1 xl:ml-auto xl:w-auto xl:shrink-0"
          >
            <Target size={15} />
            Definir Meta
          </button>
        </div>
      </div>
    </section>
  );
  

}
