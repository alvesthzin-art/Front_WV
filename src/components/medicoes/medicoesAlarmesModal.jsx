import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import NovoLimiteModal from './novoLimiteModal';
import {
  X,
  Zap,
  Search,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

const unidadesGrandeza = {
  Potência: 'kW',
  Tensão: 'V',
  Corrente: 'A',
  Energia: 'kWh',
};

function formatarData(data) {
  if (!data) return '';

  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function obterTipo(escopo) {
  if (escopo === 'Equipamento') return 'EQUIP.';
  if (escopo === 'Setor') return 'SETOR';
  return 'LOCAL';
}

const grandezaApi = { Potência: 'potencia', Tensão: 'tensao', Corrente: 'corrente', Energia: 'energia' };
const grandezaTela = { potencia: 'Potência', tensao: 'Tensão', corrente: 'Corrente', energia: 'Energia' };
const severidadeApi = { 'Atenção': 'atencao', Crítico: 'critico', Meta: 'meta', Informativo: 'informativo' };
const severidadeTela = { atencao: 'Atenção', critico: 'Crítico', meta: 'Meta', informativo: 'Informativo' };

function extrairDados(resposta) {
  return Array.isArray(resposta?.data?.dados) ? resposta.data.dados : [];
}

function nomeEntidade(item, equipamentos, setores, locais) {
  if (item.id_equipamento) return equipamentos.find((itemAtual) => itemAtual.id === item.id_equipamento)?.nome || `Equipamento ${item.id_equipamento}`;
  if (item.id_setor) return setores.find((itemAtual) => itemAtual.id === item.id_setor)?.nome || `Setor ${item.id_setor}`;
  return locais.find((itemAtual) => itemAtual.id === item.id_local)?.nome || `Local ${item.id_local}`;
}

function converterLimite(item, equipamentos, setores, locais) {
  const grandeza = grandezaTela[item.grandeza] || item.grandeza;
  const unidade = unidadesGrandeza[grandeza] || '';
  const escopo = item.id_equipamento ? 'Equipamento' : item.id_setor ? 'Setor' : 'Local';
  const entidadeId = item.id_equipamento || item.id_setor || item.id_local;
  const periodo = item.periodo_inicial && item.periodo_final
    ? `${formatarData(String(item.periodo_inicial).slice(0, 10))} a ${formatarData(String(item.periodo_final).slice(0, 10))}`
    : item.periodo_inicial ? `A partir de ${formatarData(String(item.periodo_inicial).slice(0, 10))}`
      : item.periodo_final ? `Até ${formatarData(String(item.periodo_final).slice(0, 10))}` : 'Contínuo';
  return {
    ...item,
    id: item.id,
    escopo,
    entidadeId,
    entidade: nomeEntidade(item, equipamentos, setores, locais),
    tipo: obterTipo(escopo),
    grandeza,
    condicao: `${item.operador} ${item.valor} ${unidade}`,
    severidade: severidadeTela[item.severidade] || item.severidade,
    periodo,
    status: Number(item.ativa) === 1 ? 'Ativa' : 'Inativa',
  };
}

export default function MedicoesAlarmesModal({ onClose }) {
  const [pesquisa, setPesquisa] = useState('');
  const [grandeza, setGrandeza] = useState('Todos');
  const [severidade, setSeveridade] = useState('Todos');
  const [status, setStatus] = useState('Todos');

  const [medicoes, setMedicoes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [locais, setLocais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [novoLimiteAberto, setNovoLimiteAberto] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState(null);

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    try {
      const [limitesResposta, equipamentosResposta, setoresResposta, locaisResposta] = await Promise.all([
        api.get('/limites'), api.get('/equipamentos'), api.get('/setores'), api.get('/locais'),
      ]);
      const equipamentosAtuais = extrairDados(equipamentosResposta);
      const setoresAtuais = extrairDados(setoresResposta);
      const locaisAtuais = extrairDados(locaisResposta);
      setEquipamentos(equipamentosAtuais); setSetores(setoresAtuais); setLocais(locaisAtuais);
      setMedicoes(extrairDados(limitesResposta).map((item) => converterLimite(item, equipamentosAtuais, setoresAtuais, locaisAtuais)));
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Não foi possível carregar as metas do banco de dados.');
    } finally { setCarregando(false); }
  }

  useEffect(() => { const timer = setTimeout(() => { void carregarDados(); }, 0); return () => clearTimeout(timer); }, []);

  const listaFiltrada = useMemo(() => {
    return medicoes.filter((item) => {
      const correspondePesquisa = item.entidade
        .toLowerCase()
        .includes(pesquisa.toLowerCase());

      const correspondeGrandeza =
        grandeza === 'Todos' || item.grandeza === grandeza;

      const correspondeSeveridade =
        severidade === 'Todos' || item.severidade === severidade;

      const correspondeStatus =
        status === 'Todos' || item.status === status;

      return (
        correspondePesquisa &&
        correspondeGrandeza &&
        correspondeSeveridade &&
        correspondeStatus
      );
    });
  }, [medicoes, pesquisa, grandeza, severidade, status]);

  async function alternarStatus(item) {
    try {
      await api.patch(`/limites/${item.id}/status`, { ativa: item.status !== 'Ativa' });
      await carregarDados();
    } catch (error) { setErro(error.response?.data?.mensagem || 'Não foi possível alterar o status da meta.'); }
  }

  async function desativarMedicao(item) {
    if (item.status === 'Inativa') return;
    await alternarStatus(item);
  }

  function abrirNovoLimite() {
    setItemParaEditar(null);
    setNovoLimiteAberto(true);
  }

  function abrirEdicao(item) {
    setItemParaEditar(item);
    setNovoLimiteAberto(true);
  }

  function fecharModalLimite() {
    setNovoLimiteAberto(false);
    setItemParaEditar(null);
  }

  async function salvarLimite(dados) {
    const entidadeId = Number(dados.entidade);
    const payload = {
      descricao: dados.descricao.trim(), grandeza: grandezaApi[dados.grandeza], operador: dados.operador,
      valor: dados.valor, severidade: severidadeApi[dados.severidade], periodo_inicial: dados.periodoInicial || null,
      periodo_final: dados.periodoFinal || null, ativa: dados.limiteAtivo ? 1 : 0,
      id_equipamento: dados.escopo === 'Equipamento' ? entidadeId : null,
      id_setor: dados.escopo === 'Setor' ? entidadeId : null, id_local: dados.escopo === 'Local' ? entidadeId : null,
    };
    setSalvando(true); setErro('');
    try {
      if (itemParaEditar) await api.put(`/limites/${itemParaEditar.id}`, payload);
      else await api.post('/limites', payload);
      fecharModalLimite(); await carregarDados();
    } catch (error) { setErro(error.response?.data?.mensagem || 'Não foi possível salvar a meta.'); }
    finally { setSalvando(false); }
  }

  const estiloSelect =
    'rounded-xl border border-[#1D2C42] bg-[#101827] px-3 py-2.5 text-xs text-[#AEB9C8] outline-none focus:border-[#5A8F97]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="medicoes-alarmes-titulo"
        className="flex max-h-[94vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-[20px] border border-[#263448] bg-[#0C141F] text-[#C0C5C8] shadow-2xl"
      >
        {/* Cabeçalho */}
        <header className="flex items-start justify-between border-b border-[#1D2C42] bg-gradient-to-r from-[#13213A] to-[#0C141F] px-5 py-5 sm:px-6">
          <div>
            <h2
              id="medicoes-alarmes-titulo"
              className="flex items-center gap-2 text-lg font-semibold text-[#D0D8E5]"
            >
              <Zap size={18} className="text-[#5A8F97]" />
              Medições para Alarmes
            </h2>

            <p className="mt-1 text-xs text-[#91A4BD]">
              Condições configuradas sobre entidades monitoradas
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="rounded-lg p-1 text-[#647184] transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {/* Filtros */}
        <div className="flex flex-col gap-3 border-b border-[#1D2C42] p-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526176]"
            />

            <input
              type="text"
              value={pesquisa}
              onChange={(event) => setPesquisa(event.target.value)}
              placeholder="Pesquisar por entidade..."
              className="w-full rounded-xl border border-[#17253A] bg-[#070D18] py-2.5 pl-9 pr-3 text-xs text-[#C0C5C8] outline-none placeholder:text-[#465164] focus:border-[#34517A]"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:flex">
            <select
              aria-label="Filtrar por grandeza"
              value={grandeza}
              onChange={(event) => setGrandeza(event.target.value)}
              className={estiloSelect}
            >
              <option>Todos</option>
              <option>Tensão</option>
              <option>Corrente</option>
              <option>Potência</option>
              <option>Energia</option>
            </select>

            <select
              aria-label="Filtrar por severidade"
              value={severidade}
              onChange={(event) => setSeveridade(event.target.value)}
              className={estiloSelect}
            >
              <option>Todos</option>
              <option>Crítico</option>
              <option>Atenção</option>
              <option>Meta</option>
              <option>Informativo</option>
            </select>

            <select
              aria-label="Filtrar por status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={estiloSelect}
            >
              <option>Todos</option>
              <option>Ativa</option>
              <option>Inativa</option>
            </select>
          </div>

          <button
            type="button"
            onClick={abrirNovoLimite}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1C3B6E] px-4 py-2.5 text-xs font-semibold text-white ring-1 ring-[#2E5899] transition hover:bg-[#254b8a]"
          >
            <Plus size={15} />
            Novo Limite
          </button>
        </div>

        {erro && <div className="mx-4 mt-4 rounded-xl border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">{erro}</div>}

        {/* Tabela */}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#101927] text-[10px] uppercase text-[#66758A]">
              <tr>
                <th className="px-4 py-3 font-medium">Entidade</th>
                <th className="px-3 py-3 font-medium">Grandeza</th>
                <th className="px-3 py-3 font-medium">Condição</th>
                <th className="px-3 py-3 font-medium">Severidade</th>
                <th className="px-3 py-3 font-medium">Período</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-center font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[#7E8A9D]">Carregando metas...</td></tr>
              ) : listaFiltrada.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-[#172337] transition hover:bg-[#121E30]"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#28505B] bg-[#15313B] px-2 py-1 text-[9px] text-[#6CA8B0]">
                        {item.tipo}
                      </span>

                      <span className="font-semibold text-[#BEC6D0]">
                        {item.entidade}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-4 text-[#A5AFBD]">
                    {item.grandeza}
                  </td>

                  <td className="px-3 py-4 font-semibold text-[#C0C5C8]">
                    {item.condicao || '—'}
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[10px] ${
                        item.severidade === 'Crítico'
                          ? 'border-[#71383C] bg-[#291A20] text-[#E59A92]'
                          : item.severidade === 'Atenção'
                            ? 'border-[#735C2D] bg-[#3A301C] text-[#E5C47B]'
                            : 'border-[#31566B] bg-[#142A3B] text-[#80B6C6]'
                      }`}
                    >
                      {item.severidade}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-[#A5AFBD]">
                    {item.periodo}
                  </td>

                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => alternarStatus(item)}
                      title="Alternar status"
                      className={`rounded-full border px-2 py-1 text-[10px] ${
                        item.status === 'Ativa'
                          ? 'border-[#174D36] bg-[#102C22] text-[#4BAE7B]'
                          : 'border-[#293C57] bg-[#111C2D] text-[#8392A8]'
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        title={`Editar ${item.entidade}`}
                        onClick={() => abrirEdicao(item)}
                        className="p-1 text-[#C5A059] transition hover:text-[#E2C37B]"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        title={`Desativar ${item.entidade}`}
                        onClick={() => desativarMedicao(item)}
                        className="p-1 text-[#C5A059] transition hover:text-[#E2C37B]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!carregando && listaFiltrada.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-[#7E8A9D]"
                  >
                    Nenhuma medição encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <footer className="border-t border-[#1D2C42] px-5 py-3 text-xs text-[#718096]">
          {listaFiltrada.length} de {medicoes.length} medições
        </footer>
      </section>

      {/* Modal Criar / Editar Limite */}
      {novoLimiteAberto && (
        <NovoLimiteModal
          key={itemParaEditar?.id ?? 'novo'}
          itemEdicao={itemParaEditar}
          equipamentos={equipamentos}
          setores={setores}
          locais={locais}
          salvando={salvando}
          onFechar={fecharModalLimite}
          onSalvar={salvarLimite}
        />
      )}
    </div>
  );
}
