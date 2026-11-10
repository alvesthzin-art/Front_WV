import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import AlarmesKpiGrid from '../components/alarmes/alarmesKpiGrid';
import AlarmesTabela from '../components/alarmes/alarmesTabela';
import api from '../services/api';

const fallbackKpis = [
  { id: 'ativos', label: 'Alarmes Ativos', value: 11, detail: '7 requerem ação · 4 com atenção', tone: 'blue', icon: Bell },
  { id: 'criticos', label: 'Críticos', value: 4, detail: 'Requerem ação imediata', tone: 'red', icon: AlertTriangle },
  { id: 'atencao', label: 'Atenção', value: 4, detail: 'Monitorar para evitar agravamento', tone: 'yellow', icon: AlertCircle },
  { id: 'resolvidos', label: 'Resolvidos Hoje', value: 6, detail: 'Normalizados nas últimas 24h', tone: 'green', icon: CheckCircle2 },
];

const fallbackAlertas = [
  {
    id: '1',
    titulo: 'Consumo acima do limite',
    condicao: 'Potência acima de 15,0 kW (atual: 18,7 kW)',
    categoria: 'Energético',
    equipamento: 'Compressor HVAC-03',
    local: 'Planta Industrial Osasco > HVAC',
    severidade: 'Crítico',
    inicio: 'há 3 min',
    timestampInicio: '10/11 09:48',
    status: 'Ativo',
    reconhecido: false
  },
  {
    id: '2',
    titulo: 'Corrente elevada',
    condicao: 'Corrente > 80 A (atual: 84,3 A)',
    categoria: 'Energético',
    equipamento: 'Motor Bomba-07',
    local: 'Planta Industrial Osasco > Utilidades',
    severidade: 'Crítico',
    inicio: 'há 47 min',
    timestampInicio: '10/11 09:04',
    status: 'Reconhecido',
    reconhecido: true
  },
  {
    id: '3',
    titulo: 'Sobretensão detectada',
    condicao: 'Tensão > 250 V (atual: 263 V)',
    categoria: 'Energético',
    equipamento: 'Prensa Hidráulica PH-01',
    local: 'Planta Industrial Osasco > Produção',
    severidade: 'Crítico',
    inicio: 'há 8 min',
    timestampInicio: '10/11 09:43',
    status: 'Ativo',
    reconhecido: false
  },
  {
    id: '4',
    titulo: 'Temperatura ambiente alta',
    condicao: 'Temp. do ambiente > 38°C (atual: 41°C)',
    categoria: 'Energético',
    equipamento: 'Chiller CH-01',
    local: 'Planta Industrial Osasco > HVAC',
    severidade: 'Atenção',
    inicio: 'há 2 h',
    timestampInicio: '10/11 07:51',
    status: 'Reconhecido',
    reconhecido: true
  },
  {
    id: '5',
    titulo: 'Tensão instável',
    condicao: 'Variação de tensão > 5% em 10 min',
    categoria: 'Energético',
    equipamento: 'Torno CNC-02',
    local: 'Planta Industrial Osasco > Usinagem',
    severidade: 'Atenção',
    inicio: 'há 1 h',
    timestampInicio: '10/11 08:43',
    status: 'Ativo',
    reconhecido: false
  },
  {
    id: '6',
    titulo: 'Fator de potência baixo',
    condicao: 'FP < 0,92 (atual: 0,87)',
    categoria: 'Energético',
    equipamento: 'Linha Produção 3',
    local: 'Planta Industrial Osasco > Montagem',
    severidade: 'Informativo',
    inicio: 'há 4 h',
    timestampInicio: '10/11 05:43',
    status: 'Ativo',
    reconhecido: false
  },
  {
    id: '7',
    titulo: 'Consumo noturno anormal',
    condicao: 'Consumo fora do horário programado',
    categoria: 'Energético',
    equipamento: 'Torno CNC-02',
    local: 'Planta Industrial Osasco > Usinagem',
    severidade: 'Informativo',
    inicio: 'há 6 h',
    timestampInicio: '10/11 03:43',
    status: 'Ativo',
    reconhecido: false
  },
  {
    id: '8',
    titulo: 'ESP32 sem comunicação',
    condicao: 'Sem resposta MQTT há 8 minutos',
    categoria: 'Comunicação',
    equipamento: 'Dispositivo ESP32-019',
    local: 'Planta Industrial Osasco > Medição',
    severidade: 'Crítico',
    inicio: 'há 8 min',
    timestampInicio: '10/11 09:43',
    status: 'Ativo',
    reconhecido: false
  }
];

