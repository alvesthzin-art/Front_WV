import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, Filler, LineController, LineElement, LinearScale, PointElement);
Chart.defaults.font.family = 'Helvetica, Arial, sans-serif';

/* ================================================================== */
/* Configuração                                                        */
/* ================================================================== */

const PAGINA = { largura: 297, altura: 210, margem: 14 };
const LARGURA_UTIL = PAGINA.largura - PAGINA.margem * 2; // 269 mm
const LIMITE_INFERIOR = PAGINA.altura - 14; // 196 mm
const TOPO_CONTEUDO = 16;

const CORES = {
  navy: [15, 23, 42],
  navy2: [30, 41, 59],
  azul: [37, 99, 235],
  cinza: [100, 116, 139],
  texto: [51, 65, 85],
  claro: [241, 245, 249],
  borda: [226, 232, 240],
  ok: [4, 120, 87],
  okFundo: [236, 253, 245],
  okBorda: [110, 231, 183],
  alerta: [185, 28, 28],
  alertaFundo: [254, 242, 242],
  alertaBorda: [252, 165, 165],
  aviso: [180, 83, 9],
  avisoFundo: [255, 251, 235],
  avisoBorda: [252, 211, 77],
};

const NOME_CONSUMO = 'Consumo (kWh)';
const NOME_POTENCIA = 'Potência (kW)';
const NOME_TENSAO = 'Tensão (V)';
const NOME_FREQ = 'Frequência (Hz)';
const NOME_FP = 'Fator de potência';

// Ajuste conforme a sua instalação (aqui: 220 V ±10 %, frequência 59,9-60,1 Hz, FP mínimo 0,92).
const LIMITES = {
  [NOME_TENSAO]: { min: 198, max: 242, texto: '198 a 242 V' },
  [NOME_FREQ]: { min: 59.9, max: 60.1, texto: '59,9 a 60,1 Hz' },
  [NOME_FP]: { min: 0.92, texto: 'acima de 0,92' },
};
const NOMES_ABREV = { [NOME_TENSAO]: 'Tensão', [NOME_FREQ]: 'Freq.', [NOME_FP]: 'FP' };
const CASAS_PADRAO = { [NOME_CONSUMO]: 3, [NOME_POTENCIA]: 2, [NOME_FREQ]: 2 };

/* ================================================================== */
/* Helpers                                                             */
/* ================================================================== */

const pad = (n) => String(n).padStart(2, '0');
const fmt = (valor, casas = 1) => {
  let n = Number(valor ?? 0);
  if (Math.abs(n) < 0.5 * 10 ** -casas) n = 0; // evita "-0,0"
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
};
const dataCurta = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
const horaCurta = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dataHora = (d) => `${dataCurta(d)} ${horaCurta(d)}`;
const nomeCurto = (nome) => nome.replace(/\s*\(.*\)\s*$/, '');
const hexParaRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgba = (hex, alfa) => `rgba(${hexParaRgb(hex).join(',')},${alfa})`;
const chaveDia = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const rotuloDia = (d) => `${SEMANA[d.getDay()]} ${dataCurta(d)}`;
const plural = (n, singular, pluralTxt) => (n === 1 ? singular : pluralTxt);

const casasMetrica = (m) => m.casas ?? CASAS_PADRAO[m.nome] ?? 1;
const comUnidade = (valor, m) => `${fmt(valor, casasMetrica(m))} ${m.unit}`.trim();

const foraDaFaixa = (nome, valor) => {
  const l = LIMITES[nome];
  return Boolean(l) && ((l.min != null && valor < l.min) || (l.max != null && valor > l.max));
};

function mediana(valores) {
  if (!valores.length) return 0;
  const v = [...valores].sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}

/* ================================================================== */
/* Dados                                                               */
/* ================================================================== */

function prepararPontos(registros, metricas, obterValor, converterData) {
  const pontos = registros
    .map((registro) => {
      const data = converterData(registro.data_hora);
      if (!data) return null;
      const v = {};
      metricas.forEach((m) => { v[m.nome] = obterValor(registro, m); });
      return { data, v, delta: 0 };
    })
    .filter(Boolean)
    .sort((a, b) => a.data - b.data);

  // Consumo = soma dos aumentos do medidor acumulado (tolera reinício do medidor).
  let anterior = null;
  let quedas = 0;
  pontos.forEach((p) => {
    const e = p.v[NOME_CONSUMO];
    if (e == null) return;
    if (anterior != null && e >= anterior) p.delta = e - anterior;
    if (anterior != null && e < anterior) quedas += 1;
    anterior = e;
  });

  return { pontos, quedas };
}

const FORMATOS = {
  dia: {
    chave: chaveDia,
    rotulo: (d) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
    rotuloCurto: (d) => rotuloDia(d),
    titulo: 'dia',
  },
  hora: {
    chave: (d) => `${chaveDia(d)}-${d.getHours()}`,
    rotulo: (d) => `${dataCurta(d)} ${pad(d.getHours())}:00`,
    rotuloCurto: (d) => `${dataCurta(d)} ${pad(d.getHours())}h`,
    titulo: 'hora',
  },
  minuto: {
    chave: (d) => `${chaveDia(d)}-${d.getHours()}-${d.getMinutes()}`,
    rotulo: (d) => dataHora(d),
    rotuloCurto: (d) => horaCurta(d),
    titulo: 'minuto',
  },
};

function escolherGranularidade(pontos) {
  const horas = (pontos.at(-1).data - pontos[0].data) / 3600e3;
  if (horas > 48) return 'dia';
  if (horas > 2) return 'hora';
  return 'minuto';
}

function agruparPorPeriodo(pontos, formato) {
  const grupos = new Map();
  pontos.forEach((p) => {
    const chave = formato.chave(p.data);
    if (!grupos.has(chave)) {
      grupos.set(chave, { rotulo: formato.rotulo(p.data), rotuloCurto: formato.rotuloCurto(p.data), pontos: [] });
    }
    grupos.get(chave).pontos.push(p);
  });
  return [...grupos.values()];
}

function estatisticas(pontos, nome) {
  const validos = pontos.filter((p) => p.v[nome] != null);
  if (!validos.length) return null;
  let menor = validos[0];
  let maior = validos[0];
  let soma = 0;
  validos.forEach((p) => {
    const x = p.v[nome];
    soma += x;
    if (x < menor.v[nome]) menor = p;
    if (x > maior.v[nome]) maior = p;
  });
  return {
    media: soma / validos.length,
    min: menor.v[nome],
    max: maior.v[nome],
    dMin: menor.data,
    dMax: maior.data,
    inicial: validos[0].v[nome],
    ultimo: validos.at(-1).v[nome],
    total: validos.length,
  };
}

// Tendência: compara a 1ª e a 2ª metade do TEMPO (não das leituras). Só com 24 h+ e dados nas duas metades.
function tendencia(pontos, nome) {
  if (pontos.length < 6) return null;
  const t0 = pontos[0].data.getTime();
  const t1 = pontos.at(-1).data.getTime();
  if (t1 - t0 < 24 * 3600e3) return null;
  const meio = (t0 + t1) / 2;
  const a = [];
  const b = [];
  pontos.forEach((p) => {
    const v = p.v[nome];
    if (v == null) return;
    (p.data.getTime() < meio ? a : b).push(v);
  });
  if (a.length < 3 || b.length < 3) return null;
  const media = (lista) => lista.reduce((s, x) => s + x, 0) / lista.length;
  const m1 = media(a);
  const pct = m1 ? ((media(b) - m1) / Math.abs(m1)) * 100 : 0;
  const rotulo = Math.abs(pct) < 5 ? 'Estável' : pct > 0 ? 'Alta' : 'Queda';
  return { pct, rotulo, texto: `${rotulo} (${pct >= 0 ? '+' : ''}${fmt(pct, 1)}%)` };
}

function contarForaDaFaixa(pontos, nome) {
  const valores = pontos.map((p) => p.v[nome]).filter((x) => x != null);
  return { fora: valores.filter((x) => foraDaFaixa(nome, x)).length, total: valores.length };
}

