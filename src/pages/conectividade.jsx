import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import ConectividadeKpiGrid from '../components/conectividade/conectividadeKpiGrid';
import ConectividadeTabela from '../components/conectividade/conectividadeTabela';
import DispositivoFormModal from '../components/conectividade/dispositivoFormModal';
import DispositivoDetalhesModal from '../components/conectividade/dispositivoDetalhesModal';

const VINCULOS_KEY = 'wattvision_vinculos_dispositivos';

function getVinculosSalvos() {
  try {
    return JSON.parse(localStorage.getItem(VINCULOS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setVinculoSalvo(idDispositivo, idsVinculo) {
  if (!idDispositivo) return;
  const atual = getVinculosSalvos();
  atual[String(idDispositivo)] = {
    monitoradoPor: idsVinculo.monitoradoPor || 'Não associado',
    id_equipamento: idsVinculo.id_equipamento ? Number(idsVinculo.id_equipamento) : null,
    id_setor: idsVinculo.id_setor ? Number(idsVinculo.id_setor) : null,
    id_local: idsVinculo.id_local ? Number(idsVinculo.id_local) : null,
  };
  localStorage.setItem(VINCULOS_KEY, JSON.stringify(atual));
}

function removerVinculoSalvo(idDispositivo) {
  if (!idDispositivo) return;
  const atual = getVinculosSalvos();
  delete atual[String(idDispositivo)];
  localStorage.setItem(VINCULOS_KEY, JSON.stringify(atual));
}

function normalizarDispositivoApi(raw) {
  const idNumerico =
    Number(raw.id_dispositivo_iot) ||
    (!Number.isNaN(Number(raw.id)) ? Number(raw.id) : null);

  const tipoVinculo = raw.id_equipamento
    ? 'EQUIPAMENTO'
    : raw.id_setor
      ? 'SETOR'
      : raw.id_local
        ? 'LOCAL'
        : 'NÃO ASSOCIADO';

  const nomeVinculo =
    raw.nome_equipamento ||
    raw.nome_setor ||
    raw.nome_local ||
    '— Não associado';

  const statusBruto = String(raw.status || 'offline').toLowerCase();
  const statusNormalizado =
    statusBruto === 'online'
      ? 'Online'
      : statusBruto === 'instavel' || statusBruto === 'instável'
        ? 'Instável'
        : 'Offline';

  const wifiAtivo = Number(raw.wifi ?? 0) === 1;
  const mqttAtivo = Number(raw.mqtt ?? 0) === 1;

  return {
    ...raw,
    id_dispositivo_iot: idNumerico,
    id:
      raw.identificador ||
      raw.codigo_identificacao ||
      `ESP32-${String(idNumerico || 1).padStart(3, '0')}`,
    identificador: raw.identificador || raw.codigo_identificacao || '',
    nome: raw.nome || 'Dispositivo IoT',
    modelo: raw.modelo || 'ESP32-DevKitC',
    numeroSerie: raw.numero_serie || raw.numeroSerie || '—',
    macAddress: raw.mac_address || raw.macAddress || '—',
    firmware: raw.versao_firmware || raw.firmware || 'v1.0.0',
    dataInstalacao: raw.data_instalacao || raw.dataInstalacao || '',
    intervalo: raw.tx_interval_sec
      ? `${raw.tx_interval_sec}s`
      : raw.intervalo || '30s',
    pontoAtivo: wifiAtivo || mqttAtivo || tipoVinculo !== 'NÃO ASSOCIADO',
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
    local: raw.nome_local || '',
    setor: raw.nome_setor || '',
    equipamento: raw.nome_equipamento || '',
    ssid: raw.ssid || raw.ssid_wifi || 'WattVisionWiFi',
    ipEstatico: raw.ip || raw.ip_estatico || raw.ipEstatico || '',
    broker: raw.broker || raw.broker_mqtt || 'broker.hivemq.com',
    porta: String(raw.port || raw.porta_mqtt || raw.porta || '1883'),
    topico:
      raw.topic || raw.topico_mqtt || raw.topico || 'wattvision/medicoes',
    clientId: raw.client_id || raw.client_id_mqtt || raw.clientId || '',
    wifi: wifiAtivo ? 1 : 0,
    mqtt: mqttAtivo ? 1 : 0,
    protocolo: 'MQTT',
    ultimoContato: raw.data_comunicacao || raw.ultimoContato || '—',
    status: statusNormalizado,
  };
}

function Conectividade() {
  const [dispositivos, setDispositivos] = useState([]);
  const [eventosHistorico, setEventosHistorico] = useState([]);
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

  // Resolve a hierarquia (Equipamento -> Setor -> Local) sempre a partir do banco atual
  const resolverHierarquiaAtual = useCallback(
    (raw, listaPontos, listaLocais, listaSetores, listaEquipamentos) => {
      const idNum =
        Number(raw.id_dispositivo_iot) ||
        (!Number.isNaN(Number(raw.id)) ? Number(raw.id) : null);

      const pontoBanco = idNum
        ? listaPontos.find(
            (pm) =>
              Number(pm.id_dispositivo_iot) === idNum &&
              (pm.status === 'Ativo' || !pm.status)
          ) || listaPontos.find((pm) => Number(pm.id_dispositivo_iot) === idNum)
        : null;

      const vinculoCache = idNum ? getVinculosSalvos()[String(idNum)] || {} : {};

      // Prioriza o vínculo vindo diretamente do banco (raw ou tbl_ponto_medicao)
      const temVinculoBanco = Boolean(
        raw.id_equipamento ||
          raw.id_setor ||
          raw.id_local ||
          pontoBanco?.id_equipamento ||
          pontoBanco?.id_setor ||
          pontoBanco?.id_local
      );

      const idEquipamento = temVinculoBanco
        ? (raw.id_equipamento ?? pontoBanco?.id_equipamento ?? null)
        : (vinculoCache.id_equipamento ?? null);

      const equipAtual = idEquipamento
        ? listaEquipamentos.find(
            (eq) => Number(eq.id_equipamento || eq.id) === Number(idEquipamento)
          )
        : null;

      // Se houver equipamento, o setor atual é obrigatoriamente o id_setor atualizado desse equipamento
      const idSetorAtual = idEquipamento
        ? (equipAtual?.id_setor ?? raw.id_setor ?? pontoBanco?.id_setor ?? null)
        : temVinculoBanco
          ? (raw.id_setor ?? pontoBanco?.id_setor ?? null)
          : (vinculoCache.id_setor ?? null);

      const setorAtual = idSetorAtual
        ? listaSetores.find(
            (s) => Number(s.id_setor || s.id) === Number(idSetorAtual)
          )
        : null;

      // Se houver setor, o local atual é obrigatoriamente o id_local atualizado desse setor
      const idLocalAtual = idSetorAtual
        ? (setorAtual?.id_local ??
            equipAtual?.id_local ??
            raw.id_local ??
            pontoBanco?.id_local ??
            null)
        : temVinculoBanco
          ? (raw.id_local ?? pontoBanco?.id_local ?? null)
          : (vinculoCache.id_local ?? null);

      const localAtual = idLocalAtual
        ? listaLocais.find(
            (l) => Number(l.id_local || l.id) === Number(idLocalAtual)
          )
        : null;

      const nomeEquipamentoAtual =
        equipAtual?.nome ||
        equipAtual?.nome_equipamento ||
        equipAtual?.equipamento ||
        raw.nome_equipamento ||
        '';

      const nomeSetorAtual =
        setorAtual?.nome ||
        setorAtual?.nome_setor ||
        equipAtual?.setor ||
        raw.nome_setor ||
        '';

      const nomeLocalAtual =
        localAtual?.nome ||
        localAtual?.nome_local ||
        setorAtual?.local ||
        equipAtual?.local ||
        raw.nome_local ||
        '';

      return normalizarDispositivoApi({
        ...raw,
        id_equipamento: idEquipamento ? Number(idEquipamento) : null,
        nome_equipamento: nomeEquipamentoAtual,
        id_setor: idSetorAtual ? Number(idSetorAtual) : null,
        nome_setor: nomeSetorAtual,
        id_local: idLocalAtual ? Number(idLocalAtual) : null,
        nome_local: nomeLocalAtual,
      });
    },
    []
  );

  const carregarDadosConectividade = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setLoading(true);
      try {
        const [
          resDispositivos,
          resPontos,
          resLocais,
          resSetores,
          resEquipamentos,
          resAlertas,
        ] = await Promise.all([
          api.get('/dispositivos-iot'),
          api.get('/pontos-medicao').catch(() => ({ data: [] })),
          api.get('/locais').catch(() => ({ data: [] })),
          api.get('/setores').catch(() => ({ data: [] })),
          api.get('/equipamentos').catch(() => ({ data: [] })),
          api.get('/alertas').catch(() => ({ data: [] })),
        ]);

        const extrair = (res) =>
          Array.isArray(res.data) ? res.data : res.data?.dados || [];

        const listaDispositivos = extrair(resDispositivos);
        const listaPontos = extrair(resPontos);
        const listaLocais = extrair(resLocais);
        const listaSetores = extrair(resSetores);
        const listaEquipamentos = extrair(resEquipamentos);

        setLocais(listaLocais);
        setSetores(listaSetores);
        setEquipamentos(listaEquipamentos);

        const normalizados = listaDispositivos.map((raw) =>
          resolverHierarquiaAtual(
            raw,
            listaPontos,
            listaLocais,
            listaSetores,
            listaEquipamentos
          )
        );
        setDispositivos(normalizados);

        setDispositivoDetalhes((atual) =>
          atual
            ? normalizados.find(
                (d) => d.id_dispositivo_iot === atual.id_dispositivo_iot
              ) || atual
            : null
        );

        const listaAlertas = extrair(resAlertas);
        const eventosComunicacao = listaAlertas
          .filter(
            (a) =>
              a.categoria === 'comunicacao' ||
              a.id_tipo_alerta === 2 ||
              String(a.mensagem || '')
                .toLowerCase()
                .includes('conex')
          )
          .map((a, idx) => ({
            id: a.id_alerta || a.id || idx + 1,
            dispositivo:
              a.codigo_dispositivo ||
              `ESP32-${String(a.id_dispositivo_iot || 1).padStart(3, '0')}`,
            subtitulo: a.nome_equipamento || '',
            evento: a.status === 'Resolvido' ? 'Reconectado' : 'Desconectado',
            dataHora: a.criado_em || 'Hoje',
            relativo: a.tempo_relativo || 'recente',
            duracao: a.duracao || '—',
          }));

        if (eventosComunicacao.length > 0) {
          setEventosHistorico(eventosComunicacao);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de conectividade:', error);
      } finally {
        if (!silencioso) setLoading(false);
      }
    },
    [resolverHierarquiaAtual]
  );

  useEffect(() => {
    carregarDadosConectividade();

    const aoFocar = () => carregarDadosConectividade(true);
    window.addEventListener('focus', aoFocar);

    const intervalo = setInterval(() => {
      carregarDadosConectividade(true);
    }, 5000);

    return () => {
      window.removeEventListener('focus', aoFocar);
      clearInterval(intervalo);
    };
  }, [carregarDadosConectividade]);

  const buscarDispositivoPorId = async (idBanco) => {
    if (!idBanco) return null;
    try {
      const [resDisp, resPontos, resLocais, resSetores, resEquipamentos] =
        await Promise.all([
          api.get(`/dispositivos-iot/${idBanco}`),
          api.get('/pontos-medicao').catch(() => ({ data: [] })),
          api.get('/locais').catch(() => ({ data: [] })),
          api.get('/setores').catch(() => ({ data: [] })),
          api.get('/equipamentos').catch(() => ({ data: [] })),
        ]);

      const extrair = (res) =>
        Array.isArray(res.data) ? res.data : res.data?.dados || [];

      const bruto = resDisp.data?.dados ?? resDisp.data;
      const item = Array.isArray(bruto) ? bruto[0] : bruto;

      const listaPontos = extrair(resPontos);
      const listaLocais = extrair(resLocais);
      const listaSetores = extrair(resSetores);
      const listaEquipamentos = extrair(resEquipamentos);

      setLocais(listaLocais);
      setSetores(listaSetores);
      setEquipamentos(listaEquipamentos);

      return item
        ? resolverHierarquiaAtual(
            item,
            listaPontos,
            listaLocais,
            listaSetores,
            listaEquipamentos
          )
        : null;
    } catch (error) {
      console.error(`Erro ao buscar GET /dispositivos-iot/${idBanco}:`, error);
      return null;
    }
  };

  const handleAbrirDetalhes = async (dev) => {
    setDispositivoDetalhes(dev);
    const atualizado = await buscarDispositivoPorId(dev.id_dispositivo_iot);
    if (atualizado) setDispositivoDetalhes(atualizado);
  };

  const handleAbrirEdicao = async (dev) => {
    setDispositivoDetalhes(null);
    setDispositivoEditando(dev);
    setModalFormAberto(true);

    const atualizado = await buscarDispositivoPorId(dev.id_dispositivo_iot);
    if (atualizado) setDispositivoEditando(atualizado);
  };

  // Na edição: atualiza SOMENTE os parâmetros de conectividade/hardware
  // No cadastro: cria o dispositivo e o vínculo inicial
  const handleSalvarDispositivo = async (dadosForm) => {
    const idBanco =
      dadosForm.id_dispositivo_iot || dispositivoEditando?.id_dispositivo_iot;
    const identificador = (
      dadosForm.id ||
      dadosForm.identificador ||
      ''
    ).trim();
    const hojeIso = new Date().toISOString().split('T')[0];

    const payloadConectividade = {
      id_empresa: Number(dadosForm.id_empresa) || 1,
      nome: (dadosForm.nome || '').trim(),
      identificador,
      mac_address: (
        dadosForm.macAddress ||
        dadosForm.mac_address ||
        ''
      ).trim(),
      modelo: (dadosForm.modelo || 'ESP32-DevKitC').trim(),
      numero_serie: (
        dadosForm.numeroSerie ||
        dadosForm.numero_serie ||
        ''
      ).trim(),
      ip: (dadosForm.ipEstatico || dadosForm.ip || '').trim(),
      versao_firmware: (
        dadosForm.firmware ||
        dadosForm.versao_firmware ||
        'v1.0.0'
      ).trim(),
      data_instalacao:
        dadosForm.dataInstalacao || dadosForm.data_instalacao || hojeIso,
      ssid: (dadosForm.ssid || 'WattVisionWiFi').trim(),
      broker: (dadosForm.broker || 'broker.hivemq.com').trim(),
      port: Number(dadosForm.porta || dadosForm.port) || 1883,
      topic: (
        dadosForm.topico ||
        dadosForm.topic ||
        'wattvision/medicoes'
      ).trim(),
      client_id: (
        dadosForm.clientId ||
        dadosForm.client_id ||
        identificador.toLowerCase()
      ).trim(),
      tx_interval_sec:
        parseInt(dadosForm.intervalo || dadosForm.tx_interval_sec, 10) || 30,
      wifi: Number(dadosForm.wifi ?? 0),
      mqtt: Number(dadosForm.mqtt ?? 0),
      status: (dadosForm.status || 'offline').toLowerCase(),
    };

    try {
      if (idBanco) {
        await api.put(`/dispositivos-iot/${idBanco}`, payloadConectividade);
      } else {
        const resPost = await api.post('/dispositivos-iot', payloadConectividade);
        const retorno = resPost.data?.dados ?? resPost.data;
        let idFinal =
          retorno?.id_dispositivo_iot || retorno?.id || retorno?.insertId;

        if (!idFinal && identificador) {
          const resLista = await api.get('/dispositivos-iot');
          const lista = Array.isArray(resLista.data)
            ? resLista.data
            : resLista.data?.dados || [];
          const criado = lista.find((d) => d.identificador === identificador);
          if (criado) idFinal = criado.id_dispositivo_iot || criado.id;
        }

        const monitoradoPor = dadosForm.monitoradoPor || 'Não associado';
        const temVinculo =
          monitoradoPor !== 'Não associado' &&
          Boolean(
            dadosForm.id_local || dadosForm.id_setor || dadosForm.id_equipamento
          );

        if (idFinal && temVinculo) {
          setVinculoSalvo(idFinal, {
            monitoradoPor,
            id_local: dadosForm.id_local,
            id_setor: dadosForm.id_setor,
            id_equipamento: dadosForm.id_equipamento,
          });

          await api
            .post('/pontos-medicao', {
              nome: `Ponto ${payloadConectividade.nome}`,
              descricao: `Medição via ${identificador}`,
              data_instalacao: hojeIso,
              status: 'Ativo',
              id_local:
                monitoradoPor === 'Local' && dadosForm.id_local
                  ? Number(dadosForm.id_local)
                  : null,
              id_setor:
                monitoradoPor === 'Setor' && dadosForm.id_setor
                  ? Number(dadosForm.id_setor)
                  : null,
              id_equipamento:
                monitoradoPor === 'Equipamento' && dadosForm.id_equipamento
                  ? Number(dadosForm.id_equipamento)
                  : null,
              id_dispositivo_iot: Number(idFinal),
            })
            .catch(() => {});
        }
      }

      setModalFormAberto(false);
      setDispositivoEditando(null);
      await carregarDadosConectividade(true);
    } catch (err) {
      const msg =
        err.response?.data?.mensagem || 'Dados do dispositivo IoT inválidos.';
      console.error('Erro ao salvar dispositivo IoT:', err.response?.data || err);
      alert(msg);
    }
  };

  const handleAlterarStatusDispositivo = async (dev, novoStatus) => {
    const idBanco = dev.id_dispositivo_iot;
    if (!idBanco) return;

    const statusLower = novoStatus.toLowerCase();
    const payload = {
      status: statusLower,
      wifi: statusLower === 'offline' ? 0 : 1,
      mqtt: statusLower === 'online' ? 1 : 0,
    };

    try {
      await api
        .patch(`/dispositivos-iot/${idBanco}/status`, payload)
        .catch(() => api.put(`/dispositivos-iot/${idBanco}/status`, payload));

      const atualizarItem = (item) =>
        item.id_dispositivo_iot === idBanco
          ? {
              ...item,
              status: novoStatus,
              wifi: payload.wifi,
              mqtt: payload.mqtt,
              pontoAtivo:
                payload.wifi === 1 ||
                payload.mqtt === 1 ||
                item.vinculoTipo !== 'NÃO ASSOCIADO',
            }
          : item;

      setDispositivos((prev) => prev.map(atualizarItem));
      setDispositivoDetalhes((atual) => (atual ? atualizarItem(atual) : null));
    } catch (error) {
      console.error(
        `Erro ao atualizar status /dispositivos-iot/${idBanco}/status:`,
        error.response?.data || error
      );
      alert(
        error.response?.data?.mensagem ||
          'Não foi possível atualizar o status do dispositivo.'
      );
    }
  };

  const handleExcluirDispositivo = async (dev) => {
    const idBanco = dev.id_dispositivo_iot;
    if (!idBanco) return;

    const confirmou = window.confirm(
      `Tem certeza que deseja excluir o dispositivo "${dev.nome}" (${dev.id})?`
    );
    if (!confirmou) return;

    try {
      await api.delete(`/dispositivos-iot/${idBanco}`);
      removerVinculoSalvo(idBanco);

      setDispositivos((prev) =>
        prev.filter((item) => item.id_dispositivo_iot !== idBanco)
      );

      setDispositivoDetalhes((atual) =>
        atual?.id_dispositivo_iot === idBanco ? null : atual
      );
    } catch (error) {
      console.error(
        `Erro ao excluir DELETE /dispositivos-iot/${idBanco}:`,
        error.response?.data || error
      );
      alert(
        error.response?.data?.mensagem ||
          'Não foi possível excluir o dispositivo IoT.'
      );
    }
  };

  const metricas = useMemo(
    () => ({
      total: dispositivos.length,
      online: dispositivos.filter((d) => d.status === 'Online').length,
      instaveis: dispositivos.filter((d) => d.status === 'Instável').length,
      offline: dispositivos.filter((d) => d.status === 'Offline').length,
    }),
    [dispositivos]
  );

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
        <div>
          <h1 className="text-2xl font-bold text-[#C0C5C8] tracking-tight">
            Conectividade
          </h1>
          <p className="text-sm text-[#9ca1a6] mt-0.5">
            Gerencie os dispositivos responsáveis pela coleta e transmissão das medições do Watt Vision
          </p>
        </div>

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
        onVerDetalhes={handleAbrirDetalhes}
        onEditar={handleAbrirEdicao}
        onAlterarStatus={handleAlterarStatusDispositivo}
        onExcluir={handleExcluirDispositivo}
      />

      <DispositivoFormModal
        isOpen={modalFormAberto}
        onClose={() => {
          setModalFormAberto(false);
          setDispositivoEditando(null);
        }}
        dispositivoParaEditar={dispositivoEditando}
        locais={locais}
        setores={setores}
        equipamentos={equipamentos}
        onSalvar={handleSalvarDispositivo}
      />

      <DispositivoDetalhesModal
        dispositivo={dispositivoDetalhes}
        onClose={() => setDispositivoDetalhes(null)}
        onEditar={handleAbrirEdicao}
        onAlterarStatus={handleAlterarStatusDispositivo}
        onExcluir={handleExcluirDispositivo}
      />
    </div>
  );
}

export default Conectividade;