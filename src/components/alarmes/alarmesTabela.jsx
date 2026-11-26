import { useEffect, useState } from 'react';
import {
  Search,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MapPin,
} from 'lucide-react';

function AlarmesTabela({ alertas, loading, erro, onReconhecer, onVerEquipamento }) {
  const LIMITE_POR_PAGINA = 10;

  const [activeTab, setActiveTab] = useState('ativos');
  const [subFiltroHistorico, setSubFiltroHistorico] = useState('Hoje');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSeveridade, setFiltroSeveridade] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [selectedAlarme, setSelectedAlarme] = useState(null);
  const [reconhecendoId, setReconhecendoId] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Fechar modal com tecla ESC
  useEffect(() => {
    if (!selectedAlarme) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedAlarme(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAlarme]);

  // Tratamento dinâmico de propriedades (suporta dados do backend e fallbacks)
  const getTitulo = (item) => item.titulo || item.mensagem || 'Alerta do Sistema';

  const getCondicao = (item) => {
    if (item.condicao) return item.condicao;
    if (item.valor_detectado !== undefined && item.valor_limite !== undefined) {
      return `Valor detectado: ${item.valor_detectado} (Limite: ${item.valor_limite})`;
    }
    return item.mensagem || 'Parâmetro fora do limite configurado';
  };

  const getCategoria = (item) =>
    item.categoria || (item.id_dispositivo_iot ? 'Comunicação' : 'Energético');

  const getEquipamento = (item) =>
    item.equipamento ||
    item.nome_equipamento ||
    item.nome_dispositivo ||
    'Equipamento Geral';

  const getLocal = (item) =>
    item.local ||
    item.localizacao ||
    item.setor ||
    item.nome_setor ||
    'Local não informado';

  const getSeveridade = (item) => {
    const sev = (item.severidade || '').toLowerCase();
    if (sev === 'critico' || sev === 'crítico') return 'Crítico';
    if (sev === 'atencao' || sev === 'atenção') return 'Atenção';
    return 'Informativo';
  };

  const isAlarmeReconhecido = (item) =>
    Boolean(
      item?.reconhecido ||
        item?.status === 'Reconhecido' ||
        item?.id_usuario_reconhecimento
    );

  const obterDataAlarme = (item) => {
    const valor = item.data_hora || item.data_criacao || item.inicio;
    if (!valor) return null;

    const data = new Date(String(valor).replace(' ', 'T'));
    return Number.isNaN(data.getTime()) ? null : data;
  };

  const correspondePeriodoHistorico = (item) => {
    if (activeTab !== 'historico' || subFiltroHistorico === 'Personalizado') {
      return true;
    }

    const dataAlarme = obterDataAlarme(item);
    if (!dataAlarme) return false;

    const agora = new Date();
    if (subFiltroHistorico === 'Hoje') {
      const inicioHoje = new Date(agora);
      inicioHoje.setHours(0, 0, 0, 0);
      return dataAlarme >= inicioHoje && dataAlarme <= agora;
    }

    const dias = subFiltroHistorico === '7 dias' ? 7 : 30;
    const inicioPeriodo = new Date(agora);
    inicioPeriodo.setDate(inicioPeriodo.getDate() - dias);
    return dataAlarme >= inicioPeriodo && dataAlarme <= agora;
  };

  // Filtragem dos alarmes na tabela
  const alarmesFiltrados = alertas.filter((item) => {
    const isResolvido = item.status === 'Resolvido' || item.status === 'inativo';
    // Ativos mostra somente ocorrências abertas; Histórico mostra todas as
    // ocorrências do período selecionado, inclusive as recém-geradas.
    const isTabMatch = activeTab === 'ativos' ? !isResolvido : true;

    const titulo = getTitulo(item).toLowerCase();
    const equip = getEquipamento(item).toLowerCase();
    const isSearchMatch =
      titulo.includes(searchTerm.toLowerCase()) ||
      equip.includes(searchTerm.toLowerCase());

    const isSeveridadeMatch =
      filtroSeveridade === 'Todos' || getSeveridade(item) === filtroSeveridade;
    const isCategoriaMatch =
      filtroCategoria === 'Todos' || getCategoria(item) === filtroCategoria;

    return (
      isTabMatch &&
      correspondePeriodoHistorico(item) &&
      isSearchMatch &&
      isSeveridadeMatch &&
      isCategoriaMatch
    );
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(alarmesFiltrados.length / LIMITE_POR_PAGINA)
  );
  const paginaVisivel = Math.min(paginaAtual, totalPaginas);
  const alarmesDaPagina = alarmesFiltrados.slice(
    (paginaVisivel - 1) * LIMITE_POR_PAGINA,
    paginaVisivel * LIMITE_POR_PAGINA
  );

  const handleReconhecerClick = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id || reconhecendoId === id) return;

    setReconhecendoId(id);
    try {
      const sucesso = await onReconhecer(id);
      if (sucesso === false) return;

      if (
        selectedAlarme &&
        (selectedAlarme.id_alerta === id || selectedAlarme.id === id)
      ) {
        setSelectedAlarme((prev) => ({
          ...prev,
          status: 'Reconhecido',
          reconhecido: true,
        }));
      }
    } finally {
      setReconhecendoId(null);
    }
  };

  const handleVerEquipamento = (alarme) => {
    setSelectedAlarme(null);
    if (onVerEquipamento) {
      onVerEquipamento(alarme);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-[#1B2A40] bg-[#0C141F] p-5 shadow-[0_2px_20px_rgba(0,0,0,0.32)]">
      {/* Topo da Tabela: Abas + Busca e Selects */}
      <div className="flex flex-col gap-4 border-b border-[#1B2A40] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setActiveTab('ativos');
              setPaginaAtual(1);
            }}
            className={`wv-alarm-tab relative pb-2 text-sm font-semibold transition-colors ${
              activeTab === 'ativos'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ativos
            {activeTab === 'ativos' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#356EC5]" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('historico');
              setPaginaAtual(1);
            }}
            className={`wv-alarm-tab relative pb-2 text-sm font-semibold transition-colors ${
              activeTab === 'historico'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Histórico
            {activeTab === 'historico' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#356EC5]" />
            )}
          </button>
        </div>

        {/* Inputs de busca e selects */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar alarme ou equipamento..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPaginaAtual(1);
              }}
              className="h-9 w-60 rounded-xl border border-[#1B2A40] bg-[#070A15] pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-[#356EC5]"
            />
          </div>

          <select
            value={filtroSeveridade}
            onChange={(e) => {
              setFiltroSeveridade(e.target.value);
              setPaginaAtual(1);
            }}
            className="h-9 rounded-xl border border-[#1B2A40] bg-[#070A15] px-3 text-xs text-slate-300 outline-none focus:border-[#356EC5]"
          >
            <option value="Todos">Severidade: Todos</option>
            <option value="Crítico">Crítico</option>
            <option value="Atenção">Atenção</option>
            <option value="Informativo">Informativo</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setPaginaAtual(1);
            }}
            className="h-9 rounded-xl border border-[#1B2A40] bg-[#070A15] px-3 text-xs text-slate-300 outline-none focus:border-[#356EC5]"
          >
            <option value="Todos">Categoria: Todos</option>
            <option value="Energético">Energético</option>
            <option value="Comunicação">Comunicação</option>
          </select>
        </div>
      </div>

      {/* Sub-filtros para o Histórico */}
      {activeTab === 'historico' && (
        <div className="mt-4 flex gap-2">
          {['Hoje', '7 dias', '30 dias', 'Personalizado'].map((sub) => (
            <button
              key={sub}
              onClick={() => {
                setSubFiltroHistorico(sub);
                setPaginaAtual(1);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                subFiltroHistorico === sub
                  ? 'border border-[#244C88]/50 bg-[#17315F] text-[#78B5FF]'
                  : 'border border-[#1B2A40] bg-[#070A15] text-slate-400 hover:text-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Renderização da Tabela */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#1B2A40] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-3">Alarme</th>
              <th className="px-3 py-3">Equipamento</th>
              <th className="px-3 py-3">Severidade</th>
              <th className="px-3 py-3">Início</th>
              <th className="px-3 py-3">
                {activeTab === 'ativos' ? 'Status' : 'Resolvido em'}
              </th>
              <th className="px-3 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1B2A40]/50 text-xs">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3 py-4">
                    <div className="h-4 w-44 rounded bg-[#1B2A40]" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-4 w-28 rounded bg-[#1B2A40]" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-4 w-16 rounded bg-[#1B2A40]" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-4 w-16 rounded bg-[#1B2A40]" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-4 w-20 rounded bg-[#1B2A40]" />
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="ml-auto h-7 w-20 rounded bg-[#1B2A40]" />
                  </td>
                </tr>
              ))
            ) : alarmesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  {erro || 'Nenhum alarme encontrado para os critérios selecionados.'}
                </td>
              </tr>
            ) : (
              alarmesDaPagina.map((item) => {
                const idAlarme = item.id_alerta || item.id;
                const titulo = getTitulo(item);
                const condicao = getCondicao(item);
                const categoria = getCategoria(item);
                const equipamento = getEquipamento(item);
                const severidade = getSeveridade(item);
                const isReconhecido = isAlarmeReconhecido(item);

                return (
                  <tr
                    key={idAlarme}
                    onClick={() => setSelectedAlarme(item)}
                    className="group cursor-pointer transition-colors hover:bg-[#142032]/60"
                  >
                    {/* Coluna 1: Título + Badge */}
                    <td className="max-w-[280px] px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-slate-100 transition-colors group-hover:text-[#78B5FF]">
                          {titulo}
                        </span>
                        {categoria === 'Energético' ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#244C88]/50 bg-[#17315F]/40 px-2 py-0.5 text-[10px] font-medium text-[#78B5FF]">
                            ⚡ Energético
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                            📡 Comunicação
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-400">
                        {condicao}
                      </div>
                    </td>

                    {/* Equipamento */}
                    <td className="px-3 py-3.5 font-medium text-slate-300">
                      {equipamento}
                      <div className="text-[10px] text-slate-500">
                        {getLocal(item).split('>')[0]}
                      </div>
                    </td>

                    {/* Severidade */}
                    <td className="px-3 py-3.5">
                      {severidade === 'Crítico' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Crítico
                        </span>
                      )}
                      {severidade === 'Atenção' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Atenção
                        </span>
                      )}
                      {severidade === 'Informativo' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[10px] font-semibold text-teal-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Informativo
                        </span>
                      )}
                    </td>

                    {/* Início */}
                    <td className="px-3 py-3.5 text-slate-300">
                      <div>{item.inicio || '—'}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.data_criacao || item.timestampInicio || '—'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      {activeTab === 'ativos' ? (
                        isReconhecido ? (
                          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                            Reconhecido
                          </span>
                        ) : (
                          <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400">
                            Ativo
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">
                          {item.inicio || 'Resolvido'}
                        </span>
                      )}
                    </td>

                    {/* Botão de Ação */}
                    <td className="px-3 py-3.5 text-right">
                      {activeTab === 'ativos' ? (
                        isReconhecido ? (
                          <span className="text-xs font-semibold text-slate-500">—</span>
                        ) : (
                          <button
                            onClick={(e) => handleReconhecerClick(idAlarme, e)}
                            disabled={reconhecendoId === idAlarme}
                            className="wv-ack-button h-7 rounded-lg bg-[#1D4ED8] px-3 text-xs font-medium text-white shadow-[0_0_12px_rgba(29,78,216,0.3)] transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {reconhecendoId === idAlarme ? 'Salvando...' : 'Reconhecer'}
                          </button>
                        )
                      ) : (
                        <button className="p-1 text-slate-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="mt-4 flex items-center justify-between border-t border-[#1B2A40] pt-4 text-xs text-slate-400">
        <span>
          {alarmesFiltrados.length
            ? `Mostrando ${(paginaVisivel - 1) * LIMITE_POR_PAGINA + 1} a ${Math.min(
                paginaVisivel * LIMITE_POR_PAGINA,
                alarmesFiltrados.length
              )} de ${alarmesFiltrados.length} alarmes`
            : 'Nenhum alarme'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
            className="flex items-center gap-1 rounded-lg border border-[#1B2A40] bg-[#070A15] px-2.5 py-1 hover:border-slate-600 disabled:opacity-50"
            disabled={paginaVisivel === 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>
          <span className="px-2 font-medium text-slate-200">
            {paginaVisivel} / {totalPaginas}
          </span>
          <button
            onClick={() =>
              setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
            }
            className="flex items-center gap-1 rounded-lg border border-[#1B2A40] bg-[#070A15] px-2.5 py-1 hover:border-slate-600 disabled:opacity-50"
            disabled={paginaVisivel === totalPaginas}
          >
            Próxima <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedAlarme && (() => {
        const idSelecionado = selectedAlarme.id_alerta || selectedAlarme.id;
        const severidadeModal = getSeveridade(selectedAlarme);
        const reconhecidoModal = isAlarmeReconhecido(selectedAlarme);

        const badgeSeveridadeClass =
          severidadeModal === 'Crítico'
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : severidadeModal === 'Atenção'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-teal-500/10 text-teal-400 border-teal-500/20';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSelectedAlarme(null);
            }}
          >
            <div className="wv-modal-panel w-full max-w-lg rounded-2xl border border-[#1B2A40] bg-[#0C141F] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${badgeSeveridadeClass}`}
                    >
                      ● {severidadeModal}
                    </span>
                    <span
                      className={`wv-alarm-status rounded-md px-2 py-0.5 text-xs font-semibold ${
                        reconhecidoModal
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {reconhecidoModal ? 'Reconhecido' : selectedAlarme.status || 'Ativo'}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-white">
                    {getTitulo(selectedAlarme)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAlarme(null)}
                  aria-label="Fechar modal"
                  className="rounded-lg p-1 text-slate-400 hover:bg-[#1B2A40] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-[#1B2A40] bg-[#070A15] p-3">
                <div className="font-semibold text-slate-200">
                  {getEquipamento(selectedAlarme)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  <span>{getLocal(selectedAlarme)}</span>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Condição Identificada
                </span>
                <div className="mt-1 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs font-medium text-red-300">
                  {getCondicao(selectedAlarme)}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#1B2A40] pt-4">
                <button
                  type="button"
                  onClick={() => handleVerEquipamento(selectedAlarme)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#78B5FF] hover:underline"
                >
                  Ver Equipamento <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAlarme(null)}
                    className="rounded-xl border border-[#1B2A40] bg-[#070A15] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#1B2A40]"
                  >
                    Fechar
                  </button>
                  {!reconhecidoModal && (
                    <button
                      type="button"
                      disabled={reconhecendoId === idSelecionado}
                      onClick={() => handleReconhecerClick(idSelecionado)}
                      className="wv-ack-button rounded-xl bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reconhecendoId === idSelecionado
                        ? 'Reconhecendo...'
                        : 'Reconhecer Alarme'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

export default AlarmesTabela;
