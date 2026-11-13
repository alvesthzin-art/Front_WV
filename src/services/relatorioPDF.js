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
  azul: [37, 99, 235],
  cinza: [100, 116, 139],
  claro: [241, 245, 249],
  borda: [226, 232, 240],
  alerta: [185, 28, 28],
  ok: [4, 120, 87],
};

const NOME_CONSUMO = 'Consumo (kWh)';
const NOME_POTENCIA = 'Potência (kW)';
const NOME_TENSAO = 'Tensão (V)';
const NOME_FP = 'Fator de potência';

// Ajuste conforme a sua instalação (aqui: 220 V ±10 %, frequência 59,9-60,1 Hz, FP mínimo 0,92).
const LIMITES = {
  [NOME_TENSAO]: { min: 198, max: 242, texto: '198 a 242 V' },
  'Frequência (Hz)': { min: 59.9, max: 60.1, texto: '59,9 a 60,1 Hz' },
  [NOME_FP]: { min: 0.92, texto: 'mínimo 0,92' },
};

/* ================================================================== */
/* Helpers                                                             */
/* ================================================================== */

const pad = (n) => String(n).padStart(2, '0');
const fmt = (valor, casas = 1) => Number(valor ?? 0).toLocaleString('pt-BR', {
  minimumFractionDigits: casas,
  maximumFractionDigits: casas,
});
const dataCurta = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
const horaCurta = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dataHora = (d) => `${dataCurta(d)} ${horaCurta(d)}`;
const nomeCurto = (nome) => nome.replace(/\s*\(.*\)\s*$/, '');
const hexParaRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgba = (hex, alfa) => `rgba(${hexParaRgb(hex).join(',')},${alfa})`;

const casasMetrica = (m) => m.casas ?? (m.nome === NOME_CONSUMO ? 3 : m.nome === NOME_POTENCIA ? 2 : 1);
const comUnidade = (valor, m) => `${fmt(valor, casasMetrica(m))} ${m.unit}`.trim();
const casasPorFaixa = (faixa) => (faixa < 1 ? 3 : faixa < 10 ? 2 : 1);

const foraDaFaixa = (nome, valor) => {
  const l = LIMITES[nome];
  return Boolean(l) && ((l.min != null && valor < l.min) || (l.max != null && valor > l.max));
};

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

  // Consumo = soma dos deltas positivos do medidor acumulado (tolera reset do medidor).
  let anterior = null;
  pontos.forEach((p) => {
    const e = p.v[NOME_CONSUMO];
    if (e == null) return;
    if (anterior != null && e >= anterior) p.delta = e - anterior;
    anterior = e;
  });

  return pontos;
}

