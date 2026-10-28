import React, { useState } from 'react';
import { Activity,TrendingUp, Zap } from 'lucide-react';

import FiltrosMedicao from '../components/medicoes/filtrosMedicao';
import MedicoesAlarmesModal from '../components/medicoes/medicoesAlarmesModal';
import CardMedicao from '../components/medicoes/cardMedicao';
import CardMetaMedicao from '../components/medicoes/cardMetaMedicao';
import TensaoAoLongoDoTempo from '../components/medicoes/tensaoAoLongoDoTempo';
import DadosBrutosModal from '../components/medicoes/dadosBrutos';

function Medicao() {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <main className="min-h-screen bg-[#070A15] p-6 text-slate-200 md:p-8">
      <div className="mb-5">
        <FiltrosMedicao
          onDefinirMeta={() => setModalAberto(true)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardMedicao
          titulo="Media do Período"
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
      </div>



      {/* Modal de medições, alarmes e gerenciamento de limites */}
      {modalAberto && (
        <MedicoesAlarmesModal
          onClose={() => setModalAberto(false)}
        />
      )}

      {/* Gráfico de tensão ao longo do tempo */}
      <section className="mt-6">
        <TensaoAoLongoDoTempo />
      </section>

      {/* Dados brutos das medições */}
      <section className="mt-6">
        <DadosBrutosModal />
      </section>
    </main>
  );
}

export default Medicao;