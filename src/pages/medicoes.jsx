
import React, { useState } from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';

import FiltrosMedicao from '../components/medicoes/filtrosMedicao';
import MedicoesAlarmesModal from '../components/medicoes/medicoesAlarmesModal';
import CardMedicao from '../components/medicoes/cardMedicao';
import CardMetaMedicao from '../components/medicoes/cardMetaMedicao';
//
function Medicao() {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <main className="min-h-screen bg-[#070A15] p-6 text-slate-200 md:p-8">
      <div className="mb-5">
        <FiltrosMedicao
          onDefinirMeta={() => setModalAberto(true)}
        />
      </div>
    
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CardMedicao
          titulo="Média do Período"
          valor="218,8"
          unidade="V"
          icone={Activity}
          cor="blue"
        />

        <CardMedicao
          titulo="Valor Máximo"
          valor="227,7"
          unidade="V"
          icone={TrendingUp}
          cor="teal"
        />

        <CardMedicao
          titulo="Valor Atual"
          valor="218,9"
          unidade="V"
          icone={Zap}
          cor="green"
        />

        <CardMetaMedicao
          onDefinirMeta={() => setModalAberto(true)}
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

export default Medicao;
