import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, Activity, Wifi, ArrowRight } from 'lucide-react';
import loginBg from '../assets/login.png';
import logoWV from '../assets/logoWV.png';
import logoModoClaro from '../assets/logo_modo_claro.png';
import { entrar, solicitarRedefinicaoSenha, redefinirSenhaComCodigo } from '../services/auth';

export function Login({ onLoginSuccess, theme = 'dark' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('');
  const [etapaRecuperacao, setEtapaRecuperacao] = useState(1);
  const [codigoRecuperacao, setCodigoRecuperacao] = useState('');
  const [novaSenhaRecuperacao, setNovaSenhaRecuperacao] = useState('');
  const [confirmacaoRecuperacao, setConfirmacaoRecuperacao] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const usuario = await entrar(email.trim(), password, rememberMe);
      onLoginSuccess?.(usuario);
    } catch (error) {
      const mensagem = error.response?.data?.mensagem || error.response?.data?.message;
      setErro(mensagem || (!error.response
        ? 'Não foi possível conectar ao backend. Verifique se o servidor está rodando na porta 3000.'
        : 'Não foi possível entrar. Confira o e-mail e a senha.'));
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperacao = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemRecuperacao('');
    setCarregando(true);

    try {
      const resposta = await solicitarRedefinicaoSenha(emailRecuperacao.trim());
      setMensagemRecuperacao(resposta.mensagem || 'Confira seu e-mail para continuar.');
      setEtapaRecuperacao(2);
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Não foi possível solicitar a redefinição.');
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmarRecuperacao = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemRecuperacao('');

    if (novaSenhaRecuperacao.length < 8) {
      setErro('A nova senha deve conter pelo menos 8 caracteres.');
      return;
    }

    if (novaSenhaRecuperacao !== confirmacaoRecuperacao) {
      setErro('As senhas não conferem.');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await redefinirSenhaComCodigo(
        emailRecuperacao.trim(),
        codigoRecuperacao.trim(),
        novaSenhaRecuperacao
      );
      setMensagemRecuperacao(resposta.mensagem || 'Senha redefinida com sucesso.');
      setNovaSenhaRecuperacao('');
      setConfirmacaoRecuperacao('');
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Não foi possível validar o código.');
    } finally {
      setCarregando(false);
    }
  };

  const fecharRecuperacao = () => {
    setMostrarRecuperacao(false);
    setEtapaRecuperacao(1);
    setCodigoRecuperacao('');
    setNovaSenhaRecuperacao('');
    setConfirmacaoRecuperacao('');
    setMensagemRecuperacao('');
    setErro('');
  };

  return (
    <div className="theme-login min-h-screen w-full flex bg-slate-950 font-sans text-slate-100">
      {/* Lado Esquerdo - Banner Industrial */}
      <div
        className="theme-login-hero relative hidden overflow-hidden bg-cover bg-center lg:flex lg:w-3/5 flex-col justify-between p-12"
        style={{
          backgroundImage: `linear-gradient(to right, rgb(2 6 23 / 90%), rgb(2 6 23 / 75%), rgb(2 6 23 / 90%)), url(${loginBg})`,
        }}
      >

        {/* Topo do Banner - Badge de Status */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sistema online — monitoramento em tempo real
          </div>
        </div>

        {/* Centro do Banner - Texto Chamativo */}
        <div className="relative z-10 max-w-xl my-auto">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Energia industrial sob controle, <span className="text-blue-500">em tempo real</span>
          </h1>
          <p className="text-slate-300 text-base mt-4 leading-relaxed">
            Monitore o consumo, antecipe falhas e tome decisões mais eficientes com dados confiáveis dos seus equipamentos.
          </p>
        </div>

        {/* Rodapé do Banner - Vazio para manter alinhamento */}
        <div className="relative z-10"></div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="theme-login-panel w-full lg:w-2/5 flex flex-col justify-between p-8 sm:p-12 bg-slate-950 border-l border-slate-900">
        <div></div>

        <div className="w-full max-w-md mx-auto space-y-8">


          {/* Logo Watt Vision (Substituído o ícone pela imagem logoWV) */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="theme-login-logo-wrap relative h-50 w-50">
                <img
                  src={theme === 'light' ? logoModoClaro : logoWV}
                  alt="Logo Watt Vision"
                  className={`${theme === 'light' ? '' : 'theme-login-logo'} h-50 w-50 object-contain`}
                />
              </div>
            </div>
          </div>

          {/* Cabeçalho do Formulário */}
          <div className="text-center space-y-1">
            <h3 className="text-xl font-semibold text-white">Acesse sua conta</h3>
            <p className="text-xs text-slate-400">
              Utilize suas credenciais para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                E-mail corporativo
              </label>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@empresa.com.br"
                className="w-full bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="senha"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {erro}
              </div>
            )}

            {/* Opções: Lembrar Acesso e Esqueci Senha */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                Lembrar acesso
              </label>
              <button
                type="button"
                onClick={() => { setMostrarRecuperacao(true); setEtapaRecuperacao(1); setErro(''); setMensagemRecuperacao(''); }}
                className="text-blue-500 hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-colors"
            >
              <span>{carregando ? 'Entrando...' : 'Entrar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {mostrarRecuperacao && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${theme === 'light' ? 'bg-slate-900/35' : 'bg-slate-950/75'}`}>
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-700 bg-slate-900 text-slate-100'}`}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className={`text-lg font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Redefinir senha</h2>
                  <p className={`mt-1 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    {etapaRecuperacao === 1 ? 'Informe seu e-mail para receber um código de recuperação.' : 'Digite o código recebido e defina sua nova senha.'}
                  </p>
                </div>
                <button type="button" onClick={fecharRecuperacao} className={`${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`} aria-label="Fechar recuperação">×</button>
              </div>

              {etapaRecuperacao === 1 ? (
                <form onSubmit={handleRecuperacao} className="space-y-4">
                  <label className={`block text-sm font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                    E-mail corporativo
                    <input
                      type="email"
                      required
                      value={emailRecuperacao}
                      onChange={(e) => setEmailRecuperacao(e.target.value)}
                      placeholder="seu@empresa.com.br"
                      className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400' : 'border-slate-700 bg-slate-950 text-white'}`}
                    />
                  </label>
                  {mensagemRecuperacao && <p className={`text-sm ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300'}`}>{mensagemRecuperacao}</p>}
                  {erro && <p className={`text-sm ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>{erro}</p>}
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={fecharRecuperacao} className={`rounded-xl border px-4 py-2.5 text-sm ${theme === 'light' ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}>Cancelar</button>
                    <button type="submit" disabled={carregando} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{carregando ? 'Enviando...' : 'Enviar código'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmarRecuperacao} className="space-y-4">
                  <label className={`block text-sm font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                    Código recebido
                    <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={codigoRecuperacao} onChange={(e) => setCodigoRecuperacao(e.target.value.replace(/\D/g, ''))} placeholder="000000" className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm tracking-[0.3em] outline-none focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400' : 'border-slate-700 bg-slate-950 text-white'}`} />
                  </label>
                  <label className={`block text-sm font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                    Nova senha
                    <input type="password" minLength={8} required value={novaSenhaRecuperacao} onChange={(e) => setNovaSenhaRecuperacao(e.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-700 bg-slate-950 text-white'}`} />
                  </label>
                  <label className={`block text-sm font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                    Confirmar nova senha
                    <input type="password" minLength={8} required value={confirmacaoRecuperacao} onChange={(e) => setConfirmacaoRecuperacao(e.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-700 bg-slate-950 text-white'}`} />
                  </label>
                  {mensagemRecuperacao && <p className={`text-sm ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300'}`}>{mensagemRecuperacao}</p>}
                  {erro && <p className={`text-sm ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>{erro}</p>}
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={fecharRecuperacao} className={`rounded-xl border px-4 py-2.5 text-sm ${theme === 'light' ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}>Cancelar</button>
                    <button type="submit" disabled={carregando || Boolean(mensagemRecuperacao)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{carregando ? 'Salvando...' : 'Confirmar nova senha'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Rodapé - Indicadores de Segurança */}
        <div className="pt-8 border-t border-slate-900 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Conexão protegida</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Activity className="w-4 h-4 text-slate-400" />
            <span>Dados em tempo real</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Wifi className="w-4 h-4 text-slate-400" />
            <span>Alta disponibilidade</span>
          </div>
        </div>
      </div>    
    </div>
  );
}
