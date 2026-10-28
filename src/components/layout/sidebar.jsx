import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  BellRing, 
  Wifi, 
  Settings, 
  FileText, 
  LogOut
} from 'lucide-react';
import logoWV from '../../assets/logoWV.png';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Operacional', icon: Cpu, path: '/operacional' },
  { name: 'Medições', icon: Activity, path: '/medicoes' },
  { name: 'Alarmes', icon: BellRing, path: '/alarmes' },
  { name: 'Conectividade', icon: Wifi, path: '/conectividade' },
  { name: 'Configurações', icon: Settings, path: '/configuracoes' },
  { name: 'Relatórios', icon: FileText, path: '/relatorios' },
];

export function Sidebar({ activePage, setActivePage, onLogout, isOpen, setIsOpen }) {
  return (
    <aside 
      className={`bg-slate-950/60 backdrop-blur-md text-slate-300 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800/60 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div>
        {/* Logo Watt Vision interativa (Clica para abrir/fechar) */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          title="Alternar Menu"
          className={`flex items-center py-4 mb-6 cursor-pointer group transition-all ${
            isOpen ? 'justify-start gap-3 px-2' : 'justify-center px-0'
          }`}
        >
          <img 
            src={logoWV} 
            alt="Logo Watt Vision" 
            className={`object-contain transition-transform group-hover:scale-105 ${
              isOpen ? 'w-30 h-30' : 'w-15 h-15'
            }`} 
          />
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
                title={!isOpen ? item.name : ''}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isOpen ? 'justify-start' : 'justify-center'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Botão Sair Fixo no Rodapé */}
      <div className="pt-4 border-t border-slate-800/60">
        <button 
          onClick={onLogout}
          title={!isOpen ? 'Sair' : ''}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${
            isOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}