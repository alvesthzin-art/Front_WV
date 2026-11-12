import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import ConectividadeKpiGrid from '../components/conectividade/conectividadeKpiGrid';
import ConectividadeTabela from '../components/conectividade/conectividadeTabela';
import DispositivoFormModal from '../components/conectividade/dispositivoFormModal';
import DispositivoDetalhesModal from '../components/conectividade/dispositivoDetalhesModal';

const FALLBACK_DISPOSITIVOS = [
  {
    id_dispositivo_iot: 1,
    id: 'ESP32-001',
    nome: 'Medidor Bloco A',
    modelo: 'ESP32',
    numeroSerie: 'WV-ESP-0001',
    macAddress: '24:6F:28:A1:0B:01',
    firmware: '1.2.4',
    dataInstalacao: '2026-03-11',
    intervalo: '5s',
    pontoAtivo: true,
    monitoradoPor: 'Equipamento',
    vinculoTipo: 'EQUIPAMENTO',
    relacionadoNome: 'Painel Elétrico PE-12',
    local: 'Planta Industrial Osasco',
    setor: 'Elétrica',
    equipamento: 'Painel Elétrico PE-12',
    ssid: 'WattVision-IoT',
    ipEstatico: '192.168.1.42',
    broker: 'broker.hivemq.com',
    porta: '1883',
    topico: 'wattvision/medicoes',
    clientId: 'wattvision-esp32-001',
    protocolo: 'MQTT',
    ultimoContato: '1min',
    status: 'Online',
  },
  {
    id_dispositivo_iot: 2,
    id: 'ESP32-002',
    nome: 'Medidor Setor Elétrica',
    modelo: 'ESP32',
    pontoAtivo: true,
    monitoradoPor: 'Setor',
    vinculoTipo: 'SETOR',
    relacionadoNome: 'Elétrica',
    local: 'Planta Industrial Osasco',
    setor: 'Elétrica',
    protocolo: 'MQTT',
    ultimoContato: '1min',
    status: 'Online',
  },
  {
    id_dispositivo_iot: 3,
    nome: 'Medidor Geral Jandira',
    id: 'ESP32-003',
    modelo: 'ESP32',
    pontoAtivo: false,
    monitoradoPor: 'Local',
    vinculoTipo: 'LOCAL',
    relacionadoNome: 'Planta Industrial Jandira',
    local: 'Planta Industrial Jandira',
    setor: '',
    protocolo: 'MQTT',
    ultimoContato: '1min',
    status: 'Online',
  },
  {
    id_dispositivo_iot: 4,
    id: 'ESP32-004',
    nome: 'Módulo Reserva',
    modelo: 'ESP32',
    pontoAtivo: false,
    monitoradoPor: 'Não associado',
    vinculoTipo: 'NÃO ASSOCIADO',
    relacionadoNome: '— Não associado',
    local: '',
    setor: '',
    protocolo: 'MQTT',
    ultimoContato: '1min',
    status: 'Disponível',
  },
  {
    id_dispositivo_iot: 5,
    id: 'ESP32-005',
    nome: 'Medidor Subestação',
    modelo: 'ESP32',
    pontoAtivo: true,
    monitoradoPor: 'Local',
    vinculoTipo: 'LOCAL',
    relacionadoNome: 'Subestação Central',
    local: 'Subestação Central',
    setor: '',
    protocolo: 'MQTT',
    ultimoContato: '1min',
    status: 'Online',
  },
];