function contarAlertas(pontos) {
  return Object.keys(LIMITES)
    .map((nome) => ({ nome, ...contarForaDaFaixa(pontos, nome) }))
    .filter((a) => a.fora > 0);
}

const somaConsumo = (pontos) => pontos.reduce((s, p) => s + p.delta, 0);
const serieDe = (pontos, nome) => pontos
  .filter((p) => p.v[nome] != null)
  .map((p) => ({ x: p.data.getTime(), y: p.v[nome] }));

// Reduz a série preservando picos (início, mín., máx. e fim de cada bloco).
function reduzirSerie(serie, max = 360) {
  if (serie.length <= max) return serie;
  const blocos = Math.floor(max / 4);
  const tamanho = serie.length / blocos;
  const saida = [];
  for (let i = 0; i < blocos; i += 1) {
    const fatia = serie.slice(Math.floor(i * tamanho), Math.floor((i + 1) * tamanho));
    if (fatia.length) {
      let menor = fatia[0];
      let maior = fatia[0];
      fatia.forEach((p) => {
        if (p.y < menor.y) menor = p;
        if (p.y > maior.y) maior = p;
      });
      [fatia[0], menor, maior, fatia.at(-1)]
        .sort((a, b) => a.x - b.x)
        .forEach((p) => { if (saida.at(-1) !== p) saida.push(p); });
    }
  }
  return saida;
}

function resumirGrupos(grupos) {
  return grupos.map((g, indice) => {
    const consumo = somaConsumo(g.pontos);
    // 1ª leitura do período, sozinha, não tem leitura anterior para comparar
    const semBase = indice === 0 && g.pontos.length < 2;
    const pot = estatisticas(g.pontos, NOME_POTENCIA);
    const ten = estatisticas(g.pontos, NOME_TENSAO);
    const cor = estatisticas(g.pontos, 'Corrente (A)');
    const frq = estatisticas(g.pontos, NOME_FREQ);
    const fp = estatisticas(g.pontos, NOME_FP);
    const alertas = contarAlertas(g.pontos)
      .map((a) => `${NOMES_ABREV[a.nome] || nomeCurto(a.nome)} ${a.fora}/${a.total}`)
      .join(' · ');

    return {
      rotulo: g.rotulo,
      rotuloCurto: g.rotuloCurto,
      consumo,
      semBase,
      picoPot: pot?.max ?? null,
      dPico: pot?.dMax ?? null,
      temAlerta: Boolean(alertas),
      celulas: [
        g.rotulo,
        g.pontos.length,
        semBase ? '-' : fmt(consumo, 3),
        pot ? fmt(pot.media, 2) : '-',
        pot ? fmt(pot.max, 2) : '-',
        ten ? `${fmt(ten.media, 1)} (${fmt(ten.min, 0)}-${fmt(ten.max, 0)})` : '-',
        cor ? fmt(cor.media, 1) : '-',
        frq ? fmt(frq.media, 2) : '-',
        fp ? fmt(fp.media, 3) : '-',
        alertas || 'Tudo normal',
      ],
    };
  });
}

/* ================================================================== */
/* Eixo de tempo (comprime intervalos sem medições)                    */
/* ================================================================== */

