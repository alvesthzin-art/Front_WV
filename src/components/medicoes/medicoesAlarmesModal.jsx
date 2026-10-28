
import React, { useMemo, useState } from 'react';
<<<<<<< HEAD
=======
import NovoLimiteModal from './novoLimiteModal';
>>>>>>> juan1/main
import {
  X,
  Zap,
  Search,
<<<<<<< HEAD
  Plus,
  Pencil,
=======
  Pencil,
  Trash2,
  Plus,
>>>>>>> juan1/main
} from 'lucide-react';

const dadosIniciais = [
  {
    id: 1,
    entidade: 'Compressor HVAC-03',
    tipo: 'EQUIP.',
    grandeza: 'Potência',
    condicao: '',
    severidade: 'Crítico',
    periodo: 'Contínuo',
    status: 'Ativa',
  },
  {
    id: 2,
    entidade: 'Motor Bomba-07',
    tipo: 'EQUIP.',
    grandeza: 'Corrente',
    condicao: '',
    severidade: 'Crítico',
    periodo: 'Contínuo',
    status: 'Ativa',
  },
  {
    id: 3,
    entidade: 'Produção',
    tipo: 'SETOR',
    grandeza: 'Energia',
    condicao: '> 1.124 kWh',
    severidade: 'Meta',
    periodo: '01/09 a 30/09/2026',
    status: 'Ativa',
  },
  {
    id: 4,
    entidade: 'Planta Industrial Jandira',
    tipo: 'LOCAL',
    grandeza: 'Energia',
    condicao: '> 1.300 kWh',
    severidade: 'Meta',
    periodo: 'Contínuo',
    status: 'Ativa',
  },
  {
    id: 5,
    entidade: 'Prensa Hidráulica PH-01',
    tipo: 'EQUIP.',
    grandeza: 'Tensão',
    condicao: '< 200 V',
    severidade: 'Crítico',
    periodo: 'Contínuo',
    status: 'Inativa',
  },
  {
    id: 6,
    entidade: 'Chiller CH-01',
    tipo: 'EQUIP.',
    grandeza: 'Energia',
    condicao: '> 800 kWh',
    severidade: 'Atenção',
    periodo: '01/09 a 30/09/2026',
    status: 'Ativa',
  },
];

<<<<<<< HEAD
=======
const nomesEntidades = {
  'sensor-01': 'Sensor Principal - Ar Condicionado',
  'sensor-02': 'Sensor Secundário - Iluminação',
};

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

>>>>>>> juan1/main
export default function MedicoesAlarmesModal({ onClose }) {
  const [pesquisa, setPesquisa] = useState('');
  const [grandeza, setGrandeza] = useState('Todos');
  const [severidade, setSeveridade] = useState('Todos');
  const [status, setStatus] = useState('Todos');

  const [medicoes, setMedicoes] = useState(dadosIniciais);
<<<<<<< HEAD
=======
  const [novoLimiteAberto, setNovoLimiteAberto] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState(null);
>>>>>>> juan1/main

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

  function alternarStatus(id) {
    setMedicoes((atuais) =>
      atuais.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'Ativa' ? 'Inativa' : 'Ativa',
            }
          : item
      )
    );
  }

<<<<<<< HEAD
=======
  function deletarMedicao(id) {
    setMedicoes((atuais) =>
      atuais.filter((item) => item.id !== id)
    );

    if (itemParaEditar?.id === id) {
      fecharModalLimite();
    }
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

  function salvarLimite(dados) {
    const nomeEntidade =
      nomesEntidades[dados.entidade] ||
      dados.entidade ||
      'Nova entidade';

    const unidade = unidadesGrandeza[dados.grandeza] || '';

    const periodo =
      dados.periodoInicial && dados.periodoFinal
        ? `${formatarData(dados.periodoInicial)} a ${formatarData(
            dados.periodoFinal
          )}`
        : dados.periodoInicial
          ? `A partir de ${formatarData(dados.periodoInicial)}`
          : dados.periodoFinal
            ? `Até ${formatarData(dados.periodoFinal)}`
            : 'Contínuo';

    const condicaoFormatada = dados.valor
      ? `${dados.operador || '>'} ${dados.valor} ${unidade}`.trim()
      : '';

    const novoRegistro = {
      entidade: nomeEntidade,
      tipo: obterTipo(dados.escopo),
      grandeza: dados.grandeza,
      condicao: condicaoFormatada,
      severidade: dados.severidade,
      periodo,
    };

    if (itemParaEditar) {
      setMedicoes((atuais) =>
        atuais.map((item) =>
          item.id === itemParaEditar.id
            ? {
                ...item,
                ...novoRegistro,
                status:
                  dados.limiteAtivo === undefined
                    ? item.status
                    : dados.limiteAtivo
                      ? 'Ativa'
                      : 'Inativa',
              }
            : item
        )
      );
    } else {
      const novaMedicao = {
        id: Date.now(),
        ...novoRegistro,
        status: dados.limiteAtivo ? 'Ativa' : 'Inativa',
      };

      setMedicoes((atuais) => [...atuais, novaMedicao]);
    }

    fecharModalLimite();
  }

>>>>>>> juan1/main
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
<<<<<<< HEAD
=======

>>>>>>> juan1/main
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
<<<<<<< HEAD
=======
              <option>Informativo</option>
>>>>>>> juan1/main
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
<<<<<<< HEAD
            onClick={() =>
              window.alert('A criação de uma nova medição será implementada.')
            }
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#244C91] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2E5EAD]"
          >
            <Plus size={15} />
            Nova Medição
=======
            onClick={abrirNovoLimite}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C3B6E] px-4 py-2.5 text-sm font-medium text-white ring-1 ring-[#2E5899] transition hover:bg-[#254b8a]"
          >
            <Plus size={16} />
            Novo Limite
>>>>>>> juan1/main
          </button>
        </div>

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
              {listaFiltrada.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-[#172337] transition hover:bg-[#121E30]"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#28505B] bg-[#15313B] px-2 py-1 text-[9px] text-[#6CA8B0]">
                        {item.tipo}
                      </span>
<<<<<<< HEAD
=======

>>>>>>> juan1/main
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
                      onClick={() => alternarStatus(item.id)}
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

<<<<<<< HEAD
                  <td className="px-3 py-4 text-center">
                    <button
                      type="button"
                      title={`Editar ${item.entidade}`}
                      onClick={() =>
                        window.alert(`Edição de "${item.entidade}" será implementada.`)
                      }
                      className="rounded-lg p-1.5 text-[#A5AFBD] transition hover:bg-white/5 hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>
=======
                  {/* Ações */}
                  <td className="px-3 py-4">
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
                        title={`Excluir ${item.entidade}`}
                        onClick={() => deletarMedicao(item.id)}
                        className="p-1 text-[#C5A059] transition hover:text-[#E2C37B]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
>>>>>>> juan1/main
                  </td>
                </tr>
              ))}

              {listaFiltrada.length === 0 && (
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

<<<<<<< HEAD
=======
        {/* Rodapé */}
>>>>>>> juan1/main
        <footer className="border-t border-[#1D2C42] px-5 py-3 text-xs text-[#718096]">
          {listaFiltrada.length} de {medicoes.length} medições
        </footer>
      </section>
<<<<<<< HEAD
=======

      {/* Modal Criar / Editar Limite */}
      {novoLimiteAberto && (
        <NovoLimiteModal
          itemEdicao={itemParaEditar}
          onFechar={fecharModalLimite}
          onSalvar={salvarLimite}
        />
      )}
>>>>>>> juan1/main
    </div>
  );
}
