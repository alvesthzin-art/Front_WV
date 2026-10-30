import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function SystemPerformance({ dados = [] }) {
  // Aba de métrica selecionada (Consumo, Potência, Corrente ou Tensão)
  const [metrica, setMetrica] = useState('tensao'); 
  // Intervalo de horas/dias (1h, 6h, 24h, 7d, 30d)
  const [periodo, setPeriodo] = useState('24h');

  // Configuração visual de cada métrica (Cores, Chaves do JSON, Unidades)
  const configMetrica = {
    consumo: { key: 'energia_acumulada', unit: 'kWh', label: 'Consumo (kWh)', color: '#3b82f6' },
    potencia: { key: 'potencia_ativa', unit: 'W', label: 'Potência (W)', color: '#10b981' },
    corrente: { key: 'corrente', unit: 'A', label: 'Corrente (A)', color: '#f59e0b' },
    tensao: { key: 'tensao', unit: 'V', label: 'Tensão (V)', color: '#6366f1' }
  };

  const metricAtual = configMetrica[metrica];

  // Trata os dados recebidos para exibição no gráfico
  const chartData = dados.map((item) => {
    let horaFormatada = item.data_hora;
    try {
      // Extrai apenas a hora e minuto se for uma string no formato "YYYY-MM-DD HH:MM:SS"
      if (item.data_hora && item.data_hora.includes(' ')) {
        horaFormatada = item.data_hora.split(' ')[1].substring(0, 5);
      }
    } catch (e) {
      horaFormatada = item.data_hora;
    }

    return {
      time: horaFormatada,
      valor: parseFloat(item[metricAtual.key]) || 0
    };
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      {/* Cabeçalho e Controles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Desempenho do Sistema</h3>
          <p className="text-xs text-slate-400">
            {metricAtual.label} ao longo do período selecionado
          </p>
        </div>

        {/* Filtro de Período (1h, 6h, 24h, 7d, 30d) */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          {['1h', '6h', '24h', '7d', '30d'].map((item) => (
            <button
              key={item}
              onClick={() => setPeriodo(item)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                periodo === item
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Botões de Métrica (Consumo, Potência, Corrente, Tensão) */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'consumo', label: 'Consumo' },
          { id: 'potencia', label: 'Potência' },
          { id: 'corrente', label: 'Corrente' },
          { id: 'tensao', label: 'Tensão' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setMetrica(btn.id)}
            className={`px-4 py-1.5 text-xs font-medium rounded-xl transition-all border ${
              metrica === btn.id
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-sm'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Área do Gráfico */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <svg
              className="w-8 h-8 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <p className="text-xs">Nenhum dado encontrado para este gráfico no período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricAtual.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={metricAtual.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(val) => [`${val} ${metricAtual.unit}`, metricAtual.label]}
                labelFormatter={(label) => `Horário: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke={metricAtual.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}