import React from 'react';
import StatCard from '../components/dashboard/statCard';
import DashboardFilters from '../components/dashboard/dashboardFilters';
import { summaryCards } from '../components/dashboard/dashboardData';
import SystemPerformance from '../components/dashboard/systemPerformance';
import RecentAlarms from '../components/dashboard/recentAlarms';
import IndicadoresEnergeticos from '../components/dashboard/indicadoresEnergeticos';

function Dashboard() {
  return (
    <main className="min-h-screen bg-[#070A15] p-6 text-slate-200 md:p-8">
      {/* Filtros e indicador de atualização */}
      <div className="mb-5">
        <DashboardFilters />
      </div>

      

<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
  {summaryCards.map((item) => (
    <StatCard key={item.label} item={item} />
  ))}
</section>

<section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
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