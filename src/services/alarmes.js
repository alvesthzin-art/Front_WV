import api from './api';

function credenciais() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export function normalizarAlarme(item) {
  const texto = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const status = texto(item.status);
  const severidade = texto(item.severidade);
  const categoria = texto(item.categoria_alerta ?? item.categoria);
  return {
    ...item,
    id: item.id_alerta ?? item.id,
    titulo: item.titulo ?? item.tipo_alerta ?? item.mensagem ?? 'Alarme',
    equipamento: item.equipamento?.nome ?? item.equipamento ?? item.nome_equipamento ?? (item.id_dispositivo_iot ? `Dispositivo ${item.id_dispositivo_iot}` : 'Equipamento n\u00e3o informado'),
    local: item.local?.nome ?? item.local ?? '',
    categoria: categoria.includes('comunic') ? 'Comunica\u00e7\u00e3o' : 'Energ\u00e9tico',
    severidade: severidade === 'critico' ? 'Cr\u00edtico' : ['atencao', 'aviso'].includes(severidade) ? 'Aten\u00e7\u00e3o' : 'Informativo',
    status: ['resolvido', 'inativo'].includes(status) ? 'Resolvido' : status === 'reconhecido' ? 'Reconhecido' : status === 'ativo' ? 'Ativo' : (item.status ?? 'Desconhecido'),
    reconhecido: status === 'reconhecido' || Boolean(item.reconhecido_por || item.id_usuario_reconhecimento),
    inicio: item.inicio ?? (item.data_hora ? new Date(item.data_hora).toLocaleString('pt-BR') : '\u2014'),
    data_criacao: item.data_hora ?? item.data_criacao,
  };
}

export async function listarAlarmes(signal) {
  const resposta = await api.get('/alertas', { ...credenciais(), signal });
  const dados = resposta.data;
  const lista = Array.isArray(dados) ? dados : dados?.dados ?? dados?.alertas;
  if (!Array.isArray(lista)) throw new Error('Resposta de alarmes inv\u00e1lida.');
  return lista.map(normalizarAlarme);
}

export function mensagemErroAlarmes(erro) {
  if (erro.response?.status === 401) return 'Autentica\u00e7\u00e3o necess\u00e1ria para consultar os alarmes.';
  if (erro.response?.status === 403) return 'Seu usu\u00e1rio n\u00e3o tem permiss\u00e3o para acessar os alarmes.';
  return erro.response?.data?.mensagem ?? 'N\u00e3o foi poss\u00edvel carregar os alarmes. Nova tentativa em alguns segundos.';
}

export async function reconhecerAlarme(id) {
  const config = credenciais();
  const token = config.headers?.Authorization?.slice(7);
  let usuario;
  if (token) {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      usuario = Number(JSON.parse(atob(payload)).id);
    } catch { throw new Error('Token de autenticação inválido.'); }
    if (!Number.isSafeInteger(usuario) || usuario <= 0) throw new Error('Usuário inválido.');
  }
  await api.patch(`/alertas/${encodeURIComponent(id)}/reconhecer`, usuario ? { id_usuario: usuario } : {}, config);
}
