import { X } from 'lucide-react';
import PontosMedicao from '../configuracoes/pontosMedicao.jsx';

export default function PontosMedicaoModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#050812]/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pontos-medicao-modal-title"
        className="wv-pontos-modal flex max-h-[94vh] min-h-[460px] w-full max-w-[1000px] flex-col overflow-hidden rounded-[20px] border border-[#26354B] bg-[#0D1523] text-[#C0C5C8] shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#17315F55] px-5 py-4 sm:px-6">
          <div>
            <h2 id="pontos-medicao-modal-title" className="text-base font-semibold sm:text-[17px]">
              Pontos de Medição
            </h2>
            <p className="mt-1 text-xs text-[#8F9AA8]">
              Cadastre e organize os pontos usados para receber medições.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pontos de medição"
            className="rounded-lg p-2 text-[#7D8998] transition hover:bg-[#172235] hover:text-white"
          >
            <X size={17} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <PontosMedicao compacto />
        </div>
      </section>
    </div>
  );
}
