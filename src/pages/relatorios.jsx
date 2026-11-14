import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  DollarSign,
  Printer,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
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
import { exportarRelatorioPDF } from '../services/relatorioPDF';

const HORAS_POR_PERIODO = {
  Hoje: 24,
  '6 horas': 6,
  Ontem: 48,
  'Últimos 7 dias': 168,
  'Últimos 30 dias': 720,
};

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

// Energia acumulada: somar apenas diferenças positivas entre leituras consecutivas.
// Quedas no contador são tratadas como reinício, sem cobrar o valor reiniciado.
// A primeira leitura serve de referência, não de consumo do período.
function calcularConsumoPorDia(registros) {
  const porMedidor = new Map();
  registros.forEach((item) => {
    const data = converterData(item.data_hora);
    const energia = obterValor(item, METRICAS['Consumo (kWh)']);
    if (!data || energia === null || energia < 0) return;
    const id = item.id_pzem ?? item.pzem_id ?? item.id_medidor ?? 'medidor_unico';
    if (!porMedidor.has(id)) porMedidor.set(id, []);
    porMedidor.get(id).push({ data, energia });
  });

  const porDia = new Map();
  for (const leituras of porMedidor.values()) {
    leituras.sort((a, b) => a.data - b.data);
    for (let i = 1; i < leituras.length; i += 1) {
      const diferenca = leituras[i].energia - leituras[i - 1].energia;
      if (diferenca < 0) continue; // reset do contador
      const dia = chaveDataLocal(leituras[i].data);
      porDia.set(dia, (porDia.get(dia) ?? 0) + diferenca);
    }
  }
  return porDia;
}

function agruparPorDia(registros, metrica, consumoPorDia) {
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
    .map((grupo) => {
      const { valores } = grupo;
      const total = valores.reduce((soma, valor) => soma + valor, 0);
      const media = total / valores.length;
      const valor = metrica.acumulada
        ? (consumoPorDia.get(chaveDataLocal(grupo.data)) ?? 0)
        : media;
      const variacao = 0; // preenchida abaixo usando a linha anterior

      return {
        data: grupo.data.toLocaleDateString('pt-BR'),
        quantidade: valores.length,
        valor,
        minimo: Math.min(...valores),
        maximo: Math.max(...valores),
        variacao,
      };
    }).map((linha, indice, todas) => ({
      ...linha,
      variacao: indice > 0 && todas[indice - 1].valor !== 0
        ? ((linha.valor - todas[indice - 1].valor) / Math.abs(todas[indice - 1].valor)) * 100
        : 0,
    }));
}

function agruparTodasGrandezasPorDia(registros, consumoPorDia) {
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
        ? (consumoPorDia.get(chaveDataLocal(grupo.data)) ?? 0)
        : valores.reduce((soma, atual) => soma + atual, 0) / valores.length;
      return { nome: itemMetrica.nome, valor };
    }),
  }));
}

// Define limites arredondados e marcações legíveis para cada grandeza.
// Os limites automáticos são apenas visuais: não alteram as medições.
function calcularEscalaAutomatica(valores, nome) {
  const menor = Math.min(...valores);
  const maior = Math.max(...valores);
  const faixa = maior - menor;
  const referencia = Math.max(Math.abs(menor), Math.abs(maior), 1);
  const amplitude = faixa > 0 ? faixa * 1.2 : Math.max(referencia * 0.1, 0.01);
  const bruto = amplitude / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fator = bruto / potencia;
  const multiplicador = [1, 2, 2.5, 5, 10].find((item) => item >= fator) ?? 10;
  const passo = multiplicador * potencia;
  const centro = (menor + maior) / 2;
  let minimo = Math.floor((centro - Math.max(amplitude, passo * 4) / 2) / passo) * passo;
  let maximo = Math.ceil((centro + Math.max(amplitude, passo * 4) / 2) / passo) * passo;
  minimo = Math.min(minimo, Math.floor(menor / passo) * passo);
  maximo = Math.max(maximo, Math.ceil(maior / passo) * passo);
  if (nome === 'Fator de potência') {
    minimo = Math.max(0, minimo);
    maximo = Math.min(1, maximo);
    if (maximo <= minimo) { minimo = 0; maximo = 1; }
  } else if (minimo < 0 && menor >= 0 && nome !== 'Tensão (V)') {
    minimo = 0;
  }
  return { minimo: Number(minimo.toPrecision(12)), maximo: Number(maximo.toPrecision(12)) };
}

