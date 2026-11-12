const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function limparSessao() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function salvarSessao(dados, lembrar) {
  limparSessao();
  const armazenamento = lembrar ? localStorage : sessionStorage;
  armazenamento.setItem(TOKEN_KEY, dados.token);
  armazenamento.setItem(USER_KEY, JSON.stringify(dados.usuario));
}
