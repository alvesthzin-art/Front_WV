import { useEffect } from 'react';
import { CheckCircle2, Mail, ShieldCheck, UserRound, X } from 'lucide-react';

export default function PerfilModal({ onClose }) {
  useEffect(() => {
    const fecharComEsc = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', fecharComEsc);
    return () => window.removeEventListener('keydown', fecharComEsc);
  }, [onClose]);

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
          <div><h3 className="text-base font-semibold">Administrador</h3><p className="mt-1 text-xs opacity-70">Acesso demonstrativo</p></div>
          <CheckCircle2 size={18} className="ml-auto text-emerald-400" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="wv-profile-row"><UserRound size={16} /><div><span>Nome</span><strong>Administrador Watt Vision</strong></div></div>
          <div className="wv-profile-row"><Mail size={16} /><div><span>E-mail</span><strong>admin@wattvision.com.br</strong></div></div>
          <div className="wv-profile-row"><ShieldCheck size={16} /><div><span>Perfil de acesso</span><strong>Administrador do sistema</strong></div></div>
        </div>

        <footer className="mt-6 flex justify-end border-t pt-4">
          <button type="button" onClick={onClose} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500">Fechar</button>
        </footer>
      </section>
    </div>
  );
}