function ticksDeTempo(t0, t1) {
  const span = t1 - t0;
  const multiDia = chaveDia(new Date(t0)) !== chaveDia(new Date(t1));

  if (span > 36 * 3600e3) {
    const dias = [];
    const d = new Date(t0);
    d.setHours(24, 0, 0, 0);
    while (d.getTime() <= t1) {
      dias.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    if (dias.length >= 2) {
      const passo = Math.ceil(dias.length / 7);
      return dias.filter((_, i) => i % passo === 0).map((dt) => ({ value: dt.getTime(), label: rotuloDia(dt) }));
    }
  }

  return Array.from({ length: 6 }, (_, i) => {
    const value = t0 + (span * i) / 5;
    const d = new Date(value);
    let label = horaCurta(d);
    if (multiDia) label = [dataCurta(d), horaCurta(d)];
    else if (span < 10 * 60e3) label = `${horaCurta(d)}:${pad(d.getSeconds())}`;
    return { value, label };
  });
}

function ticksComLacunas(completa, xs, segmentos, multiDia) {
  const U = xs.at(-1) - xs[0] || 1;
  const indices = new Set();
  segmentos.forEach(([s, e]) => {
    indices.add(s);
    const largura = xs[e] - xs[s];
    if (largura > U * 0.25) {
      const k = Math.floor(largura / (U * 0.2));
      for (let j = 1; j <= k; j += 1) {
        const alvo = xs[s] + (largura * j) / (k + 1);
        let melhor = s;
        for (let i = s; i <= e; i += 1) if (Math.abs(xs[i] - alvo) < Math.abs(xs[melhor] - alvo)) melhor = i;
        indices.add(melhor);
      }
    }
  });
  indices.add(completa.length - 1);

  const escolhidos = [];
  [...indices].sort((a, b) => a - b).forEach((i) => {
    if (!escolhidos.length || xs[i] - xs[escolhidos.at(-1)] >= U * 0.09) escolhidos.push(i);
  });

  return escolhidos.map((i) => {
    const d = new Date(completa[i].x);
    return { value: xs[i], label: multiDia ? [dataCurta(d), horaCurta(d)] : horaCurta(d) };
  });
}

const BUCKETS_MS = [30e3, 60e3, 2 * 60e3, 5 * 60e3, 10 * 60e3, 15 * 60e3, 30 * 60e3, 3600e3, 2 * 3600e3, 3 * 3600e3, 6 * 3600e3, 12 * 3600e3, 24 * 3600e3];

function rotuloBucket(ms) {
  if (ms < 60e3) return `${ms / 1000} s`;
  if (ms < 3600e3) return `${ms / 60e3} min`;
  if (ms < 86400e3) return `${ms / 3600e3} h`;
  return `${ms / 86400e3} dia`;
}

/**
 * Prepara a série para o gráfico.
 * - Grandes intervalos sem medições são encurtados e marcados; a linha é quebrada
 *   e leituras isoladas viram pontos.
 * - Com muitas leituras (> 60), agrupa em períodos (ex.: a cada 2 h): a linha mostra
 *   a média e uma área suave mostra o mínimo e o máximo de cada período.
 */
function construirSerieGrafico(completa) {
  const n = completa.length;
  const dts = [];
  for (let i = 1; i < n; i += 1) dts.push(completa[i].x - completa[i - 1].x);
  const med = mediana(dts.filter((d) => d > 0));

  const t0 = completa[0].x;
  const t1 = completa.at(-1).x > t0 ? completa.at(-1).x : t0 + 60000;
  const limite = Math.max(med * 8, Math.min(4 * 3600e3, (t1 - t0) / 12));
  const lacuna = dts.map((d) => d > limite);
  const temLacuna = lacuna.some(Boolean);
  const multiDia = chaveDia(new Date(t0)) !== chaveDia(new Date(t1));

  const segmentos = [];
  let ini = 0;
  lacuna.forEach((l, i) => {
    if (l) {
      segmentos.push([ini, i]);
      ini = i + 1;
    }
  });
  segmentos.push([ini, n - 1]);

  const conteudo = dts.reduce((s, d, i) => s + (lacuna[i] ? 0 : d), 0) || 60000;

  let xs;
  let ticks;
  let min;
  let max;
  const quebras = [];
  if (!temLacuna) {
    xs = completa.map((p) => p.x);
    min = t0;
    max = t1;
    ticks = ticksDeTempo(t0, t1);
  } else {
    const larguraQuebra = Math.max(med * 6, conteudo * 0.12);
    xs = [0];
    dts.forEach((d, i) => xs.push(xs[i] + (lacuna[i] ? larguraQuebra : d)));
    min = 0;
    max = xs.at(-1) || 1;
    ticks = ticksComLacunas(completa, xs, segmentos, multiDia);
    lacuna.forEach((l, i) => { if (l) quebras.push((xs[i] + xs[i + 1]) / 2); });
  }

  const folgaX = (max - min) * 0.02;
  min -= folgaX;
  max += folgaX;

  const agregado = n > 60;
  const bucketMs = agregado ? (BUCKETS_MS.find((b) => b >= conteudo / 110) ?? BUCKETS_MS.at(-1)) : 0;

  const dados = [];
  const minimos = [];
  const maximos = [];
  const isolados = new Set();
  segmentos.forEach(([s, e], k) => {
    let pts = [];
    if (!agregado) {
      for (let i = s; i <= e; i += 1) pts.push({ x: xs[i], y: completa[i].y, mn: completa[i].y, mx: completa[i].y });
    } else {
      const grupos = new Map();
      for (let i = s; i <= e; i += 1) {
        const chave = Math.floor((completa[i].x - t0) / bucketMs);
        const g = grupos.get(chave) || { sx: 0, sy: 0, n: 0, mn: Infinity, mx: -Infinity };
        g.sx += xs[i];
        g.sy += completa[i].y;
        g.n += 1;
        g.mn = Math.min(g.mn, completa[i].y);
        g.mx = Math.max(g.mx, completa[i].y);
        grupos.set(chave, g);
      }
      pts = [...grupos.values()].map((g) => ({ x: g.sx / g.n, y: g.sy / g.n, mn: g.mn, mx: g.mx }));
    }
    if (k > 0) {
      const xm = (xs[s - 1] + xs[s]) / 2;
      dados.push({ x: xm, y: null });
      minimos.push({ x: xm, y: null });
      maximos.push({ x: xm, y: null });
    }
    if (pts.length === 1) isolados.add(dados.length);
    pts.forEach((p) => {
      dados.push({ x: p.x, y: p.y });
      minimos.push({ x: p.x, y: p.mn });
      maximos.push({ x: p.x, y: p.mx });
    });
  });

  return { dados, minimos, maximos, agregado, bucketMs, isolados, ticks, min, max, quebras, xs };
}

/* ================================================================== */
/* Textos                                                              */
/* ================================================================== */

function montarResumoExecutivo(pontos, linhasGrupo, formato, custoKwh, quedas = 0) {
  const consumo = somaConsumo(pontos);
  const resumo = [
    `Entre ${dataHora(pontos[0].data)} e ${dataHora(pontos.at(-1).data)} foram registradas ${pontos.length} leituras (resumo por ${formato.titulo}).`,
    `Consumo de ${fmt(consumo, 3)} kWh, com custo estimado de R$ ${fmt(consumo * custoKwh, 2)} (tarifa de R$ ${fmt(custoKwh, 2)}/kWh).`,
  ];

  const pot = estatisticas(pontos, NOME_POTENCIA);
  if (pot) {
    resumo.push(`Potência média de ${fmt(pot.media, 2)} kW, com pico de ${fmt(pot.max, 2)} kW em ${dataHora(pot.dMax)}.`);
    const t = tendencia(pontos, NOME_POTENCIA);
    if (t) resumo.push(`Tendência da potência ao longo do período: ${t.texto}.`);
  }

  const comBase = linhasGrupo.filter((l) => !l.semBase);
  if (comBase.length > 1) {
    const maior = comBase.reduce((a, b) => (b.consumo > a.consumo ? b : a));
    resumo.push(`Maior consumo: ${maior.rotulo} (${fmt(maior.consumo, 3)} kWh).`);
  }

  const alertas = contarAlertas(pontos).map((a) => (
    `${nomeCurto(a.nome)} fora do normal em ${fmt((a.fora / a.total) * 100, 0)}% das leituras (${a.fora} de ${a.total}). Faixa normal: ${LIMITES[a.nome].texto}.`
  ));
  if (quedas) {
    alertas.push(`A leitura do medidor voltou para trás ${quedas} ${plural(quedas, 'vez', 'vezes')} (reinício do medidor). O consumo considera só os aumentos de leitura.`);
  }

  return { resumo, alertas };
}

function interpretarMetrica(m, pontos, est, custoKwh, quedas = 0) {
  if (m.nome === NOME_CONSUMO) {
    const total = somaConsumo(pontos);
    const base = `Leitura do medidor: ${fmt(est.inicial, 3)} kWh no início e ${fmt(est.ultimo, 3)} kWh no fim. Consumo de ${fmt(total, 3)} kWh, custo estimado de R$ ${fmt(total * custoKwh, 2)}.`;
    return quedas ? `${base} O medidor reiniciou ${quedas}x; por isso o consumo soma só os aumentos de leitura.` : base;
  }
  const partes = [`Variou de ${comUnidade(est.min, m)} a ${comUnidade(est.max, m)}.`];
  const t = tendencia(pontos, m.nome);
  if (t) partes.push(`Tendência: ${t.texto}.`);
  if (LIMITES[m.nome]) {
    const { fora, total } = contarForaDaFaixa(pontos, m.nome);
    partes.push(fora
      ? `${fora} de ${total} leituras (${fmt((fora / total) * 100, 0)}%) fora do normal (${LIMITES[m.nome].texto}).`
      : 'Todas as leituras dentro do normal.');
  }
  partes.push(`Baseado em ${est.total} leituras.`);
  return partes.join(' ');
}

/* ================================================================== */
/* Chart.js fora da tela                                               */
/* ================================================================== */

const fundoBranco = {
  id: 'fundoBranco',
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

function caixaArredondada(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function desenharLegenda(ctx, itens, limiteX) {
  ctx.font = '20px Helvetica, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const x0 = itens[0]?.x ?? 0;
  let cx = 0;
  let linha = 0;
  itens.forEach((item) => {
    const marcador = item.tipo === 'quebra' ? 22 : item.tipo === 'caixa' ? 36 : 44;
    const largura = marcador + ctx.measureText(item.texto).width;
    if (cx > 0 && x0 + cx + largura > limiteX) {
      cx = 0;
      linha += 1;
    }
    const yy = 22 + linha * 26;
    const x = x0 + cx;
    if (item.tipo === 'linha' || item.tipo === 'solida') {
      ctx.setLineDash(item.tipo === 'linha' ? [6, 6] : []);
      ctx.strokeStyle = item.cor;
      ctx.lineWidth = item.tipo === 'linha' ? 3 : 5;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + 34, yy);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (item.tipo === 'quebra') {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = item.cor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 6, yy - 11);
      ctx.lineTo(x + 6, yy + 12);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = item.cor;
      ctx.fillRect(x, yy - 9, 26, 18);
    }
    ctx.fillStyle = '#334155';
    ctx.fillText(item.texto, x + marcador, yy);
    cx += largura + 40;
  });
}

// Faixa normal, quebras de eixo, linha de média, marcadores de mín/máx, legenda e rótulos de barras.
const decoracoes = {
  id: 'decoracoes',
  beforeDatasetsDraw(chart, _args, o) {
    const { ctx, chartArea: a, scales: { x, y } } = chart;
    ctx.save();

    (o?.quebras || []).forEach((q) => {
      const px = x.getPixelForValue(q);
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, a.top);
      ctx.lineTo(px, a.bottom);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    if (o?.faixa) {
      const { min, max } = o.faixa;
      const topo = Math.max(a.top, max != null ? y.getPixelForValue(max) : a.top);
      const base = Math.min(a.bottom, min != null ? y.getPixelForValue(min) : a.bottom);
      ctx.fillStyle = 'rgba(16,185,129,0.10)';
      ctx.fillRect(a.left, topo, a.right - a.left, Math.max(base - topo, 0));
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = 'rgba(239,68,68,0.75)';
      ctx.lineWidth = 2;
      [min, max].filter((v) => v != null).forEach((v) => {
        const py = y.getPixelForValue(v);
        if (py > a.top && py < a.bottom) {
          ctx.beginPath();
          ctx.moveTo(a.left, py);
          ctx.lineTo(a.right, py);
          ctx.stroke();
        }
      });
    }
    ctx.restore();
  },
  afterDatasetsDraw(chart, _args, o) {
    const { ctx, chartArea: a, scales: { x, y } } = chart;
    ctx.save();

    if (o?.media != null) {
      const py = y.getPixelForValue(o.media);
      if (py > a.top && py < a.bottom) {
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = 'rgba(71,85,105,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.left, py);
        ctx.lineTo(a.right, py);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    (o?.extremos || []).forEach((p) => {
      const px = x.getPixelForValue(p.x);
      const py = y.getPixelForValue(p.y);
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = o.cor;
      ctx.stroke();

      ctx.font = 'bold 20px Helvetica, Arial, sans-serif';
      const largura = ctx.measureText(p.rotulo).width + 22;
      const altura = 32;
      let bx;
      let by;
      if (p.tipo === 'max') {
        bx = Math.min(Math.max(px - largura / 2, a.left), a.right - largura);
        by = Math.max(py - altura - 14, 58);
      } else {
        bx = px + 16 + largura <= a.right ? px + 16 : px - 16 - largura;
        bx = Math.max(a.left, bx);
        by = Math.min(Math.max(py - altura / 2, a.top), a.bottom - altura);
      }
      ctx.fillStyle = '#0f172a';
      caixaArredondada(ctx, bx, by, largura, altura, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.rotulo, bx + largura / 2, by + altura / 2 + 1);
    });

    if (o?.legenda?.length) desenharLegenda(ctx, o.legenda.map((i) => ({ ...i, x: a.left })), a.right);

    if (o?.rotulosBarras) {
      const meta = chart.getDatasetMeta(0);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      o.rotulosBarras.forEach((texto, i) => {
        if (texto == null) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '20px Helvetica, Arial, sans-serif';
          ctx.fillText('sem base', x.getPixelForValue(i), y.getPixelForValue(0) - 10);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
          ctx.fillText(texto, meta.data[i].x, meta.data[i].y - 8);
        }
      });
    }

    ctx.restore();
  },
};

function renderizar(config, largura, altura) {
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const chart = new Chart(canvas, { ...config, plugins: [fundoBranco, decoracoes] });
  const imagem = chart.toBase64Image('image/png', 1);
  chart.destroy();
  return imagem;
}

const gradiente = (cor, forte = 0.32) => (ctx) => {
  const { chart } = ctx;
  const area = chart.chartArea;
  if (!area) return 'transparent';
  const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
  g.addColorStop(0, rgba(cor, forte));
  g.addColorStop(1, rgba(cor, 0));
  return g;
};

function casasDoPasso(passo) {
  const texto = Number(passo.toFixed(6)).toString();
  const i = texto.indexOf('.');
  return i === -1 ? 0 : texto.length - i - 1;
}

// Escolhe limites e passo "redondos" para o eixo Y (ex.: 0, 2, 4, 6, 8).
function eixoBonito(min, max, { piso, teto } = {}) {
  if (piso != null) min = Math.max(min, piso);
  const faixa = max - min || 1;
  const base = 10 ** Math.floor(Math.log10(faixa / 5));
  const candidatos = [1, 2, 2.5, 5, 10, 20, 25, 50, 100].map((f) => f * base);
  let passo = candidatos.at(-1);
  for (const c of candidatos) {
    const intervalos = Math.ceil(max / c - 1e-9) - Math.floor(min / c + 1e-9);
    if (intervalos <= 7) {
      passo = c;
      break;
    }
  }
  let ini = Math.floor(min / passo + 1e-9) * passo;
  let fim = Math.ceil(max / passo - 1e-9) * passo;
  if (piso != null) ini = Math.max(ini, piso);
  if (teto != null) fim = Math.min(fim, teto);
  return { min: Number(ini.toFixed(6)), max: Number(fim.toFixed(6)), passo: Number(passo.toFixed(6)) };
}

function imagemLinha(m, pontos, largura, altura) {
  const completa = serieDe(pontos, m.nome);
  const est = estatisticas(pontos, m.nome);
  if (!completa.length || !est) return null;

  const serie = construirSerieGrafico(completa);
  const lim = LIMITES[m.nome];
  let min = est.min;
  let max = est.max;
  if (lim?.min != null) min = Math.min(min, lim.min);
  if (lim?.max != null) max = Math.max(max, lim.max);
  const folga = max === min ? Math.max(Math.abs(min) * 0.05, 0.5) : (max - min) * 0.08;
  min -= folga;
  max += folga;

  const eixo = eixoBonito(min, max, {
    piso: est.min >= 0 ? 0 : undefined,
    teto: m.nome === NOME_FP ? 1 : undefined,
  });
  const casasEixo = casasDoPasso(eixo.passo);
  const casas = casasMetrica(m);
  const rotulos = new Map(serie.ticks.map((t) => [t.value, t.label]));

  const extremos = [];
  if (est.max !== est.min) {
    const iMax = completa.findIndex((p) => p.y === est.max);
    const iMin = completa.findIndex((p) => p.y === est.min);
    extremos.push({ x: serie.xs[iMax], y: est.max, rotulo: `máx. ${fmt(est.max, casas)}`, tipo: 'max' });
    extremos.push({ x: serie.xs[iMin], y: est.min, rotulo: `mín. ${fmt(est.min, casas)}`, tipo: 'min' });
  }

  const legenda = [];
  if (lim) legenda.push({ tipo: 'caixa', cor: 'rgba(16,185,129,0.35)', texto: `faixa normal: ${lim.texto}` });
  if (m.nome !== NOME_CONSUMO) legenda.push({ tipo: 'linha', cor: '#475569', texto: `média geral ${fmt(est.media, casas)}` });
  if (serie.agregado) {
    legenda.push({ tipo: 'solida', cor: m.cor, texto: `média a cada ${rotuloBucket(serie.bucketMs)}` });
    legenda.push({ tipo: 'caixa', cor: rgba(m.cor, 0.3), texto: 'variação (mín–máx)' });
  }
  if (serie.quebras.length) legenda.push({ tipo: 'quebra', cor: '#94a3b8', texto: 'intervalo sem medições' });

  const rotulosX = rotulos;
  const raioBase = !serie.agregado && completa.length <= 12 ? 4 : 0;
  const comum = { parsing: false, normalized: true, spanGaps: false };
  const suave = serie.agregado ? 'monotone' : 'default';
  const linha = {
    ...comum,
    data: serie.dados,
    borderColor: m.cor,
    borderWidth: 4,
    tension: 0,
    cubicInterpolationMode: suave,
    pointRadius: (c) => (serie.isolados.has(c.dataIndex) ? 6 : raioBase),
    pointBackgroundColor: m.cor,
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
    fill: !serie.agregado,
    backgroundColor: gradiente(m.cor),
    order: 0,
  };
  const datasets = serie.agregado
    ? [
      { ...comum, data: serie.maximos, borderWidth: 0, pointRadius: 0, cubicInterpolationMode: suave, fill: '+1', backgroundColor: rgba(m.cor, 0.2), order: 1 },
      { ...comum, data: serie.minimos, borderWidth: 0, pointRadius: 0, cubicInterpolationMode: suave, fill: false, order: 1 },
      linha,
    ]
    : [linha];

  const fonte = { size: 22 };
  return renderizar({
    type: 'line',
    data: { datasets },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      events: [],
      layout: { padding: { top: 76, right: 28, bottom: 6, left: 6 } },
      scales: {
        x: {
          type: 'linear',
          min: serie.min,
          max: serie.max,
          grid: { display: false },
          border: { color: '#cbd5e1', width: 2 },
          ticks: { color: '#64748b', font: fonte, padding: 10, align: 'inner', callback: (v) => rotulosX.get(v) ?? '' },
          afterBuildTicks: (eixoX) => {
            eixoX.ticks = serie.ticks.map((t) => ({ value: t.value }));
          },
        },
        y: {
          min: eixo.min,
          max: eixo.max,
          grid: { color: '#e2e8f0', lineWidth: 1.5 },
          border: { display: false },
          ticks: { color: '#64748b', font: fonte, padding: 12, stepSize: eixo.passo, callback: (v) => fmt(v, casasEixo) },
        },
      },
      plugins: {
        decoracoes: {
          faixa: lim ? { min: lim.min, max: lim.max } : null,
          media: m.nome === NOME_CONSUMO ? null : est.media,
          extremos,
          legenda,
          quebras: serie.quebras,
          cor: m.cor,
        },
      },
    },
  }, largura, altura);
}

// Média por blocos: o mini gráfico mostra o formato geral, sem o ruído de cada leitura.
function suavizar(valores, alvo = 36) {
  if (valores.length <= alvo) return valores;
  const tamanho = valores.length / alvo;
  return Array.from({ length: alvo }, (_, i) => {
    const fatia = valores.slice(Math.floor(i * tamanho), Math.floor((i + 1) * tamanho));
    return fatia.reduce((s, v) => s + v, 0) / fatia.length;
  });
}

function imagemSparkline(m, pontos, largura, altura) {
  const valores = suavizar(pontos.map((p) => p.v[m.nome]).filter((v) => v != null));
  if (valores.length < 2) return null;
  const serie = valores.map((y, x) => ({ x, y }));
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  const folga = max === min ? 0.5 : (max - min) * 0.15;
  min -= folga;
  max += folga;

  return renderizar({
    type: 'line',
    data: {
      datasets: [{
        data: serie,
        parsing: false,
        normalized: true,
        borderColor: m.cor,
        borderWidth: 5,
        tension: 0,
        cubicInterpolationMode: 'monotone',
        pointRadius: (c) => (c.dataIndex === serie.length - 1 ? 6 : 0),
        pointBackgroundColor: m.cor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        fill: true,
        backgroundColor: gradiente(m.cor, 0.28),
      }],
    },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      events: [],
      layout: { padding: 8 },
      scales: {
        x: { type: 'linear', display: false },
        y: { display: false, min, max },
      },
    },
  }, largura, altura);
}

function imagemBarras(linhasGrupo, largura, altura) {
  const valores = linhasGrupo.map((l) => (l.semBase ? null : l.consumo));
  const validos = valores.filter((v) => v != null);
  const maior = Math.max(...validos, 0);
  const indiceMaior = maior > 0 ? valores.indexOf(maior) : -1;
  const casas = maior < 1 ? 3 : maior < 10 ? 2 : 1;
  const eixo = eixoBonito(0, maior * 1.12 || 1, { piso: 0 });
  const media = validos.length ? validos.reduce((s, v) => s + v, 0) / validos.length : null;
  const poucas = linhasGrupo.length <= 16;

  return renderizar({
    type: 'bar',
    data: {
      labels: linhasGrupo.map((l) => l.rotuloCurto),
      datasets: [{
        data: valores,
        backgroundColor: valores.map((_, i) => (i === indiceMaior ? '#1d4ed8' : '#93c5fd')),
        borderRadius: 10,
        maxBarThickness: 90,
      }],
    },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      events: [],
      layout: { padding: { top: 64, right: 24, bottom: 6, left: 6 } },
      scales: {
        x: {
          grid: { display: false },
          border: { color: '#cbd5e1', width: 2 },
          ticks: { color: '#64748b', font: { size: 22 }, padding: 10, maxRotation: 0, autoSkip: true },
        },
        y: {
          min: eixo.min,
          max: eixo.max,
          grid: { color: '#e2e8f0', lineWidth: 1.5 },
          border: { display: false },
          ticks: { color: '#64748b', font: { size: 22 }, padding: 12, stepSize: eixo.passo, callback: (v) => fmt(v, casasDoPasso(eixo.passo)) },
        },
      },
      plugins: {
        decoracoes: {
          media,
          legenda: media == null ? [] : [{ tipo: 'linha', cor: '#475569', texto: `média ${fmt(media, casas)} kWh` }],
          rotulosBarras: poucas ? valores.map((v) => (v == null ? null : fmt(v, casas))) : null,
        },
      },
    },
  }, largura, altura);
}

/* ================================================================== */
/* Blocos do PDF                                                       */
/* ================================================================== */

const adicionarImagem = (doc, imagem, x, y, w, h) => {
  if (imagem) doc.addImage(imagem, 'PNG', x, y, w, h, undefined, 'FAST');
};

function garantirEspaco(doc, y, altura) {
  if (y + altura > LIMITE_INFERIOR) {
    doc.addPage();
    return TOPO_CONTEUDO;
  }
  return y;
}

// Cartão branco com borda e sombra leve
function cartao(doc, x, y, w, h, raio = 2.5) {
  doc.setFillColor(222, 228, 237);
  doc.roundedRect(x + 0.5, y + 0.7, w, h, raio, raio, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...CORES.borda);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, raio, raio, 'FD');
  doc.setLineWidth(0.2);
}

