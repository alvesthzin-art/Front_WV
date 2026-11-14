import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Settings, ChevronRight, LayoutDashboard, FileBarChart, Cpu, MapPin, Layers, Bell, Zap, SlidersHorizontal } from 'lucide-react';

const normalizar = (valor) => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Páginas conhecidas do Watt Vision. Ajuste os IDs para os nomes usados na sua Sidebar/roteador.
const PAGINAS = [
  { id: 'Dashboard', label: 'Dashboard', type: 'page', description: 'Visão geral do sistema', keywords: ['inicio', 'painel'], icon: LayoutDashboard },
  { id: 'Operacional', label: 'Operacional', type: 'page', description: 'Monitoramento operacional', keywords: ['operacao', 'equipamentos'], icon: Cpu },
  { id: 'Medições', label: 'Medições', type: 'page', description: 'Leituras e grandezas elétricas', keywords: ['medicoes', 'tensao', 'corrente', 'potencia'], icon: Zap },
  { id: 'Alarmes', label: 'Alarmes', type: 'page', description: 'Alertas e ocorrências', keywords: ['alertas', 'avisos'], icon: Bell },
  { id: 'Conectividade', label: 'Conectividade', type: 'page', description: 'Conexão e status dos dispositivos', keywords: ['wifi', 'rede', 'online'], icon: Layers },
  { id: 'Relatórios', label: 'Relatórios', type: 'page', description: 'Gráficos, consumo e custo estimado', keywords: ['relatorios', 'pdf', 'tarifa'], icon: FileBarChart },
  { id: 'Configurações', label: 'Configurações', type: 'page', description: 'Preferências do sistema', keywords: ['ajustes'], icon: SlidersHorizontal },
];

/**
 * Props de integração:
 * - pages: páginas REAIS da Sidebar (substitui PAGINAS quando fornecido)
 * - equipamentos, setores, locais, searchItems: arrays de dados já carregados pelo sistema
 * - onNavigate(item): navegar para página ou abrir detalhe de equipamento/setor/local
 * - onOpenSettings(): abrir configurações
 * A Topbar não inventa endpoints e não pesquisa registros que não recebeu.
 */
