
import React, { useState } from 'react';
import { Login } from './pages/login';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
import Dashboard from './pages/dashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#070b14] font-sans text-slate-100">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="flex flex-1 flex-col">
        <Topbar activePage={activePage} />

        <main className="flex-1 p-4 md:p-8">
          {activePage === 'Dashboard' ? (
            <Dashboard />
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
        </main>
      </div>
    </div>
  );
}
