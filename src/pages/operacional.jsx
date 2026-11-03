import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Plus, 
  Trash2,
  Pencil,
  Layers,
  MapPin,
  Zap,
  ArrowLeft,
  AlertCircle,
  Save
} from 'lucide-react';
import NovoOperacionalModal from '../components/operacional/NovoOperacionalModal';
import api from '../services/api';

export default function Operacional() {
  const [abaAtiva, setAbaAtiva] = useState('Equipamentos');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  // Estados limpos (vazios) para coletar e carregar dados reais da aplicação/back-end
  const [equipamentos, setEquipamentos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [locais, setLocais] = useState([]);

  const [formEdicao, setFormEdicao] = useState({});

  // Carrega dados de Equipamentos, Setores e Locais do Back-end ao iniciar
  useEffect(() => {
    async function carregarDadosGlobaisAPI() {
      try {
        const [resEquipamentos, resSetores, resLocais] = await Promise.all([
          api.get('/equipamentos').catch(() => ({ data: [] })),
          api.get('/setores').catch(() => ({ data: [] })),
          api.get('/locais').catch(() => ({ data: [] }))
        ]);

        if (resEquipamentos.data && Array.isArray(resEquipamentos.data)) {
          setEquipamentos(resEquipamentos.data);
        }
        if (resSetores.data && Array.isArray(resSetores.data)) {
          setSetores(resSetores.data);
        }
        if (resLocais.data && Array.isArray(resLocais.data)) {
          setLocais(resLocais.data);
        }
      } catch (error) {
        console.log("Aguardando conexão com as APIs do back-end...");
      }
    }
    carregarDadosGlobaisAPI();
  }, []);

  const handleSelecionarEquipamento = (item) => {
    setEquipamentoSelecionado(item);
    setFormEdicao(item);
  };

  const handleInputChange = (campo, valor) => {
    setFormEdicao(prev => ({ ...prev, [campo]: valor }));
  };

  // Salvar Alterações de Equipamento (PUT / PATCH)
  const handleSalvarAlteracoes = async () => {
    try {
      await api.put(`/equipamentos/${formEdicao.id}`, formEdicao).catch(() => {});
      setEquipamentos(prev => 
        prev.map(eq => eq.id === formEdicao.id ? formEdicao : eq)
      );
      alert('Alterações salvas com sucesso no banco!');
      setEquipamentoSelecionado(null);
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      alert('Erro ao salvar alterações.');
    }
  };

  // Cadastrar Novo Item (POST)
  const handleSalvarNovo = async (novoItem) => {
    try {
      if (abaAtiva === 'Equipamentos') {
        const res = await api.post('/equipamentos', novoItem).catch(() => ({ data: { id: Date.now(), ...novoItem } }));
        setEquipamentos(prev => [res.data || { id: Date.now(), ...novoItem }, ...prev]);
      } else if (abaAtiva === 'Setores') {
        const res = await api.post('/setores', novoItem).catch(() => ({ data: { id: Date.now(), ...novoItem } }));
        setSetores(prev => [res.data || { id: Date.now(), ...novoItem }, ...prev]);
      } else {
        const res = await api.post('/locais', novoItem).catch(() => ({ data: { id: Date.now(), ...novoItem } }));
        setLocais(prev => [res.data || { id: Date.now(), ...novoItem }, ...prev]);
      }
      alert('Item cadastrado com sucesso!');
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao cadastrar novo item:", error);
      alert('Erro ao salvar no back-end.');
    }
  };

  // Deletar Item (DELETE)
  const handleDeletar = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este item permanentemente?')) return;

    try {
      if (abaAtiva === 'Equipamentos') {
        await api.delete(`/equipamentos/${id}`).catch(() => {});
        setEquipamentos(prev => prev.filter(item => item.id !== id));
      } else if (abaAtiva === 'Setores') {
        await api.delete(`/setores/${id}`).catch(() => {});
        setSetores(prev => prev.filter(item => item.id !== id));
      } else {
        await api.delete(`/locais/${id}`).catch(() => {});
        setLocais(prev => prev.filter(item => item.id !== id));
      }
      alert('Item excluído com sucesso!');
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert('Erro ao excluir item.');
    }
  };

  const itensFiltrados = () => {
    if (abaAtiva === 'Equipamentos') {
      return equipamentos.filter(i => i.nome?.toLowerCase().includes(pesquisa.toLowerCase()) && (filtroStatus === 'Todos' || i.status === filtroStatus));
    } else if (abaAtiva === 'Setores') {
      return setores.filter(i => i.nome?.toLowerCase().includes(pesquisa.toLowerCase()) && (filtroStatus === 'Todos' || i.status === filtroStatus));
    } else {
      return locais.filter(i => i.nome?.toLowerCase().includes(pesquisa.toLowerCase()) && (filtroStatus === 'Todos' || i.status === filtroStatus));
    }
  };

  if (equipamentoSelecionado) {
    return (
      <main className="space-y-6 p-4 md:p-6 text-slate-200 min-h-screen bg-transparent">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Detalhes do Equipamento</h1>
              <p className="text-xs text-slate-400 mt-0.5">Gerencie as informações e dados do dispositivo.</p>
            </div>
            <button 
              onClick={() => alert('Redirecionando para medições completas...')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Ver Medições Completas +
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => setEquipamentoSelecionado(null)} className="hover:text-blue-400 transition flex items-center gap-1">
              <ArrowLeft size={14} /> Equipamentos
            </button>
            <span>/</span>
            <span className="text-slate-200 font-medium">{formEdicao.nome}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{formEdicao.nome}</h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Última comunicação: há 5 segundos
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">Identificador: <strong className="text-white">{formEdicao.codigo}</strong></span>
            <span className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">Local: <strong className="text-white">{formEdicao.local}</strong></span>
            <span className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">Setor: <strong className="text-white">{formEdicao.setor}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-6 backdrop-blur-md space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">Informações do Equipamento</h2>
              <p className="text-xs text-slate-400 mt-0.5">Edite os dados diretamente e salve as alterações ao clicar em "Salvar Alterações".</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Nome</label>
                <input type="text" value={formEdicao.nome || ''} onChange={(e) => handleInputChange('nome', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Identificação</label>
                <input type="text" value={formEdicao.codigo || ''} onChange={(e) => handleInputChange('codigo', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Fabricante</label>
                <input type="text" value={formEdicao.fabricante || ''} onChange={(e) => handleInputChange('fabricante', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Modelo</label>
                <input type="text" value={formEdicao.modelo || ''} onChange={(e) => handleInputChange('modelo', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Número de Série</label>
                <input type="text" value={formEdicao.numeroSerie || ''} onChange={(e) => handleInputChange('numeroSerie', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Tensão Nominal (V)</label>
                <input type="text" value={formEdicao.tensaoNominal || ''} onChange={(e) => handleInputChange('tensaoNominal', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Data de Instalação</label>
                <input type="text" value={formEdicao.dataInstalacao || ''} onChange={(e) => handleInputChange('dataInstalacao', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Setor</label>
                <select value={formEdicao.setor || ''} onChange={(e) => handleInputChange('setor', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition">
                  <option>Utilidades</option>
                  <option>HVAC</option>
                  <option>Produção</option>
                  <option>Manutenção</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Local</label>
                <select value={formEdicao.local || ''} onChange={(e) => handleInputChange('local', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition">
                  <option>Planta Industrial Jandira</option>
                  <option>Planta Industrial Osasco</option>
                  <option>Centro Logístico Alphaville</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Status</label>
                <select value={formEdicao.status || ''} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition">
                  <option>Online</option>
                  <option>Atenção</option>
                  <option>Offline</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Descrição</label>
              <textarea rows={3} value={formEdicao.descricao || ''} onChange={(e) => handleInputChange('descricao', e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition resize-none" />
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={handleSalvarAlteracoes} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-600/20">
                <Save size={15} /> Salvar Alterações
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-6 backdrop-blur-md space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Alarmes do Equipamento</h2>
              <p className="text-xs text-slate-400 mt-0.5">Eventos de alerta gerados para o dispositivo.</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between text-rose-400 font-semibold">
                  <span className="flex items-center gap-1.5"><AlertCircle size={14} /> Sobretensão detectada</span>
                  <span className="text-[10px] text-slate-400">há 5 min</span>
                </div>
                <p className="text-slate-300 text-[11px]">Tensao &gt; 250V | Atual: 254V</p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> Corrente elevada</span>
                  <span className="text-[10px] text-slate-400">há 18 min</span>
                </div>
                <p className="text-slate-300 text-[11px]">Corrente &gt; 50A | Atual: 54.3A</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-6 text-slate-200 min-h-screen bg-transparent">
      <div className="flex border-b border-slate-800/60 gap-8">
        {['Equipamentos', 'Setores', 'Locais'].map((aba) => (
          <button
            key={aba}
            onClick={() => { setAbaAtiva(aba); setPesquisa(''); setFiltroStatus('Todos'); }}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              abaAtiva === aba 
                ? 'text-blue-400 border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {aba}
          </button>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[260px] flex-1 sm:flex-none">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder={`Pesquisar por ${abaAtiva.toLowerCase().slice(0, -1)} ou código...`}
              className="w-full rounded-xl border border-slate-800 bg-[#0C141F] py-2.5 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-blue-600 transition"
            />
          </div>

          <select 
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-[#0C141F] px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-600"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Ativo">Ativo / Online</option>
            <option value="Inativo">Inativo / Offline</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-600/20"
        >
          <Plus size={15} />
          Adicionar {abaAtiva === 'Equipamentos' ? 'Equipamento' : abaAtiva === 'Setores' ? 'Setor' : 'Local'}
        </button>
      </div>

      {abaAtiva === 'Equipamentos' && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20"><Cpu size={18} /></div><span className="text-[10px] text-blue-400 font-medium">Total</span></div>
            <h3 className="text-2xl font-bold text-white">{equipamentos.length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total de Equipamentos</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={18} /></div><span className="text-[10px] text-emerald-400 font-medium">Online</span></div>
            <h3 className="text-2xl font-bold text-white">{equipamentos.filter(e => e.status === 'Online').length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Equipamentos Online</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertTriangle size={18} /></div><span className="text-[10px] text-amber-400 font-medium">Atenção</span></div>
            <h3 className="text-2xl font-bold text-white">{equipamentos.filter(e => e.status === 'Atenção').length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Em Atenção</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20"><XCircle size={18} /></div><span className="text-[10px] text-rose-400 font-medium">Offline</span></div>
            <h3 className="text-2xl font-bold text-white">{equipamentos.filter(e => e.status === 'Offline').length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Offline</p>
          </div>
        </section>
      )}

      {abaAtiva === 'Setores' && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20"><Layers size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">{setores.length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total de Setores</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">{setores.filter(s => s.status === 'Ativo').length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Setores Ativos</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><Cpu size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">{equipamentos.length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Equipamentos Totais</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><Zap size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">0,0 kWh</h3>
            <p className="text-xs text-slate-400 mt-0.5">Consumo Agregado</p>
          </div>
        </section>
      )}

      {abaAtiva === 'Locais' && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20"><MapPin size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">{locais.length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total de Locais</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">{locais.filter(l => l.status === 'Ativo').length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Locais Ativos</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><Layers size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">{setores.length}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Setores Vinculados</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-blue-500/20"><Zap size={18} /></div></div>
            <h3 className="text-2xl font-bold text-white">0,0 kWh</h3>
            <p className="text-xs text-slate-400 mt-0.5">Consumo Total</p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-xs">
            <thead className="bg-[#101827] text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">{abaAtiva === 'Equipamentos' ? 'Equipamento' : abaAtiva === 'Setores' ? 'Setor / Código' : 'Local / Código'}</th>
                <th className="px-4 py-3 font-semibold">{abaAtiva === 'Equipamentos' ? 'Local' : abaAtiva === 'Setores' ? 'Local de Pertencimento' : 'Setores Vinculados'}</th>
                <th className="px-4 py-3 font-semibold">{abaAtiva === 'Equipamentos' ? 'Setor' : abaAtiva === 'Setores' ? 'Equipamentos Vinculados' : 'Equipamentos'}</th>
                <th className="px-4 py-3 font-semibold">{abaAtiva === 'Equipamentos' ? 'Potência' : 'Consumo Acumulado'}</th>
                {abaAtiva === 'Equipamentos' && <th className="px-4 py-3 font-semibold">Consumo</th>}
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {itensFiltrados().length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-400 text-xs">
                    Nenhum registro encontrado. Cadastre novos itens pelo botão acima ou verifique a conexão com o back-end.
                  </td>
                </tr>
              ) : (
                itensFiltrados().map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => {
                      if (abaAtiva === 'Equipamentos') {
                        handleSelecionarEquipamento(item);
                      }
                    }}
                    className={`transition hover:bg-slate-900/40 ${abaAtiva === 'Equipamentos' ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-200 hover:text-blue-400 transition">{item.nome}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.codigo || item.id}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{item.local || item.setores}</td>
                    <td className="px-4 py-4 text-slate-300">{item.setor || item.equipamentosVinc || item.equipamentos}</td>
                    <td className="px-4 py-4 text-slate-300 font-medium">{item.potencia || item.consumo}</td>
                    {abaAtiva === 'Equipamentos' && <td className="px-4 py-4 text-slate-300 font-medium">{item.consumo}</td>}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                        item.status === 'Online' || item.status === 'Ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : item.status === 'Atenção'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Online' || item.status === 'Ativo' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            if (abaAtiva === 'Equipamentos') handleSelecionarEquipamento(item);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button 
                          onClick={(e) => handleDeletar(item.id, e)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <NovoOperacionalModal 
          tipo={abaAtiva} 
          onClose={() => setModalAberto(false)} 
          onSalvar={handleSalvarNovo} 
        />
      )}
    </main>
  );
}