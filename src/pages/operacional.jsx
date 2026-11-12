import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  Pencil,
  ArrowLeft,
  Save,
  AlertCircle,
  Clock
} from 'lucide-react';
import NovoOperacionalModal from '../components/operacional/NovoOperacionalModal';
import api from '../services/api';

export default function Operacional() {
  const [abaAtiva, setAbaAtiva] = useState('Equipamentos');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  const [equipamentos, setEquipamentos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [locais, setLocais] = useState([]);

  const [formEdicao, setFormEdicao] = useState({});

  // Função para carregar dados e relacionar Equipamentos com Setores e Locais do MySQL
  const carregarDadosOperacionais = async () => {
    try {
      const [resEquipamentos, resSetores, resLocais] = await Promise.all([
        api.get('/equipamentos').catch(() => ({ data: [] })),
        api.get('/setores').catch(() => ({ data: [] })),
        api.get('/locais').catch(() => ({ data: [] }))
      ]);

      const listaEquipamentos = Array.isArray(resEquipamentos.data) 
        ? resEquipamentos.data 
        : (resEquipamentos.data?.dados || resEquipamentos.data?.equipamentos || []);

      const listaSetores = Array.isArray(resSetores.data) 
        ? resSetores.data 
        : (resSetores.data?.dados || resSetores.data?.setores || []);

      const listaLocais = Array.isArray(resLocais.data) 
        ? resLocais.data 
        : (resLocais.data?.dados || resLocais.data?.locais || []);

      // Cruza o id_setor com o setor e o local correspondente para exibição correta na tabela
      const equipamentosEnriquecidos = listaEquipamentos.map(eq => {
        const setorEncontrado = listaSetores.find(s => s.id === eq.id_setor || s.id_setor === eq.id_setor);
        const localEncontrado = listaLocais.find(l => l.id === setorEncontrado?.id_local);

        return {
          ...eq,
          nomeSetor: setorEncontrado ? setorEncontrado.nome : (eq.setor || 'Setor Padrão'),
          nomeLocal: localEncontrado ? localEncontrado.nome : (eq.local || 'Planta Industrial')
        };
      });

      setEquipamentos(equipamentosEnriquecidos);
      setSetores(listaSetores);
      setLocais(listaLocais);
    } catch (error) {
      console.error("Erro ao sincronizar dados operacionais com o banco:", error);
    }
  };

  useEffect(() => {
    const agendamento = setTimeout(() => { void carregarDadosOperacionais(); }, 0);
    const intervalo = setInterval(carregarDadosOperacionais, 5000);
    return () => { clearTimeout(agendamento); clearInterval(intervalo); };
  }, []);

  const handleSelecionarEquipamento = (item) => {
    setEquipamentoSelecionado(item);
    setFormEdicao(item);
  };

  const handleSelecionarItemOperacional = (item) => {
    if (abaAtiva === 'Equipamentos') {
      handleSelecionarEquipamento(item);
      return;
    }
    setItemEmEdicao(item);
    setModalAberto(true);
  };

  const handleInputChange = (campo, valor) => {
    setFormEdicao(prev => ({ ...prev, [campo]: valor }));
  };

  // Salvar Alterações (PUT) no Banco de Dados
  const handleSalvarAlteracoes = async () => {
    try {
      await api.put(`/equipamentos/${formEdicao.id}`, formEdicao);
      alert('Alterações salvas com sucesso no banco de dados!');
      setEquipamentoSelecionado(null);
      carregarDadosOperacionais();
    } catch (error) {
      console.error("Erro ao atualizar no banco:", error);
      alert('Erro ao salvar alterações no banco.');
    }
  };

  // Cadastrar Novo Item (POST) com suporte adequado ao LocalService do back-end
  const handleSalvarNovo = async (novoItem) => {
    try {
      if (abaAtiva === 'Equipamentos') {
        const payload = {
          nome: novoItem.nome,
          codigo: novoItem.codigo || `EQ-${Math.floor(Math.random() * 900 + 100)}`,
          id_setor: novoItem.id_setor ? Number(novoItem.id_setor) : 1,
          status: novoItem.status || 'Ativo',
          potencia_nominal: novoItem.potencia_nominal || 0
        };
        await api.post('/equipamentos', payload);
      } else if (abaAtiva === 'Setores') {
        const payload = {
          nome: novoItem.nome,
          codigo: novoItem.codigo || `SET-${Math.floor(Math.random() * 900 + 100)}`,
          id_local: novoItem.id_local ? Number(novoItem.id_local) : Number(locais[0]?.id),
          responsavel: novoItem.responsavel || null,
          descricao: novoItem.descricao || null,
          status: novoItem.status || 'Ativo'
        };
        if (itemEmEdicao) await api.put(`/setores/${itemEmEdicao.id}`, payload);
        else await api.post('/setores', payload);
      } else {
        const payload = {
          nome: novoItem.nome,
          codigo: novoItem.codigo || `LOC-${Math.floor(Math.random() * 900 + 100)}`,
          endereco: novoItem.endereco || novoItem.localizacao || 'Planta Principal',
          responsavel: novoItem.responsavel || null,
          status: novoItem.status || 'Ativo',
          id_empresa: novoItem.id_empresa ? Number(novoItem.id_empresa) : Number(itemEmEdicao?.id_empresa || 1)
        };
        if (itemEmEdicao) await api.put(`/locais/${itemEmEdicao.id}`, payload);
        else await api.post('/locais', payload);
      }
      
      alert(`${itemEmEdicao ? 'Alterações salvas' : 'Item cadastrado'} com sucesso no banco!`);
      setModalAberto(false);
      setItemEmEdicao(null);
      carregarDadosOperacionais();
    } catch (error) {
      console.error("Erro ao cadastrar no banco:", error);
      alert('Erro ao salvar no back-end / banco de dados. Verifique os campos preenchidos.');
    }
  };

  // Filtros de Pesquisa e Status
  const itensFiltrados = () => {
    const dadosAtuais = abaAtiva === 'Equipamentos'
      ? equipamentos
      : abaAtiva === 'Setores' ? setores : locais;

    return dadosAtuais.filter(item => {
      const matchNome = item.nome?.toLowerCase().includes(pesquisa.toLowerCase()) || 
                        item.codigo?.toLowerCase().includes(pesquisa.toLowerCase());
      
      const matchStatus = filtroStatus === 'Todos' || 
                          item.status === filtroStatus || 
                          (filtroStatus === 'Ativo' && (item.status === 'Online' || item.status === 'Ativo')) ||
                          (filtroStatus === 'Inativo' && (item.status === 'Offline' || item.status === 'Inativo' || item.status === 'Atenção'));

      return matchNome && matchStatus;
    });
  };

  // TELA DE DETALHES DO EQUIPAMENTO SEGUINDO EXATAMENTE O PROTÓTIPO
  if (equipamentoSelecionado) {
    return (
      <main className="space-y-6 p-4 md:p-6 text-slate-200 min-h-screen bg-transparent">
        {/* Barra Superior Informativa do Protótipo */}
        <div className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-800/80 bg-[#0C141F]/90 px-4 py-3 backdrop-blur-md gap-4 text-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setEquipamentoSelecionado(null)} className="text-slate-400 hover:text-blue-400 transition flex items-center gap-1">
              <ArrowLeft size={16} /> Voltar
            </button>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock size={13} /> Última comunicação: há 3 segundos
            </span>
          </div>
          <div className="text-slate-400 hidden xl:block">
            <span className="text-slate-200 font-medium">{formEdicao.codigo || 'ESP32-008'}</span> &bull;{' '}
            <span>{formEdicao.nomeLocal || 'Planta Industrial Jandira'}</span> &bull;{' '}
            <span>{formEdicao.nomeSetor || 'Utilidades'}</span> &bull;{' '}
            <span className="text-blue-400">{formEdicao.nome || 'Bomba'}</span>
          </div>
        </div>

        {/* Layout em Grid do Protótipo (Formulário à esquerda | Alarmes à direita) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Formulário de Informações do Equipamento (Ocupa 2 colunas) */}
          <div className="xl:col-span-2 rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-6 backdrop-blur-md space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">Informações do Equipamento</h2>
              <p className="text-xs text-slate-400 mt-0.5">Edite os dados diretamente — as alterações só são salvas ao clicar em "Salvar Alterações".</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Nome</label>
                <input 
                  type="text" 
                  value={formEdicao.nome || ''} 
                  onChange={(e) => handleInputChange('nome', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Identificação</label>
                <input 
                  type="text" 
                  value={formEdicao.codigo || ''} 
                  onChange={(e) => handleInputChange('codigo', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Fabricante</label>
                <input 
                  type="text" 
                  value={formEdicao.fabricante || 'ABB'} 
                  onChange={(e) => handleInputChange('fabricante', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Modelo</label>
                <input 
                  type="text" 
                  value={formEdicao.modelo || 'ACQ580'} 
                  onChange={(e) => handleInputChange('modelo', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Número de Série</label>
                <input 
                  type="text" 
                  value={formEdicao.numero_serie || 'ABB-ACQ-58008'} 
                  onChange={(e) => handleInputChange('numero_serie', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Tensão Nominal (V)</label>
                <input 
                  type="text" 
                  value={formEdicao.tensao_nominal || '380'} 
                  onChange={(e) => handleInputChange('tensao_nominal', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Data de Instalação</label>
                <input 
                  type="text" 
                  value={formEdicao.data_instalacao || '21/03/2025'} 
                  onChange={(e) => handleInputChange('data_instalacao', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Local</label>
                <select 
                  value={formEdicao.nomeLocal || ''} 
                  onChange={(e) => handleInputChange('nomeLocal', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition"
                >
                  <option value="Planta Industrial Jandira">Planta Industrial Jandira</option>
                  {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Setor</label>
                <select 
                  value={formEdicao.nomeSetor || ''} 
                  onChange={(e) => handleInputChange('nomeSetor', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition"
                >
                  <option value="Utilidades">Utilidades</option>
                  <option value="Produção">Produção</option>
                  {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Tipo</label>
                <select 
                  value={formEdicao.tipo || 'Bomba'} 
                  onChange={(e) => handleInputChange('tipo', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition"
                >
                  <option value="Bomba">Bomba</option>
                  <option value="Motor">Motor</option>
                  <option value="Compressor">Compressor</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Status</label>
                <select 
                  value={formEdicao.status || 'Ativo'} 
                  onChange={(e) => handleInputChange('status', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Descrição</label>
                <textarea 
                  rows={3}
                  value={formEdicao.descricao || 'Descreva o equipamento, localização física, observações...'} 
                  onChange={(e) => handleInputChange('descricao', e.target.value)} 
                  className="w-full rounded-xl border border-slate-800 bg-[#101827] p-3.5 text-xs text-slate-200 outline-none focus:border-blue-600 transition resize-none" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSalvarAlteracoes} 
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-600/20"
              >
                <Save size={15} /> Salvar Alterações
              </button>
            </div>
          </div>

          {/* Painel Lateral de Alarmes do Equipamento (Ocupa 1 coluna) */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C141F]/80 p-5 backdrop-blur-md space-y-4 h-fit">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Alarmes do Equipamento</h3>
                <p className="text-[11px] text-slate-400">Eventos de alerta gerados por este dispositivo</p>
              </div>
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">3</span>
            </div>

            <div className="space-y-3">
              {/* Alarme Crítico */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-400" /> Sobretensão detectada
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">Crítico</span>
                </div>
                <p className="text-[11px] text-slate-400">Tensão &gt; 250 V (atual: 263 V)</p>
                <p className="text-[10px] text-slate-500 pt-1">Hoje, 14:32</p>
              </div>

              {/* Alarme Alerta */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400" /> Corrente elevada
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Alerta</span>
                </div>
                <p className="text-[11px] text-slate-400">Corrente &gt; 80 A (atual: 84,3 A)</p>
                <p className="text-[10px] text-slate-500 pt-1">Hoje, 12:15</p>
              </div>

              {/* Alarme Aviso */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-blue-400" /> Temperatura interna alta
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">Aviso</span>
                </div>
                <p className="text-[11px] text-slate-400">Temp. &gt; 70°C (atual: 71,2°C)</p>
                <p className="text-[10px] text-slate-500 pt-1">Ontem, 23:47</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // TELA PRINCIPAL (Lista de Equipamentos / Setores / Locais)
  return (
    <main className="space-y-6 p-4 md:p-6 text-slate-200 min-h-screen bg-transparent">
      {/* Abas Superiores (Equipamentos | Setores | Locais) */}
      <div className="flex border-b border-slate-800/60 gap-8">
        {['Equipamentos', 'Setores', 'Locais'].map((aba) => (
          <button
            key={aba}
            onClick={() => { setAbaAtiva(aba); setPesquisa(''); setFiltroStatus('Todos'); setItemEmEdicao(null); }}
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

      {/* Barra de Pesquisa, Filtros e Botão de Adicionar */}
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
          onClick={() => { setItemEmEdicao(null); setModalAberto(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-600/20"
        >
          <Plus size={15} />
          Adicionar {abaAtiva === 'Equipamentos' ? 'Equipamento' : abaAtiva === 'Setores' ? 'Setor' : 'Local'}
        </button>
      </div>

      {/* Tabela de Dados */}
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
                    Nenhum registo encontrado. Cadastre novos itens pelo botão acima.
                  </td>
                </tr>
              ) : (
                itensFiltrados().map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleSelecionarItemOperacional(item)}
                    className="cursor-pointer transition hover:bg-slate-900/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-200 hover:text-blue-400 transition">{item.nome}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.codigo || item.id}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{abaAtiva === 'Equipamentos' ? (item.nomeLocal || '-') : (item.local || item.setores || '-')}</td>
                    <td className="px-4 py-4 text-slate-300">{abaAtiva === 'Equipamentos' ? (item.nomeSetor || '-') : (item.setor || '-')}</td>
                    <td className="px-4 py-4 text-slate-300 font-medium">{item.potencia_nominal ? `${item.potencia_nominal} W` : (item.potencia || '0.0')}</td>
                    {abaAtiva === 'Equipamentos' && <td className="px-4 py-4 text-slate-300 font-medium">{item.consumo || '0.0 kWh'}</td>}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                        item.status === 'Online' || item.status === 'Ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelecionarItemOperacional(item);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Editar"
                        >
                          <Pencil size={15} />
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
          key={`${abaAtiva}-${itemEmEdicao?.id || 'novo'}`}
          tipo={abaAtiva} 
          itemInicial={itemEmEdicao}
          locais={locais}
          onClose={() => { setModalAberto(false); setItemEmEdicao(null); }}
          onSalvar={handleSalvarNovo} 
        />
      )}
    </main>
  );
}
