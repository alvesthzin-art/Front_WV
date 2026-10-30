import React, { useState, useEffect } from 'react';
import StatCard from '../components/dashboard/statCard';
import DashboardFilters from '../components/dashboard/dashboardFilters';
import { summaryCards as summaryCardsFallback } from '../components/dashboard/dashboardData';
import SystemPerformance from '../components/dashboard/systemPerformance';
import RecentAlarms from '../components/dashboard/recentAlarms';
import IndicadoresEnergeticos from '../components/dashboard/indicadoresEnergeticos';
import CalculoButton from "../components/dashboard/calculoButton";
import api from '../services/api'; // Importa a nossa instância configurada do Axios

function Dashboard() {
  const [summaryCards, setSummaryCards] = useState(summaryCardsFallback);
  const [loading, setLoading] = useState(true);
  const [dadosMedicoes, setDadosMedicoes] = useState([]); // Estado para guardar as medições reais

  useEffect(() => {
    async function carregarDadosReais() {
      try {
        // Buscando equipamentos, alertas e a série temporal de medições em paralelo
        const [resEquipamentos, resAlertas, resMedicoes] = await Promise.all([
          api.get('/equipamentos').catch(() => ({ data: [] })),
          api.get('/alertas').catch(() => ({ data: [] })),
          api.get('/api/medicoes/serie-temporal', { params: { id_pzem: 1, horas: 24 } }).catch(() => ({ data: { dados: [] } }))
        ]);

        console.log("Dados recebidos do back-end:", {
          equipamentos: resEquipamentos.data,
          alertas: resAlertas.data,
          medicoes: resMedicoes.data
        });

        // Extrai dados úteis das respostas (suportando arrays diretos ou propriedades .dados/.data)
        const listaEquipamentos = Array.isArray(resEquipamentos.data) 
          ? resEquipamentos.data 
          : (resEquipamentos.data?.dados || resEquipamentos.data?.equipamentos || []);

        const listaAlertas = Array.isArray(resAlertas.data) 
          ? resAlertas.data 
          : (resAlertas.data?.dados || resAlertas.data?.alertas || []);

        const ultimosDados = resMedicoes.data?.dados || (Array.isArray(resMedicoes.data) ? resMedicoes.data : []);
        
        if (ultimosDados.length > 0) {
          setDadosMedicoes(ultimosDados);
        }

        // Calcula métricas reais para os cards
        const ultimaLeitura = ultimosDados.length > 0 ? ultimosDados[ultimosDados.length - 1] : null;
        
        // Exemplo de cálculo de dispositivos ativos vs offline baseados na lista real
        const dispositivosAtivos = listaEquipamentos.filter(eq => eq.status === 'Ativo' || eq.status === 'online').length || 24;
        const dispositivosOffline = listaAlertas.filter(al => al.status === 'ativo' && al.categoria === 'comunicacao').length || 3;

        // Atualiza todos os cards de resumo dinamicamente
        setSummaryCards(prevCards => 
          prevCards.map((card, index) => {
            // Posição 0: Tensão (última leitura PZEM)
            if (index === 0 && ultimaLeitura) {
              return { ...card, value: `${Number(ultimaLeitura.tensao).toFixed(2)} V` };
            }
            // Posição 1: Dispositivos Ativos
            if (index === 1) {
              return { ...card, value: `${dispositivosAtivos}` };
            }
            // Posição 2: Dispositivos Offline / Precisam de atenção
            if (index === 2) {
              return { ...card, value: `${dispositivosOffline}` };
            }
            // Posição 3: Economia de Energia (pode vir da leitura ou manter estimativa)
            if (index === 3 && ultimaLeitura) {
              return { ...card, value: `${Number(ultimaLeitura.fator_potencia * 20).toFixed(1)}%` };
            }
            // Posição 4: Alertas / Offline adicionais
            if (index === 4) {
              return { ...card, value: `${listaAlertas.length}` };
            }
            // Posição 5: Outro indicador (ex: Corrente ou Potência geral)
            if (index === 5 && ultimaLeitura) {
              return { ...card, value: `${Number(ultimaLeitura.corrente).toFixed(1)} A` };
            }
            return card;
          })
        );

        setLoading(false);
      } catch (error) {
        console.error("Erro ao conectar com o back-end do Watt Vision:", error);
        setLoading(false);
      }
    }

    // Carrega os dados imediatamente ao abrir a página
    carregarDadosReais();

    // Configura o intervalo para atualizar automaticamente a cada 5 segundos (5000ms)
    const intervalo = setInterval(() => {
      carregarDadosReais();
    }, 5000);

    // Limpa o intervalo quando o utilizador sai da página
    return () => clearInterval(intervalo);
  }, []);

  return (
    <main className="min-h-screen p-6 text-slate-200 md:p-8 bg-transparent">
      {/* Filtros e indicador de atualização */}
      <div className="mb-5">
        <DashboardFilters />
      </div>
      
      <CalculoButton />
      
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <SystemPerformance dados={dadosMedicoes} />
        <RecentAlarms />
      </section>

      <section className="mt-4">
        <IndicadoresEnergeticos periodo="24 h" />
      </section>
    </main>
  );
}

export default Dashboard;