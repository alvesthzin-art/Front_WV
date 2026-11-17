import api from './api';
import { getToken, limparSessao, salvarSessao } from './session';

export async function entrar(email, senha, lembrar = false) {
  const resposta = await api.post('/auth/login', { email, senha });
  const dados = resposta.data?.dados;

  if (!dados?.token || !dados?.usuario) {
    throw new Error('Resposta de autenticação inválida.');
  }

  salvarSessao(dados, lembrar);

  return dados.usuario;
}

export async function validarSessao() {
  if (!getToken()) return null;

  try {
    const resposta = await api.get('/auth/me');
    const usuario = resposta.data?.dados;
    return usuario;
  } catch (erro) {
    limparSessao();
    throw erro;
  }
}

export async function alterarMinhaSenha(senhaAtual, novaSenha) {
  const resposta = await api.patch('/usuarios/me/senha', {
    senhaAtual,
    novaSenha,
  });

  return resposta.data;
}

export async function redefinirSenhaUsuario(id, novaSenha) {
  const resposta = await api.patch(`/usuarios/${id}/senha`, { novaSenha });
  return resposta.data;
}
