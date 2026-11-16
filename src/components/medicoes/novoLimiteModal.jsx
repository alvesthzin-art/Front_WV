import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

const escopos = ['Equipamento', 'Setor', 'Local'];

const grandezas = [
  { valor: 'Potência', apiValor: 'potencia', unidade: 'W' },
  { valor: 'Tensão', apiValor: 'tensao', unidade: 'V' },
  { valor: 'Corrente', apiValor: 'corrente', unidade: 'A' },
  { valor: 'Energia', apiValor: 'energia', unidade: 'kWh' },
];

const MAPA_SEVERIDADE_API = {
  Atenção: 'atencao',
  Crítico: 'critico',
  Meta: 'meta',
  Informativo: 'informativo',
};

function extrairLista(res) {
  return Array.isArray(res?.data) ? res.data : res?.data?.dados || [];
}

export default function NovoLimiteModal({
  itemEdicao,
  equipamentos = [],
  setores = [],
  locais = [],
  onFechar,
  onSalvar,
  salvando: salvandoExterno = false,
}) {
  const [escopo, setEscopo] = useState(itemEdicao?.escopo || 'Equipamento');
  const [entidade, setEntidade] = useState(
    String(
      itemEdicao?.entidadeId ||
        itemEdicao?.id_equipamento ||
        itemEdicao?.id_setor ||
        itemEdicao?.id_local ||
        ''
    )
  );
  const [grandeza, setGrandeza] = useState(itemEdicao?.grandeza || 'Potência');
  const [operador, setOperador] = useState(itemEdicao?.operador || '>');
  const [valor, setValor] = useState(itemEdicao?.valor ?? '');
  const [severidade, setSeveridade] = useState(
    itemEdicao?.severidade || 'Atenção'
  );
  const [periodoInicial, setPeriodoInicial] = useState(
    itemEdicao?.periodoInicial || itemEdicao?.periodo_inicial || ''
  );
  const [periodoFinal, setPeriodoFinal] = useState(
    itemEdicao?.periodoFinal || itemEdicao?.periodo_final || ''
  );
  const [descricao, setDescricao] = useState(itemEdicao?.descricao || '');
  const [limiteAtivo, setLimiteAtivo] = useState(
    itemEdicao
      ? itemEdicao.status !== 'Inativa' && itemEdicao.ativa !== 0
      : true
  );

  // Estados locais caso as listas não venham preenchidas via props
  const [listaEquipamentos, setListaEquipamentos] = useState(equipamentos);
  const [listaSetores, setListaSetores] = useState(setores);
  const [listaLocais, setListaLocais] = useState(locais);
  const [carregandoEntidades, setCarregandoEntidades] = useState(false);
  const [salvandoInterno, setSalvandoInterno] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (equipamentos.length > 0) setListaEquipamentos(equipamentos);
    if (setores.length > 0) setListaSetores(setores);
    if (locais.length > 0) setListaLocais(locais);
  }, [equipamentos, setores, locais]);

  useEffect(() => {
    let ativo = true;

    async function carregarEntidades() {
      // Se todas as listas já vieram via props, não precisa buscar novamente
      if (equipamentos.length > 0 && setores.length > 0 && locais.length > 0) {
        return;
      }

      setCarregandoEntidades(true);
      try {
        const [resEq, resSet, resLoc] = await Promise.all([
          equipamentos.length > 0
            ? Promise.resolve(null)
            : api.get('/equipamentos').catch(() => ({ data: [] })),
          setores.length > 0
            ? Promise.resolve(null)
            : api.get('/setores').catch(() => ({ data: [] })),
          locais.length > 0
            ? Promise.resolve(null)
            : api.get('/locais').catch(() => ({ data: [] })),
        ]);

        if (!ativo) return;

        if (resEq) setListaEquipamentos(extrairLista(resEq));
        if (resSet) setListaSetores(extrairLista(resSet));
        if (resLoc) setListaLocais(extrairLista(resLoc));
      } finally {
        if (ativo) setCarregandoEntidades(false);
      }
    }

    carregarEntidades();
    return () => {
      ativo = false;
    };
  }, [equipamentos.length, setores.length, locais.length]);

  const opcoesEntidade =
    escopo === 'Equipamento'
      ? listaEquipamentos
      : escopo === 'Setor'
      ? listaSetores
      : listaLocais;

  const obterIdOpcao = (opcao) => {
    if (escopo === 'Equipamento') return opcao.id_equipamento ?? opcao.id;
    if (escopo === 'Setor') return opcao.id_setor ?? opcao.id;
    return opcao.id_local ?? opcao.id;
  };

  const nomeOpcao = (opcao) => {
    const id = obterIdOpcao(opcao);
    if (escopo === 'Equipamento') {
      const nome = opcao.nome_equipamento || opcao.nome || `Equipamento ${id}`;
      return `${nome} · ${opcao.nome_setor || 'Sem setor'}`;
    }
    if (escopo === 'Setor') {
      const nome = opcao.nome_setor || opcao.nome || `Setor ${id}`;
      return `${nome} · ${opcao.nome_local || 'Sem local'}`;
    }
    return opcao.nome_local || opcao.nome || `Local ${id}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!entidade || valor === '') return;

    setErro('');
    setSalvandoInterno(true);

    const grandezaObj =
      grandezas.find((item) => item.valor === grandeza) || grandezas[0];
    const idNumerico = Number(entidade);

    const payloadApi = {
      descricao: descricao.trim(),
      grandeza: grandezaObj.apiValor,
      operador,
      valor: Number(valor),
      severidade: MAPA_SEVERIDADE_API[severidade] || 'atencao',
      periodo_inicial: periodoInicial || null,
      periodo_final: periodoFinal || null,
      ativa: limiteAtivo ? 1 : 0,
      id_equipamento: escopo === 'Equipamento' ? idNumerico : null,
      id_setor: escopo === 'Setor' ? idNumerico : null,
      id_local: escopo === 'Local' ? idNumerico : null,
    };

    try {
      let resposta;
      if (itemEdicao?.id_limite || itemEdicao?.id) {
        const idLimite = itemEdicao.id_limite || itemEdicao.id;
        resposta = await api.put(`/limites/${idLimite}`, payloadApi);
      } else {
        resposta = await api.post('/limites', payloadApi);
      }

      // Notifica o componente pai com os dados salvos e fecha o modal
      await onSalvar?.({
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
        payloadApi,
        resposta: resposta?.data,
      });

      onFechar?.();
    } catch (err) {
      console.error('Erro ao salvar limite:', err);
      const msg =
        err?.response?.data?.mensagem ||
        err?.response?.data?.erro ||
        'Não foi possível salvar o limite.';
      setErro(msg);
    } finally {
      setSalvandoInterno(false);
    }
  };

  const unidade = grandezas.find((item) => item.valor === grandeza)?.unidade;
  const salvando = salvandoExterno || salvandoInterno;
  const campo =
    'w-full rounded-xl border border-[#162136] bg-[#0B1220] px-3.5 py-2.5 text-slate-300 outline-none focus:border-[#2E5899]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
<<<<<<< HEAD
      <div className="wv-modal-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#141C2B] bg-[#070B15] p-6 text-slate-200 shadow-2xl">
        <div className="mb-6 flex items-start justify-between"><div><h2 className="text-lg font-medium text-slate-100">{itemEdicao ? 'Editar Limite' : 'Novo Limite'}</h2><p className="mt-0.5 text-xs text-slate-400">Configure uma condição para monitoramento energético.</p></div><button type="button" onClick={onFechar} className="rounded-lg p-1 text-slate-400 hover:bg-[#111B2A] hover:text-slate-200" aria-label="Fechar modal"><X size={18} /></button></div>
=======
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#141C2B] bg-[#070B15] p-6 text-slate-200 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-slate-100">
              {itemEdicao ? 'Editar Limite' : 'Novo Limite'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Configure uma condição para monitoramento energético.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-slate-400 hover:bg-[#111B2A] hover:text-slate-200"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {erro && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
            {erro}
          </div>
        )}

>>>>>>> 0d29116 (Filtros de tela medicao)
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-medium text-slate-300">
              Escopo
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#162136] bg-[#0B1220] p-1">
              {escopos.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setEscopo(item);
                    setEntidade('');
                  }}
                  className={`rounded-lg py-2 font-medium ${
                    escopo === item
                      ? 'bg-[#1C3B6E] text-white ring-1 ring-[#2E5899]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-medium text-slate-300">
              Entidade
            </label>
            <select
              required
              value={entidade}
              onChange={(event) => setEntidade(event.target.value)}
              disabled={carregandoEntidades}
              className={campo}
            >
              <option value="" disabled>
                {carregandoEntidades
                  ? 'Carregando entidades...'
                  : 'Selecionar entidade...'}
              </option>
              {opcoesEntidade.map((opcao) => {
                const id = obterIdOpcao(opcao);
                return (
                  <option key={id} value={id}>
                    {nomeOpcao(opcao)}
                  </option>
                );
              })}
            </select>
            {!carregandoEntidades && !opcoesEntidade.length && (
              <p className="mt-1 text-[11px] text-amber-400">
                Nenhuma entidade cadastrada neste escopo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <label className="mb-1.5 block font-medium text-slate-300">
                Grandeza
              </label>
              <select
                value={grandeza}
                onChange={(event) => setGrandeza(event.target.value)}
                className={campo}
              >
                {grandezas.map((item) => (
                  <option key={item.valor}>{item.valor}</option>
                ))}
              </select>
            </div>

            <div className="col-span-3">
              <label className="mb-1.5 block font-medium text-slate-300">
                Operador
              </label>
              <select
                value={operador}
                onChange={(event) => setOperador(event.target.value)}
                className={campo}
              >
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
              </select>
            </div>

            <div className="col-span-4">
              <label className="mb-1.5 block font-medium text-slate-300">
                Valor ({unidade})
              </label>
              <input
                required
                min="0"
                type="number"
                step="any"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                className={campo}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-medium text-slate-300">
              Severidade
            </label>
            <select
              value={severidade}
              onChange={(event) => setSeveridade(event.target.value)}
              className={campo}
            >
              <option>Atenção</option>
              <option>Crítico</option>
              <option>Meta</option>
              <option>Informativo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-medium text-slate-300">
                Período inicial
              </label>
              <input
                type="date"
                value={periodoInicial}
                onChange={(event) => setPeriodoInicial(event.target.value)}
                className={`${campo} [color-scheme:dark]`}
              />
            </div>

            <div>
              <label className="mb-1.5 block font-medium text-slate-300">
                Período final
              </label>
              <input
                type="date"
                value={periodoFinal}
                onChange={(event) => setPeriodoFinal(event.target.value)}
                className={`${campo} [color-scheme:dark]`}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-medium text-slate-300">
              Descrição
            </label>
            <textarea
              required
              rows={3}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Ex.: Meta mensal de consumo do equipamento"
              className={`${campo} resize-none placeholder:text-slate-600`}
            />
          </div>

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
              onChange={(event) => setLimiteAtivo(event.target.checked)}
              className="h-4 w-4 accent-[#2E5899]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-[#162136] bg-[#0B1220] px-4 py-2 text-slate-300 hover:bg-[#111B2A]"
            >
              Cancelar
            </button>
            <button
              disabled={salvando || !opcoesEntidade.length}
              type="submit"
              className="rounded-xl bg-[#1C3B6E] px-4 py-2 font-medium text-white ring-1 ring-[#2E5899] hover:bg-[#254b8a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Limite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}