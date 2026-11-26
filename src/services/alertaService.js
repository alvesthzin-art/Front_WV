import api from './api';

const alertasDisparados = new Set(
  JSON.parse(sessionStorage.getItem('wv_alertas_disparados') || '[]')
);

function registrarDisparo(chave) {
  alertasDisparados.add(chave);
  sessionStorage.setItem(
    'wv_alertas_disparados',
    JSON.stringify([...alertasDisparados])
  );
}

function avaliarCondicao(valorMedido, operador, valorLimite) {
  const v = Number(valorMedido);
  const l = Number(valorLimite);
  if (!Number.isFinite(v) || !Number.isFinite(l)) return false;

  switch (operador) {
    case '>':  return v > l;
    case '>=': return v >= l;
    case '<':  return v < l;
    case '<=': return v <= l;
    default:   return false;
  }
}

const CAMPO_POR_GRANDEZA = {
  tensao: 'tensao',
  corrente: 'corrente',
  potencia: 'potencia_ativa',
  energia: 'energia_acumulada',
};

export async function verificarMedicaoECriarAlarme(medicao, contexto = {}) {
  if (!medicao) return;

  try {
    const resLimites = await api.get('/limites/ativos');
    const limites = Array.isArray(resLimites.data)
      ? resLimites.data
      : resLimites.data?.dados || [];

    const idEquip = contexto.id_equipamento ?? medicao.id_equipamento;
    const idSetor = contexto.id_setor ?? medicao.id_setor;
    const idLocal = contexto.id_local ?? medicao.id_local;

    for (const limite of limites) {
      const mesmoEscopo =
        (limite.id_equipamento && Number(limite.id_equipamento) === Number(idEquip)) ||
        (limite.id_setor && Number(limite.id_setor) === Number(idSetor)) ||
        (limite.id_local && Number(limite.id_local) === Number(idLocal)) ||
        (!limite.id_equipamento && !limite.id_setor && !limite.id_local);

      if (!mesmoEscopo) continue;

      const campo = CAMPO_POR_GRANDEZA[limite.grandeza];
      const valorMedido = medicao[campo];
      if (valorMedido === undefined || valorMedido === null) continue;

      if (!avaliarCondicao(valorMedido, limite.operador, limite.valor)) continue;

      const idLimite = limite.id_limite ?? limite.id;
      const idMedicao = medicao.id_medicao ?? medicao.id ?? medicao.data_hora;
      const idDispositivo = contexto.id_dispositivo_iot ?? medicao.id_dispositivo_iot;

      // O banco exige um dispositivo real. Nunca associe um alarme a um ID
      // fixo, pois isso mascara medições sem equipamento cadastrado.
      if (!idDispositivo) continue;

      const chaveUnica = `${idLimite}-${idMedicao}`;
      if (alertasDisparados.has(chaveUnica)) continue;

      await api.post('/alertas', {
        id_tipo_alerta: 1,
        id_limite: idLimite,
        id_dispositivo_iot: idDispositivo,
        id_medicao: medicao.id_medicao ?? medicao.id ?? null,
        valor_detectado: Number(valorMedido),
        valor_limite: Number(limite.valor),
        severidade: limite.severidade || 'atencao',
        mensagem: `${limite.descricao}: detectado ${valorMedido} (${limite.operador} ${limite.valor})`,
      });

      registrarDisparo(chaveUnica);
    }
  } catch (err) {
    console.error('Erro ao verificar limites e criar alarme:', err);
  }
}