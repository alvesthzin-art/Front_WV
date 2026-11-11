import { useState } from 'react';

// Import dos componentes Gerais
import { Login } from './pages/login';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
import ConfiguracoesSistemaModal from './components/configuracoes/configuracoesSistemaModal';

// Import das telas 
import Dashboard from './pages/dashboard';
import Medicao from './pages/medicoes';
import Operacional from './pages/operacional';
import Relatorios from './pages/relatorios';
import Alarmes from './pages/alarmes'; // Importação da página de Alarmes

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  // Normalização do nome da página ativa para evitar inconsistências no Sidebar
  const pageKey = activePage?.toLowerCase() || '';

  return (
    <div 
      className="flex min-h-screen font-sans text-slate-100"
      style={{
        background: 'linear-gradient(135deg, #070A15 0%, #0B132B 50%, #04060B 100%)'
      }}
    >
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={() => setIsAuthenticated(false)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-transparent">
        <Topbar
          activePage={activePage}
          onOpenSettings={() => setShowConfigModal(true)}
        />
        
        {showConfigModal && (
          <ConfiguracoesSistemaModal
            onClose={() => setShowConfigModal(false)}
          />
        )}

        <main className="flex-1 bg-transparent">
          {pageKey === 'dashboard' ? (
            <Dashboard onOpenAlarmes={() => setActivePage('Alarmes')} />
          ) : pageKey === 'medições' || pageKey === 'medicoes' ? (
            <Medicao />
          ) : pageKey === 'operacional' ? (
            <Operacional />
          ) : pageKey === 'relatórios' || pageKey === 'relatorios' ? (
            <Relatorios />
          ) : pageKey === 'alarmes' ? (
            <Alarmes />
          ) : (
            <div className="m-6 rounded-2xl border border-slate-800/60 bg-slate-900/80 backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-white">
                {activePage}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Esta seção do Watt Vision será implementada.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}