const FALLBACK_EVENTOS = [
  { id: 1, dispositivo: 'ESP32-019', subtitulo: '', evento: 'Desconectado', dataHora: '12/11 05:40', relativo: 'há 3h', duracao: '—' },
  { id: 2, dispositivo: 'ESP32-030', subtitulo: '', evento: 'Desconectado', dataHora: '12/11 03:40', relativo: 'há 5h', duracao: '—' },
  { id: 3, dispositivo: 'ESP32-040', subtitulo: '', evento: 'Desconectado', dataHora: '12/11 06:40', relativo: 'há 2h', duracao: '—' },
  { id: 4, dispositivo: 'ESP32-007', subtitulo: '', evento: 'Desconectado', dataHora: '12/11 08:32', relativo: 'há 8min', duracao: '—' },
  { id: 5, dispositivo: 'ESP32-015', subtitulo: '', evento: 'Desconectado', dataHora: '12/11 08:25', relativo: 'há 15min', duracao: '—' },
  { id: 6, dispositivo: 'ESP32-001', subtitulo: 'Painel Elétrico PE-12', evento: 'Reconectado', dataHora: '12/11 07:40', relativo: 'há 1h', duracao: '4min 12s' },
  { id: 7, dispositivo: 'ESP32-001', subtitulo: 'Painel Elétrico PE-12', evento: 'Desconectado', dataHora: '12/11 07:40', relativo: 'há 1h', duracao: '—' },
  { id: 8, dispositivo: 'ESP32-007', subtitulo: '', evento: 'Reconectado', dataHora: '12/11 06:40', relativo: 'há 2h', duracao: '7min 38s' },
  { id: 9, dispositivo: 'ESP32-007', subtitulo: '', evento: 'Desconectado', dataHora: '12/11 06:40', relativo: 'há 2h', duracao: '—' },
  { id: 10, dispositivo: 'ESP32-012', subtitulo: '', evento: 'Reconectado', dataHora: '12/11 05:40', relativo: 'há 3h', duracao: '2min 05s' },
];

// Normaliza o payload vindo do backend para o formato esperado pelos componentes visuais
function normalizarDispositivoApi(raw) {
  const tipoVinculo = raw.id_equipamento
    ? 'EQUIPAMENTO'
    : raw.id_setor
      ? 'SETOR'
      : raw.id_local
        ? 'LOCAL'
        : (raw.vinculoTipo || 'NÃO ASSOCIADO');

  const nomeVinculo =
    raw.nome_equipamento ||
    raw.nome_setor ||
    raw.nome_local ||
    raw.relacionadoNome ||
    '— Não associado';

  const statusNormalizado =
    raw.status === 'online' || raw.status === 'Online'
      ? 'Online'
      : raw.status === 'instavel' || raw.status === 'Instável'
        ? 'Instável'
        : raw.status === 'offline' || raw.status === 'Offline'
          ? 'Offline'
          : raw.status || 'Disponível';

  return {
    ...raw,
    id_dispositivo_iot: raw.id_dispositivo_iot || raw.id,
    id: raw.codigo_identificacao || raw.identificacao || `ESP32-${String(raw.id_dispositivo_iot || raw.id).padStart(3, '0')}`,
    nome: raw.nome || raw.nome_dispositivo || 'Dispositivo IoT',
    modelo: raw.modelo || 'ESP32',
    numeroSerie: raw.numero_serie || raw.numeroSerie || '—',
    macAddress: raw.mac_address || raw.macAddress || '—',
    firmware: raw.versao_firmware || raw.firmware || '1.0.0',
    dataInstalacao: raw.data_instalacao || raw.dataInstalacao || '',
    intervalo: raw.intervalo_transmissao ? `${raw.intervalo_transmissao}s` : raw.intervalo || '5s',
    pontoAtivo: Boolean(raw.ativo ?? raw.pontoAtivo ?? tipoVinculo !== 'NÃO ASSOCIADO'),
    monitoradoPor:
      tipoVinculo === 'EQUIPAMENTO'
        ? 'Equipamento'
        : tipoVinculo === 'SETOR'
          ? 'Setor'
          : tipoVinculo === 'LOCAL'
            ? 'Local'
            : 'Não associado',
    vinculoTipo: tipoVinculo,
    relacionadoNome: nomeVinculo,
    local: raw.nome_local || raw.local || '',
    setor: raw.nome_setor || raw.setor || '',
    equipamento: raw.nome_equipamento || raw.equipamento || '',
    ssid: raw.ssid_wifi || raw.ssid || 'WattVision-IoT',
    ipEstatico: raw.ip_estatico || raw.ipEstatico || '',
    broker: raw.broker_mqtt || raw.broker || 'broker.hivemq.com',
    porta: String(raw.porta_mqtt || raw.porta || '1883'),
    topico: raw.topico_mqtt || raw.topico || 'wattvision/medicoes',
    clientId: raw.client_id_mqtt || raw.clientId || '',
    protocolo: raw.protocolo || 'MQTT',
    ultimoContato: raw.ultimo_contato || raw.ultimoContato || '1min',
    status: statusNormalizado,
  };
}

