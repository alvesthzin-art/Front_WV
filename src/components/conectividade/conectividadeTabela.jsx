import React, { useState, useEffect } from 'react';
import {
  Search,
  Radio,
  MoreVertical,
  Cpu,
  Layers,
  Building2,
  HelpCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wifi,
  Check,
  Info,
  Save,
  Eye,
  Pencil,
  Power,
  Trash2,
} from 'lucide-react';

const VINCULO_ICONS = {
  EQUIPAMENTO: Cpu,
  SETOR: Layers,
  LOCAL: Building2,
  'NÃO ASSOCIADO': HelpCircle,
};

const PERIODOS = ['Hoje', '7 dias', '30 dias', 'Personalizado'];
const ITENS_POR_PAGINA = 10;

const LISTA_REGRAS = [
  {
    key: 'alarmeOffline',
    titulo: 'Gerar alarme quando dispositivo ficar offline',
    descricao: 'Cria um alerta de comunicação após o tempo de tolerância.',
  },
  {
    key: 'alarmeReconectar',
    titulo: 'Gerar alarme quando dispositivo reconectar',
    descricao: 'Notifica quando a comunicação estável for restabelecida.',
  },
  {
    key: 'registrarHistorico',
    titulo: 'Registrar eventos no histórico de conectividade',
    descricao: 'Mantém quedas e reconexões disponíveis para consulta.',
  },
];

