
import {
  Zap,
  Activity,
  TrendingUp,
  Clock3,
  DollarSign,
  Percent,
} from 'lucide-react';

const indicadores = [
  {
    titulo: 'Consumo Total',
    valor: '487,3 kWh',
    detalhe: 'Consumo acumulado',
    Icone: Zap,
    cor: 'text-blue-500',
  },
  {
    titulo: 'Consumo Médio',
    valor: '69,6 kWh/dia',
    detalhe: 'Média diária',
    Icone: Activity,
    cor: 'text-emerald-500',
  },
  {
    titulo: 'Pico de Consumo',
    valor: '94,2 kW',
    detalhe: 'às 14h22',
    Icone: TrendingUp,
    cor: 'text-amber-400',
  },
  {
    titulo: 'Maior Consumo',
    valor: '10h – 16h',
    detalhe: 'Faixa horária',
    Icone: Clock3,
    cor: 'text-cyan-400',
  },
  {
    titulo: 'Custo Estimado',
    valor: 'R$ 291,80',
    detalhe: 'R$ 0,598/kWh',
    Icone: DollarSign,
    cor: 'text-green-500',
  },
  {
    titulo: 'Variação',
    valor: '-7,3%',
    detalhe: 'vs. período anterior',
    Icone: Percent,
    cor: 'text-green-500',
  },
];

export default function IndicadoresEnergeticos({
  periodo = '24 h',
}) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-[#0d151f] p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-200">
          Indicadores Energéticos
        </h2>

        <span className="shrink-0 text-xs text-slate-500">
          Período: {periodo}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 xl:grid-cols-6">
        {indicadores.map((item, index) => {
          const Icone = item.Icone;

          return (
            <div
              key={item.titulo}
              className={`min-w-0 px-3 ${
                index !== 0
                  ? 'xl:border-l xl:border-slate-800'
                  : ''
              }`}
            >
              <Icone
                size={16}
                strokeWidth={2}
                className={item.cor}
              />

              <p className="mt-2 truncate text-xs font-medium text-slate-400">
                {item.titulo}
              </p>

              <p className="mt-1 break-words text-lg font-bold leading-6 tracking-tight text-slate-200">
                {item.valor}
              </p>

              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                {item.detalhe}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
