import { useMemo } from 'react';
import { Target } from 'lucide-react';

export default function FiltrosMedicao({
  locais = [],
  setores = [],
  equipamentos = [],
  onDefinirMeta,
  filtros,
  onFiltrosChange,
}) {
  const valoresIniciais = {
    id_local: '',
    local: 'Todos os locais',
    id_setor: '',
    setor: 'Todos os setores',
    id_equipamento: '',
    equipamento: 'Todos',
    periodo: 'Hoje',
    grandeza: 'Tensão',
  };

  const valores = { ...valoresIniciais, ...filtros };

  // Filtra setores pertencentes ao local selecionado
  const setoresFiltrados = useMemo(() => {
    if (!valores.id_local) return setores;
    return setores.filter(
      (s) => String(s.id_local) === String(valores.id_local)
    );
  }, [setores, valores.id_local]);

  // Filtra equipamentos pertencentes ao setor (ou aos setores do local selecionado)
  const equipamentosFiltrados = useMemo(() => {
    if (valores.id_setor) {
      return equipamentos.filter(
        (eq) => String(eq.id_setor) === String(valores.id_setor)
      );
    }
    if (valores.id_local) {
      const idsSetores = new Set(
        setoresFiltrados.map((s) => String(s.id_setor || s.id))
      );
      return equipamentos.filter((eq) => idsSetores.has(String(eq.id_setor)));
    }
    return equipamentos;
  }, [equipamentos, setoresFiltrados, valores.id_local, valores.id_setor]);

  function handleLocalChange(idLocal) {
    const item = locais.find(
      (l) => String(l.id_local || l.id) === String(idLocal)
    );
    onFiltrosChange?.({
      ...valores,
      id_local: idLocal,
      local: item ? item.nome_local || item.nome : 'Todos os locais',
      id_setor: '',
      setor: 'Todos os setores',
      id_equipamento: '',
      equipamento: 'Todos',
    });
  }

  function handleSetorChange(idSetor) {
    const item = setores.find(
      (s) => String(s.id_setor || s.id) === String(idSetor)
    );
    onFiltrosChange?.({
      ...valores,
      id_setor: idSetor,
      setor: item ? item.nome_setor || item.nome : 'Todos os setores',
      id_equipamento: '',
      equipamento: 'Todos',
    });
  }

  function handleEquipamentoChange(idEquipamento) {
    const item = equipamentos.find(
      (eq) => String(eq.id_equipamento || eq.id) === String(idEquipamento)
    );
    onFiltrosChange?.({
      ...valores,
      id_equipamento: idEquipamento,
      equipamento: item
        ? item.nome_equipamento || item.equipamento || item.nome
        : 'Todos',
    });
  }

  function atualizar(campo, valor) {
    onFiltrosChange?.({
      ...valores,
      [campo]: valor,
    });
  }

  const estiloSelect =
    'wv-filter-control min-w-0 max-w-full cursor-pointer appearance-none px-3 text-xs outline-none';

  const estiloLabel = 'text-[#65758B]';

  return (
    <section className="w-full min-w-0 rounded-[20px] border border-[#263448] bg-[#0C141F] p-3.5 sm:p-4">
      <div className="flex w-full min-w-0 flex-col gap-2.5 xl:flex-row xl:flex-nowrap xl:items-center">
        {/* Filtros de localização */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:flex xl:flex-nowrap">
          <label className={`${estiloSelect} flex min-w-0 items-center gap-1.5`}>
            <span className={estiloLabel}>Local:</span>
            <select
              className="wv-filter-select w-full min-w-0 flex-1 bg-transparent outline-none"
              value={valores.id_local}
              onChange={(e) => handleLocalChange(e.target.value)}
            >
              <option value="" className="bg-[#0C141F]">
                Todos os locais
              </option>
              {locais.map((item) => {
                const id = item.id_local || item.id;
                const nome = item.nome_local || item.nome;
                return (
                  <option key={id} value={id} className="bg-[#0C141F]">
                    {nome}
                  </option>
                );
              })}
            </select>
          </label>

          <label className={`${estiloSelect} flex min-w-0 items-center gap-1.5`}>
            <span className={estiloLabel}>Setor:</span>
            <select
              className="wv-filter-select w-full min-w-0 flex-1 bg-transparent outline-none"
              value={valores.id_setor}
              onChange={(e) => handleSetorChange(e.target.value)}
            >
              <option value="" className="bg-[#0C141F]">
                Todos os setores
              </option>
              {setoresFiltrados.map((item) => {
                const id = item.id_setor || item.id;
                const nome = item.nome_setor || item.nome;
                return (
                  <option key={id} value={id} className="bg-[#0C141F]">
                    {nome}
                  </option>
                );
              })}
            </select>
          </label>

          <label
            className={`${estiloSelect} col-span-2 flex min-w-0 items-center gap-1.5 sm:col-span-1`}
          >
            <span className={estiloLabel}>Equipamento:</span>
            <select
              className="wv-filter-select w-full min-w-0 flex-1 bg-transparent outline-none"
              value={valores.id_equipamento}
              onChange={(e) => handleEquipamentoChange(e.target.value)}
            >
              <option value="" className="bg-[#0C141F]">
                Todos
              </option>
              {equipamentosFiltrados.map((item) => {
                const id = item.id_equipamento || item.id;
                const nome =
                  item.nome_equipamento || item.equipamento || item.nome;
                return (
                  <option key={id} value={id} className="bg-[#0C141F]">
                    {nome}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        <div className="hidden h-6 w-px bg-[#263448] xl:block" />

        {/* Período, grandeza e botão */}
        <div className="grid grid-cols-2 items-center gap-2.5 sm:grid-cols-3 xl:flex xl:flex-nowrap xl:flex-1">
          <label className={`${estiloSelect} flex min-w-0 items-center gap-1.5`}>
            <span className={estiloLabel}>Período:</span>
            <select
              className="wv-filter-select w-full min-w-0 flex-1 bg-transparent outline-none"
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
              className="wv-filter-select w-full min-w-0 flex-1 bg-transparent outline-none"
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