function tituloSecao(doc, texto, x, y, cor = CORES.azul, tamanho = 12) {
  doc.setFillColor(...cor);
  doc.roundedRect(x, y - 4.4, 1.6, 5.6, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tamanho);
  doc.setTextColor(...CORES.navy);
  doc.text(texto, x + 4, y);
  doc.setFont('helvetica', 'normal');
}

function desenharTopicos(doc, linhas, x, y, largura, corTexto, corPonto, tamanho = 9.5) {
  doc.setFontSize(tamanho);
  let cursor = y;
  linhas.forEach((linha) => {
    const partes = doc.splitTextToSize(linha, largura - 5);
    doc.setFillColor(...corPonto);
    doc.circle(x + 1, cursor - 1.1, 0.75, 'F');
    doc.setTextColor(...corTexto);
    doc.text(partes, x + 4, cursor);
    cursor += partes.length * (tamanho * 0.5) + 1.8;
  });
  return cursor;
}

function desenharCabecalho(doc, filtros, pontos) {
  doc.setFillColor(...CORES.navy);
  doc.rect(0, 0, PAGINA.largura, 28, 'F');
  doc.setFillColor(...CORES.navy2);
  doc.triangle(PAGINA.largura - 120, 28, PAGINA.largura, 0, PAGINA.largura, 28, 'F');
  doc.setFillColor(...CORES.azul);
  doc.rect(0, 28, PAGINA.largura, 1.2, 'F');
  doc.setFillColor(...CORES.azul);
  doc.roundedRect(PAGINA.margem, 7, 1.8, 8.5, 0.9, 0.9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Relatório de medições', PAGINA.margem + 5, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Período: ${filtros.periodo}   |   Grandezas: ${filtros.metrica}`, PAGINA.margem + 5, 20.5);
  doc.text(`Local: ${filtros.local}   |   Setor: ${filtros.setor}`, PAGINA.margem + 5, 25);

  doc.setTextColor(226, 232, 240);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, PAGINA.largura - PAGINA.margem, 14, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Dados de ${dataHora(pontos[0].data)} a ${dataHora(pontos.at(-1).data)}`, PAGINA.largura - PAGINA.margem, 20.5, { align: 'right' });
}

function desenharStatus(doc, y, status) {
  const estilos = {
    ok: { fundo: CORES.okFundo, borda: CORES.okBorda, forte: CORES.ok },
    alerta: { fundo: CORES.alertaFundo, borda: CORES.alertaBorda, forte: CORES.alerta },
    aviso: { fundo: CORES.avisoFundo, borda: CORES.avisoBorda, forte: CORES.aviso },
  };
  const e = estilos[status.nivel];
  const x = PAGINA.margem;

  doc.setFillColor(...e.fundo);
  doc.setDrawColor(...e.borda);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, LARGURA_UTIL, 14.5, 2.5, 2.5, 'FD');
  doc.setFillColor(...e.forte);
  doc.circle(x + 8, y + 7.25, 4.3, 'F');

  if (status.nivel === 'ok') {
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.9);
    doc.line(x + 5.9, y + 7.4, x + 7.4, y + 9);
    doc.line(x + 7.4, y + 9, x + 10.3, y + 5.5);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('!', x + 8, y + 9.2, { align: 'center' });
  }
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...e.forte);
  doc.text(status.titulo, x + 16, y + 6.3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(...CORES.texto);
  doc.text(status.detalhe, x + 16, y + 11.2);
  return y + 14.5;
}

function desenharCartoes(doc, y, cartoes) {
  const gap = 4;
  const largura = (LARGURA_UTIL - gap * (cartoes.length - 1)) / cartoes.length;
  const altura = 34;

  cartoes.forEach((c, i) => {
    const x = PAGINA.margem + i * (largura + gap);
    cartao(doc, x, y, largura, altura);

    doc.setFillColor(...c.cor);
    doc.roundedRect(x + 3.5, y + 4.1, 2.2, 2.2, 0.6, 0.6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...CORES.cinza);
    doc.text(c.rotulo, x + 7.5, y + 6.1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...CORES.navy);
    doc.text(c.valor, x + 3.5, y + 14.5);
    if (c.unidade) {
      const w = doc.getTextWidth(c.valor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...CORES.cinza);
      doc.text(c.unidade, x + 3.5 + w + 1.3, y + 14.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CORES.cinza);
    doc.text(c.detalhe || '', x + 3.5, y + 19);

    const larguraSpark = largura - 6;
    adicionarImagem(doc, c.spark, x + 3, y + 21, larguraSpark, (larguraSpark * 100) / 440);
  });
  return y + altura;
}

function desenharResumoEAlertas(doc, y, resumo, alertas) {
  const wEsq = 164;
  const xDir = PAGINA.margem + wEsq + 5;
  const wDir = LARGURA_UTIL - wEsq - 5;

  tituloSecao(doc, 'Resumo executivo', PAGINA.margem, y);
  const yEsq = desenharTopicos(doc, resumo, PAGINA.margem + 2, y + 7, wEsq - 2, CORES.texto, CORES.azul);

  const temAlerta = alertas.length > 0;
  const linhasAlerta = temAlerta ? alertas : ['Tudo dentro do normal: tensão, frequência e fator de potência.'];
  doc.setFontSize(8.5);
  const partes = linhasAlerta.map((l) => doc.splitTextToSize(l, wDir - 13));
  const alturaCaixa = 13 + partes.reduce((s, p) => s + p.length * 4.1 + 1.8, 0);

  doc.setFillColor(...(temAlerta ? CORES.alertaFundo : CORES.okFundo));
  doc.setDrawColor(...(temAlerta ? CORES.alertaBorda : CORES.okBorda));
  doc.setLineWidth(0.3);
  doc.roundedRect(xDir, y - 5, wDir, alturaCaixa, 2.5, 2.5, 'FD');
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...(temAlerta ? CORES.alerta : CORES.ok));
  doc.text(temAlerta ? 'Pontos de atenção' : 'Sem pontos de atenção', xDir + 4, y + 0.8);
  doc.setFont('helvetica', 'normal');

  let yDir = y + 7;
  partes.forEach((p) => {
    doc.setFillColor(...(temAlerta ? CORES.alerta : CORES.ok));
    doc.circle(xDir + 5, yDir - 1.1, 0.75, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(...(temAlerta ? CORES.alerta : CORES.ok));
    doc.text(p, xDir + 8.5, yDir);
    yDir += p.length * 4.1 + 1.8;
  });

  return Math.max(yEsq, y - 5 + alturaCaixa) + 4;
}

function desenharTile(doc, x, y, w, rotulo, valor, sub) {
  doc.setFillColor(...CORES.claro);
  doc.setDrawColor(...CORES.borda);
  doc.roundedRect(x, y, w, 19, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...CORES.cinza);
  doc.text(rotulo.toUpperCase(), x + 3, y + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...CORES.navy);
  doc.text(valor, x + 3, y + 11.6);
  if (sub) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CORES.cinza);
    doc.text(sub, x + 3, y + 16.2);
  }
}

const ALTURA_BLOCO = 82;
const PASSO_BLOCO = ALTURA_BLOCO + 5;

function desenharBlocoMetrica(doc, y, m, pontos, custoKwh, quedas = 0) {
  const CARD_X = PAGINA.margem;
  const PAD = 4;
  const LARG_GRAFICO = 184;
  const ALT_GRAFICO = 68;
  const xGrafico = CARD_X + PAD;
  const xPainel = xGrafico + LARG_GRAFICO + 4;
  const larguraPainel = CARD_X + LARGURA_UTIL - PAD - xPainel;
  const cor = hexParaRgb(m.cor);
  const est = estatisticas(pontos, m.nome);

  cartao(doc, CARD_X, y, LARGURA_UTIL, ALTURA_BLOCO);
  doc.setFillColor(...cor);
  doc.roundedRect(CARD_X, y + 3, 1.6, ALTURA_BLOCO - 6, 0.8, 0.8, 'F');

  doc.setFillColor(...cor);
  doc.circle(xGrafico + 2, y + 5.6, 1.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...CORES.navy);
  const nome = `${nomeCurto(m.nome)}${m.nome === NOME_CONSUMO ? ' - leitura acumulada do medidor' : ''}`;
  doc.text(nome, xGrafico + 6.5, y + 6.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...CORES.cinza);
  doc.text(m.unit ? `Unidade: ${m.unit}` : 'Sem unidade', xGrafico + LARG_GRAFICO, y + 6.2, { align: 'right' });

  if (!est) return ALTURA_BLOCO;

  adicionarImagem(doc, imagemLinha(m, pontos, LARG_GRAFICO * 8, ALT_GRAFICO * 8), xGrafico, y + 9, LARG_GRAFICO, ALT_GRAFICO);

  const w = (larguraPainel - 3) / 2;
  const x2 = xPainel + w + 3;
  const yT = y + 10;
  if (m.nome === NOME_CONSUMO) {
    const total = somaConsumo(pontos);
    desenharTile(doc, xPainel, yT, w, 'Consumido', comUnidade(total, m));
    desenharTile(doc, x2, yT, w, 'Custo est.', `R$ ${fmt(total * custoKwh, 2)}`);
    desenharTile(doc, xPainel, yT + 22, w, 'Leitura inicial', comUnidade(est.inicial, m));
    desenharTile(doc, x2, yT + 22, w, 'Leitura final', comUnidade(est.ultimo, m));
  } else {
    desenharTile(doc, xPainel, yT, w, 'Média', comUnidade(est.media, m));
    desenharTile(doc, x2, yT, w, 'Último', comUnidade(est.ultimo, m));
    desenharTile(doc, xPainel, yT + 22, w, 'Mínimo', comUnidade(est.min, m), dataHora(est.dMin));
    desenharTile(doc, x2, yT + 22, w, 'Máximo', comUnidade(est.max, m), dataHora(est.dMax));
  }

  const yTexto = y + 54;
  doc.setFillColor(...CORES.claro);
  doc.roundedRect(xPainel, yTexto, larguraPainel, 23, 2, 2, 'F');
  doc.setFillColor(...cor);
  doc.roundedRect(xPainel, yTexto + 2, 1.2, 19, 0.6, 0.6, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...CORES.texto);
  const linhas = doc.splitTextToSize(interpretarMetrica(m, pontos, est, custoKwh, quedas), larguraPainel - 8).slice(0, 6);
  doc.text(linhas, xPainel + 4, yTexto + 5);

  return ALTURA_BLOCO;
}

function desenharCartaoBarras(doc, y, linhasGrupo, formato) {
  const altura = 72;
  cartao(doc, PAGINA.margem, y, LARGURA_UTIL, altura);
  doc.setFillColor(...CORES.azul);
  doc.roundedRect(PAGINA.margem, y + 3, 1.6, altura - 6, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...CORES.navy);
  doc.text(`Consumo por ${formato.titulo} (kWh)`, PAGINA.margem + 6, y + 6.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...CORES.cinza);
  doc.text('Barra escura = maior consumo', PAGINA.margem + LARGURA_UTIL - 4, y + 6.2, { align: 'right' });

  const larguraImg = LARGURA_UTIL - 8;
  adicionarImagem(doc, imagemBarras(linhasGrupo, larguraImg * 8, 55 * 8), PAGINA.margem + 4, y + 9, larguraImg, 55);

  if (linhasGrupo.some((l) => l.semBase)) {
    doc.setFontSize(7.4);
    doc.setTextColor(...CORES.cinza);
    doc.text('"sem base": primeira leitura do período, sem leitura anterior para calcular o consumo.', PAGINA.margem + 6, y + altura - 3.2);
  }
  return altura;
}

function desenharGlossario(doc, y, metricas) {
  const itens = [
    { nome: NOME_CONSUMO, texto: 'Quantidade de energia usada. É o valor que aparece na conta de luz.' },
    { nome: NOME_POTENCIA, texto: 'Quanta energia está sendo usada naquele instante. Sobe quando mais aparelhos estão ligados.' },
    { nome: NOME_TENSAO, texto: `"Força" da energia que chega na instalação. O normal fica entre ${LIMITES[NOME_TENSAO].texto}.` },
    { nome: 'Corrente (A)', texto: 'Quantidade de energia circulando nos fios. Acompanha o uso dos equipamentos.' },
    { nome: NOME_FREQ, texto: `Estabilidade da rede elétrica. O normal fica entre ${LIMITES[NOME_FREQ].texto}.` },
    { nome: NOME_FP, texto: `Mostra o quanto da energia é bem aproveitada. Quanto mais perto de 1, melhor (${LIMITES[NOME_FP].texto}).` },
  ].filter((i) => metricas.some((m) => m.nome === i.nome));
  if (!itens.length) return y;

  const linhas = Math.ceil(itens.length / 2);
  const altura = 15 + linhas * 17;
  y = garantirEspaco(doc, y, altura);

  cartao(doc, PAGINA.margem, y, LARGURA_UTIL, altura);
  doc.setFillColor(...CORES.azul);
  doc.roundedRect(PAGINA.margem, y + 3, 1.6, altura - 6, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...CORES.navy);
  doc.text('Entenda as grandezas', PAGINA.margem + 6, y + 7);

  const larguraCol = (LARGURA_UTIL - 18) / 2;
  itens.forEach((item, i) => {
    const m = metricas.find((mm) => mm.nome === item.nome);
    const x = PAGINA.margem + 6 + (i % 2) * (larguraCol + 6);
    const yi = y + 15 + Math.floor(i / 2) * 17;
    doc.setFillColor(...hexParaRgb(m.cor));
    doc.circle(x + 1.4, yi - 1, 1.4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(...CORES.navy);
    doc.text(m.nome, x + 5, yi);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...CORES.texto);
    doc.text(doc.splitTextToSize(item.texto, larguraCol - 6).slice(0, 3), x + 5, yi + 4.4);
  });
  return y + altura;
}

/* ================================================================== */
/* Função principal                                                    */
/* ================================================================== */

export function exportarRelatorioPDF({
  registros,
  metricas, // METRICAS_GRAFICO
  metricasExibidas,
  filtros, // { periodo, metrica, local, setor }
  obterValor,
  converterData,
  custoKwh = 0.8,
  granularidade = 'auto', // 'auto' | 'dia' | 'hora' | 'minuto'
}) {
  const { pontos, quedas } = prepararPontos(registros, metricas, obterValor, converterData);
  if (!pontos.length) return;

  const meta = (nome) => metricas.find((m) => m.nome === nome);
  const modo = granularidade === 'auto' ? escolherGranularidade(pontos) : granularidade;
  const formato = FORMATOS[modo];
  const linhasGrupo = resumirGrupos(agruparPorPeriodo(pontos, formato));
  const consumo = somaConsumo(pontos);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  doc.setProperties({
    title: `Relatório de medições - ${filtros.periodo}`,
    subject: 'Medições de energia elétrica (consumo, potência, tensão, corrente, frequência e fator de potência)',
    author: 'Sistema de monitoramento',
    creator: 'Sistema de monitoramento',
    keywords: 'energia, consumo, potência, tensão, corrente, frequência, fator de potência',
  });
  if (typeof doc.setLanguage === 'function') doc.setLanguage('pt-BR');
  if (typeof doc.viewerPreferences === 'function') doc.viewerPreferences({ DisplayDocTitle: true });

  /* ---------- Página 1 ---------- */
  desenharCabecalho(doc, filtros, pontos);

  // Situação geral, em uma frase
  const alertasLimites = contarAlertas(pontos);
  let status;
  if (alertasLimites.length) {
    status = {
      nivel: 'alerta',
      titulo: `Atenção: ${alertasLimites.length} ${plural(alertasLimites.length, 'grandeza fora do normal', 'grandezas fora do normal')}`,
      detalhe: alertasLimites.map((a) => `${nomeCurto(a.nome)} (${fmt((a.fora / a.total) * 100, 0)}% das leituras)`).join('   ·   '),
    };
  } else if (quedas) {
    status = {
      nivel: 'aviso',
      titulo: 'Aviso sobre o medidor',
      detalhe: `A leitura do medidor reiniciou ${quedas}x no período; o consumo considera só os aumentos.`,
    };
  } else {
    status = {
      nivel: 'ok',
      titulo: 'Tudo normal no período',
      detalhe: 'Tensão, frequência e fator de potência dentro dos limites em todas as leituras.',
    };
  }
  let y = desenharStatus(doc, 34, status);

  const spark = (nome) => (meta(nome) ? imagemSparkline(meta(nome), pontos, 440, 100) : null);
  const pot = estatisticas(pontos, NOME_POTENCIA);
  const ten = estatisticas(pontos, NOME_TENSAO);
  const fp = estatisticas(pontos, NOME_FP);

  y = desenharCartoes(doc, y + 4, [
    {
      rotulo: 'CONSUMO NO PERÍODO',
      valor: fmt(consumo, 3),
      unidade: 'kWh',
      detalhe: `${pontos.length} leituras`,
      cor: hexParaRgb('#3b82f6'),
      spark: spark(NOME_CONSUMO),
    },
    {
      rotulo: 'CUSTO ESTIMADO',
      valor: `R$ ${fmt(consumo * custoKwh, 2)}`,
      detalhe: `Tarifa R$ ${fmt(custoKwh, 2)}/kWh`,
      cor: hexParaRgb('#0ea5e9'),
    },
    {
      rotulo: 'POTÊNCIA MÉDIA',
      valor: pot ? fmt(pot.media, 2) : '-',
      unidade: pot ? 'kW' : '',
      detalhe: pot ? `Pico de ${fmt(pot.max, 2)} kW` : '',
      cor: hexParaRgb('#10b981'),
      spark: spark(NOME_POTENCIA),
    },
    {
      rotulo: 'TENSÃO MÉDIA',
      valor: ten ? fmt(ten.media, 1) : '-',
      unidade: ten ? 'V' : '',
      detalhe: ten ? `De ${fmt(ten.min, 0)} a ${fmt(ten.max, 0)} V` : '',
      cor: hexParaRgb('#6366f1'),
      spark: spark(NOME_TENSAO),
    },
    {
      rotulo: 'FATOR DE POTÊNCIA',
      valor: fp ? fmt(fp.media, 3) : '-',
      detalhe: fp ? `De ${fmt(fp.min, 3)} a ${fmt(fp.max, 3)}` : '',
      cor: hexParaRgb('#f97316'),
      spark: spark(NOME_FP),
    },
  ]);

  const { resumo, alertas } = montarResumoExecutivo(pontos, linhasGrupo, formato, custoKwh, quedas);
  y = desenharResumoEAlertas(doc, y + 11, resumo, alertas);

  /* ---------- Tabela de grandezas ---------- */
  const metricasTabela = metricas.filter((m) => m.nome !== NOME_CONSUMO);
  const temTendencia = metricas.some((m) => tendencia(pontos, m.nome));
  const cabecalhoGrandezas = ['Grandeza', 'Média', 'Mínimo', 'Máximo', 'Último'];
  if (temTendencia) cabecalhoGrandezas.push('Tendência');
  cabecalhoGrandezas.push('Situação');

  const corpoGrandezas = metricasTabela.map((m) => {
    const e = estatisticas(pontos, m.nome);
    const linha = [nomeCurto(m.nome)];
    if (e) linha.push(comUnidade(e.media, m), comUnidade(e.min, m), comUnidade(e.max, m), comUnidade(e.ultimo, m));
    else linha.push('-', '-', '-', '-');
    if (temTendencia) {
      const t = tendencia(pontos, m.nome);
      linha.push(t ? t.texto : '-');
    }
    let situacao = 'Sem limite definido';
    if (e && LIMITES[m.nome]) {
      const { fora, total } = contarForaDaFaixa(pontos, m.nome);
      situacao = fora ? `Atenção (${fmt((fora / total) * 100, 0)}% fora)` : 'Normal';
    }
    linha.push(situacao);
    return linha;
  });

  y = garantirEspaco(doc, y, 6 + (corpoGrandezas.length + 1) * 7.6);
  autoTable(doc, {
    startY: y,
    head: [cabecalhoGrandezas],
    body: corpoGrandezas,
    theme: 'grid',
    headStyles: { fillColor: CORES.navy, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: CORES.borda, lineWidth: 0.2, textColor: CORES.texto },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellPadding: { top: 2.2, bottom: 2.2, left: 7, right: 2 }, fontStyle: 'bold' } },
    margin: { top: TOPO_CONTEUDO, left: PAGINA.margem, right: PAGINA.margem, bottom: 16 },
    didParseCell: (d) => {
      if (d.section !== 'body' || d.column.index !== cabecalhoGrandezas.length - 1) return;
      const texto = String(d.cell.raw);
      d.cell.styles.fontStyle = 'bold';
      if (texto.startsWith('Atenção')) {
        d.cell.styles.textColor = CORES.alerta;
        d.cell.styles.fillColor = CORES.alertaFundo;
      } else if (texto === 'Normal') {
        d.cell.styles.textColor = CORES.ok;
        d.cell.styles.fillColor = CORES.okFundo;
      } else {
        d.cell.styles.textColor = CORES.cinza;
        d.cell.styles.fontStyle = 'normal';
      }
    },
    didDrawCell: (d) => {
      if (d.section === 'body' && d.column.index === 0) {
        const m = metricasTabela[d.row.index];
        doc.setFillColor(...hexParaRgb(m.cor));
        doc.circle(d.cell.x + 3.6, d.cell.y + d.cell.height / 2, 1.5, 'F');
      }
    },
  });
  y = doc.lastAutoTable.finalY + 4;

  if (y + 4 <= 197) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.6);
    doc.setTextColor(...CORES.cinza);
    doc.text('Como ler os gráficos: faixa verde = valores normais  |  linha tracejada = média geral  |  área colorida = variação (mín–máx)  |  pontos escuros = menor e maior valor.', PAGINA.margem, y + 2);
    doc.setFont('helvetica', 'normal');
  }
  y += 10;

  /* ---------- Consumo por período (barras) ---------- */
  if (linhasGrupo.length > 1) {
    y = garantirEspaco(doc, y, 72);
    y += desenharCartaoBarras(doc, y, linhasGrupo, formato) + 5;
  }

  /* ---------- Gráficos por grandeza ---------- */
  const mostrarAcumulado = linhasGrupo.length < 2 || metricasExibidas.length === 1;
  metricasExibidas
    .filter((m) => m.nome !== NOME_CONSUMO || mostrarAcumulado)
    .forEach((m) => {
      y = garantirEspaco(doc, y, ALTURA_BLOCO);
      y += desenharBlocoMetrica(doc, y, m, pontos, custoKwh, quedas) + 5;
    });

  /* ---------- Tabela por dia / hora / minuto ---------- */
  const comBase = linhasGrupo.filter((l) => !l.semBase);
  const destaques = [];
  if (comBase.length > 1) {
    const maiorCons = comBase.reduce((a, b) => (b.consumo > a.consumo ? b : a));
    destaques.push(`Maior consumo: ${maiorCons.rotulo} (${fmt(maiorCons.consumo, 3)} kWh).`);
  }
  const comPico = linhasGrupo.filter((l) => l.picoPot != null);
  if (comPico.length > 1) {
    const pico = comPico.reduce((a, b) => (b.picoPot > a.picoPot ? b : a));
    destaques.push(`Maior pico de potência: ${fmt(pico.picoPot, 2)} kW em ${dataHora(pico.dPico)}.`);
  }
  if (linhasGrupo.length > 1) {
    const n = linhasGrupo.filter((l) => l.temAlerta).length;
    destaques.push(n === 0
      ? `Nenhum dos ${linhasGrupo.length} períodos teve leituras fora do normal.`
      : `${n} de ${linhasGrupo.length} períodos ${n === 1 ? 'teve' : 'tiveram'} leituras fora do normal.`);
  } else {
    destaques.push(`Todas as leituras estão em um único ${formato.titulo}; selecione um período maior para comparar.`);
  }

  y = garantirEspaco(doc, y, 34 + destaques.length * 6);
  tituloSecao(doc, `Resumo por ${formato.titulo}`, PAGINA.margem, y + 4, CORES.navy, 13);
  const yTabela = desenharTopicos(doc, destaques, PAGINA.margem + 2, y + 12, LARGURA_UTIL - 4, CORES.texto, CORES.azul);

  const maxConsumo = Math.max(...comBase.map((l) => l.consumo), 0);
  autoTable(doc, {
    startY: yTabela + 1,
    head: [[
      formato.titulo === 'dia' ? 'Dia' : formato.titulo === 'hora' ? 'Hora' : 'Minuto',
      'Leituras',
      'Consumo (kWh)',
      'Pot. média (kW)',
      'Pico (kW)',
      'Tensão méd. (mín-máx) V',
      'Corrente méd. (A)',
      'Freq. méd. (Hz)',
      'FP médio',
      'Fora do normal (leituras)',
    ]],
    body: linhasGrupo.map((l) => l.celulas),
    theme: 'grid',
    headStyles: { fillColor: CORES.navy, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7.8, cellPadding: 2, lineColor: CORES.borda, lineWidth: 0.2, textColor: CORES.texto },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold' }, 9: { cellWidth: 56 } },
    margin: { top: TOPO_CONTEUDO, left: PAGINA.margem, right: PAGINA.margem, bottom: 16 },
    didParseCell: (d) => {
      if (d.section !== 'body') return;
      const linha = linhasGrupo[d.row.index];
      if (d.column.index === 2 && maxConsumo > 0 && !linha.semBase) {
        const t = linha.consumo / maxConsumo; // mapa de calor
        d.cell.styles.fillColor = [Math.round(255 - 64 * t), Math.round(255 - 36 * t), 254];
        d.cell.styles.fontStyle = 'bold';
      }
      if (d.column.index === 9) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.textColor = d.cell.raw === 'Tudo normal' ? CORES.ok : CORES.alerta;
      }
    },
  });

  desenharGlossario(doc, doc.lastAutoTable.finalY + 8, metricasExibidas);

  /* ---------- Cabeçalho corrido e rodapé ---------- */
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    if (i > 1) {
      doc.setFillColor(...CORES.azul);
      doc.roundedRect(PAGINA.margem, 5.2, 1.4, 4.4, 0.7, 0.7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES.navy);
      doc.text('Relatório de medições', PAGINA.margem + 3.5, 8.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES.cinza);
      doc.text(`${filtros.periodo}   |   Local: ${filtros.local}   |   Setor: ${filtros.setor}`, PAGINA.largura - PAGINA.margem, 8.8, { align: 'right' });
      doc.setDrawColor(...CORES.borda);
      doc.line(PAGINA.margem, 11.5, PAGINA.largura - PAGINA.margem, 11.5);
    }
    doc.setDrawColor(...CORES.borda);
    doc.line(PAGINA.margem, PAGINA.altura - 10, PAGINA.largura - PAGINA.margem, PAGINA.altura - 10);
    doc.setTextColor(...CORES.cinza);
    doc.text('Gerado automaticamente pelo sistema de monitoramento', PAGINA.margem, PAGINA.altura - 6);
    doc.text(`Página ${i} de ${total}`, PAGINA.largura - PAGINA.margem, PAGINA.altura - 6, { align: 'right' });
  }

  doc.save(`relatorio-${filtros.periodo.toLowerCase().replaceAll(' ', '-')}.pdf`);
}