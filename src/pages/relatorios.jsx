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
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
  'Consumo (kWh)': { keys: ['energia', 'energia_acumulada', 'consumo'], unit: 'kWh', acumulada: true, cor: '#3b82f6' },
  'Potência (kW)': { keys: ['potencia_ativa', 'potencia'], unit: 'kW', transform: valor => valor / 1000, cor: '#10b981' },
  'Tensão (V)': { keys: ['tensao'], unit: 'V', cor: '#6366f1' },
  'Corrente (A)': { keys: ['corrente'], unit: 'A', cor: '#f59e0b' },
  'Frequência (Hz)': { keys: ['frequencia', 'frequência'], unit: 'Hz', cor: '#a855f7' },
  'Fator de potência': { keys: ['fator_potencia', 'fatorPotencia'], unit: '', casas: 3, cor: '#f97316' },
};

const METRICAS_GRAFICO = Object.entries(METRICAS).map(([nome, configuracao]) => ({
  nome,
  ...configuracao,
}));

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
  if (!Number.isFinite(valor)) return null;
  return metrica.transform ? metrica.transform(valor) : valor;
}

function abreviarData(valor) {
  const data = converterData(valor);
  return data ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
}

function rotuloDataHora(valor) {
  const data = converterData(valor);
  return data ? data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
}

function amostrarRegistros(registros, limite = 120) {
  if (registros.length <= limite) return registros;
  const passo = (registros.length - 1) / (limite - 1);
  return Array.from({ length: limite }, (_, indice) => registros[Math.round(indice * passo)]);
}