function marcasEixo(minimo, maximo, quantidade = 5) {
  return Array.from({ length: quantidade }, (_, i) => Number((minimo + (maximo - minimo) * i / (quantidade - 1)).toPrecision(12)));
}

function formatarEixo(valor, nome) {
  const casas = nome === 'Fator de potência' ? 3 : (Math.abs(valor) < 1 ? 3 : Math.abs(valor) < 10 ? 2 : 2);
  return Number(valor.toFixed(casas)).toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

export default function Relatorios() {
  const [tarifaTexto, setTarifaTexto] = useState(() => {
    try { return localStorage.getItem('wattvision_tarifa') ?? '0.80'; }
    catch { return '0.80'; }
  });
  const tarifaKwh = Math.max(0, Number(tarifaTexto.replace(',', '.')) || 0);
  const atualizarTarifa = (texto) => {
    if (!/^\d*[.,]?\d*$/.test(texto)) return;
    setTarifaTexto(texto);
    try { localStorage.setItem('wattvision_tarifa', texto); } catch { /* storage indisponível */ }
  };

  const [limitesManuais, setLimitesManuais] = useState({});
  const alterarLimite = (nome, campo, texto) => {
    if (texto !== '' && !/^-?\d*[.,]?\d*$/.test(texto)) return;
    setLimitesManuais((atual) => ({ ...atual, [nome]: { ...atual[nome], [campo]: texto } }));
  };
  const restaurarEscala = (nome) => setLimitesManuais((atual) => {
    const novo = { ...atual };
    delete novo[nome];
    return novo;
  });

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
  const consumoPorDia = useMemo(() => calcularConsumoPorDia(registrosValidos), [registrosValidos]);
  const consumoTotal = useMemo(
    () => [...consumoPorDia.values()].reduce((soma, valor) => soma + valor, 0),
    [consumoPorDia]
  );
  const linhas = useMemo(
    () => agruparPorDia(registrosValidos, metrica, consumoPorDia),
    [registrosValidos, metrica, consumoPorDia]
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
    const valores = registrosValidos.map((item) => obterValor(item, metrica)).filter((valor) => valor !== null);
    const soma = valores.reduce((acumulado, valor) => acumulado + valor, 0);
    const total = metrica.acumulada ? consumoTotal : soma;
    const media = metrica.acumulada
      ? total / Math.max(linhas.length, 1)
      : (valores.length ? total / valores.length : 0);
    const pico = metrica.acumulada
      ? Math.max(0, ...linhas.map((linha) => linha.valor))
      : (valores.length ? Math.max(...valores) : 0);
    return { principal: metrica.acumulada ? total : media, media, pico, custo: consumoTotal * tarifaKwh };
  }, [registrosValidos, metrica, linhas, consumoTotal, tarifaKwh]);

  const resumoDiario = useMemo(
    () => agruparTodasGrandezasPorDia(registrosValidos, consumoPorDia),
    [registrosValidos, consumoPorDia]
  );

  const imprimirRelatorio = () => window.print();

  const exportarPDF = () => {
    if (!registrosValidos.length) return;

    exportarRelatorioPDF({
      registros: registrosValidos,
      metricas: METRICAS_GRAFICO,
      metricasExibidas,
      filtros: {
        periodo: filtroPeriodo,
        metrica: filtroMetrica,
        local: filtroLocal,
        setor: filtroSetor,
      },
      obterValor,
      converterData,
      custoKwh: tarifaKwh,
    });
  };

  return (
    <main className="min-h-screen space-y-6 bg-transparent p-4 text-slate-200 md:p-6 print:bg-white print:p-0 print:text-black">
      {/* O título da página já é exibido pelo layout principal. */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{atualizadoEm ? `Dados atualizados às ${atualizadoEm}` : 'Carregando medições...'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setCarregando(true); void carregarRelatorio(); }} disabled={carregando} className="inline-flex items-center gap-2 rounded-xl border border-[#263448] bg-[#111C2C] px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-blue-500/60 hover:bg-[#19283D] disabled:opacity-50">
            <RefreshCw size={14} className={carregando ? 'animate-spin text-blue-400' : 'text-blue-400'} /> Atualizar dados
          </button>
          <button type="button" onClick={exportarPDF} disabled={carregando || !registrosValidos.length} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 disabled:opacity-50">
            <Download size={14} /> Exportar PDF
          </button>
          <button type="button" onClick={imprimirRelatorio} className="inline-flex items-center gap-2 rounded-xl border border-[#263448] bg-[#111C2C] px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-[#19283D]">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-[#243247] bg-[#0C141F] p-4 shadow-sm md:p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <SlidersHorizontal size={16} className="text-blue-400" /> Filtros do relatório
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium text-slate-400">
            Período analisado
            <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="wv-filter-control wv-filter-select w-full px-3 text-xs outline-none">
              {Object.keys(HORAS_POR_PERIODO).map((periodo) => <option key={periodo}>{periodo}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium text-slate-400">
            Local
            <select value={filtroLocal} onChange={(e) => setFiltroLocal(e.target.value)} className="wv-filter-control wv-filter-select w-full px-3 text-xs outline-none">
              <option value="Todos">Todos os locais</option>
              {locais.map((local) => <option key={local.id ?? local.nome} value={local.nome}>{local.nome}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium text-slate-400">
            Setor
            <select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)} className="wv-filter-control wv-filter-select w-full px-3 text-xs outline-none">
              <option value="Todos">Todos os setores</option>
              {setores.map((setor) => <option key={setor.id ?? setor.nome} value={setor.nome}>{setor.nome}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium text-slate-400">
            Grandeza
            <select value={filtroMetrica} onChange={(e) => setFiltroMetrica(e.target.value)} className="wv-filter-control wv-filter-select w-full px-3 text-xs outline-none">
              <option>Todas as grandezas</option>
              {Object.keys(METRICAS).map((metricaNome) => <option key={metricaNome}>{metricaNome}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium text-slate-400">
            Tarifa de energia
            <span className="wv-filter-control flex items-center gap-2 px-3 transition-colors focus-within:border-blue-400 focus-within:bg-blue-500/15">
              <DollarSign size={15} className="shrink-0 text-blue-400" />
              <span className="text-xs text-slate-300">R$</span>
              <input type="text" inputMode="decimal" aria-label="Tarifa em reais por kWh" value={tarifaTexto} onChange={(e) => atualizarTarifa(e.target.value)} className="w-full min-w-0 bg-transparent text-xs font-bold text-white outline-none" />
              <span className="shrink-0 text-[11px] text-slate-400">/kWh</span>
            </span>
          </label>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          A tarifa é o preço por kWh configurado; não possui período próprio. O consumo e o custo estimado consideram <span className="font-semibold text-slate-300">{filtroPeriodo.toLowerCase()}</span> e os filtros de local e setor.
        </p>
      </section>

      <section id="relatorio-impressao" className="space-y-6 rounded-2xl print:space-y-4 print:bg-white">
        <header className="hidden print:block">
          <h1 className="text-2xl font-bold">Relatório de medições</h1>
          <p>Período: {filtroPeriodo} | Grandezas: {filtroMetrica}</p>
          <p>Local: {filtroLocal} | Setor: {filtroSetor}</p>
          <p>Tarifa: R$ {formatarNumero(tarifaKwh, 2)}/kWh | Consumo calculado: {formatarNumero(consumoTotal, 3)} kWh</p>
        </header>

        {erro && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 print:text-red-700">{erro}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {[
            [Zap, formatarNumero(resumo.principal), metrica.acumulada ? 'Consumo total' : 'Média da grandeza', metrica.unit],
            [TrendingUp, formatarNumero(resumo.media), metrica.acumulada ? 'Média diária' : 'Média das leituras', metrica.unit],
            [BarChart3, formatarNumero(resumo.pico), metrica.acumulada ? 'Maior consumo diário' : 'Maior valor', metrica.unit],
          ].map(([Icone, valor, legenda, unidade]) => (
            <div key={legenda} className="rounded-2xl border border-[#243247] bg-[#0C141F] p-5 shadow-sm print:border-gray-300 print:bg-white">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 print:bg-transparent"><Icone size={18} className="text-blue-400 print:text-black" /></div>
              <p className="text-2xl font-bold tracking-tight text-white print:text-black">{valor} <span className="text-xs font-normal text-slate-400 print:text-gray-600">{unidade}</span></p>
              <p className="mt-2 text-xs text-slate-400 print:text-gray-600">{legenda}</p>
              <p className="mt-1 text-[11px] text-slate-500 print:text-gray-600">{filtroPeriodo}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-blue-500/35 bg-[#101D30] p-5 shadow-sm print:border-gray-300 print:bg-white">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 print:bg-transparent"><DollarSign size={18} className="text-blue-400 print:text-black" /></span>
              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-300 print:text-black">Estimativa</span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white print:text-black">R$ {formatarNumero(resumo.custo, 2)}</p>
            <p className="mt-2 text-xs font-medium text-slate-300 print:text-black">Custo estimado · {filtroPeriodo}</p>
            <div className="mt-3 border-t border-[#2A3B53] pt-3 text-[11px] leading-relaxed text-slate-400 print:border-gray-300 print:text-gray-700">
              <p>Consumo no período: <span className="font-semibold text-slate-200 print:text-black">{formatarNumero(consumoTotal, 3)} kWh</span></p>
              <p>Tarifa aplicada: <span className="font-semibold text-slate-200 print:text-black">R$ {formatarNumero(tarifaKwh, 2)}/kWh</span></p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-white print:text-black">Grandezas ao longo do tempo</h2>
            </div>
            <span className="text-[11px] text-slate-500">{dadosGraficoReal.length} pontos exibidos</span>
          </div>
          {dadosGraficoReal.length ? metricasExibidas.map((itemMetrica) => {
            const dadosMetrica = dadosGraficoReal
              .map((item) => ({ momento: item.momento, valor: item[itemMetrica.nome] }))
              .filter((item) => Number.isFinite(item.valor));
            const valores = dadosMetrica.map((item) => item.valor);
            if (!valores.length) return null;
            const automatico = calcularEscalaAutomatica(valores, itemMetrica.nome);
            const manual = limitesManuais[itemMetrica.nome] ?? {};
            const lerLimite = (texto, padrao) => {
              if (texto === undefined || texto.trim() === '') return padrao;
              const numero = Number(texto.replace(',', '.'));
              return Number.isFinite(numero) ? numero : padrao;
            };
            const minimo = lerLimite(manual.minimo, automatico.minimo);
            const maximo = lerLimite(manual.maximo, automatico.maximo);
            const limitesValidos = minimo < maximo && (itemMetrica.nome !== 'Fator de potência' || (minimo >= 0 && maximo <= 1));
            const marcas = limitesValidos ? marcasEixo(minimo, maximo) : marcasEixo(automatico.minimo, automatico.maximo);
            return (
              <article key={itemMetrica.nome} className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 print:border-gray-300 print:bg-white">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-white print:text-black">{itemMetrica.nome}</h3>
                  <span className="text-[11px] text-slate-500">{dadosMetrica.length} leituras</span>
                </div>
                <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-[#263448] bg-[#111C2C] px-3 py-2.5 print:hidden">
                  <div className="mr-auto text-[11px] text-slate-400">
                    <span className="block font-semibold text-slate-200">Escala do eixo Y</span>
                    <span>Automática ou personalizada · {itemMetrica.unit || 'sem unidade'}</span>
                  </div>
                  {['minimo', 'maximo'].map((campo) => (
                    <label key={campo} className="flex flex-col gap-1 text-[11px] text-slate-400">
                      {campo === 'minimo' ? 'Mínimo' : 'Máximo'}
                      <input
                        type="text" inputMode="decimal"
                        aria-label={`${campo === 'minimo' ? 'Mínimo' : 'Máximo'} de ${itemMetrica.nome}`}
                        value={manual[campo] ?? ''}
                        placeholder={String(automatico[campo]).replace('.', ',')}
                        onChange={(e) => alterarLimite(itemMetrica.nome, campo, e.target.value)}
                        className="w-28 rounded-lg border border-[#34445B] bg-[#0C141F] px-2.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                      />
                    </label>
                  ))}
                  <button type="button" onClick={() => restaurarEscala(itemMetrica.nome)} className="rounded-lg border border-[#34445B] px-3 py-2 text-xs text-blue-300 transition hover:bg-blue-500/10">Automático</button>
                  {!limitesValidos && <span className="w-full text-xs text-rose-400">O mínimo deve ser menor que o máximo{itemMetrica.nome === 'Fator de potência' ? ' (entre 0 e 1)' : ''}. Usando escala automática.</span>}
                </div>
                <div className="h-[250px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosMetrica} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263448" vertical={false} />
                      <XAxis dataKey="momento" minTickGap={28} stroke="#8191A5" tick={{ fontSize: 10 }} />
                      <YAxis type="number" domain={limitesValidos ? [minimo, maximo] : [automatico.minimo, automatico.maximo]} ticks={marcas} allowDataOverflow stroke="#8191A5" tick={{ fontSize: 10 }} tickFormatter={(valor) => formatarEixo(valor, itemMetrica.nome)} width={72} />
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
                      <th className="px-4 py-3">Custo (R$)</th>
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
                    <td className="px-4 py-3 font-semibold text-white print:text-black">
                      R$ {formatarNumero((dia.metricas.find((item) => item.nome === 'Consumo (kWh)')?.valor ?? 0) * tarifaKwh, 2)}
                    </td>
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

