import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import NovoOperacionalModal from '../components/operacional/NovoOperacionalModal';

const dadosEquipamentos = [
  { id: 1, nome: 'Bomba Centrifuga BC-02', codigo: 'ESP32-008', local: 'Planta Industrial Jandira', setor: 'Utilidades', potencia: '5,6 kW', consumo: '142,1 kWh', status: 'Online' },
  { id: 2, nome: 'Chiller CH-01', codigo: 'ESP32-025', local: 'Planta Industrial Osasco', setor: 'HVAC', potencia: '31,2 kW', consumo: '831,5 kWh', status: 'Atenção' },
  { id: 3, nome: 'Compressor HVAC-03', codigo: 'ESP32-001', local: 'Planta Industrial Osasco', setor: 'HVAC', potencia: '18,4 kW', consumo: '487,3 kWh', status: 'Online' },
  { id: 4, nome: 'Estação de Solda S-04', codigo: 'ESP32-019', local: 'Planta Industrial Osasco', setor: 'Produção', potencia: '—', consumo: '—', status: 'Offline' },
  { id: 5, nome: 'Fresadora FM-05', codigo: 'ESP32-033', local: 'Planta Industrial Jandira', setor: 'Produção', potencia: '9,1 kW', consumo: '241,8 kWh', status: 'Online' },
];

const dadosSetores = [
  { id: 1, nome: 'Produção', codigo: 'SET-JND-PRD', local: 'Planta Industrial Jandira', equipamentosVinc: '3 equipamentos', consumo: '1.174,7 kWh', status: 'Ativo' },
  { id: 2, nome: 'Utilidades', codigo: 'SET-JND-UTL', local: 'Planta Industrial Jandira', equipamentosVinc: '2 equipamentos', consumo: '454,9 kWh', status: 'Ativo' },
  { id: 3, nome: 'Manutenção', codigo: 'SET-JND-MNT', local: 'Planta Industrial Jandira', equipamentosVinc: '0 equipamentos', consumo: '0,0 kWh', status: 'Ativo' },
  { id: 4, nome: 'Produção', codigo: 'SET-OSC-PRD', local: 'Planta Industrial Osasco', equipamentosVinc: '2 equipamentos', consumo: '1.203,6 kWh', status: 'Ativo' },
  { id: 5, nome: 'HVAC', codigo: 'SET-OSC-HVC', local: 'Planta Industrial Osasco', equipamentosVinc: '3 equipamentos', consumo: '1.710,9 kWh', status: 'Ativo' },
];

const dadosLocais = [
  { id: 1, nome: 'Planta Industrial Jandira', codigo: 'LOC-JND-01', setores: '3 setores', equipamentos: 5, consumo: '1.629,5 kWh', status: 'Ativo' },
  { id: 2, nome: 'Planta Industrial Osasco', codigo: 'LOC-OSC-02', setores: '3 setores', equipamentos: 7, consumo: '2.606,2 kWh', status: 'Ativo' },
  { id: 3, nome: 'Centro Logístico Alphaville', codigo: 'LOC-ALP-03', setores: '1 setor', equipamentos: 0, consumo: '0,0 kWh', status: 'Inativo' },
  { id: 4, nome: 'Subestação Central', codigo: 'LOC-SUB-04', setores: '0 setores', equipamentos: 0, consumo: '245,8 kWh', status: 'Ativo' },
];

export default function Operacional() {
  const [abaAtiva, setAbaAtiva] = useState('Equipamentos');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [modalAberto, setModalAberto] = useState(false);

  const [equipamentos, setEquipamentos] = useState(dadosEquipamentos);
  const [setores, setSetores] = useState(dadosSetores);
  const [locais, setLocais] = useState(dadosLocais);

  const handleSalvarNovo = (novoItem) => {
    if (abaAtiva === 'Equipamentos') {
      setEquipamentos([{ id: Date.now(), ...novoItem, status: novoItem.status === 'Ativo' ? 'Online' : 'Offline' }, ...equipamentos]);
    } else if (abaAtiva === 'Setores') {
      setSetores([{ id: Date.now(), ...novoItem, equipamentosVinc: '1 equipamento', consumo: '0,0 kWh' }, ...setores]);
    } else {
      setLocais([{ id: Date.now(), ...novoItem, setores: '1 setor', equipamentos: 0, consumo: '0,0 kWh' }, ...locais]);
    }
  };

  const itensFiltrados = () => {
    if (abaAtiva === 'Equipamentos') {
      return equipamentos.filter(i => i.nome.toLowerCase().includes(pesquisa.toLowerCase()) && (filtroStatus === 'Todos' || i.status === filtroStatus));
    } else if (abaAtiva === 'Setores') {
      return setores.filter(i => i.nome.toLowerCase().includes(pesquisa.toLowerCase()) && (filtroStatus === 'Todos' || i.status === filtroStatus));
    } else {
      return locais.filter(i => i.nome.toLowerCase().includes(pesquisa.toLowerCase()) && (filtroStatus === 'Todos' || i.status === filtroStatus));
    }
  };

  return (
    <main className="space-y-6 p-4 md:p-6 text-slate-200 min-h-screen bg-transparent">
      {/* Abas Superiores */}
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

      {/* Barra de Filtros e Botão Adicionar */}
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

      {/* Cards de Resumo Dinâmicos por Aba */}
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
            <h3 className="text-2xl font-bold text-white">4.235,8 kWh</h3>
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
            <h3 className="text-2xl font-bold text-white">4.481,5 kWh</h3>
            <p className="text-xs text-slate-400 mt-0.5">Consumo Total</p>
          </div>
        </section>
      )}

      {/* Tabelas de Conteúdo Correspondentes */}
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
              {itensFiltrados().map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-900/40">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-200">{item.nome}</p>
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
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><Pencil size={15} /></button>
                      <button className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Cadastro */}
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