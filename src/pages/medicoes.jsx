
import React, { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';

import FiltrosMedicao from '../components/medicoes/filtrosMedicao';
import MedicoesAlarmesModal from '../components/medicoes/medicoesAlarmesModal';
import CardMedicao from '../components/medicoes/cardMedicao';
import CardMetaMedicao from '../components/medicoes/cardMetaMedicao';
import TensaoAoLongoDoTempo from '../components/medicoes/tensaoAoLongoDoTempo';
import DadosBrutosModal from '../components/medicoes/dadosBrutos';
import api from '../services/api';

const HORAS_POR_PERIODO = {
  Hoje: 24,
  Ontem: 48,
  'Últimos 7 dias': 168,
  'Últimos 30 dias': 720,
};

// Janela móvel do gráfico: últimos 60 segundos.
const JANELA_GRAFICO_MS = 60 * 1000;

function converterData(data) {
  if (!data) return null;

  const valor = String(data).replace(' ', 'T');
  const dataConvertida = new Date(valor);

  return Number.isNaN(dataConvertida.getTime())
    ? null
    : dataConvertida;
}

export default function Medicao() {
  const [modalAberto, setModalAberto] = useState(false);
  const [dadosMedicoes, setDadosMedicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Relógio usado somente para movimentar a janela do gráfico.
  const [agoraGrafico, setAgoraGrafico] = useState(Date.now());

  const [filtros, setFiltros] = useState({
    local: 'Todos os locais',
    setor: 'Todos os setores',
    equipamento: 'Todos',
    periodo: 'Hoje',
    grandeza: 'Tensão',
  });

  const [metricas, setMetricas] = useState({
    mediaPeriodo: '0.0',
    valorMaximo: '0.0',
    valorAtual: '0.0',
  });

  // Atualiza o relógio a cada segundo para movimentar o eixo X.
  useEffect(() => {
    const intervaloRelogio = setInterval(() => {
      setAgoraGrafico(Date.now());
    }, 1000);

    return () => clearInterval(intervaloRelogio);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarMedicoesReais() {
      try {
        const horas = HORAS_POR_PERIODO[filtros.periodo] || 24;

        const resposta = await api.get('/medicoes/serie-temporal', {
          params: {
            id_pzem: 1,
            horas,
          },
        });

        const registros =
          resposta.data?.dados ??
          (Array.isArray(resposta.data) ? resposta.data : []);

        if (!ativo) return;

        const dadosOrdenados = [...registros]
          .filter((item) => converterData(item.data_hora))
          .sort(
            (a, b) =>
              converterData(a.data_hora).getTime() -
              converterData(b.data_hora).getTime()
          );

        setDadosMedicoes(dadosOrdenados);
        setErro('');

        if (dadosOrdenados.length > 0) {
          const ultimaLeitura = dadosOrdenados[dadosOrdenados.length - 1];

          const tensoes = dadosOrdenados
            .map((item) => Number(item.tensao))
            .filter(Number.isFinite);

          const correntes = dadosOrdenados
            .map((item) => Number(item.corrente))
            .filter(Number.isFinite);

          const mediaTensao = tensoes.length
            ? (
                tensoes.reduce((soma, valor) => soma + valor, 0) /
                tensoes.length
              ).toFixed(1)
            : '0.0';

          const maxCorrente = correntes.length
            ? Math.max(...correntes).toFixed(1)
            : '0.0';

          const potenciaAtual = Number(
            ultimaLeitura.potencia_ativa ??
            ultimaLeitura.potencia ??
            0
          ).toFixed(2);

          setMetricas({
            mediaPeriodo: mediaTensao,
            valorMaximo: maxCorrente,
            valorAtual: potenciaAtual,
          });
        } else {
          setMetricas({
            mediaPeriodo: '0.0',
            valorMaximo: '0.0',
            valorAtual: '0.0',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar medições:', error);

        if (ativo) {
          setErro('Não foi possível carregar as medições.');
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    setCarregando(true);
    carregarMedicoesReais();

    const intervalo = setInterval(carregarMedicoesReais, 5000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [filtros.periodo]);

  // Dados exclusivos do gráfico.
  // Quando o período é Hoje, mostra somente os últimos 60 segundos.
  // Nos outros períodos, mantém o histórico selecionado.
  const dadosGrafico = useMemo(() => {
    if (filtros.periodo !== 'Hoje') {
      return dadosMedicoes;
    }

    const inicioJanela = agoraGrafico - JANELA_GRAFICO_MS;

    return dadosMedicoes.filter((item) => {
      const data = converterData(item.data_hora);

      if (!data) return false;

      const tempo = data.getTime();

      return tempo >= inicioJanela && tempo <= agoraGrafico;
    });
  }, [dadosMedicoes, filtros.periodo, agoraGrafico]);

  // A tabela continua recebendo o histórico completo.
  const dadosBrutos = useMemo(() => {
    return [...dadosMedicoes]
      .sort(
        (a, b) =>
          converterData(b.data_hora).getTime() -
          converterData(a.data_hora).getTime()
      )
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
  }, [dadosMedicoes]);

  return (
    <main className="min-h-screen space-y-6 bg-transparent p-4 text-slate-200 md:p-6">
      <div className="mb-5">
        <FiltrosMedicao
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onDefinirMeta={() => setModalAberto(true)}
        />
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardMedicao
          titulo="Média do Período"
          valor={metricas.mediaPeriodo}
          unidade="V"
          descricao="Média de tensão"
          icone={Zap}
          cor="blue"
        />

        <CardMedicao
          titulo="Valor Máximo"
          valor={metricas.valorMaximo}
          unidade="A"
          descricao="Maior corrente registrada"
          icone={Activity}
          cor="green"
        />

        <CardMedicao
          titulo="Valor Atual"
          valor={metricas.valorAtual}
          unidade="W"
          descricao="Potência ativa"
          icone={TrendingUp}
          cor="teal"
        />

        <CardMetaMedicao
          onDefinirMeta={() => setModalAberto(true)}
        />
      </section>

      {erro && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <section className="mt-6 min-w-0 overflow-hidden">
        <TensaoAoLongoDoTempo
          dados={dadosGrafico}
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
        <MedicoesAlarmesModal
          onClose={() => setModalAberto(false)}
        />
      )}
    </main>
  );
}
