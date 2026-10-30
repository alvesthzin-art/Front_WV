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

  useEffect(() => {
    async function carregarDadosReais() {
      try {
        // Exemplo de requisição para buscar equipamentos e alertas reais do back-end
        const [resEquipamentos, resAlertas] = await Promise.all([
          api.get('/equipamentos').catch(() => ({ data: [] })),
          api.get('/alertas').catch(() => ({ data: [] }))
        ]);

        console.log("Dados recebidos do back-end:", {
          equipamentos: resEquipamentos.data,
          alertas: resAlertas.data
        });

        //  pode atualizar os estados dos cards com base nos dados reais que vierem do banco
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
        <SystemPerformance />
        <RecentAlarms />
      </section>

      <section className="mt-4">
        <IndicadoresEnergeticos periodo="24 h" />
      </section>
    </main>
  );
}

export default Dashboard;