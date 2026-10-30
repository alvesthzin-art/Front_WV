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

        // Se a API de medições retornou dados com sucesso, guarda no estado
        if (resMedicoes.data && resMedicoes.data.dados) {
          setDadosMedicoes(resMedicoes.data.dados);
          
          // Opcional: Se quiser atualizar dinamicamente algum card de resumo com o valor atual da tensão
          const ultimosDados = resMedicoes.data.dados;
          if (ultimosDados.length > 0) {
            const ultimaLeitura = ultimosDados[ultimosDados.length - 1];
            
            // Exemplo de como atualizar o primeiro card com a tensão real em tempo real
            setSummaryCards(prevCards => 
              prevCards.map((card, index) => {
                if (index === 0) {
                  return { ...card, value: `${ultimaLeitura.tensao} V` };
                }
                return card;
              })
            );
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro ao conectar com o back-end do Watt Vision:", error);
        setLoading(false);
      }
    }

    carregarDadosReais();
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