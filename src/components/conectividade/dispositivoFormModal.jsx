import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TIPOS_ASSOCIACAO = ['Não associado', 'Local', 'Setor', 'Equipamento'];

function DispositivoFormModal({
  isOpen,
  onClose,
  dispositivoParaEditar,
  locais = [],
  setores = [],
  equipamentos = [],
  onSalvar,
}) {
  const isEdicao = Boolean(dispositivoParaEditar);

  const [form, setForm] = useState({
    nome: '',
    id: '',
    modelo: 'ESP32',
    numeroSerie: '',
    macAddress: '',
    firmware: '1.0.0',
    dataInstalacao: '',
    monitoradoPor: 'Não associado',
    id_local: '',
    local: '',
    id_setor: '',
    setor: '',
    id_equipamento: '',
    equipamento: '',
    ssid: '',
    ipEstatico: '',
    broker: 'broker.hivemq.com',
    porta: '1883',
    topico: 'wattvision/medicoes',
    clientId: '',
    intervalo: '5s',
  });

  useEffect(() => {
    if (dispositivoParaEditar) {
      setForm((prev) => ({
        ...prev,
        ...dispositivoParaEditar,
      }));
    } else {
      setForm({
        nome: '',
        id: '',
        modelo: 'ESP32',
        numeroSerie: '',
        macAddress: '',
        firmware: '1.0.0',
        dataInstalacao: '',
        monitoradoPor: 'Não associado',
        id_local: '',
        local: '',
        id_setor: '',
        setor: '',
        id_equipamento: '',
        equipamento: '',
        ssid: '',
        ipEstatico: '',
        broker: 'broker.hivemq.com',
        porta: '1883',
        topico: 'wattvision/medicoes',
        clientId: '',
        intervalo: '5s',
      });
    }
  }, [dispositivoParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(form);
    onClose();
  };

  const opcoesLocais =
    locais.length > 0
      ? locais
      : [
          { id_local: 1, nome: 'Planta Industrial Osasco' },
          { id_local: 2, nome: 'Planta Industrial Jandira' },
          { id_local: 3, nome: 'Subestação Central' },
        ];

  const opcoesSetores =
    setores.length > 0
      ? setores
      : [
          { id_setor: 1, nome: 'Elétrica' },
          { id_setor: 2, nome: 'HVAC' },
          { id_setor: 3, nome: 'Produção' },
        ];

  const opcoesEquipamentos =
    equipamentos.length > 0
      ? equipamentos
      : [
          { id_equipamento: 1, nome: 'Painel Elétrico PE-12' },
          { id_equipamento: 2, nome: 'Compressor HVAC-03' },
        ];

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-[#070A15] border border-[#17315F]/60 text-sm text-[#C0C5C8] placeholder-[#4A525B] focus:outline-none focus:border-[#2C57A8]';
  const labelClass = 'block text-xs font-medium text-[#C0C5C8] mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0C141F] border border-[#17315F] shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-[#17315F]/40">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEdicao ? 'Editar dispositivo' : 'Cadastrar dispositivo'}
            </h2>
            <p className="text-xs text-[#9ca1a6] mt-0.5">
              {isEdicao
                ? 'Atualize os parâmetros configuráveis do ponto de medição.'
                : 'Adicione um novo ponto de medição ao Watt Vision.'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#9ca1a6] hover:text-white p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#C0C5C8] mb-3">Identificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome do Dispositivo</label>
                <input
                  type="text"
                  placeholder="Medidor Bloco A"
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Identificação</label>
                <input
                  type="text"
                  placeholder="ESP32-005"
                  value={form.id}
                  onChange={(e) => handleChange('id', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Modelo</label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) => handleChange('modelo', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Número de Série</label>
                <input
                  type="text"
                  placeholder="WV-ESP-0005"
                  value={form.numeroSerie}
                  onChange={(e) => handleChange('numeroSerie', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>MAC Address</label>
                <input
                  type="text"
                  placeholder="24:6F:28:A1:0B:05"
                  value={form.macAddress}
                  onChange={(e) => handleChange('macAddress', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Versão de Firmware</label>
                <input
                  type="text"
                  value={form.firmware}
                  onChange={(e) => handleChange('firmware', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Data de Instalação</label>
                <input
                  type="date"
                  value={form.dataInstalacao}
                  onChange={(e) => handleChange('dataInstalacao', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#C0C5C8] mb-2">Associação do dispositivo</h3>
            <label className={labelClass}>Monitorado por</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-xl bg-[#070A15] border border-[#17315F]/50">
              {TIPOS_ASSOCIACAO.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleChange('monitoradoPor', tipo)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    form.monitoradoPor === tipo
                      ? 'bg-[#2C57A8] text-white'
                      : 'text-[#9ca1a6] hover:text-white'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {form.monitoradoPor !== 'Não associado' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={labelClass}>Local</label>
                  <select
                    value={form.local}
                    onChange={(e) => {
                      const selecionado = opcoesLocais.find((l) => (l.nome || l.nome_local) === e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        local: e.target.value,
                        id_local: selecionado?.id_local || selecionado?.id || '',
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="">Selecione um local...</option>
                    {opcoesLocais.map((l) => {
                      const nomeLocal = l.nome || l.nome_local;
                      return (
                        <option key={l.id_local || l.id || nomeLocal} value={nomeLocal}>
                          {nomeLocal}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {(form.monitoradoPor === 'Setor' || form.monitoradoPor === 'Equipamento') && (
                  <div>
                    <label className={labelClass}>Setor</label>
                    <select
                      value={form.setor}
                      onChange={(e) => {
                        const selecionado = opcoesSetores.find((s) => (s.nome || s.nome_setor) === e.target.value);
                        setForm((prev) => ({
                          ...prev,
                          setor: e.target.value,
                          id_setor: selecionado?.id_setor || selecionado?.id || '',
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Selecione um setor...</option>
                      {opcoesSetores.map((s) => {
                        const nomeSetor = s.nome || s.nome_setor;
                        return (
                          <option key={s.id_setor || s.id || nomeSetor} value={nomeSetor}>
                            {nomeSetor}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {form.monitoradoPor === 'Equipamento' && (
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Equipamento</label>
                    <select
                      value={form.equipamento}
                      onChange={(e) => {
                        const selecionado = opcoesEquipamentos.find(
                          (eq) => (eq.nome || eq.nome_equipamento) === e.target.value
                        );
                        setForm((prev) => ({
                          ...prev,
                          equipamento: e.target.value,
                          id_equipamento: selecionado?.id_equipamento || selecionado?.id || '',
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Selecione um equipamento...</option>
                      {opcoesEquipamentos.map((eq) => {
                        const nomeEq = eq.nome || eq.nome_equipamento;
                        return (
                          <option key={eq.id_equipamento || eq.id || nomeEq} value={nomeEq}>
                            {nomeEq}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] text-[#4A525B] mt-2">
              Cada dispositivo representa um único ponto de medição direto
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#C0C5C8] mb-3">Rede & MQTT</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>SSID da rede Wi-Fi</label>
                <input
                  type="text"
                  placeholder="WattVision-IoT"
                  value={form.ssid}
                  onChange={(e) => handleChange('ssid', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>IP estático (opcional)</label>
                <input
                  type="text"
                  placeholder="192.168.1.42"
                  value={form.ipEstatico}
                  onChange={(e) => handleChange('ipEstatico', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Endereço do Broker</label>
                <input
                  type="text"
                  value={form.broker}
                  onChange={(e) => handleChange('broker', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Porta</label>
                <input
                  type="text"
                  value={form.porta}
                  onChange={(e) => handleChange('porta', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Tópico</label>
                <input
                  type="text"
                  value={form.topico}
                  onChange={(e) => handleChange('topico', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Client ID</label>
                <input
                  type="text"
                  placeholder="wattvision-esp32"
                  value={form.clientId}
                  onChange={(e) => handleChange('clientId', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#C0C5C8] mb-3">Parâmetros</h3>
            <div>
              <label className={labelClass}>Intervalo de transmissão</label>
              <select
                value={form.intervalo}
                onChange={(e) => handleChange('intervalo', e.target.value)}
                className={inputClass}
              >
                <option value="5s">5 segundos</option>
                <option value="10s">10 segundos</option>
                <option value="30s">30 segundos</option>
                <option value="1m">1 minuto</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#17315F]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#17315F] text-sm font-semibold text-[#C0C5C8] hover:bg-[#17315F]/40 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2C57A8] hover:bg-[#3566C2] text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {isEdicao ? 'Salvar alterações' : 'Cadastrar dispositivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DispositivoFormModal;