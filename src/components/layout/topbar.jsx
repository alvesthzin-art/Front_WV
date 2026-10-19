import React from 'react';
import { Search, Settings, RefreshCw } from 'lucide-react';

export function Topbar({ activePage }) {
  return (
    <header className="px-8 pt-6 pb-4 flex items-center justify-between bg-slate-950 border-b border-slate-900">
      {/* Título e Subtítulo da Página */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {activePage}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Visão geral do sistema
        </p>
      </div>

      {/* Ações da Direita */}
      <div className="flex items-center gap-3">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-slate-900/80 text-slate-200 placeholder-slate-500 text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors w-48"
          />
        </div>

        {/* Botão Configurações */}
        <button className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        {/* Timestamp / Indicador de Atualização */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-2">
          <RefreshCw className="w-3 h-3 text-slate-500" />
          <span>Atualizado às 10:28</span>
        </div>
      </div>
    </header>
  );
}       