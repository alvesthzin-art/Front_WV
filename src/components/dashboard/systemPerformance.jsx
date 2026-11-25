import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { CONFIGURACAO_GRANDEZA } from '../../services/indicadoresEnergeticos';

const MAXIMO_PONTOS_GRAFICO = 24;

function reduzirPontos(pontos) {
  if (pontos.length <= MAXIMO_PONTOS_GRAFICO) return pontos;

  const passo = (pontos.length - 1) / (MAXIMO_PONTOS_GRAFICO - 1);
  return Array.from({ length: MAXIMO_PONTOS_GRAFICO }, (_, indice) => (
    pontos[Math.round(indice * passo)]
  ));
}

export default function SystemPerformance({ dados = [], grandeza = 'Tensão', periodo = 'Hoje' }) {
  const metricAtual = CONFIGURACAO_GRANDEZA[grandeza] ?? CONFIGURACAO_GRANDEZA.Tensão;
  const temaClaro = document.documentElement.dataset.theme === 'light';

  const chartDataCompleto = dados.map((item) => {
    const chave = metricAtual.keys.find((key) => item[key] !== undefined && item[key] !== null);
    const valor = chave ? Number(item[chave]) : NaN;
    const hora = item.data_hora?.includes(' ')
      ? item.data_hora.split(' ')[1].substring(0, 5)
      : item.data_hora;

    return { time: hora, valor: Number.isFinite(valor) ? valor : null };
  }).filter((item) => item.valor !== null);
  const chartData = reduzirPontos(chartDataCompleto);

  // Configuração específica para o Eixo Y quando for Tensão
  let dominioY;
  let ticksY = undefined;

  if (grandeza === 'Tensão') {
    dominioY = [0, 400];
    ticksY = [0, 110, 127, 220, 380];
  } else {
    const valores = chartData.map((item) => item.valor);
    const menorValor = valores.length ? Math.min(...valores) : 0;
    const maiorValor = valores.length ? Math.max(...valores) : 1;
    const margem = menorValor === maiorValor
      ? Math.max(Math.abs(menorValor) * 0.1, 1)
      : (maiorValor - menorValor) * 0.1;
    dominioY = [menorValor - margem, maiorValor + margem];
  }

  return (
    <div className="wv-dashboard-chart rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{metricAtual.label} ao longo do período selecionado</h3>
          <p className="text-xs text-slate-400">
            Desempenho do Sistema
          </p>
        </div>
        <span className="wv-chart-period rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-400">
          {periodo}
        </span>
      </div>

      <div className="h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
            <p className="text-xs">Nenhum dado encontrado para esta grandeza no período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricAtual.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={metricAtual.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={temaClaro ? '#cbd5e1' : '#1e293b'} vertical={false} />
              <XAxis
                dataKey="time"
                stroke={temaClaro ? '#64748b' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
                height={34}
              />
              <YAxis
                domain={dominioY}
                ticks={ticksY}
                stroke={temaClaro ? '#64748b' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(valor) => Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                label={{ value: metricAtual.unit, angle: -90, position: 'insideLeft', fill: temaClaro ? '#475569' : '#64748b', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: temaClaro ? '#ffffff' : '#0f172a', borderColor: temaClaro ? '#cbd5e1' : '#334155', borderRadius: '12px', color: temaClaro ? '#111827' : '#f8fafc', fontSize: '12px' }}
                formatter={(valor) => [`${Number(valor).toLocaleString('pt-BR')} ${metricAtual.unit}`, metricAtual.label]}
                labelFormatter={(label) => `Horário: ${label}`}
              />
              <Area type="monotone" dataKey="valor" stroke={metricAtual.color} strokeWidth={2.5} fillOpacity={1} fill="url(#colorGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}