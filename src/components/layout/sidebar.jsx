import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  BellRing, 
  Wifi, 
  Settings, 
  FileText, 
  LogOut,
  Zap
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Equipamentos', icon: Cpu, path: '/equipamentos' },
  { name: 'Medições', icon: Activity, path: '/medicoes' },
  { name: 'Alarmes', icon: BellRing, path: '/alarmes' },
  { name: 'Conectividade', icon: Wifi, path: '/conectividade' },
  { name: 'Configurações', icon: Settings, path: '/configuracoes' },
  { name: 'Relatórios', icon: FileText, path: '/relatorios' },
];

export function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800">
      <div>
        {/* Logo Watt Vision */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="p-2 bg-blue-600 rounded-xl text-white">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Watt Vision
          </span>
        </div>

        {/* Menu de Navegação */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Botão Sair Fixo no Rodapé */}
      <div className="pt-4 border-t border-slate-800">
        <button 
          onClick={() => alert('Saindo do sistema...')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}