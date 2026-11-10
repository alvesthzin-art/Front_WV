import { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/statCard';
import DashboardFilters from '../components/dashboard/dashboardFilters';
import { summaryCards as summaryCardsFallback } from '../components/dashboard/dashboardData';
import SystemPerformance from '../components/dashboard/systemPerformance';
import RecentAlarms from '../components/dashboard/recentAlarms';
import IndicadoresEnergeticos from '../components/dashboard/indicadoresEnergeticos';
import CalculoButton from "../components/dashboard/calculoButton";
import api from '../services/api';

const HORAS_POR_PERIODO = {
  Hoje: 24,
  '6 horas': 6,
  Ontem: 48,
};

const OPCOES_PADRAO = {
  periodo: ['Hoje', '6 horas', 'Ontem'],
  local: ['Todos'],
  setor: ['Todos'],
  equipamento: ['Todos'],
  grandeza: ['Tensão', 'Corrente', 'Potência', 'Energia', 'Frequência', 'Fator de potência'],
};

function extrairLista(resposta, chaves) {
  if (Array.isArray(resposta?.data)) return resposta.data;
  return chaves.reduce((lista, chave) => (
    Array.isArray(resposta?.data?.[chave]) ? resposta.data[chave] : lista
  ), []);
}

function nomesDasOpcoes(lista) {
  return lista
    .map((item) => typeof item === 'string' ? item : item?.nome)
    .filter(Boolean);
}

function Dashboard() {
  const [summaryCards, setSummaryCards] = useState(summaryCardsFallback);
  const [dadosMedicoes, setDadosMedicoes] = useState([]);

  // Estados dos filtros destacados na tela
  const [filtroPeriodo, setFiltroPeriodo] = useState('Hoje');
  const [filtroLocal, setFiltroLocal] = useState('Todos');
  const [filtroSetor, setFiltroSetor] = useState('Todos');
  const [filtroEquipamento, setFiltroEquipamento] = useState('Todos');
  const [filtroGrandeza, setFiltroGrandeza] = useState('Tensão');
  const [opcoesFiltros, setOpcoesFiltros] = useState(OPCOES_PADRAO);
  const [atualizadoEm, setAtualizadoEm] = useState('');

  const filtros = {
    periodo: filtroPeriodo,
    local: filtroLocal,
    setor: filtroSetor,
    equipamento: filtroEquipamento,
    grandeza: filtroGrandeza,
  };

  const setFiltros = (atualizar) => {
    const novosFiltros = atualizar(filtros);
    setFiltroPeriodo(novosFiltros.periodo);
    setFiltroLocal(novosFiltros.local);
    setFiltroSetor(novosFiltros.setor);
    setFiltroEquipamento(novosFiltros.equipamento);
    setFiltroGrandeza(novosFiltros.grandeza);
  };

  useEffect(() => {
    let ativo = true;

    async function carregarOpcoes() {
      const [resLocais, resSetores, resEquipamentos] = await Promise.all([
        api.get('/locais').catch(() => ({ data: [] })),
        api.get('/setores').catch(() => ({ data: [] })),
        api.get('/equipamentos').catch(() => ({ data: [] })),
      ]);

      if (!ativo) return;

      const locais = nomesDasOpcoes(extrairLista(resLocais, ['dados', 'locais']));
      const setores = nomesDasOpcoes(extrairLista(resSetores, ['dados', 'setores']));
      const equipamentos = nomesDasOpcoes(extrairLista(resEquipamentos, ['dados', 'equipamentos']));

      setOpcoesFiltros((atuais) => ({
        ...atuais,
        local: ['Todos', ...new Set(locais)],
        setor: ['Todos', ...new Set(setores)],
        equipamento: ['Todos', ...new Set(equipamentos)],
      }));
    }

    carregarOpcoes();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    async function carregarDadosReais() {
      try {
        // Converte o período selecionado ou horas do gráfico para parâmetros aceitos pela API
        const parametrosReq = {
          horas: HORAS_POR_PERIODO[filtroPeriodo] || 24,
          local: filtroLocal !== 'Todos' ? filtroLocal : undefined,
          setor: filtroSetor !== 'Todos' ? filtroSetor : undefined,
          equipamento: filtroEquipamento !== 'Todos' ? filtroEquipamento : undefined,
          grandeza: filtroGrandeza,
          id_pzem: 1
        };

        const [resEquipamentos, resAlertas, resMedicoes] = await Promise.all([
          api.get('/equipamentos').catch(() => ({ data: [] })),
          api.get('/alertas').catch(() => ({ data: [] })),
          api.get('/medicoes/serie-temporal', { params: parametrosReq }).catch(() => ({ data: { dados: [] } }))
        ]);

        const listaEquipamentos = Array.isArray(resEquipamentos.data) 
          ? resEquipamentos.data 
          : (resEquipamentos.data?.dados || resEquipamentos.data?.equipamentos || []);

        const listaAlertas = Array.isArray(resAlertas.data) 
          ? resAlertas.data 
          : (resAlertas.data?.dados || resAlertas.data?.alertas || []);

        const ultimosDados = resMedicoes.data?.dados || (Array.isArray(resMedicoes.data) ? resMedicoes.data : []);
        
        if (ultimosDados.length > 0) {
          setDadosMedicoes(ultimosDados);
        } else {
          setDadosMedicoes([]);
        }

        const ultimaLeitura = ultimosDados.length > 0 ? ultimosDados[ultimosDados.length - 1] : null;
        
        const dispositivosAtivos = listaEquipamentos.filter(eq => eq.status === 'Ativo' || eq.status === 'online').length || 24;
        const dispositivosOffline = listaAlertas.filter(al => al.status === 'ativo' && al.categoria === 'comunicacao').length || 3;

        setSummaryCards(prevCards => 
          prevCards.map((card, index) => {
            if (index === 0 && ultimaLeitura) {
              return { ...card, value: `${Number(ultimaLeitura.tensao || 0).toFixed(2)} V` };
            }
            if (index === 1) {
              return { ...card, value: `${dispositivosAtivos}` };
            }
            if (index === 2) {
              return { ...card, value: `${dispositivosOffline}` };
            }
            if (index === 3 && ultimaLeitura) {
              return { ...card, value: `${Number(ultimaLeitura.fator_potencia || 0).toFixed(1)}%` };
            }
            if (index === 4) {
              return { ...card, value: `${listaAlertas.length}` };
            }
            if (index === 5 && ultimaLeitura) {
              return { ...card, value: `${Number(ultimaLeitura.corrente || 0).toFixed(1)} A` };
            }
            return card;
          })
        );
        setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }));

      } catch (error) {
        console.error("Erro ao carregar dados filtrados do Dashboard:", error);
      }
    }

    carregarDadosReais();

    const intervalo = setInterval(() => {
      carregarDadosReais();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [filtroPeriodo, filtroLocal, filtroSetor, filtroEquipamento, filtroGrandeza]);

  return (
    <main className="min-h-screen p-6 text-slate-200 md:p-8 bg-transparent">
      {/* Passando os estados e setters para o componente de filtros gerenciar as opções */}
      <div className="mb-5">
        <DashboardFilters
          filtros={filtros}
          opcoes={opcoesFiltros}
          onFiltrosChange={setFiltros}
          atualizadoEm={atualizadoEm}
        />
      </div>
      
      <CalculoButton />
      
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.slice(0, -2).map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      {/* Componente de Desempenho recebendo também o controle de horas do gráfico */}
      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <SystemPerformance
          dados={dadosMedicoes}
          grandeza={filtroGrandeza}
          periodo={filtroPeriodo}
        />
        <RecentAlarms />
      </section>

      <section className="mt-4">
        <IndicadoresEnergeticos periodo={filtroPeriodo} />
      </section>
    </main>
  );
}

export default Dashboard;
