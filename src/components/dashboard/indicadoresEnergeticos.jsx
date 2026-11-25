import {
  Zap,
  Activity,
  TrendingUp,
  Clock3,
  DollarSign,
  Percent,
} from 'lucide-react';
import { CONFIGURACAO_GRANDEZA } from '../../services/indicadoresEnergeticos';

function formatarValor(valor, unidade, casas = 3) {
  if (!Number.isFinite(valor)) return 'Dados indisponíveis';
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })}${unidade ? ` ${unidade}` : ''}`;
}

export default function IndicadoresEnergeticos({ periodo, grandeza, dados }) {
  const energia = grandeza === 'Energia';
  const unidade = CONFIGURACAO_GRANDEZA[grandeza].unit;
  const resumo = dados?.grandeza;
  const metricasEnergeticas = dados?.energia;
  const casas = grandeza === 'Tensão' ? 2 : 3;
  const horario = Number.isFinite(resumo?.ultimoHorario)
    ? new Date(resumo.ultimoHorario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const metricas = energia ? [
    {
      titulo: 'Consumo Total',
      valor: formatarValor(metricasEnergeticas?.consumo_total_kwh, 'kWh'),
      detalhe: 'Total no período',
      Icone: Zap,
      cor: 'text-blue-500',
    },
    {
      titulo: 'Consumo Médio',
      valor: formatarValor(metricasEnergeticas?.consumo_medio_kw, 'kW'),
      detalhe: 'Potência média no período',
      Icone: Activity,
      cor: 'text-emerald-500',
    },
    {
      titulo: 'Pico de Potência',
      valor: formatarValor(metricasEnergeticas?.pico_consumo_kw, 'kW'),
      detalhe: 'Máxima potência ativa',
      Icone: TrendingUp,
      cor: 'text-amber-400',
    },
    {
      titulo: 'Maior Consumo',
      valor: formatarValor(metricasEnergeticas?.maior_consumo?.consumo_kwh, 'kWh'),
      detalhe: metricasEnergeticas?.maior_consumo?.nome ?? 'Ponto com maior consumo',
      Icone: Clock3,
      cor: 'text-cyan-400',
    },
  ] : [
    {
      titulo: 'Última leitura',
      valor: formatarValor(resumo?.ultima, unidade, casas),
      detalhe: horario ? `Registrada às ${horario}` : 'Leitura mais recente do período',
      Icone: Zap,
      cor: 'text-blue-500',
    },
    {
      titulo: 'Média',
      valor: formatarValor(resumo?.media, unidade, casas),
      detalhe: 'Média das leituras do período',
      Icone: Activity,
      cor: 'text-emerald-500',
    },
    {
      titulo: 'Máximo',
      valor: formatarValor(resumo?.maximo, unidade, casas),
      detalhe: resumo?.pontoMaximo ?? 'Maior leitura do período',
      Icone: TrendingUp,
      cor: 'text-amber-400',
    },
    {
      titulo: 'Mínimo',
      valor: formatarValor(resumo?.minimo, unidade, casas),
      detalhe: resumo?.pontoMinimo ?? 'Menor leitura do período',
      Icone: Clock3,
      cor: 'text-cyan-400',
    },
  ];
  const indicadores = [
    ...metricas,
    {
      titulo: 'Custo Estimado',
      valor: Number.isFinite(dados?.custoEstimado)
        ? dados.custoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'Dados indisponíveis',
      detalhe: Number.isFinite(dados?.tarifaKwh)
        ? `Tarifa ${dados.tarifaKwh.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 6 })}/kWh`
        : 'Tarifa —',
      Icone: DollarSign,
      cor: 'text-green-500',
    },
    {
      titulo: 'Variação',
      valor: formatarValor(energia ? metricasEnergeticas?.variacao_percentual : dados?.grandeza?.variacao, '%', 2),
      detalhe: energia ? 'Consumo em relação ao período anterior' : 'Média em relação ao período anterior',
      Icone: Percent,
      cor: 'text-green-500',
    },
  ];

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-[#0d151f] p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-200">
          Indicadores de {grandeza.toLowerCase()}
        </h2>

        <span className="shrink-0 text-xs text-slate-500">
          Período: {periodo}
        </span>
      </div>

      {energia && periodo === '6 horas' && (
        <p role="status" className="mb-4 text-xs text-slate-400">
          Os demais indicadores de energia são fornecidos por dia. Selecione Hoje ou Ontem.
        </p>
      )}

      {energia && dados?.erroEnergia && (
        <p role="status" className="mb-4 text-xs text-slate-400">
          {dados.erroEnergia}
        </p>
      )}

      {!energia && dados?.incompleto && (
        <p role="status" className="mb-4 text-xs text-slate-400">
          Dados incompletos para calcular os indicadores deste período.
        </p>
      )}

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
                {dados ? item.valor : 'Carregando…'}
              </p>

              {item.detalhe && (
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {item.detalhe}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}