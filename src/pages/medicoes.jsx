import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';

import FiltrosMedicao from '../components/medicoes/filtrosMedicao';
import MedicoesAlarmesModal from '../components/medicoes/medicoesAlarmesModal';
import CardMedicao from '../components/medicoes/cardMedicao';
import CardMetaMedicao from '../components/medicoes/cardMetaMedicao';
import TensaoAoLongoDoTempo from '../components/medicoes/tensaoAoLongoDoTempo';
import DadosBrutosModal from '../components/medicoes/dadosBrutos';
import api from '../services/api'; // Importa a nossa instância configurada do Axios

export default function Medicao() {
  const [modalAberto, setModalAberto] = useState(false);
  const [dadosMedicoes, setDadosMedicoes] = useState([]);
  const [metricas, setMetricas] = useState({
    mediaPeriodo: '0.0',
    valorMaximo: '0.0',
    valorAtual: '0.0'
  });

  // Função para buscar dados reais da API com polling de 5 segundos
  useEffect(() => {
    async function carregarMedicoesReais() {
      try {
        // Busca a série temporal de medições do PZEM (ajuste o id_pzem ou parâmetros conforme sua API)
        const resMedicoes = await api.get('/api/medicoes/serie-temporal', { 
          params: { id_pzem: 1, horas: 24 } 
        }).catch(() => ({ data: { dados: [] } }));

        const ultimosDados = resMedicoes.data?.dados || (Array.isArray(resMedicoes.data) ? resMedicoes.data : []);

        if (ultimosDados.length > 0) {
          setDadosMedicoes(ultimosDados);

          // Pega a leitura mais recente (último elemento)
          const ultimaLeitura = ultimosDados[ultimosDados.length - 1];

          // Calcula a média de tensão do período ou usa o valor atual
          const somaTensao = ultimosDados.reduce((acc, curr) => acc + Number(curr.tensao || 0), 0);
          const mediaTensao = (somaTensao / ultimosDados.length).toFixed(1);

          // Pega o valor máximo de corrente ou potência
          const maxCorrente = Math.max(...ultimosDados.map(curr => Number(curr.corrente || 0))).toFixed(1);
          const potenciaAtual = Number(ultimaLeitura.potencia_ativa || ultimaLeitura.potencia || 0).toFixed(2);

          setMetricas({
            mediaPeriodo: mediaTensao,
            valorMaximo: maxCorrente,
            valorAtual: potenciaAtual
          });
        }
      } catch (error) {
        console.error("Erro ao carregar medições em tempo real:", error);
      }
    }

    carregarMedicoesReais();
    const intervalo = setInterval(carregarMedicoesReais, 5000); // Polling a cada 5 segundos

    return () => clearInterval(intervalo);
  }, []);

  return (
    <main className="space-y-6 p-4 md:p-6 text-slate-200 min-h-screen bg-transparent">
      {/* Filtros de Medição */}
      <div className="mb-5">
        <FiltrosMedicao
          onDefinirMeta={() => setModalAberto(true)}
        />
      </div>
    
      {/* Cards de Métricas Dinâmicos */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardMedicao
          titulo="Média do Período"
          valor={metricas.mediaPeriodo}
          unidade="V"
          icone={Zap}
          cor="blue"
        />

        <CardMedicao
          titulo="Valor Máximo"
          valor={metricas.valorMaximo}
          unidade="A"
          icone={Activity}
          cor="green"
        />

        <CardMedicao
          titulo="Valor Atual"
          valor={metricas.valorAtual}
          unidade="kW"
          icone={TrendingUp}
          cor="teal"
        />

        <CardMetaMedicao
          onDefinirMeta={() => setModalAberto(true)}
        />
      </section>

      {/* Gráfico de tensão ao longo do tempo recebendo os dados reais */}
      <section className="mt-6">
        <TensaoAoLongoDoTempo dados={dadosMedicoes} />
      </section>

      {/* Dados brutos das medições recebendo os dados reais */}
      <section className="mt-6">
        <DadosBrutosModal dados={dadosMedicoes} />
      </section>

      {/* Modal de medições, alarmes e gerenciamento de limites */}
      {modalAberto && (
        <MedicoesAlarmesModal
          onClose={() => setModalAberto(false)}
        />
      )}
    </main>
  );
}