function Alarmes() {
  const [kpis, setKpis] = useState(fallbackKpis);
  const [alertas, setAlertas] = useState(fallbackAlertas);
  const [loading, setLoading] = useState(true);

  // Busca dados na API backend (GET /api/alertas)
  const carregarDadosAlarmes = async () => {
    try {
      const resAlertas = await api.get('/alertas').catch(() => ({ data: [] }));
      
      const listaAlertas = Array.isArray(resAlertas.data)
        ? resAlertas.data
        : resAlertas.data?.dados || resAlertas.data?.alertas || [];

      if (listaAlertas.length > 0) {
        setAlertas(listaAlertas);

        // Atualização dinâmica de contadores dos KPIs
        const totalAtivos = listaAlertas.filter((a) => a.status !== 'Resolvido' && a.status !== 'inativo').length;
        const criticos = listaAlertas.filter((a) => (a.severidade === 'critico' || a.severidade === 'Crítico') && a.status !== 'Resolvido').length;
        const atencao = listaAlertas.filter((a) => (a.severidade === 'atencao' || a.severidade === 'Atenção') && a.status !== 'Resolvido').length;
        const resolvidos = listaAlertas.filter((a) => a.status === 'Resolvido').length;

        setKpis([
          { id: 'ativos', label: 'Alarmes Ativos', value: totalAtivos, detail: `${criticos} críticos · ${atencao} com atenção`, tone: 'blue', icon: Bell },
          { id: 'criticos', label: 'Críticos', value: criticos, detail: 'Requerem ação imediata', tone: 'red', icon: AlertTriangle },
          { id: 'atencao', label: 'Atenção', value: atencao, detail: 'Monitorar para evitar agravamento', tone: 'yellow', icon: AlertCircle },
          { id: 'resolvidos', label: 'Resolvidos Hoje', value: resolvidos, detail: 'Normalizados nas últimas 24h', tone: 'green', icon: CheckCircle2 },
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao conectar com o back-end de Alertas:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosAlarmes();

    // Polling a cada 5 segundos
    const intervalo = setInterval(() => {
      carregarDadosAlarmes();
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  // Reconhecer alarme (PATCH /api/alertas/:id/reconhecer)
  const handleReconhecer = async (id) => {
    try {
      await api.patch(`/alertas/${id}/reconhecer`, { id_usuario: 1 }).catch(async () => {
        await api.post(`/alertas/${id}/reconhecer`, { id_usuario: 1 }).catch(() => {});
      });

      setAlertas((prev) =>
        prev.map((item) => {
          const itemId = item.id_alerta || item.id;
          if (itemId === id) {
            return { ...item, status: 'Reconhecido', reconhecido: true };
          }
          return item;
        })
      );
    } catch (err) {
      console.error('Erro ao reconhecer alarme:', err);
    }
  };

  return (
    <main className="min-h-screen p-6 text-slate-200 md:p-8 bg-transparent">
      {/* 1. Componente dos Cards */}
      <AlarmesKpiGrid kpis={kpis} />

      {/* 2. Componente da Tabela e Modal */}
      <AlarmesTabela alertas={alertas} loading={loading} onReconhecer={handleReconhecer} />
    </main>
  );
}

export default Alarmes;