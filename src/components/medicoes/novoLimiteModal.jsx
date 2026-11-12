import { useState } from 'react';
import { X } from 'lucide-react';

const escopos = ['Equipamento', 'Setor', 'Local'];
const grandezas = [
  { valor: 'Potência', unidade: 'kW' },
  { valor: 'Tensão', unidade: 'V' },
  { valor: 'Corrente', unidade: 'A' },
  { valor: 'Energia', unidade: 'kWh' },
];

export default function NovoLimiteModal({
  itemEdicao, equipamentos = [], setores = [], locais = [], onFechar, onSalvar, salvando = false,
}) {
  const [escopo, setEscopo] = useState(itemEdicao?.escopo || 'Equipamento');
  const [entidade, setEntidade] = useState(String(itemEdicao?.entidadeId || ''));
  const [grandeza, setGrandeza] = useState(itemEdicao?.grandeza || 'Potência');
  const [operador, setOperador] = useState(itemEdicao?.operador || '>');
  const [valor, setValor] = useState(itemEdicao?.valor ?? '');
  const [severidade, setSeveridade] = useState(itemEdicao?.severidade || 'Atenção');
  const [periodoInicial, setPeriodoInicial] = useState(itemEdicao?.periodoInicial || '');
  const [periodoFinal, setPeriodoFinal] = useState(itemEdicao?.periodoFinal || '');
  const [descricao, setDescricao] = useState(itemEdicao?.descricao || '');
  const [limiteAtivo, setLimiteAtivo] = useState(itemEdicao ? itemEdicao.status !== 'Inativa' : true);

  const opcoesEntidade = escopo === 'Equipamento' ? equipamentos : escopo === 'Setor' ? setores : locais;

  const nomeOpcao = (opcao) => {
    if (escopo === 'Equipamento') return `${opcao.nome || `Equipamento ${opcao.id}`} · ${opcao.nome_setor || 'Sem setor'}`;
    if (escopo === 'Setor') return `${opcao.nome || `Setor ${opcao.id}`} · ${opcao.nome_local || 'Sem local'}`;
    return opcao.nome || `Local ${opcao.id}`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!entidade || valor === '') return;
    onSalvar?.({ escopo, entidade, grandeza, operador, valor: Number(valor), severidade, periodoInicial, periodoFinal, descricao, limiteAtivo });
  };

  const unidade = grandezas.find((item) => item.valor === grandeza)?.unidade;
  const campo = 'w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#141C2B] bg-[#070B15] p-6 text-slate-200 shadow-2xl">
        <div className="mb-6 flex items-start justify-between"><div><h2 className="text-lg font-medium text-slate-100">{itemEdicao ? 'Editar Limite' : 'Novo Limite'}</h2><p className="mt-0.5 text-xs text-slate-400">Configure uma condição para monitoramento energético.</p></div><button type="button" onClick={onFechar} className="rounded-lg p-1 text-slate-400 hover:bg-[#111B2A] hover:text-slate-200" aria-label="Fechar modal"><X size={18} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div><label className="mb-1.5 block font-medium text-slate-300">Escopo</label><div className="grid grid-cols-3 gap-1 rounded-xl border border-[#162136] bg-[#0B1220] p-1">{escopos.map((item) => <button key={item} type="button" onClick={() => { setEscopo(item); setEntidade(''); }} className={`rounded-lg py-2 font-medium ${escopo === item ? 'bg-[#1C3B6E] text-white ring-1 ring-[#2E5899]' : 'text-slate-400 hover:text-slate-200'}`}>{item}</button>)}</div></div>
          <div><label className="mb-1.5 block font-medium text-slate-300">Entidade</label><select required value={entidade} onChange={(event) => setEntidade(event.target.value)} className={campo}><option value="" disabled>Selecionar entidade...</option>{opcoesEntidade.map((opcao) => <option key={opcao.id} value={opcao.id}>{nomeOpcao(opcao)}</option>)}</select>{!opcoesEntidade.length && <p className="mt-1 text-[11px] text-amber-400">Nenhuma entidade cadastrada neste escopo.</p>}</div>
          <div className="grid grid-cols-12 gap-3"><div className="col-span-5"><label className="mb-1.5 block font-medium text-slate-300">Grandeza</label><select value={grandeza} onChange={(event) => setGrandeza(event.target.value)} className={campo}>{grandezas.map((item) => <option key={item.valor}>{item.valor}</option>)}</select></div><div className="col-span-3"><label className="mb-1.5 block font-medium text-slate-300">Operador</label><select value={operador} onChange={(event) => setOperador(event.target.value)} className={campo}><option value=">">&gt;</option><option value="&lt;">&lt;</option><option value=">=">&gt;=</option><option value="&lt;=">&lt;=</option></select></div><div className="col-span-4"><label className="mb-1.5 block font-medium text-slate-300">Valor ({unidade})</label><input required min="0" type="number" step="any" value={valor} onChange={(event) => setValor(event.target.value)} className={campo} /></div></div>
          <div><label className="mb-1.5 block font-medium text-slate-300">Severidade</label><select value={severidade} onChange={(event) => setSeveridade(event.target.value)} className={campo}><option>Atenção</option><option>Crítico</option><option>Meta</option><option>Informativo</option></select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block font-medium text-slate-300">Período inicial</label><input type="date" value={periodoInicial} onChange={(event) => setPeriodoInicial(event.target.value)} className={`${campo} [color-scheme:dark]`} /></div><div><label className="mb-1.5 block font-medium text-slate-300">Período final</label><input type="date" value={periodoFinal} onChange={(event) => setPeriodoFinal(event.target.value)} className={`${campo} [color-scheme:dark]`} /></div></div>
          <div><label className="mb-1.5 block font-medium text-slate-300">Descrição</label><textarea required rows={3} value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Ex.: Meta mensal de consumo do equipamento" className={`${campo} resize-none placeholder:text-slate-600`} /></div>
          <div className="flex items-center justify-between rounded-xl border border-[#162136] bg-[#0B1220] p-3.5"><div><p className="font-medium text-slate-200">Limite ativo</p><p className="text-[11px] text-slate-500">A condição será considerada no monitoramento.</p></div><input type="checkbox" checked={limiteAtivo} onChange={(event) => setLimiteAtivo(event.target.checked)} className="h-4 w-4 accent-[#2E5899]" /></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onFechar} className="rounded-xl border border-[#162136] bg-[#0B1220] px-4 py-2 text-slate-300 hover:bg-[#111B2A]">Cancelar</button><button disabled={salvando || !opcoesEntidade.length} type="submit" className="rounded-xl bg-[#1C3B6E] px-4 py-2 font-medium text-white ring-1 ring-[#2E5899] hover:bg-[#254b8a] disabled:cursor-not-allowed disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar Limite'}</button></div>
        </form>
      </div>
    </div>
  );
}
