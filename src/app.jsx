import { useEffect, useState } from 'react';
import { Login } from './pages/login';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
import ConfiguracoesSistemaModal from './components/configuracoes/configuracoesSistemaModal';
import PerfilModal from './components/layout/perfilModal';
import RedefinirSenha from './pages/redefinirSenha';
import Dashboard from './pages/dashboard';
import Medicao from './pages/medicoes';
import Operacional from './pages/operacional';
import Relatorios from './pages/relatorios';
import Alarmes from './pages/alarmes';
import Conectividade from './pages/conectividade';
import { validarSessao } from './services/auth';
import { limparSessao } from './services/session';

const PAGINAS_BUSCA = [
  { id: 'Dashboard', label: 'Dashboard', description: 'Visão geral do sistema', keywords: ['inicio', 'painel'] },
  { id: 'Operacional', label: 'Operacional', description: 'Monitoramento operacional', keywords: ['operacao', 'equipamentos'] },
  { id: 'Medições', label: 'Medições', description: 'Leituras e grandezas elétricas', keywords: ['medicoes', 'tensao', 'corrente', 'potencia'] },
  { id: 'Alarmes', label: 'Alarmes', description: 'Alertas e ocorrências', keywords: ['alertas', 'avisos'] },
  { id: 'Conectividade', label: 'Conectividade', description: 'Conexão e status dos dispositivos', keywords: ['rede', 'wifi', 'online'] },
  { id: 'Relatórios', label: 'Relatórios', description: 'Gráficos, consumo e custo estimado', keywords: ['relatorios', 'pdf', 'tarifa'] },
  { id: 'Configurações', label: 'Configurações', description: 'Preferências do sistema', keywords: ['ajustes'] },
];

const normalizar = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const THEME_KEY = 'wattvision_theme';

export default function App() {
  const resetToken = new URLSearchParams(window.location.search).get('resetToken');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [restaurandoSessao, setRestaurandoSessao] = useState(true);
  const [activePage, setActivePage] = useState('Dashboard');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [equipamentoFoco, setEquipamentoFoco] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* armazenamento indisponível */
    }
  }, [theme]);

  useEffect(() => {
    let montado = true;

    validarSessao()
      .then((usuarioAtual) => {
        if (!montado || !usuarioAtual) return;
        setUsuario(usuarioAtual);
        setIsAuthenticated(true);
      })
      .catch(() => {
        // A sessão inválida é removida pelo serviço e o login será exibido.
      })
      .finally(() => {
        if (montado) setRestaurandoSessao(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  if (resetToken) return <RedefinirSenha token={resetToken} />;

  const navegarPelaBusca = (item) => {
    if (!item) return;
    const chave = normalizar(typeof item === 'string' ? item : (item.id ?? item.label));
    if (chave === 'configuracoes') {
      setShowConfigModal(true);
      return;
    }
    const pagina = PAGINAS_BUSCA.find((p) => normalizar(p.id) === chave);
    if (pagina) {
      setEquipamentoFoco(null);
      setActivePage(pagina.id);
      return;
    }
    console.warn('Resultado sem navegação configurada:', item);
  };

  const handleVerEquipamentoDoAlarme = (alarme) => {
    setEquipamentoFoco({
      id_equipamento: alarme.id_equipamento || null,
      id_dispositivo_iot: alarme.id_dispositivo_iot || null,
      nome:
        alarme.equipamento ||
        alarme.nome_equipamento ||
        alarme.nome_dispositivo ||
        '',
    });
    setActivePage('Operacional');
  };

  if (restaurandoSessao) {
    return (
      <div
        className="theme-login min-h-screen w-full bg-slate-950"
        aria-label="Validando sessão"
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Login
        theme={theme}
        onLoginSuccess={(usuarioAutenticado) => {
          setUsuario(usuarioAutenticado);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const pageKey = normalizar(activePage);

  return (
    <div className="theme-app flex min-h-screen font-sans text-slate-100">
      <Sidebar
        theme={theme}
        activePage={activePage}
        setActivePage={(pagina) => {
          setEquipamentoFoco(null);
          setActivePage(pagina);
        }}
        onLogout={() => {
          limparSessao();
          setUsuario(null);
          setIsAuthenticated(false);
          setActivePage('Dashboard');
        }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-transparent">
        <Topbar activePage={activePage} pages={PAGINAS_BUSCA}
          onOpenSettings={() => setShowConfigModal(true)} onOpenProfile={() => setShowProfileModal(true)} onNavigate={navegarPelaBusca} />
        {showConfigModal && <ConfiguracoesSistemaModal usuario={usuario} theme={theme} onThemeChange={setTheme} onClose={() => setShowConfigModal(false)} />}
        {showProfileModal && <PerfilModal usuario={usuario} onClose={() => setShowProfileModal(false)} />}
        <main className="flex-1 bg-transparent">
          {pageKey === 'dashboard' ? (
            <Dashboard onOpenAlarmes={() => setActivePage('Alarmes')} />
          ) : pageKey === 'medicoes' ? (
            <Medicao />
          ) : pageKey === 'operacional' ? (
            <Operacional
              equipamentoInicial={equipamentoFoco}
              onLimparEquipamentoInicial={() => setEquipamentoFoco(null)}
            />
          ) : pageKey === 'relatorios' ? (
            <Relatorios />
          ) : pageKey === 'alarmes' ? (
            <Alarmes onVerEquipamento={handleVerEquipamentoDoAlarme} />
          ) : pageKey === 'conectividade' ? (
            <Conectividade />
          ) : (
            <div className="m-6 rounded-2xl border border-slate-800/60 bg-slate-900/80 p-6">
              <h2 className="text-lg font-semibold text-white">{activePage}</h2>
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
