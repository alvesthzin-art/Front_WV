import { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/statCard';
import DashboardFilters from '../components/dashboard/dashboardFilters';
import { summaryCards as summaryCardsFallback } from '../components/dashboard/dashboardData';
import SystemPerformance from '../components/dashboard/systemPerformance';
import RecentAlarms from '../components/dashboard/recentAlarms';
import IndicadoresEnergeticos from '../components/dashboard/indicadoresEnergeticos';
import CalculoButton from "../components/dashboard/calculoButton";
import api from '../services/api';
import { listarAlarmes } from '../services/alarmes';

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

function Dashboard({ onOpenAlarmes }) {
  const [summaryCards, setSummaryCards] = useState(summaryCardsFallback);
  const [alertas, setAlertas] = useState([]);
  const [erro, setErro] = useState('');
  const [alarmesIndisponiveis, setAlarmesIndisponiveis] = useState(false);
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
    const controller = new AbortController();
    let emAndamento = false;

    async function carregarDadosReais() {
      if (emAndamento) return;
      emAndamento = true;
      try {
        const parametrosReq = {
          horas: HORAS_POR_PERIODO[filtroPeriodo] || 24,
          local: filtroLocal !== 'Todos' ? filtroLocal : undefined,
          setor: filtroSetor !== 'Todos' ? filtroSetor : undefined,
          equipamento: filtroEquipamento !== 'Todos' ? filtroEquipamento : undefined,
          grandeza: filtroGrandeza,
          id_pzem: 1,
        };
        const config = { signal: controller.signal };
        const resultados = await Promise.allSettled([
          api.get('/equipamentos', config),
          listarAlarmes(controller.signal),
          api.get('/medicoes/serie-temporal', { ...config, params: parametrosReq }),
        ]);
        if (controller.signal.aborted) return;

        const [equipamentosResult, alertasResult, medicoesResult] = resultados;
        const resEquipamentos = equipamentosResult.status === 'fulfilled' ? equipamentosResult.value : null;
        const resAlertas = alertasResult.status === 'fulfilled' ? alertasResult.value : null;
        const resMedicoes = medicoesResult.status === 'fulfilled' ? medicoesResult.value : null;
        const equipamentos = extrairLista(resEquipamentos, ['dados', 'equipamentos']);
        const alarmes = resAlertas ?? [];
        const medicoes = extrairLista(resMedicoes, ['dados'])
          .filter(item => Number.isFinite(new Date(String(item.data_hora ?? '').replace(' ', 'T')).getTime()))
          .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
        const ultima = medicoes.at(-1);
        const normalizar = valor => String(valor ?? '').toLowerCase();
        const valorMedido = (valor, casas, unidade) =>
          valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor))
            ? `${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} ${unidade}`
            : '—';

        setDadosMedicoes(medicoes);
        setAlertas(alarmes);
        setAlarmesIndisponiveis(alertasResult.status === 'rejected');
        setSummaryCards(summaryCardsFallback.map((card, index) => ({
          ...card,
          value: [
            valorMedido(ultima?.tensao, 2, 'V'),
            resEquipamentos ? String(equipamentos.filter(eq => ['ativo', 'online'].includes(normalizar(eq.status))).length) : '\u2014',
            resEquipamentos ? String(equipamentos.filter(eq => ['offline', 'inativo'].includes(normalizar(eq.status))).length) : '\u2014',
            valorMedido(ultima?.fator_potencia ?? ultima?.fator_de_potencia, 2, ''),
          ][index],
        })));
        setErro(resMedicoes ? '' : 'N\u00e3o foi poss\u00edvel atualizar as medi\u00e7\u00f5es. Nova tentativa em alguns segundos.');
        setAtualizadoEm(resMedicoes ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
      } catch {
        if (controller.signal.aborted) return;
        setErro('Não foi possível atualizar o dashboard. Tentaremos novamente em alguns segundos.');
        setDadosMedicoes([]);
        setAlertas([]);
        setAlarmesIndisponiveis(true);
        setSummaryCards(summaryCardsFallback);
        setAtualizadoEm('');
      } finally {
        emAndamento = false;
      }
    }

    carregarDadosReais();
    const intervalo = setInterval(carregarDadosReais, 5000);
    return () => {
      controller.abort();
      clearInterval(intervalo);
    };
  }, [filtroPeriodo, filtroLocal, filtroSetor, filtroEquipamento, filtroGrandeza]);

  return (
    <main className="min-h-screen p-6 text-slate-200 md:p-8 bg-transparent">
      {/* Passando os estados e setters para o componente de filtros gerenciar as opções */}
      <div className="wv-filter-panel mb-5">
        <DashboardFilters
          filtros={filtros}
          opcoes={opcoesFiltros}
          onFiltrosChange={setFiltros}
          atualizadoEm={atualizadoEm}
        />
      </div>
      
      {erro && <p role="alert" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">{erro}</p>}
      <CalculoButton />
      
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
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
        <RecentAlarms alertas={alertas} indisponivel={alarmesIndisponiveis} onOpenAlarmes={onOpenAlarmes} />
      </section>

      <section className="mt-4">
        <IndicadoresEnergeticos periodo={filtroPeriodo} />
      </section>
    </main>
  );
}

export default Dashboard;
