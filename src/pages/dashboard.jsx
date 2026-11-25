import { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/statCard';
import DashboardFilters from '../components/dashboard/dashboardFilters';
import { summaryCards as summaryCardsFallback } from '../components/dashboard/dashboardData';
import SystemPerformance from '../components/dashboard/systemPerformance';
import RecentAlarms from '../components/dashboard/recentAlarms';
import IndicadoresEnergeticos from '../components/dashboard/indicadoresEnergeticos';
import CalculoButton from "../components/dashboard/calculoButton";
import api from '../services/api';
import { converterTarifaEnergia, lerTarifaEnergia } from '../services/tarifaEnergia';
import { listarAlarmes } from '../services/alarmes';

import {
  calcularIndicadoresGrandeza,
  buscarIndicadoresEnergeticos,
  calcularConsumoMedido,
  horarioMedicao,
  obterPeriodosEnergeticos,
} from '../services/indicadoresEnergeticos';

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
  const [medidores, setMedidores] = useState([]);
  const [indicadores, setIndicadores] = useState(null);

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

  const chaveIndicadores = JSON.stringify([filtroPeriodo, filtroLocal, filtroSetor, filtroEquipamento, filtroGrandeza]);

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
      const [resLocais, resSetores, resEquipamentos, resPontos, resPzems] = await Promise.all([
        api.get('/locais').catch(() => ({ data: [] })),
        api.get('/setores').catch(() => ({ data: [] })),
        api.get('/equipamentos').catch(() => ({ data: [] })),
        api.get('/pontos-medicao').catch(() => ({ data: [] })),
        api.get('/pzems').catch(() => ({ data: [] })),
      ]);

      if (!ativo) return;

      const locais = nomesDasOpcoes(extrairLista(resLocais, ['dados', 'locais']));
      const setores = nomesDasOpcoes(extrairLista(resSetores, ['dados', 'setores']));
      const equipamentos = extrairLista(resEquipamentos, ['dados', 'equipamentos']);
      const idsEquipamentos = new Set(equipamentos
        .map((item) => Number(item.id ?? item.id_equipamento))
        .filter((id) => id > 0));
      const pontosVinculados = new Set(extrairLista(resPontos, ['dados', 'pontos'])
        .filter((ponto) => idsEquipamentos.has(Number(ponto.id_equipamento)))
        .map((ponto) => Number(ponto.id)));
      const pzems = extrairLista(resPzems, ['dados', 'pzems']);
      setMedidores([...new Map(pzems
        .filter((pzem) => String(pzem.status || 'Ativo').toLowerCase() === 'ativo'
          && Number(pzem.id) > 0
          && pontosVinculados.has(Number(pzem.id_ponto_medicao)))
        .map((pzem) => [Number(pzem.id), { ...pzem, id: Number(pzem.id) }])).values()]);

      setOpcoesFiltros((atuais) => ({
        ...atuais,
        local: ['Todos', ...new Set(locais)],
        setor: ['Todos', ...new Set(setores)],
        equipamento: ['Todos', ...new Set(nomesDasOpcoes(equipamentos))],
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
        const periodo = obterPeriodosEnergeticos(filtroPeriodo);
        const parametrosReq = {
          horas: Math.ceil((Date.now() - periodo.anterior) / 3600000) + 1,
          local: filtroLocal !== 'Todos' ? filtroLocal : undefined,
          setor: filtroSetor !== 'Todos' ? filtroSetor : undefined,
          equipamento: filtroEquipamento !== 'Todos' ? filtroEquipamento : undefined,
          grandeza: filtroGrandeza,
        };
        const config = { signal: controller.signal };
        const resultados = await Promise.allSettled([
          api.get('/equipamentos', config),
          listarAlarmes(controller.signal),
          medidores.length
            ? buscarIndicadoresEnergeticos(filtroPeriodo, periodo, parametrosReq, controller.signal)
            : null,
          ...medidores.map(({ id }) => api.get('/medicoes/serie-temporal', {
            ...config,
            params: { ...parametrosReq, id_pzem: id },
          })),
        ]);
        if (controller.signal.aborted) return;

        const [equipamentosResult, alertasResult, indicadoresResult, ...medicoesResultados] = resultados;
        const resEquipamentos = equipamentosResult.status === 'fulfilled' ? equipamentosResult.value : null;
        const resAlertas = alertasResult.status === 'fulfilled' ? alertasResult.value : null;
        const equipamentos = extrairLista(resEquipamentos, ['dados', 'equipamentos']);
        const alarmes = resAlertas ?? [];
        const series = medicoesResultados.flatMap((resultado, indice) =>
          resultado.status === 'fulfilled'
            ? [{ medidor: medidores[indice], dados: extrairLista(resultado.value, ['dados']) }]
            : [],
        );
        const incompleto = medicoesResultados.length !== series.length
          || series.some(({ dados }) => dados.length >= 10000);
        for (const serie of series) {
          serie.dados = serie.dados.filter((item) =>
            Number(item.id_ponto_medicao) === Number(serie.medidor.id_ponto_medicao),
          );
        }
        const medicoes = series.flatMap(({ dados }) => dados)
          .filter((item) => {
            const hora = horarioMedicao(item);
            return hora >= periodo.inicio && hora < periodo.fim;
          })
          .sort((a, b) => horarioMedicao(a) - horarioMedicao(b));


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
        setErro(medidores.length === 0
          ? 'Vincule um PZEM ativo a um equipamento cadastrado para visualizar as medições.'
          : medicoesResultados.every((resultado) => resultado.status === 'rejected')
            ? 'Não foi possível atualizar as medições. Nova tentativa em alguns segundos.'
            : '');
        setAtualizadoEm(medidores.length > 0
          ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : '');
        const grandeza = !incompleto && filtroGrandeza !== 'Energia'
          ? calcularIndicadoresGrandeza(series, periodo, filtroGrandeza)
          : null;
        const consumoMedido = incompleto ? null : calcularConsumoMedido(series, periodo);
        const tarifaKwh = converterTarifaEnergia(lerTarifaEnergia());
        setIndicadores({
          custoEstimado: consumoMedido === null ? null : consumoMedido * tarifaKwh,
          tarifaKwh,
          energia: indicadoresResult.status === 'fulfilled' ? indicadoresResult.value : null,
          erroEnergia: indicadoresResult.status === 'rejected'
            ? indicadoresResult.reason?.response?.data?.mensagem
              || 'Não foi possível consultar os indicadores de energia.'
            : null,
          chave: chaveIndicadores,
          incompleto,
          grandeza,
        });
      } catch {
        if (controller.signal.aborted) return;
        setErro('Não foi possível atualizar o dashboard. Tentaremos novamente em alguns segundos.');
        setIndicadores({ chave: chaveIndicadores, incompleto: true });
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
  }, [filtroPeriodo, filtroLocal, filtroSetor, filtroEquipamento, filtroGrandeza, medidores, chaveIndicadores]);

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
        <IndicadoresEnergeticos
          periodo={filtroPeriodo}
          grandeza={filtroGrandeza}
          dados={indicadores?.chave === chaveIndicadores ? indicadores : null}
        />
      </section>
    </main>
  );
}

export default Dashboard;
