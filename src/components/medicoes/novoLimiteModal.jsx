import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function NovoLimiteModal({
  onFechar,
  onSalvar,
}) {
  const [escopo, setEscopo] = useState('Equipamento');
  const [entidade, setEntidade] = useState('');
  const [grandeza, setGrandeza] = useState('Potência');
  const [operador, setOperador] = useState('>');
  const [valor, setValor] = useState('');
  const [severidade, setSeveridade] = useState('Atenção');
  const [periodoInicial, setPeriodoInicial] = useState('');
  const [periodoFinal, setPeriodoFinal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [limiteAtivo, setLimiteAtivo] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dadosFormulario = {
      escopo,
      entidade,
      grandeza,
      operador,
      valor: Number(valor),
      severidade,
      periodoInicial,
      periodoFinal,
      descricao,
      limiteAtivo,
    };

    if (onSalvar) {
      onSalvar(dadosFormulario);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#141C2B] bg-[#070B15] p-6 shadow-2xl text-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-slate-100">Novo Limite</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Configure uma condição para monitoramento energético.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-[#111B2A] hover:text-slate-200"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Escopo */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">Escopo</label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#0B1220] p-1 border border-[#162136]">
              {['Equipamento', 'Setor', 'Local'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEscopo(item)}
                  className={`rounded-lg py-2 text-center font-medium transition-all ${
                    escopo === item
                      ? 'bg-[#1C3B6E] text-white shadow-sm ring-1 ring-[#2E5899]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Entidade */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">Entidade</label>
            <select
              value={entidade}
              onChange={(e) => setEntidade(e.target.value)}
              className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899]"
            >
              <option value="" disabled className="text-slate-500">
                Selecionar entidade...
              </option>
              <option value="sensor-01">Sensor Principal - Ar Condicionado</option>
              <option value="sensor-02">Sensor Secundário - Iluminação</option>
            </select>
          </div>

          {/* Grandeza, Operador e Valor */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <label className="block text-slate-300 mb-1.5 font-medium">Grandeza</label>
              <select
                value={grandeza}
                onChange={(e) => setGrandeza(e.target.value)}
                className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899]"
              >
                <option value="Potência">Potência</option>
                <option value="Tensão">Tensão</option>
                <option value="Corrente">Corrente</option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-slate-300 mb-1.5 font-medium">Operador</label>
              <select
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899]"
              >
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="=">=</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
              </select>
            </div>

            <div className="col-span-4">
              <label className="block text-slate-300 mb-1.5 font-medium">Valor (kW)</label>
              <input
                type="number"
                step="any"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899]"
              />
            </div>
          </div>

          {/* Severidade */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">Severidade</label>
            <select
              value={severidade}
              onChange={(e) => setSeveridade(e.target.value)}
              className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899]"
            >
              <option value="Atenção">Atenção</option>
              <option value="Crítico">Crítico</option>
              <option value="Informativo">Informativo</option>
            </select>
          </div>

          {/* Período Inicial e Período Final */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">Período inicial</label>
              <input
                type="date"
                value={periodoInicial}
                onChange={(e) => setPeriodoInicial(e.target.value)}
                placeholder="dd/mm/aaaa"
                className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899] [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">Período final</label>
              <input
                type="date"
                value={periodoFinal}
                onChange={(e) => setPeriodoFinal(e.target.value)}
                placeholder="dd/mm/aaaa"
                className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899] [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">Descrição</label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional da condição"
              className="w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 placeholder-slate-600 outline-none focus:border-[#2E5899] resize-none"
            />
          </div>

          {/* Limite Ativo */}
          <div className="flex items-center justify-between rounded-xl border border-[#162136] bg-[#0B1220] p-3.5">
            <div>
              <p className="font-medium text-slate-200">Limite ativo</p>
              <p className="text-[11px] text-slate-500">
                A condição será considerada no monitoramento.
              </p>
            </div>
            <input
              type="checkbox"
              checked={limiteAtivo}
              onChange={(e) => setLimiteAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-[#2E5899] bg-[#070B15] text-[#1C3B6E] focus:ring-0 focus:ring-offset-0 accent-[#2E5899]"
            />
          </div>

          {/* Ações do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-[#162136] bg-[#0B1220] px-4 py-2 text-slate-300 transition hover:bg-[#111B2A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#1C3B6E] px-4 py-2 font-medium text-white shadow-sm ring-1 ring-[#2E5899] transition hover:bg-[#254b8a]"
            >
              Salvar Limite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}