function chaveDataLocal(data) {
  return [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-');
}

function formatarDataLocal(data) {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function agruparPorDia(registros, metrica) {
  const grupos = new Map();

  registros.forEach((item) => {
    const data = converterData(item.data_hora);
    const valor = obterValor(item, metrica);
    if (!data || valor === null) return;

    const chave = chaveDataLocal(data);
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

function agruparTodasGrandezasPorDia(registros) {
  const grupos = new Map();

  registros.forEach((item) => {
    const data = converterData(item.data_hora);
    if (!data) return;

    const chave = chaveDataLocal(data);
    const grupo = grupos.get(chave) || { data, valores: new Map(), leituras: 0 };
    grupo.leituras += 1;
    METRICAS_GRAFICO.forEach((itemMetrica) => {
      const valor = obterValor(item, itemMetrica);
      if (valor === null) return;
      const valores = grupo.valores.get(itemMetrica.nome) || [];
      valores.push(valor);
      grupo.valores.set(itemMetrica.nome, valores);
    });
    grupos.set(chave, grupo);
  });

  return [...grupos.values()].sort((a, b) => a.data - b.data).map((grupo) => ({
    data: formatarDataLocal(grupo.data),
    leituras: grupo.leituras,
    metricas: METRICAS_GRAFICO.map((itemMetrica) => {
      const valores = grupo.valores.get(itemMetrica.nome) || [];
      if (!valores.length) return { nome: itemMetrica.nome, valor: null };
      const valor = itemMetrica.acumulada
        ? Math.max(...valores) - Math.min(...valores)
        : valores.reduce((soma, atual) => soma + atual, 0) / valores.length;
      return { nome: itemMetrica.nome, valor };
    }),
  }));
}

export default function Relatorios() {
  const [filtroPeriodo, setFiltroPeriodo] = useState('Últimos 7 dias');
  const [filtroMetrica, setFiltroMetrica] = useState('Todas as grandezas');
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

  const exibirTodas = filtroMetrica === 'Todas as grandezas';
  const metrica = METRICAS[filtroMetrica] ?? METRICAS['Consumo (kWh)'];
  const registrosValidos = useMemo(
    () => registros.filter((item) => METRICAS_GRAFICO.some((itemMetrica) => obterValor(item, itemMetrica) !== null)),
    [registros]
  );
  const linhas = useMemo(
    () => agruparPorDia(registrosValidos, metrica),
    [registrosValidos, metrica]
  );

  const dadosGrafico = useMemo(() => amostrarRegistros(registrosValidos).map((item) => {
    const ponto = { momento: abreviarData(item.data_hora), dataLabel: rotuloDataHora(item.data_hora) };
    ponto.__originais = {};
    METRICAS_GRAFICO.forEach((itemMetrica) => {
      const valor = obterValor(item, itemMetrica);
      if (valor !== null) {
        ponto[itemMetrica.nome] = valor;
        ponto.__originais[itemMetrica.nome] = valor;
      }
    });
    return ponto;
  }).map((ponto, _indice, pontos) => {
    if (!exibirTodas) return ponto;
    const normalizado = { ...ponto };
    METRICAS_GRAFICO.forEach((itemMetrica) => {
      const valores = pontos.map(item => item.__originais[itemMetrica.nome]).filter(valor => Number.isFinite(valor));
      const valor = ponto.__originais[itemMetrica.nome];
      if (!Number.isFinite(valor) || !valores.length) return;
      const minimo = Math.min(...valores);
      const faixa = Math.max(Math.max(...valores) - minimo, 1e-9);
      normalizado[itemMetrica.nome] = ((valor - minimo) / faixa) * 100;
    });
    return normalizado;
  }), [registrosValidos, exibirTodas]);

  const metricasExibidas = exibirTodas
    ? METRICAS_GRAFICO
    : METRICAS_GRAFICO.filter((itemMetrica) => itemMetrica.nome === filtroMetrica);

  const dadosGraficoReal = useMemo(() => dadosGrafico.map((item) => ({
    momento: item.momento,
    dataLabel: item.dataLabel,
    ...item.__originais,
  })), [dadosGrafico]);

  const resumo = useMemo(() => {
    const valores = registrosValidos.map((item) => obterValor(item, metrica)).filter(valor => valor !== null);
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

  const resumosMetricas = useMemo(() => METRICAS_GRAFICO.map((itemMetrica) => {
    const valores = registrosValidos.map((item) => obterValor(item, itemMetrica)).filter(valor => valor !== null);
    const media = valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : 0;
    return {
      ...itemMetrica,
      media,
      minimo: valores.length ? Math.min(...valores) : 0,
      maximo: valores.length ? Math.max(...valores) : 0,
      ultimo: valores.at(-1) ?? 0,
    };
  }), [registrosValidos]);

  const resumoDiario = useMemo(
    () => agruparTodasGrandezasPorDia(registrosValidos),
    [registrosValidos]
  );

  const imprimirRelatorio = () => window.print();

  const criarImagemGrafico = (itemMetrica) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 300;
    const contexto = canvas.getContext('2d');
    const margem = { topo: 48, direita: 32, baixo: 42, esquerda: 70 };
    const largura = canvas.width - margem.esquerda - margem.direita;
    const altura = canvas.height - margem.topo - margem.baixo;
    const valores = dadosGraficoReal.map(item => item[itemMetrica.nome]).filter(valor => Number.isFinite(valor));
    const minimo = valores.length ? Math.min(...valores) : 0;
    const maximo = valores.length ? Math.max(...valores) : 1;
    const faixa = maximo - minimo || 1;

    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.font = '18px Arial';
    contexto.fillStyle = '#0f172a';
    contexto.fillText(`${itemMetrica.nome} (${itemMetrica.unit || 'sem unidade'})`, margem.esquerda, 28);

    contexto.strokeStyle = '#cbd5e1';
    contexto.lineWidth = 1;
    for (let indice = 0; indice <= 4; indice += 1) {
      const y = margem.topo + (altura * indice) / 4;
      contexto.beginPath();
      contexto.moveTo(margem.esquerda, y);
      contexto.lineTo(margem.esquerda + largura, y);
      contexto.stroke();
      contexto.fillStyle = '#64748b';
      contexto.font = '12px Arial';
      const escala = maximo - ((maximo - minimo) * indice) / 4;
      contexto.fillText(formatarNumero(escala, itemMetrica.casas ?? 1), 12, y + 4);
    }

    contexto.strokeStyle = itemMetrica.cor;
    contexto.lineWidth = 3;
    contexto.beginPath();
    let desenhou = false;
    dadosGraficoReal.forEach((item, indice) => {
      const valor = item[itemMetrica.nome];
      if (!Number.isFinite(valor)) return;
      const x = margem.esquerda + (largura * indice) / Math.max(dadosGraficoReal.length - 1, 1);
      const y = margem.topo + altura - ((valor - minimo) / faixa) * altura;
      if (!desenhou) contexto.moveTo(x, y);
      else contexto.lineTo(x, y);
      desenhou = true;
    });
    contexto.stroke();

    contexto.fillStyle = '#64748b';
    contexto.font = '12px Arial';
    [0, Math.floor((dadosGraficoReal.length - 1) / 2), dadosGraficoReal.length - 1]
      .filter((indice, posicao, lista) => indice >= 0 && lista.indexOf(indice) === posicao)
      .forEach((indice) => {
        const x = margem.esquerda + (largura * indice) / Math.max(dadosGraficoReal.length - 1, 1);
        const rotulo = dadosGraficoReal[indice]?.dataLabel || '';
        contexto.fillText(rotulo, Math.max(margem.esquerda, x - 36), canvas.height - 14);
      });

    return canvas.toDataURL('image/png', 1);
  };

  const exportarPDF = () => {
    if (!registrosValidos.length) return;

    const documento = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const titulo = 'Relatório de medições';
    const nomeArquivo = `relatorio-${filtroPeriodo.toLowerCase().replaceAll(' ', '-')}.pdf`;

    documento.setFontSize(18);
    documento.text(titulo, 14, 16);
    documento.setFontSize(10);
    documento.text(`Período: ${filtroPeriodo} | Grandezas: ${filtroMetrica}`, 14, 23);
    documento.text(`Local: ${filtroLocal} | Setor: ${filtroSetor}`, 14, 29);
    documento.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

    const linhasResumo = exibirTodas
      ? resumosMetricas.map(itemMetrica => [
        itemMetrica.nome,
        `Média: ${formatarNumero(itemMetrica.media, itemMetrica.casas ?? 1)} ${itemMetrica.unit}`,
        `Mín.: ${formatarNumero(itemMetrica.minimo, itemMetrica.casas ?? 1)} ${itemMetrica.unit}`,
        `Máx.: ${formatarNumero(itemMetrica.maximo, itemMetrica.casas ?? 1)} ${itemMetrica.unit}`,
        `Último: ${formatarNumero(itemMetrica.ultimo, itemMetrica.casas ?? 1)} ${itemMetrica.unit}`,
      ])
      : [
        [metrica.acumulada ? 'Total do período' : 'Valor principal', `${formatarNumero(resumo.principal)} ${metrica.unit}`],
        ['Média', `${formatarNumero(resumo.media)} ${metrica.unit}`],
        ['Maior valor', `${formatarNumero(resumo.pico)} ${metrica.unit}`],
        ['Custo estimado', `R$ ${formatarNumero(resumo.custo, 2)}`],
      ];

    autoTable(documento, {
      startY: 42,
      head: [exibirTodas ? ['Grandeza', 'Média', 'Mínimo', 'Máximo', 'Último'] : ['Resumo', 'Valor']],
      body: linhasResumo,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    let proximaPosicaoGrafico = documento.lastAutoTable.finalY + 8;
    metricasExibidas.forEach((itemMetrica) => {
      if (proximaPosicaoGrafico + 62 > 195) {
        documento.addPage();
        proximaPosicaoGrafico = 16;
      }
      documento.addImage(criarImagemGrafico(itemMetrica), 'PNG', 14, proximaPosicaoGrafico, 269, 58);
      proximaPosicaoGrafico += 64;
    });

    const linhasTabela = exibirTodas
      ? resumoDiario.map((dia) => [
        dia.data,
        dia.leituras,
        ...dia.metricas.map((itemResumo) => {
          const itemMetrica = METRICAS_GRAFICO.find(item => item.nome === itemResumo.nome);
          return itemResumo.valor === null
            ? '—'
            : `${formatarNumero(itemResumo.valor, itemMetrica.casas ?? 1)} ${itemMetrica.unit}`;
        }),
      ])
      : linhas.map((linha) => [
        linha.data,
        linha.quantidade,
        `${formatarNumero(linha.valor)} ${metrica.unit}`,
        `${formatarNumero(linha.minimo)} ${metrica.unit}`,
        `${formatarNumero(linha.maximo)} ${metrica.unit}`,
        `${linha.variacao >= 0 ? '+' : ''}${formatarNumero(linha.variacao)}%`,
      ]);

    const inicioTabela = proximaPosicaoGrafico + 4;
    documento.setFontSize(11);
    documento.setTextColor(15, 23, 42);
    documento.text(exibirTodas ? 'Resumo diário de todas as grandezas' : `Resumo diário de ${filtroMetrica}`, 14, inicioTabela);

    autoTable(documento, {
      startY: inicioTabela + 4,
      head: [exibirTodas
        ? ['Data', 'Leituras', 'Consumo', 'Potência média', 'Tensão média', 'Corrente média', 'Frequência média', 'FP médio']
        : ['Data', 'Leituras', 'Média', 'Mínimo', 'Máximo', 'Variação']],
      body: linhasTabela,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: exibirTodas ? 7 : 8, cellPadding: 2 },
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
          <option>Todas as grandezas</option>
          {Object.keys(METRICAS).map((metricaNome) => <option key={metricaNome}>{metricaNome}</option>)}
        </select>
        <span className="text-[11px] text-slate-500">{atualizadoEm ? `Atualizado às ${atualizadoEm}` : 'Carregando...'}</span>
      </section>

      <section id="relatorio-impressao" className="space-y-6 rounded-2xl print:space-y-4 print:bg-white">
        <header className="hidden print:block">
          <h1 className="text-2xl font-bold">Relatório de medições</h1>
          <p>Período: {filtroPeriodo} | Grandezas: {filtroMetrica}</p>
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

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-white print:text-black">Grandezas ao longo do tempo</h2>
              <p className="text-[11px] text-slate-400 print:text-gray-600">
                Cada grandeza possui seu próprio eixo e escala para manter o gráfico legível.
              </p>
            </div>
            <span className="text-[11px] text-slate-500">{dadosGraficoReal.length} pontos exibidos</span>
          </div>
          {dadosGraficoReal.length ? metricasExibidas.map((itemMetrica) => {
            const dadosMetrica = dadosGraficoReal
              .map((item) => ({ momento: item.momento, valor: item[itemMetrica.nome] }))
              .filter((item) => Number.isFinite(item.valor));
            const valores = dadosMetrica.map((item) => item.valor);
            const menor = Math.min(...valores);
            const maior = Math.max(...valores);
            const margem = maior === menor ? Math.max(Math.abs(menor) * 0.05, 1) : (maior - menor) * 0.12;
            return (
              <article key={itemMetrica.nome} className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 print:border-gray-300 print:bg-white">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-white print:text-black">{itemMetrica.nome} {itemMetrica.unit && `(${itemMetrica.unit})`}</h3>
                  <span className="text-[11px] text-slate-500">{dadosMetrica.length} leituras</span>
                </div>
                <div className="h-[250px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosMetrica} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263448" vertical={false} />
                      <XAxis dataKey="momento" minTickGap={28} stroke="#8191A5" tick={{ fontSize: 10 }} />
                      <YAxis domain={[menor - margem, maior + margem]} stroke="#8191A5" tick={{ fontSize: 10 }} width={52} />
                      <Tooltip
                        contentStyle={{ background: '#101827', border: '1px solid #263448', borderRadius: 12, color: '#e2e8f0' }}
                        formatter={(valor) => [`${formatarNumero(valor, itemMetrica.casas ?? 1)} ${itemMetrica.unit}`, itemMetrica.nome]}
                      />
                      <Line type="monotone" dataKey="valor" name={itemMetrica.nome} connectNulls dot={false} stroke={itemMetrica.cor} strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>
            );
          }) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-16 text-center text-sm text-slate-400">Nenhuma medição encontrada para o período selecionado.</div>
          )}
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
                  {exibirTodas ? (
                    <>
                      <th className="px-5 py-3">Data</th>
                      <th className="px-4 py-3">Leituras</th>
                      {METRICAS_GRAFICO.map((itemMetrica) => <th key={itemMetrica.nome} className="px-4 py-3" style={{ color: itemMetrica.cor }}>{itemMetrica.nome}</th>)}
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-3">Data</th><th className="px-4 py-3">Leituras</th><th className="px-4 py-3">Média</th><th className="px-4 py-3">Mínimo</th><th className="px-4 py-3">Máximo</th><th className="px-4 py-3">Variação</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                {exibirTodas ? resumoDiario.map((dia) => (
                  <tr key={dia.data} className="print:text-black">
                    <td className="px-5 py-3 font-medium">{dia.data}</td>
                    <td className="px-4 py-3">{dia.leituras}</td>
                    {dia.metricas.map((itemResumo) => {
                      const itemMetrica = METRICAS_GRAFICO.find(item => item.nome === itemResumo.nome);
                      return <td key={itemResumo.nome} className="px-4 py-3" style={{ color: itemMetrica.cor }}>{itemResumo.valor === null ? '—' : `${formatarNumero(itemResumo.valor, itemMetrica.casas ?? 1)} ${itemMetrica.unit}`}</td>;
                    })}
                  </tr>
                )) : linhas.map((linha) => (
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