function ConectividadeTabela({
  dispositivos = [],
  eventosHistorico = [],
  configuracaoGlobal,
  loading = false,
  onSalvarConfiguracao,
  onVerDetalhes,
  onEditar,
  onAlterarStatus,
  onExcluir,
}) {
  const [abaAtiva, setAbaAtiva] = useState('status');
  const [filtro, setFiltro] = useState('');
  const [menuAbertoId, setMenuAbertoId] = useState(null);

  // Estados aba Histórico de Conectividade
  const [periodoAtivo, setPeriodoAtivo] = useState('Personalizado');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados aba Configuração sincronizados com a API
  const [tempos, setTempos] = useState({
    offline: configuracaoGlobal?.offline ?? 5,
    instavel: configuracaoGlobal?.instavel ?? 2,
    reconexaoEstavel: configuracaoGlobal?.reconexaoEstavel ?? 3,
  });
  const [regras, setRegras] = useState({
    alarmeOffline: configuracaoGlobal?.alarmeOffline ?? true,
    alarmeReconectar: configuracaoGlobal?.alarmeReconectar ?? false,
    registrarHistorico: configuracaoGlobal?.registrarHistorico ?? true,
  });
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);

  useEffect(() => {
    if (configuracaoGlobal) {
      setTempos({
        offline: configuracaoGlobal.offline,
        instavel: configuracaoGlobal.instavel,
        reconexaoEstavel: configuracaoGlobal.reconexaoEstavel,
      });
      setRegras({
        alarmeOffline: configuracaoGlobal.alarmeOffline,
        alarmeReconectar: configuracaoGlobal.alarmeReconectar,
        registrarHistorico: configuracaoGlobal.registrarHistorico,
      });
    }
  }, [configuracaoGlobal]);

  const filtrados = dispositivos.filter((d) => {
    const termo = filtro.toLowerCase();
    return (
      (d.id || '').toLowerCase().includes(termo) ||
      (d.nome || '').toLowerCase().includes(termo) ||
      (d.relacionadoNome || '').toLowerCase().includes(termo) ||
      (d.local || '').toLowerCase().includes(termo) ||
      (d.setor || '').toLowerCase().includes(termo)
    );
  });

  const totalEventos = eventosHistorico.length;
  const totalPaginas = Math.max(1, Math.ceil(totalEventos / ITENS_POR_PAGINA));
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const eventosPaginados = eventosHistorico.slice(inicio, inicio + ITENS_POR_PAGINA);

  const toggleRegra = (chave) => {
    setRegras((prev) => ({ ...prev, [chave]: !prev[chave] }));
    setSalvoComSucesso(false);
  };

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    if (onSalvarConfiguracao) {
      await onSalvarConfiguracao({ ...tempos, ...regras });
    }
    setSalvoComSucesso(true);
    setTimeout(() => setSalvoComSucesso(false), 3000);
  };

  return (
    <section className="rounded-2xl bg-[#0C141F] border border-[#17315F]/50 shadow-[0_2px_20px_0_rgba(0,0,0,0.38)] overflow-hidden">
      {/* Navegação entre Abas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 pt-4 border-b border-[#17315F]/40">
        <div className="flex items-center gap-6">
          {[
            { id: 'status', label: 'Status Atual' },
            { id: 'historico', label: 'Histórico de Conectividade' },
            { id: 'configuracao', label: 'Configuração' },
          ].map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`pb-3.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                abaAtiva === aba.id
                  ? 'border-[#2C57A8] text-white'
                  : 'border-transparent text-[#9ca1a6] hover:text-white'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {abaAtiva === 'status' && (
          <div className="relative pb-3 sm:pb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A525B]" />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar dispositivo ou equipamento"
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg bg-[#070A15] border border-[#17315F]/50 text-xs text-[#C0C5C8] placeholder-[#4A525B] focus:outline-none focus:border-[#2C57A8]"
            />
          </div>
        )}
      </div>

      {/* ABA 1: STATUS ATUAL */}
      {abaAtiva === 'status' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#17315F]/40 text-[11px] font-semibold uppercase tracking-wider text-[#4A525B]">
                <th className="py-3.5 px-5">Dispositivo</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Relacionado a</th>
                <th className="py-3.5 px-4">Local</th>
                <th className="py-3.5 px-4">Setor</th>
                <th className="py-3.5 px-4">Comunicação</th>
                <th className="py-3.5 px-4">Último Contato</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17315F]/30 text-sm">
              {loading && dispositivos.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="py-4 px-5">
                      <div className="h-5 bg-[#17315F]/30 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 px-5 text-center text-xs text-[#9ca1a6]">
                    Nenhum dispositivo encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((dev) => {
                  const IconeVinculo = VINCULO_ICONS[dev.vinculoTipo] || HelpCircle;
                  const isOnline = dev.status === 'Online';
                  const isInstavel = dev.status === 'Instável';
                  const chaveMenu = dev.id_dispositivo_iot || dev.id;

                  return (
                    <tr
                      key={chaveMenu}
                      onClick={() => onVerDetalhes && onVerDetalhes(dev)}
                      className="hover:bg-[#17315F]/20 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#C0C5C8]">{dev.id}</div>
                        {dev.nome && dev.nome !== dev.id && (
                          <div className="text-[11px] text-[#9ca1a6] mt-0.5">{dev.nome}</div>
                        )}
                        {dev.pontoAtivo && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#102520] text-[#2A8246] border border-[#2A8246]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2A8246]" />
                            Ponto ativo
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-[#9ca1a6]">{dev.modelo}</td>

                      <td className="py-4 px-4">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4A525B]">
                          {dev.vinculoTipo}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-[#C0C5C8] mt-0.5">
                          <IconeVinculo size={13} className="text-[#9ca1a6]" />
                          <span>{dev.relacionadoNome}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-[#9ca1a6]">{dev.local || '—'}</td>
                      <td className="py-4 px-4 text-xs text-[#9ca1a6]">{dev.setor || '—'}</td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#9ca1a6]">
                          <Radio size={13} className="text-[#5A8F97]" />
                          {dev.protocolo}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-[#C0C5C8] font-medium">
                        {dev.ultimoContato}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isOnline
                              ? 'bg-[#102520] text-[#2A8246] border-[#2A8246]/30'
                              : isInstavel
                                ? 'bg-[#4F3E1A]/40 text-[#AFA183] border-[#AFA183]/30'
                                : 'bg-[#17315F]/40 text-[#9ca1a6] border-[#17315F]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnline
                                ? 'bg-[#2A8246]'
                                : isInstavel
                                  ? 'bg-[#AFA183]'
                                  : 'bg-[#9ca1a6]'
                            }`}
                          />
                          {dev.status}
                        </span>
                      </td>

                      <td
                        className="py-4 px-5 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setMenuAbertoId(menuAbertoId === chaveMenu ? null : chaveMenu)
                          }
                          className="p-1.5 rounded-lg text-[#9ca1a6] hover:bg-[#17315F]/50 hover:text-white transition-colors cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuAbertoId === chaveMenu && (
                          <div className="absolute right-5 mt-1 w-44 rounded-xl bg-[#111622] border border-[#17315F] shadow-xl py-1 z-20 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuAbertoId(null);
                                onVerDetalhes && onVerDetalhes(dev);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#C0C5C8] hover:bg-[#17315F] transition-colors cursor-pointer"
                            >
                              <Eye size={13} />
                              Ver detalhes
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMenuAbertoId(null);
                                onEditar && onEditar(dev);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#C0C5C8] hover:bg-[#17315F] transition-colors cursor-pointer"
                            >
                              <Pencil size={13} />
                              Editar dispositivo
                            </button>

                            {onAlterarStatus && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbertoId(null);
                                  onAlterarStatus(dev, isOnline ? 'Offline' : 'Online');
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#C0C5C8] hover:bg-[#17315F] transition-colors cursor-pointer"
                              >
                                <Power size={13} />
                                {isOnline ? 'Marcar Offline' : 'Marcar Online'}
                              </button>
                            )}

                            {onExcluir && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbertoId(null);
                                  onExcluir(dev);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer border-t border-[#17315F]/40 mt-1 pt-2"
                              >
                                <Trash2 size={13} />
                                Excluir dispositivo
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA 2: HISTÓRICO DE CONECTIVIDADE */}
      {abaAtiva === 'historico' && (
        <div>
          <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-[#17315F]/40">
            <span className="text-xs font-medium text-[#4A525B]">Período</span>

            <div className="flex flex-wrap items-center gap-1.5">
              {PERIODOS.map((periodo) => {
                const isAtivo = periodoAtivo === periodo;
                const isPersonalizado = periodo === 'Personalizado';

                return (
                  <button
                    key={periodo}
                    type="button"
                    onClick={() => {
                      setPeriodoAtivo(periodo);
                      setPaginaAtual(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isAtivo
                        ? 'bg-[#2C57A8]/20 text-white border border-[#2C57A8]'
                        : 'text-[#9ca1a6] hover:text-white border border-transparent'
                    }`}
                  >
                    {isPersonalizado && <Calendar size={13} className="text-[#60A5FA]" />}
                    {periodo}
                  </button>
                );
              })}
            </div>

            {periodoAtivo === 'Personalizado' && (
              <div className="flex items-center gap-2 ml-1">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#070A15] border border-[#17315F]/60 text-xs text-[#C0C5C8] focus:outline-none focus:border-[#2C57A8]"
                />
                <span className="text-xs text-[#4A525B]">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#070A15] border border-[#17315F]/60 text-xs text-[#C0C5C8] focus:outline-none focus:border-[#2C57A8]"
                />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#17315F]/40 text-[11px] font-semibold uppercase tracking-wider text-[#4A525B]">
                  <th className="py-3.5 px-5">Dispositivo</th>
                  <th className="py-3.5 px-4">Evento</th>
                  <th className="py-3.5 px-4">Data / Hora</th>
                  <th className="py-3.5 px-5">Duração da Indisponibilidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17315F]/30 text-sm">
                {eventosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-5 text-center text-xs text-[#9ca1a6]">
                      Nenhum evento de conectividade registrado no período.
                    </td>
                  </tr>
                ) : (
                  eventosPaginados.map((item) => {
                    const isReconectado = item.evento === 'Reconectado';

                    return (
                      <tr key={item.id} className="hover:bg-[#17315F]/15 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="text-xs font-semibold text-[#C0C5C8]">
                            {item.dispositivo}
                          </div>
                          {item.subtitulo && (
                            <div className="text-[11px] text-[#4A525B] mt-0.5">{item.subtitulo}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              isReconectado
                                ? 'bg-[#102520] text-[#2A8246] border-[#2A8246]/30'
                                : 'bg-[#4F3E1A]/40 text-[#AFA183] border-[#AFA183]/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isReconectado ? 'bg-[#2A8246]' : 'bg-[#AFA183]'
                              }`}
                            />
                            {item.evento}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-[#C0C5C8]">{item.dataHora}</div>
                          <div className="text-[11px] text-[#4A525B] mt-0.5">{item.relativo}</div>
                        </td>

                        <td className="py-3.5 px-5 text-xs font-medium text-[#C0C5C8]">
                          {item.duracao}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-t border-[#17315F]/40">
            <span className="text-xs text-[#4A525B]">{totalEventos} eventos</span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9ca1a6] mr-2">
                Página {paginaAtual} de {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#070A15] border border-[#17315F]/60 text-xs font-semibold text-[#C0C5C8] hover:bg-[#17315F]/40 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>

              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#070A15] border border-[#17315F]/60 text-xs font-semibold text-[#C0C5C8] hover:bg-[#17315F]/40 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Próxima
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: CONFIGURAÇÃO */}
      {abaAtiva === 'configuracao' && (
        <form onSubmit={handleSalvarConfig} className="p-5 space-y-5">
          <div className="p-5 rounded-xl bg-[#070A15]/70 border border-[#17315F]/50">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#17315F]/40 border border-[#17315F] flex items-center justify-center text-[#5A8F97] shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Detecção de Status</h3>
                <p className="text-xs text-[#4A525B] mt-0.5">
                  Tempos globais usados para classificar a comunicação dos dispositivos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#C0C5C8] mb-2">
                  Tempo para considerar offline
                </label>
                <div className="flex items-center rounded-xl bg-[#0C141F] border border-[#17315F]/60 focus-within:border-[#2C57A8] overflow-hidden">
                  <input
                    type="number"
                    min={1}
                    value={tempos.offline}
                    onChange={(e) => setTempos({ ...tempos, offline: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-transparent text-sm text-white focus:outline-none"
                  />
                  <span className="px-3.5 py-2.5 text-xs font-medium text-[#4A525B] border-l border-[#17315F]/40">
                    min
                  </span>
                </div>
                <p className="text-[11px] text-[#4A525B] mt-1.5">
                  Após este tempo sem contato, o dispositivo é marcado como offline.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C0C5C8] mb-2">
                  Tempo para considerar instável
                </label>
                <div className="flex items-center rounded-xl bg-[#0C141F] border border-[#17315F]/60 focus-within:border-[#2C57A8] overflow-hidden">
                  <input
                    type="number"
                    min={1}
                    value={tempos.instavel}
                    onChange={(e) => setTempos({ ...tempos, instavel: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-transparent text-sm text-white focus:outline-none"
                  />
                  <span className="px-3.5 py-2.5 text-xs font-medium text-[#4A525B] border-l border-[#17315F]/40">
                    min
                  </span>
                </div>
                <p className="text-[11px] text-[#4A525B] mt-1.5">
                  Após este tempo sem comunicação estável.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C0C5C8] mb-2">
                  Tempo para reconexão estável
                </label>
                <div className="flex items-center rounded-xl bg-[#0C141F] border border-[#17315F]/60 focus-within:border-[#2C57A8] overflow-hidden">
                  <input
                    type="number"
                    min={1}
                    value={tempos.reconexaoEstavel}
                    onChange={(e) =>
                      setTempos({ ...tempos, reconexaoEstavel: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-transparent text-sm text-white focus:outline-none"
                  />
                  <span className="px-3.5 py-2.5 text-xs font-medium text-[#4A525B] border-l border-[#17315F]/40">
                    min
                  </span>
                </div>
                <p className="text-[11px] text-[#4A525B] mt-1.5">
                  Dispositivo precisa ficar online por este tempo para fechar o alarme de comunicação.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#070A15]/70 border border-[#17315F]/50">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#17315F]/40 border border-[#17315F] flex items-center justify-center text-[#5A8F97] shrink-0">
                <Wifi size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Comportamento dos Alarmes</h3>
                <p className="text-xs text-[#4A525B] mt-0.5">
                  Defina quais eventos de conectividade devem gerar notificações
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {LISTA_REGRAS.map((regra) => {
                const ativo = regras[regra.key];

                return (
                  <div
                    key={regra.key}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-[#0C141F] border border-[#17315F]/40"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-[#C0C5C8]">{regra.titulo}</h4>
                      <p className="text-[11px] text-[#4A525B] mt-0.5">{regra.descricao}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRegra(regra.key)}
                      className={`inline-flex items-center justify-center gap-1.5 min-w-[96px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto ${
                        ativo
                          ? 'bg-[#2C57A8] text-white hover:bg-[#3566C2]'
                          : 'bg-[#070A15] text-[#4A525B] border border-[#17315F]/50 hover:text-[#9ca1a6]'
                      }`}
                    >
                      {ativo && <Check size={12} />}
                      {ativo ? 'Ativado' : 'Desativado'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
            <div className="flex items-start gap-2 text-xs text-[#4A525B]">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                Estes alarmes são gerados automaticamente pelo sistema com base no tempo de resposta dos
                dispositivos. Não é possível configurar limites individuais por dispositivo — apenas a
                tolerância global.
              </span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              {salvoComSucesso && (
                <span className="text-xs font-medium text-[#2A8246]">Alterações salvas!</span>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C57A8] hover:bg-[#3566C2] text-white text-xs font-semibold transition-colors shadow-lg shadow-[#2C57A8]/20 cursor-pointer"
              >
                <Save size={14} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

export default ConectividadeTabela;