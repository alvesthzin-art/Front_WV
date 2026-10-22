<<<<<<< HEAD
=======

>>>>>>> b8e4666 (Atualiza projeto Font_WV)
import React, { useState } from 'react';

//Import das componentes Gerais
import { Login } from './pages/login';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
//import  ConfiguracoesSistemaModal  from '../src/components/configuracoes/configuracoesSistemaModal';
import Dashboard from './pages/dashboard';
import ConfiguracoesSistemaModal  from './components/configuracoes/configuracoesSistemaModal';
// Importe o modal aqui, usando o caminho real do seu projeto.
// Exemplo:
// import { ConfiguracoesSistemaModal } from './components/ConfiguracoesSistemaModal';
>>>>>>> b8e4666 (Atualiza projeto Font_WV)

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');
  const [showConfigModal, setShowConfigModal] = useState(false);

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070A15] font-sans text-slate-100">
<<<<<<< HEAD
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="flex-1 flex flex-col">
        <Topbar activePage={activePage} />

        <main className="flex-1 p-8">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-card">
            <h2 className="text-lg font-semibold text-white">
              Painel de Controle - {activePage}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Você está autenticado no Watt Vision.
            </p>
          </div>
=======
    <div className="flex min-h-screen bg-[#070b14] font-sans text-slate-100">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-[#070A15]">
        <Topbar
          activePage={activePage}
          onOpenSettings={() => setShowConfigModal(true)}
        />
        {/* Modal de configurações */}
      {showConfigModal && (
        <ConfiguracoesSistemaModal
          onClose={() => setShowConfigModal(false)}
        />
      )}

        <main className="flex-1 p-4 md:p-8">
          {activePage === 'Dashboard' ? (
            <Dashboard />
          ) : activePage === 'Medições' ? (
            <Medicao />
          ) : (
            <div className="rounded-card border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold text-white">
                {activePage}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Esta seção do Watt Vision será implementada.
              </p>
            </div>
          )}
>>>>>>> b8e4666 (Atualiza projeto Font_WV)
        </main>
      </div>

      
    </div>
  );
<<<<<<< HEAD
}
