import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  DollarSign,
  Printer,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import api from '../services/api';

const HORAS_POR_PERIODO = {
  Hoje: 24,
  '6 horas': 6,
  Ontem: 48,
  'Últimos 7 dias': 168,
  'Últimos 30 dias': 720,
};

const CUSTO_KWH = 0.8;

const METRICAS = {
  'Consumo (kWh)': { keys: ['energia', 'energia_acumulada', 'consumo'], unit: 'kWh', acumulada: true },
  'Potência (kW)': { keys: ['potencia_ativa', 'potencia'], unit: 'kW' },
  'Tensão (V)': { keys: ['tensao'], unit: 'V' },
  'Corrente (A)': { keys: ['corrente'], unit: 'A' },
};

function extrairLista(resposta, chaves) {
  if (Array.isArray(resposta?.data)) return resposta.data;
  return chaves.reduce((lista, chave) => (
    Array.isArray(resposta?.data?.[chave]) ? resposta.data[chave] : lista
  ), []);
}

function converterData(valor) {
  if (!valor) return null;
  const data = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarNumero(valor, casas = 1) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function obterValor(item, metrica) {
  const chave = metrica.keys.find((nome) => item[nome] !== undefined && item[nome] !== null);
  const valor = chave ? Number(item[chave]) : NaN;
  return Number.isFinite(valor) ? valor : null;
}

function agruparPorDia(registros, metrica) {
  const grupos = new Map();

  registros.forEach((item) => {
    const data = converterData(item.data_hora);
    const valor = obterValor(item, metrica);
    if (!data || valor === null) return;

    const chave = data.toISOString().slice(0, 10);
    const grupo = grupos.get(chave) || { data, valores: [] };
    grupo.valores.push(valor);
    grupos.set(chave, grupo);
  });

  return [...grupos.values()]
    .sort((a, b) => a.data - b.data)
    .map((grupo, indice, todos) => {
      const { valores } = grupo;
      const total = valores.reduce((soma, valor) => soma + valor, 0);
      const media = total / valores.length;
      const valor = metrica.acumulada
        ? Math.max(...valores) - Math.min(...valores)
        : media;
      const anterior = todos[indice - 1]?.valor;
      const variacao = anterior ? ((valor - anterior) / anterior) * 100 : 0;

      return {
        data: grupo.data.toLocaleDateString('pt-BR'),
        quantidade: valores.length,
        valor,
        minimo: Math.min(...valores),
        maximo: Math.max(...valores),
        variacao,
      };
    });
}

export default function Relatorios() {
  const [filtroPeriodo, setFiltroPeriodo] = useState('Últimos 7 dias');
  const [filtroMetrica, setFiltroMetrica] = useState('Consumo (kWh)');
  const [filtroLocal, setFiltroLocal] = useState('Todos');
  const [filtroSetor, setFiltroSetor] = useState('Todos');
  const [locais, setLocais] = useState([]);
  const [setores, setSetores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarFiltros() {
      const [resLocais, resSetores] = await Promise.all([
        api.get('/locais').catch(() => ({ data: [] })),
        api.get('/setores').catch(() => ({ data: [] })),
      ]);
      if (!ativo) return;
      setLocais(extrairLista(resLocais, ['dados', 'locais']));
      setSetores(extrairLista(resSetores, ['dados', 'setores']));
    }

    carregarFiltros();
    return () => { ativo = false; };
  }, []);

  const carregarRelatorio = useCallback(async () => {
    setErro('');

    try {
      const resposta = await api.get('/medicoes/serie-temporal', {
        params: {
          id_pzem: 1,
          horas: HORAS_POR_PERIODO[filtroPeriodo] || 168,
          local: filtroLocal !== 'Todos' ? filtroLocal : undefined,
          setor: filtroSetor !== 'Todos' ? filtroSetor : undefined,
        },
      });

      const dados = extrairLista(resposta, ['dados', 'medicoes']);
      setRegistros(dados);
      setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }));
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setErro('Não foi possível carregar as medições do período selecionado.');
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }, [filtroPeriodo, filtroLocal, filtroSetor]);

  useEffect(() => {
    const agendamento = setTimeout(() => {
      void carregarRelatorio();
    }, 0);
    const intervalo = setInterval(() => {
      void carregarRelatorio();
    }, 10000);

    return () => {
      clearTimeout(agendamento);
      clearInterval(intervalo);
    };
  }, [carregarRelatorio]);

  const metrica = METRICAS[filtroMetrica];
  const registrosValidos = useMemo(
    () => registros.filter((item) => obterValor(item, metrica) !== null),
    [registros, metrica]
  );
  const linhas = useMemo(
    () => agruparPorDia(registrosValidos, metrica),
    [registrosValidos, metrica]
  );

  const resumo = useMemo(() => {
    const valores = registrosValidos.map((item) => obterValor(item, metrica));
    const soma = valores.reduce((acumulado, valor) => acumulado + valor, 0);
    const total = metrica.acumulada && valores.length > 1
      ? Math.max(...valores) - Math.min(...valores)
      : soma;
    const media = metrica.acumulada
      ? total / Math.max(linhas.length, 1)
      : (valores.length ? total / valores.length : 0);
    const pico = metrica.acumulada ? total : (valores.length ? Math.max(...valores) : 0);
    const consumo = filtroMetrica === 'Consumo (kWh)' ? total : 0;

    return {
      principal: metrica.acumulada ? total : media,
      media,
      pico,
      custo: consumo * CUSTO_KWH,
    };
  }, [registrosValidos, metrica, filtroMetrica, linhas.length]);

  const imprimirRelatorio = () => window.print();

  const exportarPDF = () => {
    if (!registrosValidos.length) return;

    const documento = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const titulo = 'Relatório de medições';
    const nomeArquivo = `relatorio-${filtroPeriodo.toLowerCase().replaceAll(' ', '-')}.pdf`;

    documento.setFontSize(18);
    documento.text(titulo, 14, 16);
    documento.setFontSize(10);
    documento.text(`Período: ${filtroPeriodo} | Métrica: ${filtroMetrica}`, 14, 23);
    documento.text(`Local: ${filtroLocal} | Setor: ${filtroSetor}`, 14, 29);
    documento.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

    autoTable(documento, {
      startY: 42,
      head: [['Resumo', 'Valor']],
      body: [
        [metrica.acumulada ? 'Total do período' : 'Valor principal', `${formatarNumero(resumo.principal)} ${metrica.unit}`],
        ['Média', `${formatarNumero(resumo.media)} ${metrica.unit}`],
        ['Maior valor', `${formatarNumero(resumo.pico)} ${metrica.unit}`],
        ['Custo estimado', `R$ ${formatarNumero(resumo.custo, 2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    autoTable(documento, {
      startY: documento.lastAutoTable.finalY + 8,
      head: [['Data', 'Leituras', 'Média', 'Mínimo', 'Máximo', 'Variação']],
      body: linhas.map((linha) => [
        linha.data,
        linha.quantidade,
        `${formatarNumero(linha.valor)} ${metrica.unit}`,
        `${formatarNumero(linha.minimo)} ${metrica.unit}`,
        `${formatarNumero(linha.maximo)} ${metrica.unit}`,
        `${linha.variacao >= 0 ? '+' : ''}${formatarNumero(linha.variacao)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    });

    documento.save(nomeArquivo);
  };

  return (
    <main className="min-h-screen space-y-6 bg-transparent p-4 text-slate-200 md:p-6 print:bg-white print:p-0 print:text-black">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl print:text-black">Relatórios</h1>
          <p className="mt-0.5 text-xs text-slate-400">Medições consolidadas do período selecionado</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => { setCarregando(true); void carregarRelatorio(); }} disabled={carregando} className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0C141F] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw size={14} className={carregando ? 'animate-spin text-blue-400' : ''} /> Atualizar Dados
          </button>
          <button type="button" onClick={exportarPDF} disabled={carregando || !registrosValidos.length} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
            <Download size={14} /> Exportar PDF
          </button>
          <button type="button" onClick={imprimirRelatorio} className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0C141F] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 print:hidden">
        <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600">
          {Object.keys(HORAS_POR_PERIODO).map((periodo) => <option key={periodo}>{periodo}</option>)}
        </select>
        <select value={filtroLocal} onChange={(e) => setFiltroLocal(e.target.value)} className="rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600">
          <option value="Todos">Local: Todos</option>
          {locais.map((local) => <option key={local.id ?? local.nome} value={local.nome}>{local.nome}</option>)}
        </select>
        <select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)} className="rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600">
          <option value="Todos">Setor: Todos</option>
          {setores.map((setor) => <option key={setor.id ?? setor.nome} value={setor.nome}>{setor.nome}</option>)}
        </select>
        <select value={filtroMetrica} onChange={(e) => setFiltroMetrica(e.target.value)} className="rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600">
          {Object.keys(METRICAS).map((metricaNome) => <option key={metricaNome}>{metricaNome}</option>)}
        </select>
        <span className="text-[11px] text-slate-500">{atualizadoEm ? `Atualizado às ${atualizadoEm}` : 'Carregando...'}</span>
      </section>

      <section id="relatorio-impressao" className="space-y-6 rounded-2xl print:space-y-4 print:bg-white">
        <header className="hidden print:block">
          <h1 className="text-2xl font-bold">Relatório de medições</h1>
          <p>Período: {filtroPeriodo} | Métrica: {filtroMetrica}</p>
          <p>Local: {filtroLocal} | Setor: {filtroSetor}</p>
        </header>

        {erro && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 print:text-red-700">{erro}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {[
            [Zap, formatarNumero(resumo.principal), metrica.acumulada ? 'Total' : 'Média'],
            [TrendingUp, formatarNumero(resumo.media), 'Média das leituras'],
            [BarChart3, formatarNumero(resumo.pico), 'Maior valor'],
            [DollarSign, `R$ ${formatarNumero(resumo.custo, 2)}`, 'Custo estimado'],
          ].map(([Icone, valor, legenda]) => (
            <div key={legenda} className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 print:border-gray-300 print:bg-white">
              <Icone size={18} className="text-blue-400 print:text-black" />
              <p className="mt-3 text-xl font-bold text-white print:text-black">{valor} <span className="text-xs font-normal text-slate-400 print:text-gray-600">{metrica.unit}</span></p>
              <p className="mt-1 text-xs text-slate-400 print:text-gray-600">{legenda}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 print:border-gray-300 print:bg-white">
          <div className="border-b border-slate-800/60 p-5 print:border-gray-300">
            <h2 className="text-sm font-bold text-white print:text-black">Medições por dia</h2>
            <p className="text-[11px] text-slate-400 print:text-gray-600">{registrosValidos.length} leituras encontradas para o período selecionado</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead className="border-b border-slate-800 bg-[#101827] text-[10px] uppercase text-slate-400 print:border-gray-300 print:bg-gray-100 print:text-gray-700">
                <tr>
                  <th className="px-5 py-3">Data</th><th className="px-4 py-3">Leituras</th><th className="px-4 py-3">Média</th><th className="px-4 py-3">Mínimo</th><th className="px-4 py-3">Máximo</th><th className="px-4 py-3">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                {linhas.map((linha) => (
                  <tr key={linha.data} className="print:text-black">
                    <td className="px-5 py-3 font-medium">{linha.data}</td><td className="px-4 py-3">{linha.quantidade}</td><td className="px-4 py-3">{formatarNumero(linha.valor)} {metrica.unit}</td><td className="px-4 py-3">{formatarNumero(linha.minimo)} {metrica.unit}</td><td className="px-4 py-3">{formatarNumero(linha.maximo)} {metrica.unit}</td>
                    <td className={`px-4 py-3 font-semibold ${linha.variacao >= 0 ? 'text-rose-400 print:text-red-700' : 'text-emerald-400 print:text-green-700'}`}>
                      {linha.variacao >= 0 ? <ArrowUpRight className="mr-1 inline" size={13} /> : <ArrowDownRight className="mr-1 inline" size={13} />}{formatarNumero(Math.abs(linha.variacao))}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!linhas.length && !carregando && <p className="p-6 text-sm text-slate-400 print:text-gray-600">Nenhuma medição encontrada para os filtros selecionados.</p>}
        </section>
      </section>
    </main>
  );
}
