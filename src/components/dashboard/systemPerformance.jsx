
import { useState } from 'react';
import { Activity } from 'lucide-react';

const periods = ['1h', '6h', '24h', '7d', '30d'];
const metrics = ['Consumo', 'Potência', 'Corrente', 'Tensão'];

function SystemPerformance() {
  const [period, setPeriod] = useState('24h');
  const [metric, setMetric] = useState('Consumo');

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-[#0d151f] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-200">
            Desempenho do Sistema
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Consumo ao longo do dia (kWh)
          </p>
        </div>

        <div className="flex gap-1 rounded-xl bg-[#0a111b] p-1">
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`rounded-lg px-2 py-1.5 text-[11px] transition ${
                period === item
                  ? 'bg-blue-600/30 text-blue-400'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {metrics.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMetric(item)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              metric === item
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex h-[230px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
        <Activity size={28} strokeWidth={1.5} />
        <p className="mt-3 text-sm">Área do gráfico</p>
        <p className="mt-1 text-xs">
          {metric} · Período de {period}
        </p>
      </div>
    </section>
  );
}

export default SystemPerformance;
