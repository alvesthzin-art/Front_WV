
import React, { useEffect, useState } from 'react';
import {
  X,
  Settings,
  Zap,
  Users,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react';

const tabs = [
  { id: 'geral', label: 'Geral', icon: Settings },
  { id: 'tarifas', label: 'Tarifas', icon: Zap },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'pontos', label: 'Pontos de medição', icon: MapPin },
];

export function ConfiguracoesSistemaModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('geral');

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-modal-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#17315F66] bg-[#0C141F] text-[#C0C5C8] shadow-2xl"
      >
        {/* Cabeçalho */}
        <header className="flex items-center justify-between border-b border-[#17315F44] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#17315F66] bg-[#111622] p-2.5">
              <Settings size={20} className="text-[#5A8F97]" />
            </div>

            <div>
              <h2
                id="config-modal-title"
                className="text-lg font-semibold text-[#C0C5C8]"
              >
                Configurações do sistema
              </h2>
              <p className="mt-1 text-sm text-[#9ca1a6]">
                Gerencie as preferências do Watt Vision
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            title="Fechar"
            className="rounded-lg border border-transparent p-2 text-[#9ca1a6] transition-colors hover:border-[#17315F66] hover:bg-[#111622] hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        {/* Abas */}
        <div className="flex gap-1 overflow-x-auto border-b border-[#17315F44] px-4 pt-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm transition-colors ${
                  selected
                    ? 'border-[#5A8F97] bg-[#111622] text-white'
                    : 'border-transparent text-[#9ca1a6] hover:bg-[#111622] hover:text-[#C0C5C8]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        <div className="min-h-[260px] flex-1 overflow-y-auto p-6">
          {activeTab === 'geral' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[#C0C5C8]">
                  Preferências gerais
                </h3>
                <p className="mt-1 text-sm text-[#9ca1a6]">
                  Configure as preferências básicas da plataforma.
                </p>
              </div>

              <div className="rounded-xl border border-[#17315F44] bg-[#070A15] p-4">
                <div className="flex items-start gap-3">
                  <SlidersHorizontal
                    size={18}
                    className="mt-0.5 text-[#5A8F97]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#C0C5C8]">
                      Interface do sistema
                    </p>
                    <p className="mt-1 text-sm text-[#9ca1a6]">
                      O Watt Vision está utilizando o tema escuro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#17315F44] bg-[#070A15] p-4">
                <p className="text-sm font-medium text-[#C0C5C8]">
                  Monitoramento energético
                </p>
                <p className="mt-1 text-sm text-[#9ca1a6]">
                  Consulte o dashboard para acompanhar os indicadores
                  e o desempenho energético.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tarifas' && (
            <div>
              <h3 className="text-base font-semibold text-[#C0C5C8]">
                Tarifas de energia
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#9ca1a6]">
                A área de tarifas está preparada para receber os valores
                de energia, as modalidades tarifárias e as respectivas
                configurações.
              </p>
              <p className="mt-3 text-xs text-[#4A525B]">
                Nenhuma tarifa é alterada por este protótipo.
              </p>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div>
              <h3 className="text-base font-semibold text-[#C0C5C8]">
                Usuários e permissões
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#9ca1a6]">
                Esta área poderá reunir os usuários cadastrados,
                seus perfis de acesso e suas permissões no sistema.
              </p>
            </div>
          )}

          {activeTab === 'pontos' && (
            <div>
              <h3 className="text-base font-semibold text-[#C0C5C8]">
                Pontos de medição
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#9ca1a6]">
                Esta área poderá exibir os pontos de medição,
                os equipamentos associados e o estado de comunicação.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <footer className="flex justify-end border-t border-[#17315F44] bg-[#0C141F] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#17315F66] bg-[#111622] px-5 py-2.5 text-sm font-medium text-[#C0C5C8] transition-colors hover:bg-[#17315F]"
          >
            Fechar
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ConfiguracoesSistemaModal;
