import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck, UserRound, X } from 'lucide-react';
import { alterarMinhaSenha } from '../../services/auth';

export default function PerfilModal({ onClose, usuario }) {
  const [mostrarAlteracaoSenha, setMostrarAlteracaoSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  useEffect(() => {
    const fecharComEsc = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', fecharComEsc);
    return () => window.removeEventListener('keydown', fecharComEsc);
  }, [onClose]);

  const limparFormularioSenha = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmacaoSenha('');
    setMensagem('');
  };

  const salvarNovaSenha = async (event) => {
    event.preventDefault();
    setMensagem('');

    if (novaSenha !== confirmacaoSenha) {
      setMensagem('A confirmação da senha não confere.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await alterarMinhaSenha(senhaAtual, novaSenha);
      setMensagem('Senha alterada com sucesso.');
      limparFormularioSenha();
      setMostrarAlteracaoSenha(false);
    } catch (error) {
      setMensagem(error.response?.data?.mensagem || 'Não foi possível alterar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#030712]/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="perfil-titulo" className="wv-profile-modal w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-2xl">
        <header className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">Conta atual</p>
            <h2 id="perfil-titulo" className="text-xl font-bold">Meu perfil</h2>
            <p className="mt-1 text-xs opacity-70">Informações do usuário conectado ao Watt Vision</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar perfil" className="rounded-lg p-2 opacity-70 transition hover:bg-blue-500/10 hover:opacity-100"><X size={18} /></button>
        </header>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-lg font-bold text-white shadow-lg shadow-blue-900/30">WV</div>
          <div><h3 className="text-base font-semibold">{usuario?.nome || 'Usuário'}</h3><p className="mt-1 text-xs opacity-70">{usuario?.status || 'Sessão autenticada'}</p></div>
          <CheckCircle2 size={18} className="ml-auto text-emerald-400" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="wv-profile-row"><UserRound size={16} /><div><span>Nome</span><strong>{usuario?.nome || 'Não informado'}</strong></div></div>
          <div className="wv-profile-row"><Mail size={16} /><div><span>E-mail</span><strong>{usuario?.email || 'Não informado'}</strong></div></div>
          <div className="wv-profile-row"><ShieldCheck size={16} /><div><span>Perfil de acesso</span><strong>{usuario?.perfil || 'Não informado'}</strong></div></div>
        </div>

        <div className="mt-5 border-t pt-5">
          <button
            type="button"
            onClick={() => { setMostrarAlteracaoSenha((atual) => !atual); setMensagem(''); }}
            className="text-sm font-semibold text-blue-500 transition hover:text-blue-400"
          >
            {mostrarAlteracaoSenha ? 'Cancelar alteração de senha' : 'Alterar minha senha'}
          </button>

          {mostrarAlteracaoSenha && (
            <form onSubmit={salvarNovaSenha} className="mt-4 space-y-3">
              <label className="block text-xs font-medium opacity-80">
                Senha atual
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(event) => setSenhaAtual(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="mt-1.5 w-full rounded-xl border border-blue-500/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="block text-xs font-medium opacity-80">
                Nova senha
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="mt-1.5 w-full rounded-xl border border-blue-500/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="block text-xs font-medium opacity-80">
                Confirmar nova senha
                <input
                  type="password"
                  value={confirmacaoSenha}
                  onChange={(event) => setConfirmacaoSenha(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="mt-1.5 w-full rounded-xl border border-blue-500/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>
              {mensagem && <p role="status" className="text-xs text-blue-500">{mensagem}</p>}
              <button
                type="submit"
                disabled={salvandoSenha}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {salvandoSenha ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>

        <footer className="mt-6 flex justify-end border-t pt-4">
          <button type="button" onClick={onClose} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500">Fechar</button>
        </footer>
      </section>
    </div>
  );
}
