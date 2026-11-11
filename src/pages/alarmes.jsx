import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import AlarmesKpiGrid from '../components/alarmes/alarmesKpiGrid';
import AlarmesTabela from '../components/alarmes/alarmesTabela';
import { listarAlarmes, reconhecerAlarme, mensagemErroAlarmes } from '../services/alarmes';

export default function Alarmes() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let ocupado = false;
    async function carregar() {
      if (ocupado) return;
      ocupado = true;
      try {
        const lista = await listarAlarmes(controller.signal);
        if (!controller.signal.aborted) { setAlertas(lista); setErro(''); }
      } catch (error) {
        if (!controller.signal.aborted) setErro(mensagemErroAlarmes(error));
      } finally {
        ocupado = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void carregar();
    const intervalo = setInterval(carregar, 5000);
    return () => { controller.abort(); clearInterval(intervalo); };
  }, []);

  const ativos = alertas.filter(a => ['Ativo', 'Reconhecido'].includes(a.status));
  const criticos = ativos.filter(a => a.severidade === 'Cr\u00edtico').length;
  const atencao = ativos.filter(a => a.severidade === 'Aten\u00e7\u00e3o').length;
  const valor = numero => loading || erro ? '\u2014' : numero;
  const kpis = [
    { id: 'ativos', label: 'Alarmes Ativos', value: valor(ativos.length), detail: 'Ativos e reconhecidos', tone: 'blue', icon: Bell },
    { id: 'criticos', label: 'Cr\u00edticos', value: valor(criticos), detail: 'Requerem a\u00e7\u00e3o imediata', tone: 'red', icon: AlertTriangle },
    { id: 'atencao', label: 'Aten\u00e7\u00e3o', value: valor(atencao), detail: 'Alarmes em acompanhamento', tone: 'yellow', icon: AlertCircle },
    { id: 'resolvidos', label: 'Resolvidos', value: valor(alertas.filter(a => a.status === 'Resolvido').length), detail: 'Total recebido da API', tone: 'green', icon: CheckCircle2 },
  ];

  async function handleReconhecer(id) {
    try {
      await reconhecerAlarme(id);
      setAlertas(atuais => atuais.map(item => item.id === id ? { ...item, status: 'Reconhecido', reconhecido: true } : item));
      setErroAcao('');
      return true;
    } catch (error) {
      setErroAcao(error.response ? mensagemErroAlarmes(error) : error.message);
      return false;
    }
  }

  return (
    <main className="min-h-screen bg-transparent p-6 text-slate-200 md:p-8">
      {(erro || erroAcao) && <p role="alert" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">{erro || erroAcao}</p>}
      <AlarmesKpiGrid kpis={kpis} />
      <AlarmesTabela alertas={alertas} loading={loading} erro={erro} onReconhecer={handleReconhecer} />
    </main>
  );
}