const FORMATOS = {
  dia: {
    chave: (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    rotulo: (d) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
    rotuloCurto: (d) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    titulo: 'dia',
  },
  hora: {
    chave: (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`,
    rotulo: (d) => `${dataCurta(d)} ${pad(d.getHours())}:00`,
    rotuloCurto: (d) => `${dataCurta(d)} ${pad(d.getHours())}h`,
    titulo: 'hora',
  },
  minuto: {
    chave: (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`,
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

function tendencia(pontos, nome) {
  const v = pontos.map((p) => p.v[nome]).filter((x) => x != null);
  if (v.length < 4) return null;
  const meio = Math.floor(v.length / 2);
  const media = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const m1 = media(v.slice(0, meio));
  const m2 = media(v.slice(meio));
  const pct = m1 ? ((m2 - m1) / Math.abs(m1)) * 100 : 0;
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
  return grupos.map((g) => {
    const consumo = somaConsumo(g.pontos);
    const pot = estatisticas(g.pontos, NOME_POTENCIA);
    const ten = estatisticas(g.pontos, NOME_TENSAO);
    const cor = estatisticas(g.pontos, 'Corrente (A)');
    const frq = estatisticas(g.pontos, 'Frequência (Hz)');
    const fp = estatisticas(g.pontos, NOME_FP);
    const alertas = contarAlertas(g.pontos)
      .map((a) => `${nomeCurto(a.nome)}: ${a.fora}/${a.total} fora da faixa`)
      .join('; ');

    return {
      rotulo: g.rotulo,
      rotuloCurto: g.rotuloCurto,
      consumo,
      picoPot: pot?.max ?? null,
      dPico: pot?.dMax ?? null,
      temAlerta: Boolean(alertas),
      celulas: [
        g.rotulo,
        g.pontos.length,
        fmt(consumo, 3),
        pot ? fmt(pot.media, 2) : '-',
        pot ? fmt(pot.max, 2) : '-',
        ten ? `${fmt(ten.media, 1)} (${fmt(ten.min, 0)}-${fmt(ten.max, 0)})` : '-',
        cor ? fmt(cor.media, 1) : '-',
        frq ? fmt(frq.media, 2) : '-',
        fp ? fmt(fp.media, 3) : '-',
        alertas || 'Sem alertas',
      ],
    };
  });
}

/* ================================================================== */
/* Textos                                                              */
/* ================================================================== */

function montarResumoExecutivo(pontos, linhasGrupo, formato, custoKwh) {
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

  if (linhasGrupo.length > 1) {
    const maior = linhasGrupo.reduce((a, b) => (b.consumo > a.consumo ? b : a));
    resumo.push(`Maior consumo: ${maior.rotulo} (${fmt(maior.consumo, 3)} kWh).`);
  }

  const alertas = contarAlertas(pontos).map((a) => (
    `${nomeCurto(a.nome)}: ${a.fora} de ${a.total} leituras (${fmt((a.fora / a.total) * 100, 0)}%) fora da faixa de ${LIMITES[a.nome].texto}.`
  ));

  return { resumo, alertas };
}

function interpretarMetrica(m, pontos, est, custoKwh) {
  if (m.nome === NOME_CONSUMO) {
    const total = somaConsumo(pontos);
    return `O medidor passou de ${fmt(est.inicial, 3)} para ${fmt(est.ultimo, 3)} kWh. Consumo de ${fmt(total, 3)} kWh no período, custo estimado de R$ ${fmt(total * custoKwh, 2)}.`;
  }
  const partes = [`Variou de ${comUnidade(est.min, m)} a ${comUnidade(est.max, m)} (amplitude de ${fmt(est.max - est.min, casasMetrica(m))}).`];
  const t = tendencia(pontos, m.nome);
  if (t) partes.push(`Tendência: ${t.texto}.`);
  if (LIMITES[m.nome]) {
    const { fora, total } = contarForaDaFaixa(pontos, m.nome);
    partes.push(fora
      ? `${fora} de ${total} leituras (${fmt((fora / total) * 100, 0)}%) fora da faixa adequada.`
      : 'Todas as leituras dentro da faixa adequada.');
  }
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

// Faixa adequada, linha de média, marcadores de mín/máx e rótulos de barras.
const decoracoes = {
  id: 'decoracoes',
  beforeDatasetsDraw(chart, _args, o) {
    if (!o?.faixa) return;
    const { ctx, chartArea: a, scales: { y } } = chart;
    const { min, max, texto } = o.faixa;
    const topo = Math.max(a.top, max != null ? y.getPixelForValue(max) : a.top);
    const base = Math.min(a.bottom, min != null ? y.getPixelForValue(min) : a.bottom);

    ctx.save();
    ctx.fillStyle = 'rgba(16,185,129,0.09)';
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
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(5,150,105,0.95)';
    ctx.font = 'bold 20px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Faixa adequada: ${texto}`, a.left + 12, topo + 8);
    ctx.restore();
  },
  afterDatasetsDraw(chart, _args, o) {
    const { ctx, chartArea: a, scales: { x, y } } = chart;
    ctx.save();

    if (o?.media != null) {
      const py = y.getPixelForValue(o.media);
      if (py > a.top && py < a.bottom) {
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = 'rgba(71,85,105,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.left, py);
        ctx.lineTo(a.right, py);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#475569';
        ctx.font = '20px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(o.mediaTexto, a.right - 8, py - 5);
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

      ctx.font = 'bold 21px Helvetica, Arial, sans-serif';
      const largura = ctx.measureText(p.rotulo).width + 24;
      const altura = 34;
      const bx = Math.min(Math.max(px - largura / 2, a.left), a.right - largura);
      const by = p.tipo === 'max' ? py - altura - 14 : py + 14;
      ctx.fillStyle = '#0f172a';
      caixaArredondada(ctx, bx, by, largura, altura, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.rotulo, bx + largura / 2, by + altura / 2 + 1);
    });

    if (o?.rotulosBarras) {
      const meta = chart.getDatasetMeta(0);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      meta.data.forEach((barra, i) => {
        ctx.fillText(o.rotulosBarras[i], barra.x, barra.y - 8);
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

function formatadorTempo(span) {
  return (valor) => {
    const d = new Date(valor);
    if (span > 36 * 3600e3) return dataCurta(d);
    if (span < 10 * 60e3) return `${horaCurta(d)}:${pad(d.getSeconds())}`;
    return dataHora(d);
  };
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

function imagemLinha(m, pontos, largura, altura) {
  const completa = serieDe(pontos, m.nome);
  const est = estatisticas(pontos, m.nome);
  if (!completa.length || !est) return null;

  const serie = reduzirSerie(completa);
  const lim = LIMITES[m.nome];
  let min = est.min;
  let max = est.max;
  if (lim?.min != null) min = Math.min(min, lim.min);
  if (lim?.max != null) max = Math.max(max, lim.max);
  if (max === min) {
    const d = Math.max(Math.abs(min) * 0.05, 0.5);
    min -= d;
    max += d;
  } else {
    const folga = (max - min) * 0.1;
    min -= folga;
    max += folga;
  }
  if (est.min >= 0 && min < 0) min = 0;
  if (m.nome === NOME_FP && max > 1) max = 1;

  const casas = m.casas ?? casasPorFaixa(max - min);
  const t0 = completa[0].x;
  const t1 = completa.at(-1).x > t0 ? completa.at(-1).x : t0 + 60000;
  const span = t1 - t0;
  const rotuloX = formatadorTempo(span);

  const extremos = [];
  if (est.max !== est.min) {
    extremos.push({ ...completa.find((p) => p.y === est.max), rotulo: `máx. ${fmt(est.max, casas)}`, tipo: 'max' });
    extremos.push({ ...completa.find((p) => p.y === est.min), rotulo: `mín. ${fmt(est.min, casas)}`, tipo: 'min' });
  }

  const fonte = { size: 22 };
  return renderizar({
    type: 'line',
    data: {
      datasets: [{
        data: serie,
        parsing: false,
        normalized: true,
        borderColor: m.cor,
        borderWidth: 4,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        fill: true,
        backgroundColor: gradiente(m.cor),
      }],
    },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      events: [],
      layout: { padding: { top: 50, right: 28, bottom: 6, left: 6 } },
      scales: {
        x: {
          type: 'linear',
          min: t0,
          max: t1,
          grid: { display: false },
          border: { color: '#cbd5e1', width: 2 },
          ticks: { color: '#64748b', font: fonte, padding: 10, align: 'inner', callback: rotuloX },
          afterBuildTicks: (eixo) => {
            eixo.ticks = Array.from({ length: 6 }, (_, i) => ({ value: t0 + (span * i) / 5 }));
          },
        },
        y: {
          min,
          max,
          grid: { color: '#e2e8f0', lineWidth: 1.5 },
          border: { display: false },
          ticks: { color: '#64748b', font: fonte, padding: 12, maxTicksLimit: 5, callback: (v) => fmt(v, casas) },
        },
      },
      plugins: {
        decoracoes: {
          faixa: lim ? { min: lim.min, max: lim.max, texto: lim.texto } : null,
          media: m.nome === NOME_CONSUMO ? null : est.media,
          mediaTexto: `média ${fmt(est.media, casas)}`,
          extremos,
          cor: m.cor,
        },
      },
    },
  }, largura, altura);
}

function imagemSparkline(m, pontos, largura, altura) {
  const serie = reduzirSerie(serieDe(pontos, m.nome), 120);
  if (serie.length < 2) return null;
  const ys = serie.map((p) => p.y);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
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
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        fill: true,
        backgroundColor: gradiente(m.cor, 0.28),
      }],
    },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      events: [],
      layout: { padding: 6 },
      scales: {
        x: { type: 'linear', display: false },
        y: { display: false, min, max },
      },
    },
  }, largura, altura);
}

function imagemBarras(linhasGrupo, largura, altura) {
  const valores = linhasGrupo.map((l) => l.consumo);
  const maior = Math.max(...valores);
  const casas = maior < 1 ? 3 : maior < 10 ? 2 : 1;
  const indiceMaior = valores.indexOf(maior);
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
      layout: { padding: { top: 40, right: 24, bottom: 6, left: 6 } },
      scales: {
        x: {
          grid: { display: false },
          border: { color: '#cbd5e1', width: 2 },
          ticks: { color: '#64748b', font: { size: 22 }, padding: 10, maxRotation: 0, autoSkip: true },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0', lineWidth: 1.5 },
          border: { display: false },
          ticks: { color: '#64748b', font: { size: 22 }, padding: 12, maxTicksLimit: 5, callback: (v) => fmt(v, casas) },
        },
      },
      plugins: {
        decoracoes: {
          rotulosBarras: poucas ? valores.map((v) => fmt(v, casas)) : null,
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

function titulo(doc, texto, x, y, tamanho = 11) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tamanho);
  doc.setTextColor(...CORES.navy);
  doc.text(texto, x, y);
  doc.setFont('helvetica', 'normal');
}

function desenharCabecalho(doc, filtros) {
  doc.setFillColor(...CORES.navy);
  doc.rect(0, 0, PAGINA.largura, 26, 'F');
  doc.setFillColor(...CORES.azul);
  doc.rect(0, 26, PAGINA.largura, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('Relatório de medições', PAGINA.margem, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Período: ${filtros.periodo}  |  Grandezas: ${filtros.metrica}`, PAGINA.margem, 18.5);
  doc.text(`Local: ${filtros.local}  |  Setor: ${filtros.setor}`, PAGINA.margem, 23);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, PAGINA.largura - PAGINA.margem, 12, { align: 'right' });
}

function desenharCartoes(doc, y, cartoes) {
  const gap = 4;
  const largura = (LARGURA_UTIL - gap * (cartoes.length - 1)) / cartoes.length;
  const altura = 33;

  cartoes.forEach((c, i) => {
    const x = PAGINA.margem + i * (largura + gap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...CORES.borda);
    doc.roundedRect(x, y, largura, altura, 2, 2, 'FD');
    doc.setFillColor(...c.cor);
    doc.rect(x + 3, y, largura - 6, 1, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CORES.cinza);
    doc.text(c.rotulo, x + 3.5, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(...CORES.navy);
    doc.text(c.valor, x + 3.5, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CORES.cinza);
    doc.text(c.detalhe || '', x + 3.5, y + 17.5);

    const larguraSpark = largura - 6;
    adicionarImagem(doc, c.spark, x + 3, y + 19.5, larguraSpark, (larguraSpark * 100) / 440);
  });
  return y + altura;
}

function desenharResumoEAlertas(doc, y, resumo, alertas) {
  const wEsq = 164;
  const xDir = PAGINA.margem + wEsq + 5;
  const wDir = LARGURA_UTIL - wEsq - 5;

  titulo(doc, 'Resumo executivo', PAGINA.margem, y);
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  let yEsq = y + 6;
  resumo.forEach((linha) => {
    const partes = doc.splitTextToSize(`•  ${linha}`, wEsq - 4);
    doc.text(partes, PAGINA.margem + 2, yEsq);
    yEsq += partes.length * 4.6 + 1.4;
  });

  const temAlerta = alertas.length > 0;
  const linhasAlerta = temAlerta ? alertas : ['Tensão, frequência e fator de potência dentro dos limites em todas as leituras.'];
  doc.setFontSize(8.5);
  const partesAlerta = linhasAlerta.map((l) => doc.splitTextToSize(`•  ${l}`, wDir - 8));
  const alturaCaixa = 11 + partesAlerta.reduce((s, p) => s + p.length * 4 + 1.5, 0);

  doc.setFillColor(...(temAlerta ? [254, 242, 242] : [236, 253, 245]));
  doc.setDrawColor(...(temAlerta ? [252, 165, 165] : [110, 231, 183]));
  doc.roundedRect(xDir, y - 4.5, wDir, alturaCaixa, 2, 2, 'FD');
  titulo(doc, temAlerta ? 'Pontos de atenção' : 'Sem pontos de atenção', xDir + 4, y + 1, 10);
  doc.setFontSize(8.5);
  doc.setTextColor(...(temAlerta ? CORES.alerta : CORES.ok));
  let yDir = y + 7;
  partesAlerta.forEach((p) => {
    doc.text(p, xDir + 4, yDir);
    yDir += p.length * 4 + 1.5;
  });

  return Math.max(yEsq, y - 4.5 + alturaCaixa) + 4;
}

function desenharTile(doc, x, y, w, rotulo, valor, sub) {
  doc.setFillColor(...CORES.claro);
  doc.setDrawColor(...CORES.borda);
  doc.roundedRect(x, y, w, 18, 1.8, 1.8, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...CORES.cinza);
  doc.text(rotulo.toUpperCase(), x + 3, y + 4.6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...CORES.navy);
  doc.text(valor, x + 3, y + 11);
  if (sub) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...CORES.cinza);
    doc.text(sub, x + 3, y + 15.3);
  }
}

const ALTURA_BLOCO = 76;

function desenharBlocoMetrica(doc, y, m, pontos, custoKwh) {
  const LARG_GRAFICO = 190;
  const ALT_GRAFICO = 64;
  const xPainel = PAGINA.margem + LARG_GRAFICO + 5;
  const larguraPainel = LARGURA_UTIL - LARG_GRAFICO - 5;
  const est = estatisticas(pontos, m.nome);

  doc.setFillColor(...hexParaRgb(m.cor));
  doc.circle(PAGINA.margem + 1.8, y + 3, 1.7, 'F');
  titulo(doc, `${nomeCurto(m.nome)}${m.nome === NOME_CONSUMO ? ' - leitura acumulada do medidor' : ''}`, PAGINA.margem + 6, y + 4, 11);
  doc.setFontSize(8);
  doc.setTextColor(...CORES.cinza);
  doc.text(m.unit ? `Unidade: ${m.unit}` : 'Grandeza adimensional', PAGINA.margem + LARG_GRAFICO, y + 4, { align: 'right' });

  if (!est) return ALTURA_BLOCO;

  adicionarImagem(doc, imagemLinha(m, pontos, LARG_GRAFICO * 8, ALT_GRAFICO * 8), PAGINA.margem, y + 8, LARG_GRAFICO, ALT_GRAFICO);

  const w = (larguraPainel - 3) / 2;
  const x2 = xPainel + w + 3;
  const yT = y + 8;
  if (m.nome === NOME_CONSUMO) {
    const total = somaConsumo(pontos);
    desenharTile(doc, xPainel, yT, w, 'Consumido', comUnidade(total, m));
    desenharTile(doc, x2, yT, w, 'Custo est.', `R$ ${fmt(total * custoKwh, 2)}`);
    desenharTile(doc, xPainel, yT + 21, w, 'Leitura inicial', comUnidade(est.inicial, m));
    desenharTile(doc, x2, yT + 21, w, 'Leitura final', comUnidade(est.ultimo, m));
  } else {
    desenharTile(doc, xPainel, yT, w, 'Média', comUnidade(est.media, m));
    desenharTile(doc, x2, yT, w, 'Último', comUnidade(est.ultimo, m));
    desenharTile(doc, xPainel, yT + 21, w, 'Mínimo', comUnidade(est.min, m), dataHora(est.dMin));
    desenharTile(doc, x2, yT + 21, w, 'Máximo', comUnidade(est.max, m), dataHora(est.dMax));
  }

  // texto interpretativo
  const yTexto = yT + 44;
  doc.setFillColor(...hexParaRgb(m.cor));
  doc.rect(xPainel, yTexto, 1.2, 20, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(51, 65, 85);
  const linhas = doc.splitTextToSize(interpretarMetrica(m, pontos, est, custoKwh), larguraPainel - 5).slice(0, 6);
  doc.text(linhas, xPainel + 3.5, yTexto + 3.5);

  return ALTURA_BLOCO;
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
  const pontos = prepararPontos(registros, metricas, obterValor, converterData);
  if (!pontos.length) return;

  const meta = (nome) => metricas.find((m) => m.nome === nome);
  const modo = granularidade === 'auto' ? escolherGranularidade(pontos) : granularidade;
  const formato = FORMATOS[modo];
  const linhasGrupo = resumirGrupos(agruparPorPeriodo(pontos, formato));
  const consumo = somaConsumo(pontos);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  /* ---------- Página 1 ---------- */
  desenharCabecalho(doc, filtros);

  const spark = (nome) => (meta(nome) ? imagemSparkline(meta(nome), pontos, 440, 100) : null);
  const pot = estatisticas(pontos, NOME_POTENCIA);
  const ten = estatisticas(pontos, NOME_TENSAO);
  const fp = estatisticas(pontos, NOME_FP);

  let y = desenharCartoes(doc, 33, [
    {
      rotulo: 'CONSUMO NO PERÍODO',
      valor: `${fmt(consumo, 3)} kWh`,
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
      valor: pot ? `${fmt(pot.media, 2)} kW` : '-',
      detalhe: pot ? `Pico de ${fmt(pot.max, 2)} kW` : '',
      cor: hexParaRgb('#10b981'),
      spark: spark(NOME_POTENCIA),
    },
    {
      rotulo: 'TENSÃO MÉDIA',
      valor: ten ? `${fmt(ten.media, 1)} V` : '-',
      detalhe: ten ? `${fmt(ten.min, 0)} a ${fmt(ten.max, 0)} V` : '',
      cor: hexParaRgb('#6366f1'),
      spark: spark(NOME_TENSAO),
    },
    {
      rotulo: 'FATOR DE POTÊNCIA',
      valor: fp ? fmt(fp.media, 3) : '-',
      detalhe: fp ? `${fmt(fp.min, 3)} a ${fmt(fp.max, 3)}` : '',
      cor: hexParaRgb('#f97316'),
      spark: spark(NOME_FP),
    },
  ]);

  const { resumo, alertas } = montarResumoExecutivo(pontos, linhasGrupo, formato, custoKwh);
  y = desenharResumoEAlertas(doc, y + 12, resumo, alertas);

  /* ---------- Tabela de grandezas ---------- */
  const corpoGrandezas = metricas
    .filter((m) => m.nome !== NOME_CONSUMO)
    .map((m) => {
      const e = estatisticas(pontos, m.nome);
      if (!e) return [nomeCurto(m.nome), '-', '-', '-', '-', '-', '-'];
      const { fora } = contarForaDaFaixa(pontos, m.nome);
      const t = tendencia(pontos, m.nome);
      return [
        nomeCurto(m.nome),
        comUnidade(e.media, m),
        comUnidade(e.min, m),
        comUnidade(e.max, m),
        comUnidade(e.ultimo, m),
        t ? t.texto : '-',
        LIMITES[m.nome] ? (fora ? `Atenção (${fora} fora)` : 'Normal') : '-',
      ];
    });

  y = garantirEspaco(doc, y, 14 + corpoGrandezas.length * 7);
  autoTable(doc, {
    startY: y,
    head: [['Grandeza', 'Média', 'Mínimo', 'Máximo', 'Último', 'Tendência', 'Situação']],
    body: corpoGrandezas,
    theme: 'grid',
    headStyles: { fillColor: CORES.azul },
    styles: { fontSize: 8.5, cellPadding: 2 },
    margin: { top: TOPO_CONTEUDO, left: PAGINA.margem, right: PAGINA.margem, bottom: 16 },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 6 && String(d.cell.raw).startsWith('Atenção')) {
        d.cell.styles.textColor = CORES.alerta;
        d.cell.styles.fontStyle = 'bold';
      }
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  /* ---------- Consumo por período (barras) ---------- */
  if (linhasGrupo.length > 1) {
    y = garantirEspaco(doc, y, 68);
    titulo(doc, `Consumo por ${formato.titulo}`, PAGINA.margem, y + 4);
    doc.setFontSize(8);
    doc.setTextColor(...CORES.cinza);
    doc.text('Barra escura = maior consumo', PAGINA.largura - PAGINA.margem, y + 4, { align: 'right' });
    adicionarImagem(doc, imagemBarras(linhasGrupo, LARGURA_UTIL * 8, 56 * 8), PAGINA.margem, y + 7, LARGURA_UTIL, 56);
    y += 68;
  }

  /* ---------- Gráficos por grandeza ---------- */
  metricasExibidas.forEach((m) => {
    y = garantirEspaco(doc, y, ALTURA_BLOCO);
    y += desenharBlocoMetrica(doc, y, m, pontos, custoKwh) + 4;
  });

  /* ---------- Tabela por dia / hora / minuto ---------- */
  doc.addPage();
  titulo(doc, `Resumo por ${formato.titulo}`, PAGINA.margem, 20, 13);

  const destaques = [];
  if (linhasGrupo.length > 1) {
    const maiorCons = linhasGrupo.reduce((a, b) => (b.consumo > a.consumo ? b : a));
    destaques.push(`Maior consumo: ${maiorCons.rotulo} (${fmt(maiorCons.consumo, 3)} kWh).`);
    const comPico = linhasGrupo.filter((l) => l.picoPot != null);
    if (comPico.length) {
      const pico = comPico.reduce((a, b) => (b.picoPot > a.picoPot ? b : a));
      destaques.push(`Maior pico de potência: ${fmt(pico.picoPot, 2)} kW em ${dataHora(pico.dPico)}.`);
    }
    const comAlerta = linhasGrupo.filter((l) => l.temAlerta).length;
    destaques.push(`${comAlerta} de ${linhasGrupo.length} períodos tiveram leituras fora dos limites.`);
  } else {
    destaques.push(`Todas as leituras estão em um único ${formato.titulo}; selecione um período maior para comparar.`);
  }

  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  let yTabela = 27;
  destaques.forEach((d) => {
    doc.text(`•  ${d}`, PAGINA.margem + 2, yTabela);
    yTabela += 5.6;
  });

  const maxConsumo = Math.max(...linhasGrupo.map((l) => l.consumo), 0);
  autoTable(doc, {
    startY: yTabela + 2,
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
      'Alertas',
    ]],
    body: linhasGrupo.map((l) => l.celulas),
    theme: 'grid',
    headStyles: { fillColor: CORES.navy, fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 9: { cellWidth: 62 } },
    margin: { top: TOPO_CONTEUDO, left: PAGINA.margem, right: PAGINA.margem, bottom: 16 },
    didParseCell: (d) => {
      if (d.section !== 'body') return;
      if (d.column.index === 2 && maxConsumo > 0) {
        const t = linhasGrupo[d.row.index].consumo / maxConsumo; // mapa de calor
        d.cell.styles.fillColor = [Math.round(255 - 64 * t), Math.round(255 - 36 * t), 254];
      }
      if (d.column.index === 9 && d.cell.raw !== 'Sem alertas') {
        d.cell.styles.textColor = CORES.alerta;
      }
    },
  });

  /* ---------- Cabeçalho corrido e rodapé ---------- */
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...CORES.cinza);
    if (i > 1) {
      doc.text(`Relatório de medições  |  ${filtros.periodo}  |  Local: ${filtros.local}  |  Setor: ${filtros.setor}`, PAGINA.margem, 9);
      doc.setDrawColor(...CORES.borda);
      doc.line(PAGINA.margem, 11, PAGINA.largura - PAGINA.margem, 11);
    }
    doc.text('Gerado automaticamente pelo sistema de monitoramento', PAGINA.margem, PAGINA.altura - 6);
    doc.text(`Página ${i} de ${total}`, PAGINA.largura - PAGINA.margem, PAGINA.altura - 6, { align: 'right' });
  }

  doc.save(`relatorio-${filtros.periodo.toLowerCase().replaceAll(' ', '-')}.pdf`);
}