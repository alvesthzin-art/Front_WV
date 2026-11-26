import { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';

import FiltrosMedicao from '../components/medicoes/filtrosMedicao';
import MedicoesAlarmesModal from '../components/medicoes/medicoesAlarmesModal';
import CardMedicao from '../components/medicoes/cardMedicao';
import CardMetaMedicao from '../components/medicoes/cardMetaMedicao';
import TensaoAoLongoDoTempo from '../components/medicoes/tensaoAoLongoDoTempo';
import DadosBrutosModal from '../components/medicoes/dadosBrutos';
import PontosMedicaoModal from '../components/medicoes/pontosMedicaoModal';
import api from '../services/api';
import { verificarMedicaoECriarAlarme } from '../services/alertaService';

const HORAS_POR_PERIODO = {
  Hoje: 24,
  Ontem: 48,
  'Últimos 7 dias': 168,
  'Últimos 30 dias': 720,
};

const CONFIG_GRANDEZA = {
  Tensão: { campo: 'tensao', unidade: 'V', label: 'tensão' },
  Corrente: { campo: 'corrente', unidade: 'A', label: 'corrente' },
  Potência: { campo: 'potencia_ativa', unidade: 'W', label: 'potência ativa' },
  Energia: { campo: 'energia_acumulada', unidade: 'kWh', label: 'energia acumulada' },
};

function converterData(data) {
  if (!data) return null;
  const dataConvertida = new Date(String(data).replace(' ', 'T'));
  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function extrairLista(res) {
  return Array.isArray(res?.data) ? res.data : res?.data?.dados || [];
}

export default function Medicao() {
  const [modalAberto, setModalAberto] = useState(false);
  const [pontosModalAberto, setPontosModalAberto] = useState(false);
  const [dadosMedicoes, setDadosMedicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [locais, setLocais] = useState([]);
  const [setores, setSetores] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [pontosMedicao, setPontosMedicao] = useState([]);
  const [pzems, setPzems] = useState([]);

  const [filtros, setFiltros] = useState({
    id_local: '',
    local: 'Todos os locais',
    id_setor: '',
    setor: 'Todos os setores',
    id_equipamento: '',
    equipamento: 'Todos',
    periodo: 'Hoje',
    grandeza: 'Tensão',
  });

  // 1. Carrega estrutura hierárquica (Locais -> Setores -> Equipamentos -> Pontos)
  useEffect(() => {
    let ativo = true;

    async function carregarEstrutura() {
      const [resLocais, resSetores, resEquipamentos, resPontos, resPzems] =
        await Promise.all([
          api.get('/locais').catch(() => ({ data: [] })),
          api.get('/setores').catch(() => ({ data: [] })),
          api.get('/equipamentos').catch(() => ({ data: [] })),
          api.get('/pontos-medicao').catch(() => ({ data: [] })),
          api.get('/pzems').catch(() => ({ data: [] })),
        ]);

      if (!ativo) return;

      setLocais(extrairLista(resLocais));
      setSetores(extrairLista(resSetores));
      setEquipamentos(extrairLista(resEquipamentos));
      setPontosMedicao(extrairLista(resPontos));
      setPzems(extrairLista(resPzems));
    }

    carregarEstrutura();
    return () => {
      ativo = false;
    };
  }, []);

  // 2. Resolve os sensores (id_pzem) correspondentes aos filtros selecionados
  const idsPzemFiltrados = useMemo(() => {
    const temFiltro =
      Boolean(filtros.id_local) ||
      Boolean(filtros.id_setor) ||
      Boolean(filtros.id_equipamento);

    if (!temFiltro) {
      const todos = pzems.map((p) => Number(p.id)).filter(Boolean);
      return [...new Set(todos)];
    }

    const pzemsFiltrados = pzems.filter((pzem) => {
      const ponto = pontosMedicao.find((item) => Number(item.id) === Number(pzem.id_ponto_medicao)) || pzem;
      const equip = equipamentos.find(
        (e) => Number(e.id_equipamento || e.id) === Number(ponto.id_equipamento)
      );
      const idSetorPonto = ponto.id_setor ?? equip?.id_setor ?? null;
      const setor = setores.find(
        (s) => Number(s.id_setor || s.id) === Number(idSetorPonto)
      );
      const idLocalPonto =
        ponto.id_local ?? equip?.id_local ?? setor?.id_local ?? null;

      if (
        filtros.id_equipamento &&
        String(ponto.id_equipamento) !== String(filtros.id_equipamento)
      ) {
        return false;
      }

      if (filtros.id_setor && String(idSetorPonto) !== String(filtros.id_setor)) {
        return false;
      }

      if (filtros.id_local && String(idLocalPonto) !== String(filtros.id_local)) {
        return false;
      }

      return true;
    });

    return [
      ...new Set(pzemsFiltrados.map((p) => Number(p.id)).filter(Boolean)),
    ];
  }, [
    filtros.id_local,
    filtros.id_setor,
    filtros.id_equipamento,
    pontosMedicao,
    pzems,
    equipamentos,
    setores,
  ]);

  // 3. Busca série temporal das medições a cada 5s
  useEffect(() => {
    let ativo = true;

    async function carregarMedicoes() {
      if (idsPzemFiltrados.length === 0) {
        if (!ativo) return;
        setDadosMedicoes([]);
        setErro('');
        setCarregando(false);
        return;
      }

      try {
        const horas = HORAS_POR_PERIODO[filtros.periodo] || 24;
        const respostas = await Promise.all(
          idsPzemFiltrados.map((idPzem) =>
            api
              .get('/medicoes/serie-temporal', {
                params: { id_pzem: idPzem, horas },
              })
              .catch(() => ({ data: { dados: [] } }))
          )
        );

        if (!ativo) return;

        const ordenados = respostas
          .flatMap((res) => extrairLista(res))
          .filter((item) => converterData(item.data_hora))
          .sort(
            (a, b) =>
              converterData(a.data_hora).getTime() -
              converterData(b.data_hora).getTime()
          );

        setDadosMedicoes(ordenados);
        const ultimaMedicao = ordenados.at(-1);
        if (ultimaMedicao) {
          const pzemAtual = pzems.find((item) => Number(item.id) === Number(ultimaMedicao.id_pzem));
          const pontoAtual = pontosMedicao.find(
            (item) => Number(item.id) === Number(pzemAtual?.id_ponto_medicao ?? ultimaMedicao.id_ponto_medicao)
          );
          const equipamentoAtual = equipamentos.find(
            (item) => Number(item.id_equipamento ?? item.id) === Number(pontoAtual?.id_equipamento)
          );
          const setorAtual = setores.find(
            (item) => Number(item.id_setor ?? item.id) === Number(pontoAtual?.id_setor ?? equipamentoAtual?.id_setor)
          );
          void verificarMedicaoECriarAlarme(ultimaMedicao, {
            id_dispositivo_iot: pontoAtual?.id_dispositivo_iot,
            id_equipamento: pontoAtual?.id_equipamento,
            id_setor: pontoAtual?.id_setor ?? equipamentoAtual?.id_setor,
            id_local: pontoAtual?.id_local ?? setorAtual?.id_local,
          });
        }
        setErro('');
      } catch (error) {
        console.error('Erro ao carregar medições:', error);
        if (ativo) setErro('Não foi possível carregar as medições.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    setCarregando(true);
    carregarMedicoes();
    const intervalo = setInterval(carregarMedicoes, 5000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [filtros.periodo, idsPzemFiltrados]);

  // 4. Filtra janela exata para "Hoje" ou "Ontem"
  const dadosFiltradosPeriodo = useMemo(() => {
    if (!['Hoje', 'Ontem'].includes(filtros.periodo)) return dadosMedicoes;

    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    if (filtros.periodo === 'Ontem') inicio.setDate(inicio.getDate() - 1);

    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 1);

    return dadosMedicoes.filter((item) => {
      const data = converterData(item.data_hora);
      return data && data >= inicio && data < fim;
    });
  }, [dadosMedicoes, filtros.periodo]);

  // 5. Calcula métricas dos cards de acordo com a grandeza e período selecionados
  const metricas = useMemo(() => {
    const cfg = CONFIG_GRANDEZA[filtros.grandeza] || CONFIG_GRANDEZA.Tensão;
    const valores = dadosFiltradosPeriodo
      .map((item) => Number(item[cfg.campo]))
      .filter(Number.isFinite);

    if (valores.length === 0) {
      return {
        mediaPeriodo: '0.0',
        valorMaximo: '0.0',
        valorAtual: '0.0',
        unidade: cfg.unidade,
        label: cfg.label,
      };
    }

    const soma = valores.reduce((acc, v) => acc + v, 0);
    const casas = filtros.grandeza === 'Energia' ? 2 : 1;

    return {
      mediaPeriodo: (soma / valores.length).toFixed(casas),
      valorMaximo: Math.max(...valores).toFixed(casas),
      valorAtual: valores[valores.length - 1].toFixed(casas),
      unidade: cfg.unidade,
      label: cfg.label,
    };
  }, [dadosFiltradosPeriodo, filtros.grandeza]);

  // 6. Formata linhas da tabela de dados brutos
  const dadosBrutos = useMemo(() => {
    return [...dadosFiltradosPeriodo]
      .reverse()
      .map((item) => {
        const dataHora = converterData(item.data_hora);
        return {
          data: dataHora.toLocaleDateString('pt-BR'),
          hora: dataHora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          tensao: item.tensao ?? '—',
          corrente: item.corrente ?? '—',
          potencia: item.potencia_ativa ?? item.potencia ?? '—',
          energia: item.energia_acumulada ?? item.energia ?? '—',
          data_hora: item.data_hora,
        };
      });
  }, [dadosFiltradosPeriodo]);

  return (
    <main className="min-h-screen space-y-6 bg-transparent p-4 text-slate-200 md:p-6">
      <div className="mb-5">
        <FiltrosMedicao
          locais={locais}
          setores={setores}
          equipamentos={equipamentos}
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onDefinirMeta={() => setModalAberto(true)}
          onAbrirPontos={() => setPontosModalAberto(true)}
        />
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardMedicao
          titulo="Média do Período"
          valor={metricas.mediaPeriodo}
          unidade={metricas.unidade}
          descricao={`Média de ${metricas.label}`}
          icone={Zap}
          cor="blue"
        />

        <CardMedicao
          titulo="Valor Máximo"
          valor={metricas.valorMaximo}
          unidade={metricas.unidade}
          descricao={`Maior ${metricas.label} registrada`}
          icone={Activity}
          cor="green"
        />

        <CardMedicao
          titulo="Valor Atual"
          valor={metricas.valorAtual}
          unidade={metricas.unidade}
          descricao={`Última leitura de ${metricas.label}`}
          icone={TrendingUp}
          cor="teal"
        />

        <CardMetaMedicao onDefinirMeta={() => setModalAberto(true)} />
      </section>

      {erro && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <section className="mt-6 min-w-0 overflow-hidden">
        <TensaoAoLongoDoTempo
          dados={dadosFiltradosPeriodo}
          grandeza={filtros.grandeza}
          periodo={filtros.periodo}
          carregando={carregando}
        />
      </section>

      <section className="mt-6">
        <DadosBrutosModal
          dados={dadosBrutos}
          totalRegistos={dadosBrutos.length}
          carregando={carregando}
        />
      </section>

      {modalAberto && (
        <MedicoesAlarmesModal onClose={() => setModalAberto(false)} />
      )}

      {pontosModalAberto && (
        <PontosMedicaoModal onClose={() => setPontosModalAberto(false)} />
      )}
    </main>
  );
}
