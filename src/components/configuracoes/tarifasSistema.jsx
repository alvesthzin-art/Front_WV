import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const tarifaVazia = {
  descricao: '',
  valor: '',
  ativa: false,
  inicio: '',
  fim: '',
};

export function TarifasSistema() {
  const [tarifas, setTarifas] = useState([]);
  const [mostrarFormularioTarifa, setMostrarFormularioTarifa] =
    useState(false);
  const [tarifaEditando, setTarifaEditando] = useState(null);
  const [formTarifa, setFormTarifa] = useState(tarifaVazia);
  const [erroTarifa, setErroTarifa] = useState('');

  // Formata o valor no padrão monetário brasileiro.
  function formatarValor(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  }

  // Formata uma data no padrão brasileiro sem alterar o dia.
  function formatarData(data) {
    if (!data) return '—';

    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Abre o formulário para cadastrar uma nova tarifa.
  function adicionarTarifa() {
    setTarifaEditando(null);
    setFormTarifa({ ...tarifaVazia });
    setErroTarifa('');
    setMostrarFormularioTarifa(true);
  }

  // Abre o formulário preenchido com os dados da tarifa escolhida.
  function editarTarifa(tarifa) {
    setTarifaEditando(tarifa.id);
    setFormTarifa({
      descricao: tarifa.descricao,
      valor: String(tarifa.valor),
      ativa: tarifa.ativa,
      inicio: tarifa.inicio,
      fim: tarifa.fim || '',
    });
    setErroTarifa('');
    setMostrarFormularioTarifa(true);
  }

  // Fecha o formulário sem salvar.
  function cancelarFormularioTarifa() {
    setMostrarFormularioTarifa(false);
    setTarifaEditando(null);
    setFormTarifa({ ...tarifaVazia });
    setErroTarifa('');
  }

  // Salva uma tarifa nova ou atualiza uma já cadastrada.
  function salvarNovaTarifa(event) {
    event.preventDefault();
    setErroTarifa('');

    if (
      formTarifa.fim &&
      formTarifa.inicio &&
      formTarifa.fim < formTarifa.inicio
    ) {
      setErroTarifa(
        'A data final não pode ser anterior à data inicial.',
      );
      return;
    }

    const valorNumerico = Number(formTarifa.valor);

    if (!Number.isFinite(valorNumerico) || valorNumerico < 0) {
      setErroTarifa('Informe um valor válido para a tarifa.');
      return;
    }

    const tarifaSalva = {
      id: tarifaEditando ?? Date.now(),
      descricao: formTarifa.descricao.trim(),
      valor: valorNumerico,
      ativa: formTarifa.ativa,
      inicio: formTarifa.inicio,
      fim: formTarifa.fim,
    };

    setTarifas((atuais) => {
      // Se a tarifa salva for ativa, desativa as demais.
      const tarifasAtualizadas = atuais.map((tarifa) => ({
        ...tarifa,
        ativa: tarifaSalva.ativa
          ? false
          : tarifa.ativa,
      }));

      if (tarifaEditando !== null) {
        return tarifasAtualizadas.map((tarifa) =>
          tarifa.id === tarifaEditando
            ? tarifaSalva
            : tarifa,
        );
      }

      return [...tarifasAtualizadas, tarifaSalva];
    });

    cancelarFormularioTarifa();
  }

  // Exclui uma tarifa após confirmação.
  function excluirTarifa(id) {
    const confirmar = window.confirm(
      'Tem certeza de que deseja excluir esta tarifa?',
    );

    if (!confirmar) return;

    setTarifas((atuais) =>
      atuais.filter((tarifa) => tarifa.id !== id),
    );

    if (tarifaEditando === id) {
      cancelarFormularioTarifa();
    }
  }

  // Seleciona a tarifa ativa com a data inicial mais recente.
  const vigente = tarifas
    .filter((tarifa) => tarifa.ativa)
    .sort((a, b) => b.inicio.localeCompare(a.inicio))[0];

  return (
    <div className="space-y-4">
      {/* Cartão de destaque da tarifa vigente */}
      <section className="rounded-[18px] border border-[#24416D] bg-[#0D1521] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#8F9AA8]">
              Tarifa Ativa
            </p>

            {vigente ? (
              <>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-semibold text-[#C0C5C8] sm:text-[28px]">
                    {formatarValor(vigente.valor)}
                  </span>

                  <span className="text-xs text-[#647184]">
                    / kWh
                  </span>
                </div>

                <p className="mt-2 text-xs text-[#8F9AA8]">
                  {vigente.descricao} — desde{' '}
                  {formatarData(vigente.inicio)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[#8F9AA8]">
                Nenhuma tarifa ativa cadastrada.
              </p>
            )}
          </div>

          {vigente && (
            <span className="shrink-0 rounded-full border border-[#205A3A] bg-[#10291F] px-3 py-1 text-[10px] font-medium text-[#4CAF78]">
              Vigente
            </span>
          )}
        </div>
      </section>

      {/* Histórico de tarifas e botão de cadastro */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#C0C5C8]">
              Histórico de Tarifas
            </h3>

            <p className="mt-1 text-[11px] text-[#647184]">
              Valores cadastrados por período de vigência
            </p>
          </div>

          <button
            type="button"
            onClick={adicionarTarifa}
            className="flex items-center gap-2 rounded-xl bg-[#2855A4] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3568C4]"
          >
            <Plus size={14} />
            Nova Tarifa
          </button>
        </div>

        {/* Formulário de cadastro e edição */}
        {mostrarFormularioTarifa && (
          <form
            onSubmit={salvarNovaTarifa}
            className="mb-4 rounded-[18px] border border-[#24416D] bg-[#101724] p-4 sm:p-5"
          >
            <div className="mb-4">
              <label
                htmlFor="tarifa-descricao"
                className="text-xs font-medium text-[#afb5ba]"
              >
                Descrição
              </label>

              <input
                id="tarifa-descricao"
                type="text"
                required
                value={formTarifa.descricao}
                onChange={(event) =>
                  setFormTarifa((atual) => ({
                    ...atual,
                    descricao: event.target.value,
                  }))
                }
                placeholder="Digite a descrição da tarifa"
                className="mt-2 w-full rounded-xl border border-[#17315F] bg-[#070A15] px-3 py-3 text-[13px] text-[#C0C5C8] outline-none focus:border-[#5A8F97]"
              />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="tarifa-valor"
                  className="text-xs font-medium text-[#afb5ba]"
                >
                  Valor R$/kWh
                </label>

                <input
                  id="tarifa-valor"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formTarifa.valor}
                  onChange={(event) =>
                    setFormTarifa((atual) => ({
                      ...atual,
                      valor: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#17315F] bg-[#070A15] px-3 py-3 text-[13px] text-[#C0C5C8] outline-none focus:border-[#5A8F97]"
                />
              </div>

              <div>
                <label
                  htmlFor="tarifa-status"
                  className="text-xs font-medium text-[#afb5ba]"
                >
                  Status
                </label>

                <select
                  id="tarifa-status"
                  value={formTarifa.ativa ? 'ativa' : 'inativa'}
                  onChange={(event) =>
                    setFormTarifa((atual) => ({
                      ...atual,
                      ativa: event.target.value === 'ativa',
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#17315F] bg-[#070A15] px-3 py-3 text-[13px] text-[#C0C5C8] outline-none focus:border-[#5A8F97]"
                >
                  <option value="inativa">Inativa</option>
                  <option value="ativa">Ativa</option>
                </select>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="tarifa-inicio"
                  className="text-xs font-medium text-[#afb5ba]"
                >
                  Data Inicial
                </label>

                <input
                  id="tarifa-inicio"
                  type="date"
                  required
                  value={formTarifa.inicio}
                  onChange={(event) =>
                    setFormTarifa((atual) => ({
                      ...atual,
                      inicio: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#17315F] bg-[#070A15] px-3 py-3 text-[13px] text-[#C0C5C8] outline-none focus:border-[#5A8F97]"
                />
              </div>

              <div>
                <label
                  htmlFor="tarifa-fim"
                  className="text-xs font-medium text-[#afb5ba]"
                >
                  Data Final
                </label>

                <input
                  id="tarifa-fim"
                  type="date"
                  min={formTarifa.inicio || undefined}
                  value={formTarifa.fim}
                  onChange={(event) =>
                    setFormTarifa((atual) => ({
                      ...atual,
                      fim: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#17315F] bg-[#070A15] px-3 py-3 text-[13px] text-[#C0C5C8] outline-none focus:border-[#5A8F97]"
                />

                <p className="mt-1.5 text-[9px] text-[#596474]">
                  Deixe em branco se a tarifa estiver vigente sem data final.
                </p>
              </div>
            </div>

            {erroTarifa && (
              <p
                role="alert"
                className="mb-4 text-xs text-[#D96B75]"
              >
                {erroTarifa}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-[#26354B]/60 pt-4">
              <button
                type="button"
                onClick={cancelarFormularioTarifa}
                className="rounded-lg border border-[#24416D] px-3 py-2 text-[11px] font-medium text-[#9CA7B7] transition hover:bg-[#172235]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-lg bg-[#2855A4] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#3568C4]"
              >
                {tarifaEditando !== null
                  ? 'Salvar Alterações'
                  : 'Salvar Tarifa'}
              </button>
            </div>
          </form>
        )}

        {/* Tabela de histórico */}
        <div className="overflow-x-auto rounded-[18px] border border-[#1C2D45]">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-[#0B1320]">
              <tr className="border-b border-[#1C2D45] text-[10px] uppercase tracking-wide text-[#647184]">
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Valor (R$/kWh)</th>
                <th className="px-4 py-3 font-medium">Vigência</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              {tarifas
                .slice()
                .sort((a, b) => b.inicio.localeCompare(a.inicio))
                .map((tarifa) => (
                  <tr
                    key={tarifa.id}
                    className="border-b border-[#1C2D45]/70 last:border-b-0 hover:bg-[#111B2A]"
                  >
                    <td className="px-4 py-4 text-xs font-medium text-[#C0C5C8]">
                      {tarifa.descricao}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#9CA1A6]">
                      {formatarValor(tarifa.valor)}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#9CA1A6]">
                      {formatarData(tarifa.inicio)} —{' '}
                      {tarifa.fim
                        ? formatarData(tarifa.fim)
                        : 'atual'}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[10px] ${
                          tarifa.ativa
                            ? 'border-[#205A3A] bg-[#10291F] text-[#4CAF78]'
                            : 'border-[#24416D] bg-[#101B2D] text-[#7E91AD]'
                        }`}
                      >
                        {tarifa.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => editarTarifa(tarifa)}
                          aria-label={`Editar ${tarifa.descricao}`}
                          title="Editar tarifa"
                          className="rounded-md p-1.5 text-[#9CA7B7] transition hover:bg-[#1A2940] hover:text-white"
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirTarifa(tarifa.id)}
                          aria-label={`Excluir ${tarifa.descricao}`}
                          title="Excluir tarifa"
                          className="rounded-md p-1.5 text-[#D96B75] transition hover:bg-[#351B27] hover:text-red-300"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {tarifas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-[#647184]"
                  >
                    Nenhuma tarifa cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}