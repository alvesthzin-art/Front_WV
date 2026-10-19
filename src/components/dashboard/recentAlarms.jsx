
import {
  CircleX,
  TriangleAlert,
  Info,
  CircleCheck,
  ArrowRight,
} from 'lucide-react';

const alarms = [
  {
    title: 'Sobretensão detectada',
    equipment: 'Compressor HVAC-03',
    time: 'há 2 min',
    type: 'critical',
  },
  {
    title: 'Fator de potência baixo',
    equipment: 'Motor Bomba-07',
    time: 'há 18 min',
    type: 'warning',
  },
  {
    title: 'Consumo acima do limite',
    equipment: 'Linha de Produção B',
    time: 'há 45 min',
    type: 'warning',
  },
  {
    title: 'Novo sensor registrado',
    equipment: 'Painel Elétrico PE-12',
    time: 'há 1 h',
    type: 'info',
  },
  {
    title: 'Equipamento restaurado',
    equipment: 'Torno CNC-02',
    time: 'há 2 h',
    type: 'success',
  },
];

const styles = {
  critical: {
    icon: CircleX,
    color: 'bg-red-500/20 text-red-400',
  },
  warning: {
    icon: TriangleAlert,
    color: 'bg-amber-500/20 text-amber-400',
  },
  info: {
    icon: Info,
    color: 'bg-cyan-500/20 text-cyan-400',
  },
  success: {
    icon: CircleCheck,
    color: 'bg-green-500/20 text-green-400',
  },
};

function RecentAlarms() {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-[#0d151f] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-200">
          Alarmes Recentes
        </h2>

        <span className="whitespace-nowrap rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-medium text-amber-400">
          5 ativos
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-4">
        {alarms.map((alarm) => {
          const Icon = styles[alarm.type].icon;

          return (
            <div
              key={alarm.title}
              className="flex min-w-0 items-start gap-3"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles[alarm.type].color}`}
              >
                <Icon size={15} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-200">
                    {alarm.title}
                  </p>

                  <span className="shrink-0 text-[9px] text-slate-500">
                    {alarm.time}
                  </span>
                </div>

                <p className="mt-1 truncate text-[11px] text-slate-400">
                  {alarm.equipment}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/20 px-3 py-2.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/30"
      >
        Ver todos
        <ArrowRight size={14} />
      </button>
    </section>
  );
}

export default RecentAlarms;
