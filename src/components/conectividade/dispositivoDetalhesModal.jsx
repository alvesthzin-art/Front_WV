import React from 'react';
import { X, Pencil, Clock } from 'lucide-react';

function DispositivoDetalhesModal({ dispositivo, onClose, onEditar }) {
  if (!dispositivo) return null;

  const telemetria = [
    { label: 'Tensão', valor: '220,4 V' },
    { label: 'Corrente', valor: '8,7 A' },
    { label: 'Potência Ativa', valor: '1.820 W' },
    { label: 'Energia Acumulada', valor: '84,2 kWh' },
    { label: 'Frequência', valor: '59,9 Hz' },
    { label: 'Fator de Potência', valor: '0,94 FP' },
  ];

  const eventos = [
    { tipo: 'Conectado', horario: 'Hoje, 14:32:08', duracao: 'Disponível', ok: true },
    { tipo: 'Queda de Conexão', horario: 'Hoje, 14:23:51', duracao: '2min 14s', ok: false },
    { tipo: 'Conectado', horario: 'Hoje, 10:05:22', duracao: '4h 16min', ok: true },
    { tipo: 'Queda de Conexão', horario: 'Ontem, 18:42:10', duracao: '38s', ok: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0C141F] border border-[#17315F] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-[#17315F]/40">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {dispositivo.id} — {dispositivo.nome || 'Medidor Bloco A'}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#102520] text-[#2A8246] border border-[#2A8246]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A8246]" />
                {dispositivo.status}
              </span>
            </div>
            <p className="text-xs text-[#9ca1a6] mt-1">
              {dispositivo.setor || 'Elétrica'} / {dispositivo.local || 'Planta Industrial Osasco'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onClose();
                onEditar(dispositivo);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2C57A8] hover:bg-[#3566C2] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              Editar Dispositivo
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#17315F] text-[#9ca1a6] hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-[#070A15]/70 border border-[#17315F]/40">
              <h3 className="text-sm font-bold text-white mb-4">Informações Gerais</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-[#4A525B] block">Nome do Dispositivo</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">
                    {dispositivo.nome || 'Medidor Bloco A'}
                  </span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Modelo do dispositivo</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">{dispositivo.modelo}</span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Número de Série</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">
                    {dispositivo.numeroSerie || 'WV-ESP-0001'}
                  </span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Ponto de Medição</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">PZEM-004T · PZEM-A1B2C3</span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">MAC Address</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">
                    {dispositivo.macAddress || '24:6F:28:A1:0B:01'}
                  </span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Versão de Firmware</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">
                    {dispositivo.firmware || '1.2.4'}
                  </span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Data de Instalação</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">11/03/2026</span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Intervalo de Transmissão</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">5s</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#17315F]/40 text-xs">
                <span className="text-[#4A525B] block">Vínculo Hierárquico</span>
                <span className="text-[#C0C5C8] font-semibold mt-0.5 block">
                  {dispositivo.local || 'Planta Industrial Osasco'}
                </span>
                <span className="text-[#9ca1a6] mt-0.5 block">
                  {dispositivo.setor || 'Elétrica'} › {dispositivo.relacionadoNome}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#070A15]/70 border border-[#17315F]/40">
              <h3 className="text-sm font-bold text-white mb-3">Conexão Wi-Fi</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#4A525B] block">Nome da rede (SSID)</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">WattVision-IoT</span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Endereço IP</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">192.168.1.42</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#070A15]/70 border border-[#17315F]/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Configurações MQTT</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#17315F]/60 text-[#60A5FA]">
                  Configuração atual de teste
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-[#4A525B] block">Endereço do Broker</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">broker.hivemq.com</span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Porta</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">1883</span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Tópico</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">wattvision/medicoes</span>
                </div>
                <div>
                  <span className="text-[#4A525B] block">Client ID</span>
                  <span className="text-[#C0C5C8] font-semibold mt-0.5 block">wattvision-esp32-</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-[#070A15]/70 border border-[#17315F]/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Telemetria do Sensor PZEM-004T</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#17315F]/50 text-[#60A5FA]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
                  Ao Vivo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {telemetria.map((item) => (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-xl bg-[#0C141F] border border-[#17315F]/40"
                  >
                    <span className="text-xs text-[#9ca1a6] block">{item.label}</span>
                    <span className="text-lg font-bold text-white mt-1 block">{item.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#070A15]/70 border border-[#17315F]/40">
              <h3 className="text-sm font-bold text-white mb-4">Histórico de Conexão e Eventos</h3>
              <div className="divide-y divide-[#17315F]/30">
                {eventos.map((ev, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ev.ok ? 'bg-[#2A8246]' : 'bg-[#AFA183]'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#C0C5C8]">{ev.tipo}</p>
                        <p className="text-[11px] text-[#4A525B]">{ev.horario}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#9ca1a6]">{ev.duracao}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#17315F]/40">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#4A525B]">
            <Clock size={13} />
            Último contato: há 3 segundos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#17315F] text-xs font-semibold text-[#C0C5C8] hover:bg-[#17315F]/40 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DispositivoDetalhesModal;