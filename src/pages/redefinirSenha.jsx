import { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { redefinirSenhaComToken } from '../services/auth';
import logoWV from '../assets/logoWV.png';

export default function RedefinirSenha({ token }) {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setMensagem('');

    if (senha.length < 8) {
      setErro('A senha deve conter pelo menos 8 caracteres.');
      return;
    }

    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await redefinirSenhaComToken(token, senha);
      setMensagem(resposta.mensagem || 'Senha redefinida com sucesso.');
      setSenha('');
      setConfirmacao('');
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'O link é inválido ou expirou.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
        <img src={logoWV} alt="Logo Watt Vision" className="mx-auto mb-6 h-16 w-16 object-contain" />
        <h1 className="text-center text-xl font-semibold">Redefinir senha</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Crie uma nova senha para acessar o Watt Vision.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300">
            Nova senha
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-10 py-3 text-white outline-none focus:border-blue-500" />
            </div>
          </label>

          <label className="block text-sm text-slate-300">
            Confirmar nova senha
            <input type="password" required minLength={8} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
          </label>

          {erro && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
          {mensagem && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{mensagem} Você já pode voltar à tela de login.</p>}

          <button type="submit" disabled={carregando || Boolean(mensagem)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            {carregando ? 'Salvando...' : 'Salvar nova senha'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
