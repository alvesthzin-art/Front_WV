import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Printer, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react';
import api from '../services/api';

export default function Relatorios() {
  const [abaAtiva, setAbaAtiva] = useState('Histórico');
  const [filtroPeriodo, setFiltroPeriodo] = useState('Últimos 7 dias');
  const [filtroMetrica, setFiltroMetrica] = useState('Consumo (kWh)');
  const [filtroLocal, setFiltroLocal] = useState('Todos');
  const [filtroSetor, setFiltroSetor] = useState('Todos');
  
  const [locais, setLocais] = useState([]);
  const [setores, setSetores] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState({
    consumoTotal: '1.284,6',
    consumoMedio: '42,8',
    picoPotencia: '78,4 kW',
    custoEstimado: 'R$ 1.027,68',
    variacao: '+8,4%',
    historicoDiario: [
      { data: '23/09/2026', consumo: '1.284,6', custo: 'R$ 1.027,68', variacao: '+8,4%', tipo: 'alta' },
      { data: '22/09/2026', consumo: '1.185,3', custo: 'R$ 948,24', variacao: '-3,2%', tipo: 'baixa' },
      { data: '21/09/2026', consumo: '1.225,9', custo: 'R$ 980,72', variacao: '+5,1%', tipo: 'alta' },
      { data: '20/09/2026', consumo: '1.166,0', custo: 'R$ 932,80', variacao: '-1,8%', tipo: 'baixa' },
      { data: '19/09/2026', consumo: '1.187,6', custo: 'R$ 950,08', variacao: '+2,9%', tipo: 'alta' },
      { data: '18/09/2026', consumo: '1.154,3', custo: 'R$ 923,44', variacao: '-4,7%', tipo: 'baixa' },
      { data: '17/09/2026', consumo: '1.210,8', custo: 'R$ 968,64', variacao: '+6,3%', tipo: 'alta' },
    ]
  });
  const [carregando, setCarregando] = useState(false);

  // Carrega locais e setores reais do banco para popular os filtros dinamicamente
  const carregarFiltrosIniciais = async () => {
    try {
      const [resLocais, resSetores] = await Promise.all([
        api.get('/locais').catch(() => ({ data: [] })),
        api.get('/setores').catch(() => ({ data: [] }))
      ]);
      setLocais(Array.isArray(resLocais.data) ? resLocais.data : (resLocais.data?.dados || []));
      setSetores(Array.isArray(resSetores.data) ? resSetores.data : (resSetores.data?.dados || []));
    } catch (error) {
      console.error("Erro ao carregar filtros operacionais:", error);
    }
  };

  useEffect(() => {
    carregarFiltrosIniciais();
  }, []);

  // Função para atualizar / recarregar os dados do relatório com base nos filtros
  const handleAtualizarDados = async () => {
    setCarregando(true);
    try {
      // Exemplo de requisição integrando com a série temporal do back-end
      const res = await api.get('/medicoes/serie-temporal', { 
        params: { periodo: filtroPeriodo, local: filtroLocal, setor: filtroSetor } 
      }).catch(() => null);

      if (res?.data) {
        // Se houver dados reais na API, processa aqui. Mantém estrutura consistente.
        console.log("Dados de relatório atualizados:", res.data);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do relatório:", error);
    } finally {
      setTimeout(() => setCarregando(false), 600);
    }
  };

  // Função para exportar / imprimir relatório em PDF
  const handleExportarPDF = () => {
    window.print(); // Abre a janela de impressão nativa do browser configurada para Salvar como PDF mantendo a folha estilizada
  };

  return (
    <main className="min-h-screen p-4 md:p-6 text-slate-200 space-y-6 bg-transparent">
      {/* Cabeçalho Superior da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Relatórios</h1>
          <p className="text-xs text-slate-400 mt-0.5">Consulte, compare e projete o comportamento do consumo energético</p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleAtualizarDados}
            disabled={carregando}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0C141F] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white transition shadow-sm"
          >
            <RefreshCw size={14} className={carregando ? "animate-spin text-blue-400" : ""} />
            Atualizar Dados
          </button>

          <button 
            onClick={handleExportarPDF}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0C141F] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white transition shadow-sm"
          >
            <Download size={14} />
            Exportar Relatório
          </button>

          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0C141F] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white transition shadow-sm"
          >
            <Printer size={14} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Abas de Navegação de Relatórios */}
      <div className="flex border-b border-slate-800/60 gap-8">
        {['Histórico', 'Comparação', 'Previsibilidade', 'Gerados'].map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              abaAtiva === aba 
                ? 'text-blue-400 border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {aba}
          </button>
        ))}
      </div>

      {/* Barra de Filtros (Local, Setor, Equipamento, Métrica, Período) */}
      <div className="flex flex-wrap items-center gap-3">
        <select 
          value={filtroLocal} 
          onChange={(e) => setFiltroLocal(e.target.value)}
          className="rounded-xl border border-slate-800 bg-[#0C141F] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600 transition"
        >
          <option value="Todos">Local: Todos</option>
          {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
        </select>

        <select 
          value={filtroSetor} 
          onChange={(e) => setFiltroSetor(e.target.value)}
          className="rounded-xl border border-slate-800 bg-[#0C141F] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600 transition"
        >
          <option value="Todos">Setor: Todos</option>
          {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
        </select>

        <select 
          value={filtroMetrica} 
          onChange={(e) => setFiltroMetrica(e.target.value)}
          className="rounded-xl border border-slate-800 bg-[#0C141F] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600 transition"
        >
          <option value="Consumo (kWh)">Consumo (kWh)</option>
          <option value="Potência (kW)">Potência (kW)</option>
          <option value="Tensão (V)">Tensão (V)</option>
          <option value="Corrente (A)">Corrente (A)</option>
        </select>

        <select 
          value={filtroPeriodo} 
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          className="rounded-xl border border-slate-800 bg-[#0C141F] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600 transition"
        >
          <option value="Últimos 7 dias">Últimos 7 dias</option>
          <option value="Últimos 30 dias">Últimos 30 dias</option>
          <option value="Hoje">Hoje</option>
        </select>
      </div>

      {/* Cards de Resumo Estatístico Superior (5 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md space-y-2">
          <div className="p-2 w-fit rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20"><Zap size={18} /></div>
          <div>
            <h3 className="text-xl font-bold text-white">{dadosRelatorio.consumoTotal} <span className="text-xs font-normal text-slate-400">kWh</span></h3>
            <p className="text-xs text-slate-400 mt-0.5">Consumo Total <span className="block text-[10px] text-slate-500">no período selecionado</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md space-y-2">
          <div className="p-2 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><TrendingUp size={18} /></div>
          <div>
            <h3 className="text-xl font-bold text-white">{dadosRelatorio.consumoMedio} <span className="text-xs font-normal text-slate-400">kWh/dia</span></h3>
            <p className="text-xs text-slate-400 mt-0.5">Consumo Médio <span className="block text-[10px] text-slate-500">média diária do período</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md space-y-2">
          <div className="p-2 w-fit rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><BarChart3 size={18} /></div>
          <div>
            <h3 className="text-xl font-bold text-white">{dadosRelatorio.picoPotencia}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pico de Potência <span className="block text-[10px] text-slate-500">14:32 &bull; 23/09/2026</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md space-y-2">
          <div className="p-2 w-fit rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"><DollarSign size={18} /></div>
          <div>
            <h3 className="text-xl font-bold text-white">{dadosRelatorio.custoEstimado}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Custo Estimado <span className="block text-[10px] text-slate-500">@ R$ 0,80/kWh</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md space-y-2">
          <div className="p-2 w-fit rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20"><ArrowUpRight size={18} /></div>
          <div>
            <h3 className="text-xl font-bold text-rose-400 flex items-center gap-1">
              {dadosRelatorio.variacao}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Variação <span className="block text-[10px] text-slate-500">vs. período anterior</span></p>
          </div>
        </div>
      </section>

      {/* Gráfico de Evolução */}
      <section className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Evolução &mdash; {filtroMetrica}</h3>
            <p className="text-[11px] text-slate-400">Série histórica do período selecionado</p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-[#101827] p-1 border border-slate-800 text-xs">
            {['1h', '6h', '24h', '7d', '30d'].map((p) => (
              <button 
                key={p}
                className={`px-3 py-1 rounded-lg font-medium transition ${p === '7d' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Desenho do Gráfico SVG Estilizado */}
        <div className="relative pt-6 pb-2">
          <div className="h-[200px] w-full">
            <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradRelatorio" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linhas de grade de fundo */}
              {[0, 0.33, 0.66, 1].map((r, i) => (
                <line key={i} x1="0" y1={200 * r} x2="700" y2={200 * r} stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
              ))}

              {/* Área sob a curva */}
              <path d="M 0 50 Q 175 30, 350 70 T 700 90 L 700 200 L 0 200 Z" fill="url(#gradRelatorio)" />

              {/* Linha principal */}
              <path d="M 0 50 Q 175 30, 350 70 T 700 90" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

              {/* Ponto Interativo em Destaque */}
              <g transform="translate(350, 70)">
                <circle r="6" fill="#0C141F" stroke="#3b82f6" strokeWidth="3" />
                <rect x="-45" y="-42" width="90" height="32" rx="8" fill="#101827" stroke="#3b82f6" strokeWidth="1" />
                <text x="0" y="-28" fill="#94a3b8" fontSize="9" textAnchor="middle">23/09/2026 &bull; Sáb</text>
                <text x="0" y="-16" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">30,8 kWh</text>
              </g>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 border-t border-slate-800/60">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>
        </div>
      </section>

      {/* Tabela de Consumo por Período */}
      <section className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 backdrop-blur-md overflow-hidden">
        <div className="p-5 border-b border-slate-800/60">
          <h3 className="text-sm font-bold text-white">Consumo por Período</h3>
          <p className="text-[11px] text-slate-400">Consolidado diário com custo estimado e variação</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] border-collapse text-left text-xs">
            <thead className="bg-[#101827] text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Consumo (kWh)</th>
                <th className="px-4 py-3 font-semibold">Custo Estimado (R$)</th>
                <th className="px-4 py-3 font-semibold">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dadosRelatorio.historicoDiario.map((item, idx) => (
                <tr key={idx} className="transition hover:bg-slate-900/40">
                  <td className="px-5 py-4 font-medium text-slate-200">{item.data}</td>
                  <td className="px-4 py-4 text-slate-300 font-semibold">{item.consumo}</td>
                  <td className="px-4 py-4 text-slate-300">{item.custo}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 font-semibold ${item.tipo === 'alta' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.tipo === 'alta' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {item.variacao}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-800/60 text-[11px] text-slate-500">
          {dadosRelatorio.historicoDiario.length} registros listados
        </div>
      </section>
    </main>
  );
}