function Conectividade() {
  const [dispositivos, setDispositivos] = useState(FALLBACK_DISPOSITIVOS);
  const [eventosHistorico, setEventosHistorico] = useState(FALLBACK_EVENTOS);
  const [locais, setLocais] = useState([]);
  const [setores, setSetores] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [configuracaoGlobal, setConfiguracaoGlobal] = useState({
    offline: 5,
    instavel: 2,
    reconexaoEstavel: 3,
    alarmeOffline: true,
    alarmeReconectar: false,
    registrarHistorico: true,
  });

  const [loading, setLoading] = useState(true);
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [dispositivoEditando, setDispositivoEditando] = useState(null);
  const [dispositivoDetalhes, setDispositivoDetalhes] = useState(null);

  // Busca paralela seguindo o padrão de Dashboard.jsx e Alarmes.jsx
  const carregarDadosConectividade = async () => {
    try {
      const [resDispositivos, resLocais, resSetores, resEquipamentos, resAlertas] = await Promise.all([
        api.get('/dispositivos').catch(() => api.get('/dispositivos-iot').catch(() => ({ data: [] }))),
        api.get('/locais').catch(() => ({ data: [] })),
        api.get('/setores').catch(() => ({ data: [] })),
        api.get('/equipamentos').catch(() => ({ data: [] })),
        api.get('/alertas').catch(() => ({ data: [] })),
      ]);

      const listaDispositivos = Array.isArray(resDispositivos.data)
        ? resDispositivos.data
        : resDispositivos.data?.dados || resDispositivos.data?.dispositivos || [];

      if (listaDispositivos.length > 0) {
        setDispositivos(listaDispositivos.map(normalizarDispositivoApi));
      }

      const listaLocais = Array.isArray(resLocais.data) ? resLocais.data : resLocais.data?.dados || [];
      const listaSetores = Array.isArray(resSetores.data) ? resSetores.data : resSetores.data?.dados || [];
      const listaEquipamentos = Array.isArray(resEquipamentos.data) ? resEquipamentos.data : resEquipamentos.data?.dados || [];

      if (listaLocais.length > 0) setLocais(listaLocais);
      if (listaSetores.length > 0) setSetores(listaSetores);
      if (listaEquipamentos.length > 0) setEquipamentos(listaEquipamentos);

      // Filtra alertas de comunicação para alimentar o Histórico de Conectividade caso existam na API
      const listaAlertas = Array.isArray(resAlertas.data) ? resAlertas.data : resAlertas.data?.dados || [];
      const eventosComunicacao = listaAlertas
        .filter((a) => a.categoria === 'comunicacao' || a.id_tipo_alerta === 2 || String(a.mensagem).toLowerCase().includes('conex'))
        .map((a, idx) => ({
          id: a.id_alerta || a.id || idx + 1,
          dispositivo: a.codigo_dispositivo || `ESP32-${String(a.id_dispositivo_iot || 1).padStart(3, '0')}`,
          subtitulo: a.nome_equipamento || '',
          evento: a.status === 'Resolvido' ? 'Reconectado' : 'Desconectado',
          dataHora: a.criado_em || 'Hoje',
          relativo: a.tempo_relativo || 'recente',
          duracao: a.duracao || '—',
        }));

      if (eventosComunicacao.length > 0) {
        setEventosHistorico(eventosComunicacao);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao conectar com o back-end de Conectividade:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosConectividade();

    // Polling a cada 5 segundos (mesmo intervalo do Dashboard e Alarmes)
    const intervalo = setInterval(() => {
      carregarDadosConectividade();
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  const metricas = useMemo(() => ({
    total: dispositivos.length,
    online: dispositivos.filter((d) => d.status === 'Online').length,
    instaveis: dispositivos.filter((d) => d.status === 'Instável').length,
    offline: dispositivos.filter((d) => d.status === 'Offline').length,
  }), [dispositivos]);

  // Cadastrar (POST) ou Editar (PUT/PATCH) dispositivo
  const handleSalvarDispositivo = async (dadosForm) => {
    const payloadApi = {
      nome: dadosForm.nome,
      codigo_identificacao: dadosForm.id,
      modelo: dadosForm.modelo,
      numero_serie: dadosForm.numeroSerie,
      mac_address: dadosForm.macAddress,
      versao_firmware: dadosForm.firmware,
      data_instalacao: dadosForm.dataInstalacao || null,
      id_local: dadosForm.id_local || null,
      id_setor: dadosForm.id_setor || null,
      id_equipamento: dadosForm.id_equipamento || null,
      ssid_wifi: dadosForm.ssid,
      ip_estatico: dadosForm.ipEstatico || null,
      broker_mqtt: dadosForm.broker,
      porta_mqtt: Number(dadosForm.porta) || 1883,
      topico_mqtt: dadosForm.topico,
      client_id_mqtt: dadosForm.clientId,
      intervalo_transmissao: parseInt(dadosForm.intervalo, 10) || 5,
    };

    try {
      if (dadosForm.id_dispositivo_iot) {
        await api
          .put(`/dispositivos/${dadosForm.id_dispositivo_iot}`, payloadApi)
          .catch(() => api.patch(`/dispositivos/${dadosForm.id_dispositivo_iot}`, payloadApi).catch(() => {}));
      } else {
        await api
          .post('/dispositivos', payloadApi)
          .catch(() => api.post('/dispositivos-iot', payloadApi).catch(() => {}));
      }

      // Atualização otimista imediata na UI
      setDispositivos((prev) => {
        const existe = prev.some((d) => d.id === dadosForm.id);
        const itemAtualizado = {
          ...dadosForm,
          pontoAtivo: dadosForm.monitoradoPor !== 'Não associado',
          vinculoTipo: dadosForm.monitoradoPor.toUpperCase(),
          relacionadoNome:
            dadosForm.equipamento || dadosForm.setor || dadosForm.local || '— Não associado',
          protocolo: 'MQTT',
          ultimoContato: 'Agora',
          status: dadosForm.status || 'Online',
        };

        if (existe) {
          return prev.map((d) => (d.id === dadosForm.id ? { ...d, ...itemAtualizado } : d));
        }
        return [...prev, itemAtualizado];
      });
    } catch (err) {
      console.error('Erro ao salvar dispositivo:', err);
    }
  };

  // Salvar parâmetros globais da aba Configuração
  const handleSalvarConfiguracao = async (novaConfig) => {
    setConfiguracaoGlobal(novaConfig);
    await api
      .put('/configuracoes/conectividade', {
        tempo_offline_min: novaConfig.offline,
        tempo_instavel_min: novaConfig.instavel,
        tempo_reconexao_min: novaConfig.reconexaoEstavel,
        alarme_offline: novaConfig.alarmeOffline,
        alarme_reconectar: novaConfig.alarmeReconectar,
        registrar_historico: novaConfig.registrarHistorico,
      })
      .catch(() => {});
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        

        <button
          onClick={() => {
            setDispositivoEditando(null);
            setModalFormAberto(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C57A8] hover:bg-[#3566C2] text-white text-sm font-semibold transition-colors shadow-lg shadow-[#2C57A8]/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          Cadastrar dispositivo
        </button>
      </div>

      <ConectividadeKpiGrid metricas={metricas} />

      <ConectividadeTabela
        dispositivos={dispositivos}
        eventosHistorico={eventosHistorico}
        configuracaoGlobal={configuracaoGlobal}
        loading={loading}
        onSalvarConfiguracao={handleSalvarConfiguracao}
        onVerDetalhes={(dev) => setDispositivoDetalhes(dev)}
        onEditar={(dev) => {
          setDispositivoEditando(dev);
          setModalFormAberto(true);
        }}
      />

      <DispositivoFormModal
        isOpen={modalFormAberto}
        onClose={() => setModalFormAberto(false)}
        dispositivoParaEditar={dispositivoEditando}
        locais={locais}
        setores={setores}
        equipamentos={equipamentos}
        onSalvar={handleSalvarDispositivo}
      />

      <DispositivoDetalhesModal
        dispositivo={dispositivoDetalhes}
        onClose={() => setDispositivoDetalhes(null)}
        onEditar={(dev) => {
          setDispositivoEditando(dev);
          setModalFormAberto(true);
        }}
      />
    </div>
  );
}

export default Conectividade;