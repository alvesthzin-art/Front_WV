import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, Activity, Wifi, ArrowRight } from 'lucide-react';
import loginBg from '../assets/login.png';

export function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulação de login 
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 font-sans text-slate-100">
      {/* Lado Esquerdo - Banner Industrial */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col justify-between p-12">
        {/* Imagem de Fundo */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 scale-105"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/90" />
        </div>

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
      <div className="w-full lg:w-2/5 flex flex-col justify-between p-8 sm:p-12 bg-slate-950 border-l border-slate-900">
        <div></div>

        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Logo Watt Vision */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Activity className="w-7 h-7" />
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
              WATT <span className="text-blue-500">VISION</span>
            </h2>
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
              <a href="#" className="text-blue-500 hover:underline">
                Esqueci minha senha
              </a>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-colors"
            >
              <span>Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

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