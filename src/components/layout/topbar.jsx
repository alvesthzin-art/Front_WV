import React from 'react';
import {
  Search,
  Settings,
  Bell,
  RefreshCw
} from 'lucide-react';

export function Topbar({ activePage, onOpenSettings }) {
  return (
    <header
      className="flex flex-shrink-0 items-center justify-between px-6 py-4 border-b border-slate-900"
      style={{ backgroundColor: '#070A15' }}
    >
      {/* Título e subtítulo */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#C0C5C8]">
          {activePage}
        </h1>
        <p className="mt-1 text-xs text-[#9ca1a6]">
          Visão geral do sistema
        </p>
      </div>

      {/* Ações do lado direito */}
      <div className="flex items-center gap-3">
        {/* Busca */}
        <div className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: '#4A525B' }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-48 rounded-lg border py-2 pl-9 pr-4 text-xs text-[#C0C5C8] outline-none transition-colors placeholder:text-[#4A525B] focus:border-[#2C57A8]"
            style={{
              backgroundColor: '#0C141F',
              borderColor: '#17315F44',
            }}
          />
        </div>

        {/* Botão Configurações */}
        <button
          type="button"
          aria-label="Configurações"
          title="Configurações do sistema"
          onClick={onOpenSettings}
          className="rounded-lg border p-2 transition-colors hover:bg-[#111622]"
          style={{
            backgroundColor: '#0C141F',
            borderColor: '#17315F44',
            color: '#9ca1a6',
          }}
        >
          <Settings size={15} />
        </button>

        {/* Perfil */}
        <button
          type="button"
          aria-label="Perfil do usuário"
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #2C57A8, #0B121E)',
            boxShadow: '0 2px 12px rgba(44, 87, 168, 0.25)',
          }}
        >
          WV
        </button>
      </div>
    </header>
  );

}

