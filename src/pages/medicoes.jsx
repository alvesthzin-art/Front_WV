import React, { useState } from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';

import FiltrosMedicao from '../components/medicoes/filtrosMedicao';
import MedicoesAlarmesModal from '../components/medicoes/medicoesAlarmesModal';
import CardMedicao from '../components/medicoes/cardMedicao';
import CardMetaMedicao from '../components/medicoes/cardMetaMedicao';
import TensaoAoLongoDoTempo from '../components/medicoes/tensaoAoLongoDoTempo';
import DadosBrutosModal from '../components/medicoes/dadosBrutos';

export default function Medicao() {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <main 
      className="space-y-6 p-4 md:p-6 rounded-2xl text-slate-200 min-h-screen"
      style={{
        background: 'linear-gradient(135deg, rgba(7, 10, 21, 0.4) 0%, rgba(11, 19, 43, 0.6) 50%, rgba(4, 6, 11, 0.4) 100%)'
      }}
    >
      {/* Filtros de Medição */}
      <div className="mb-5">
        <FiltrosMedicao
          onDefinirMeta={() => setModalAberto(true)}
        />
      </div>
    
      {/* Cards de Métricas */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardMedicao
          titulo="Média do Período"
          valor="220"
          unidade="V"
          icone={Zap}
          cor="blue"
        />

        <CardMedicao
          titulo="Valor Máximo"
          valor="15.4"
          unidade="A"
          icone={Activity}
          cor="green"
        />

        <CardMedicao
          titulo="Valor Atual"
          valor="3.4"
          unidade="kW"
          icone={TrendingUp}
          cor="teal"
        />

        <CardMetaMedicao
          onDefinirMeta={() => setModalAberto(true)}
        />
      </section>

      {/* Gráfico de tensão ao longo do tempo */}
      <section className="mt-6">
        <TensaoAoLongoDoTempo />
      </section>

      {/* Dados brutos das medições */}
      <section className="mt-6">
        <DadosBrutosModal />
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