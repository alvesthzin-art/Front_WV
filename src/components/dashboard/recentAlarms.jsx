
import {
  CircleX,
  TriangleAlert,
  Info,
  CircleCheck,
} from 'lucide-react';

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

function RecentAlarms({ alertas = [], indisponivel = false, onOpenAlarmes }) {
  const ativos = alertas.filter(item => ['ativo', 'reconhecido'].includes(String(item.status).toLowerCase()));
  const alarms = ativos.slice(-5).reverse().map((item, index) => ({
    id: item.id_alerta ?? item.id ?? index,
    title: item.titulo ?? item.descricao ?? 'Alarme',
    equipment: item.equipamento?.nome ?? item.equipamento ?? 'Equipamento não informado',
    time: item.inicio ?? '',
    type: ['critico', 'crítico'].includes(String(item.severidade).toLowerCase()) ? 'critical' : 'warning',
  }));
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-[#0d151f] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-200">
          Alarmes Recentes
        </h2>

        <span className="whitespace-nowrap rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-medium text-amber-400">
          {indisponivel ? 'Indisponível' : `${ativos.length} ativos`}
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-4">
        {!alarms.length && <button type="button" onClick={onOpenAlarmes} className="text-left text-xs text-slate-400 hover:text-cyan-400">{indisponivel ? 'Não foi possível carregar os alarmes.' : 'Nenhum alarme ativo.'}</button>}
        {alarms.map((alarm) => {
          const Icon = styles[alarm.type].icon;

          return (
            <div
              key={alarm.id}
              onClick={onOpenAlarmes}
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

      <button type="button" onClick={onOpenAlarmes} className="mt-5 rounded-xl bg-cyan-500/20 px-3 py-2.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/30">Ver todos os alarmes</button>
    </section>
  );
}

export default RecentAlarms;
