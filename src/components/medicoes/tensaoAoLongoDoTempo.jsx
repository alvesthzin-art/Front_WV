
import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CONFIGURACAO = {
  Tensão: {
    campo: 'tensao',
    unidade: 'V',
    cor: '#3b82f6',
  },
  Corrente: {
    campo: 'corrente',
    unidade: 'A',
    cor: '#22c55e',
  },
  Potência: {
    campo: 'potencia_ativa',
    alternativa: 'potencia',
    unidade: 'W',
    cor: '#14b8a6',
  },
  Energia: {
    campo: 'energia_acumulada',
    alternativa: 'energia',
    unidade: 'kWh',
    cor: '#eab308',
  },
  Frequência: {
    campo: 'frequencia',
    alternativa: 'frequência',
    unidade: 'Hz',
    cor: '#a855f7',
  },
  'Fator de potência': {
    campo: 'fator_potencia',
    alternativa: 'fator_de_potencia',
    unidade: '',
    cor: '#f97316',
  },
};

function converterData(data) {
  if (!data) return null;

  const resultado = new Date(String(data).replace(' ', 'T'));

  return Number.isNaN(resultado.getTime()) ? null : resultado;
}

export default function TensaoAoLongoDoTempo({
  dados = [],
  grandeza = 'Tensão',
  periodo = 'Hoje',
  carregando = false,
}) {
  const configuracao =
    CONFIGURACAO[grandeza] || CONFIGURACAO.Tensão;

  const dadosGrafico = useMemo(() => {
    return dados
      .map((item) => {
        const data = converterData(item.data_hora);

        const valorOriginal =
          item[configuracao.campo] ??
          (configuracao.alternativa
            ? item[configuracao.alternativa]
            : null);

        return {
          instante: data ? data.getTime() : null,
          valor: Number(valorOriginal),
          horario: data
            ? data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
        };
      })
      .filter(
        (item) =>
          item.instante !== null &&
          Number.isFinite(item.valor)
      )
      .sort((a, b) => a.instante - b.instante);
  }, [dados, configuracao]);

  const escalaY = useMemo(() => {
    if (dadosGrafico.length === 0) return [0, 10];

    const valores = dadosGrafico.map((item) => item.valor);
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    const amplitude = maximo - minimo;

    // Margem de 15% para não deixar a linha colada às bordas.
    // Se os valores forem praticamente iguais, usa uma margem mínima.
    const margem = amplitude > 0
      ? amplitude * 0.15
      : Math.max(Math.abs(minimo) * 0.02, 1);

    return [
      minimo - margem,
      maximo + margem,
    ];
  }, [dadosGrafico]);

  const formatarHorario = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {grandeza} ao Longo do Tempo
          </h2>
          <p className="text-xs text-slate-400">
            Histórico de medições · {periodo}
          </p>
        </div>

        <span className="text-xs text-slate-400">
          {dadosGrafico.length} registros
        </span>
      </div>

      {carregando && dadosGrafico.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          Carregando medições...
        </div>
      ) : dadosGrafico.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          Nenhuma medição encontrada neste período.
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dadosGrafico}
              margin={{
                top: 10,
                right: 15,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="instante"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatarHorario}
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                minTickGap={35}
              />

              <YAxis
                type="number"
                domain={escalaY}
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                width={55}
                tickFormatter={(valor) => Number(valor).toFixed(1)}
              />

              <Tooltip
                labelFormatter={formatarHorario}
                formatter={(valor) => [
                  `${Number(valor).toFixed(2)} ${configuracao.unidade}`,
                  grandeza,
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />

              <Line
                type="monotone"
                dataKey="valor"
                name={grandeza}
                stroke={configuracao.cor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