export function Topbar({ activePage, onOpenSettings, onOpenProfile, onNavigate, pages, equipamentos = [], setores = [], locais = [], searchItems = [] }) {
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const raiz = useRef(null);
  const campo = useRef(null);

  const itens = useMemo(() => {
    const paginas = Array.isArray(pages) ? pages : PAGINAS;
    const converter = (dados, type, campoNome) => dados.map((item, i) => ({
      ...item,
      id: item.id ?? `${type}-${i}`,
      label: item.label ?? item.nome ?? item.nome_equipamento ?? item.nome_maquina ?? item[campoNome] ?? String(item.id ?? 'Sem nome'),
      description: item.description ?? (type === 'equipment' ? 'Equipamento' : type === 'sector' ? 'Setor' : 'Local'),
      type,
      icon: type === 'equipment' ? Cpu : type === 'sector' ? Layers : MapPin,
    }));
    return [
      ...paginas.map(p => ({ type: 'page', ...p, label: p.label ?? p.nome ?? p.id, icon: p.icon ?? LayoutDashboard })),
      ...converter(equipamentos, 'equipment', 'equipamento'),
      ...converter(setores, 'sector', 'setor'),
      ...converter(locais, 'location', 'local'),
      ...searchItems.map(item => ({ type: 'other', ...item, label: item.label ?? item.nome ?? String(item.id ?? '') })),
    ];
  }, [pages, equipamentos, setores, locais, searchItems]);

  const resultados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return [];
    const palavras = termo.split(/\s+/);
    return itens.filter(item => {
      const conteudo = normalizar([item.label, item.description, item.type, item.section, ...(Array.isArray(item.keywords) ? item.keywords : [])].join(' '));
      return palavras.every(palavra => conteudo.includes(palavra));
    }).slice(0, 12);
  }, [busca, itens]);

  useEffect(() => {
    const fechar = (evento) => { if (raiz.current && !raiz.current.contains(evento.target)) setAberta(false); };
    document.addEventListener('pointerdown', fechar);
    return () => document.removeEventListener('pointerdown', fechar);
  }, []);
  useEffect(() => {
    const atalho = (evento) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault(); campo.current?.focus(); setAberta(true);
      }
    };
    document.addEventListener('keydown', atalho);
    return () => document.removeEventListener('keydown', atalho);
  }, []);

  const selecionar = (item) => {
    if (item.type === 'page' && normalizar(item.label) === 'configuracoes' && typeof onOpenSettings === 'function') {
      onOpenSettings();
    } else if (typeof onNavigate === 'function') {
      onNavigate(item);
    } else {
      // Sem função de navegação, não fingir que o item foi aberto.
      return;
    }
    setBusca(''); setAberta(false);
  };

  const teclado = (evento) => {
    if (evento.key === 'Escape') { setAberta(false); campo.current?.blur(); return; }
    if (!aberta || !resultados.length) return;
    if (evento.key === 'ArrowDown') { evento.preventDefault(); setIndiceAtivo(i => (i + 1) % resultados.length); }
    if (evento.key === 'ArrowUp') { evento.preventDefault(); setIndiceAtivo(i => (i - 1 + resultados.length) % resultados.length); }
    if (evento.key === 'Enter') { evento.preventDefault(); selecionar(resultados[indiceAtivo] ?? resultados[0]); }
  };

  return (
    <header className="wv-topbar relative z-30 flex min-h-[84px] shrink-0 items-center justify-between gap-4 px-5 py-4 md:px-7">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-[#E5EAF2] md:text-3xl">{activePage}</h1>
        <p className="mt-1 hidden text-xs text-[#8794A8] sm:block">Visão geral do sistema</p>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <div ref={raiz} className="relative w-44 sm:w-72 lg:w-[360px]">
          <div className={`wv-search-shell flex h-12 items-center gap-2.5 rounded-xl border px-4 transition-all ${aberta ? 'border-[#3B82F6] shadow-[0_0_0_3px_rgba(59,130,246,0.08)]' : 'border-[#263448] hover:border-[#365172]'}`}>
            <Search size={18} className="shrink-0 text-[#8BA4C8]" />
            <input ref={campo} type="search" value={busca} onChange={e => { setBusca(e.target.value); setIndiceAtivo(0); setAberta(true); }} onFocus={() => setAberta(true)} onKeyDown={teclado} placeholder="Buscar no sistema..." aria-label="Buscar no sistema" role="combobox" aria-autocomplete="list" aria-expanded={aberta && !!busca.trim()} aria-controls="wattvision-resultados" className="w-full min-w-0 appearance-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-[#67758A] [&::-webkit-search-cancel-button]:hidden" />
          </div>
          {aberta && busca.trim() && (
            <div id="wattvision-resultados" role="listbox" className="absolute right-0 top-[calc(100%+9px)] z-50 max-h-[360px] w-[min(90vw,390px)] overflow-y-auto rounded-xl border border-[#2B3D56] bg-[#101A2A] p-2 shadow-2xl shadow-black/50">
              <p className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8192A8]">Resultados encontrados ({resultados.length}{resultados.length === 12 ? '+' : ''})</p>
              {resultados.length ? resultados.map((item, indice) => {
                const Icone = item.icon ?? Search;
                return (
                  <button key={`${item.type}-${item.id}-${indice}`} type="button" role="option" aria-selected={indice === indiceAtivo} onMouseEnter={() => setIndiceAtivo(indice)} onClick={() => selecionar(item)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${indice === indiceAtivo ? 'bg-[#1D3557] text-white' : 'text-[#DCE4F0] hover:bg-[#18273A]'}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"><Icone size={16}/></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{item.label}</span><span className="mt-0.5 block truncate text-[11px] text-[#91A0B3]">{item.description}</span></span>
                    <ChevronRight size={15} className="shrink-0 text-[#72849C]" />
                  </button>
                );
              }) : <p className="px-3 py-4 text-xs text-[#91A0B3]">Nenhum resultado encontrado nos dados disponíveis.</p>}
            </div>
          )}
        </div>
        <button type="button" aria-label="Configurações" title="Configurações" onClick={onOpenSettings} className="wv-topbar-button flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-[#9EACC0] transition-colors"><Settings size={20}/></button>
        {onOpenProfile ? (
          <button type="button" onClick={onOpenProfile} aria-label="Abrir perfil" className="wv-profile-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-bold text-white">WV</button>
        ) : (
          <span aria-label="Watt Vision" className="wv-profile-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-bold text-white">WV</span>
        )}
      </div>
    </header>
  );
}
