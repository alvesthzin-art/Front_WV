
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, MapPin } from 'lucide-react';

// Pontos iniciais para demonstração.
// Posteriormente, estes dados podem vir da API ou do banco de dados.
const pontosIniciais = [
  {
    id: 1,
    nome: 'Painel Elétrico PE-12',
    escopo: 'Equipamento',
    entidade: 'PE-12',
    dispositivo: 'PZEM-004T',
    modelo: 'PZEM-004T V3',
    ativo: true,
  },
  {
    id: 2,
    nome: 'Elétrica',
    escopo: 'Setor',
    entidade: 'Elétrica',
    dispositivo: 'PZEM-004T',
    modelo: 'PZEM-004T V3',
    ativo: true,
  },
  {
    id: 3,
    nome: 'Subestação Central',
    escopo: 'Local',
    entidade: 'Subestação Central',
    dispositivo: 'PZEM-004T',
    modelo: 'PZEM-004T V3',
    ativo: false,
  },
];

// Estado inicial do formulário.
const formularioInicial = {
  dispositivo: '',
  nome: '',
  escopo: 'Equipamento',
  entidade: '',
  modelo: 'PZEM-004T V3',
};

export default function PontosMedicao() {
  const [pontos, setPontos] = useState(pontosIniciais);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pontoEditando, setPontoEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  // Calcula os totais exibidos no resumo.
  const totalAtivos = pontos.filter((ponto) => ponto.ativo).length;
  const totalInativos = pontos.length - totalAtivos;

  // Atualiza um campo do formulário.
  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  // Abre o formulário para cadastrar um novo ponto.
  function novoPonto() {
    setPontoEditando(null);
    setFormulario(formularioInicial);
    setMostrarFormulario(true);
  }

  // Abre o formulário preenchido para editar um ponto existente.
  function editarPonto(ponto) {
    setPontoEditando(ponto.id);

    setFormulario({
      dispositivo: ponto.dispositivo,
      nome: ponto.nome,
      escopo: ponto.escopo,
      entidade: ponto.entidade,
      modelo: ponto.modelo,
    });

    setMostrarFormulario(true);
  }

  // Fecha o formulário sem salvar as alterações.
  function cancelarFormulario() {
    setMostrarFormulario(false);
    setPontoEditando(null);
    setFormulario(formularioInicial);
  }

  // Salva um novo ponto ou atualiza um ponto existente.
  function salvarPonto(event) {
    event.preventDefault();

    const dadosPonto = {
      nome: formulario.nome.trim(),
      escopo: formulario.escopo,
      entidade: formulario.entidade.trim(),
      dispositivo: formulario.dispositivo.trim(),
      modelo: formulario.modelo,
    };

    // Evita salvar o formulário sem os campos obrigatórios.
    if (
      !dadosPonto.nome ||
      !dadosPonto.entidade ||
      !dadosPonto.dispositivo
    ) {
      return;
    }

    if (pontoEditando !== null) {
      setPontos((anteriores) =>
        anteriores.map((ponto) =>
          ponto.id === pontoEditando
            ? { ...ponto, ...dadosPonto }
            : ponto
        )
      );
    } else {
      setPontos((anteriores) => [
        ...anteriores,
        {
          id: Date.now(),
          ...dadosPonto,
          ativo: true,
        },
      ]);
    }

    cancelarFormulario();
  }

  // Exclui um ponto após confirmação.
  function excluirPonto(id) {
    const confirmar = window.confirm(
      'Tem certeza de que deseja excluir este ponto de medição?'
    );

    if (confirmar) {
      setPontos((anteriores) =>
        anteriores.filter((ponto) => ponto.id !== id)
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-[#C0C5C8]">
      {/* Cabeçalho com os totais e a ação principal */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#202D40] px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-[#C0C5C8]">
            Pontos de Medição
          </h3>

          <p className="mt-1 text-sm text-[#7F8B9A]">
            {pontos.length} pontos configurados · {totalAtivos} ativos ·{' '}
            {totalInativos} inativos
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            onClick={novoPonto}
            className="inline-flex items-center gap-2 rounded-lg bg-[#17315F] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#21457F]"
          >
            <Plus size={17} />
            Novo Ponto
          </button>
        )}
      </div>

      {/* Área rolável: a altura do modal permanece controlada pelo componente pai */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {mostrarFormulario ? (
          /* Formulário de cadastro e edição */
          <form onSubmit={salvarPonto} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#17315F] text-[#8EB5FF]">
                <MapPin size={20} />
              </div>

              <div>
                <h4 className="font-semibold text-[#C0C5C8]">
                  {pontoEditando !== null
                    ? 'Editar ponto de medição'
                    : 'Novo ponto de medição'}
                </h4>

                <p className="text-sm text-[#7F8B9A]">
                  Configure o dispositivo e a entidade monitorada.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Identificação do dispositivo */}
              <div>
                <label
                  htmlFor="dispositivo"
                  className="mb-2 block text-sm text-[#AAB4C1]"
                >
                  Dispositivo *
                </label>

                <input
                  id="dispositivo"
                  name="dispositivo"
                  value={formulario.dispositivo}
                  onChange={atualizarCampo}
                  placeholder="Ex.: ESP32-01"
                  required
                  className="w-full rounded-lg border border-[#29384D] bg-[#080F1B] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#4A525B] focus:border-[#5A8F97]"
                />
              </div>

              {/* Nome que será mostrado na listagem */}
              <div>
                <label
                  htmlFor="nome"
                  className="mb-2 block text-sm text-[#AAB4C1]"
                >
                  Nome do Ponto *
                </label>

                <input
                  id="nome"
                  name="nome"
                  value={formulario.nome}
                  onChange={atualizarCampo}
                  placeholder="Ex.: Painel Elétrico PE-12"
                  required
                  className="w-full rounded-lg border border-[#29384D] bg-[#080F1B] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#4A525B] focus:border-[#5A8F97]"
                />
              </div>

              {/* Define a abrangência da medição */}
              <div>
                <label
                  htmlFor="escopo"
                  className="mb-2 block text-sm text-[#AAB4C1]"
                >
                  Escopo *
                </label>

                <select
                  id="escopo"
                  name="escopo"
                  value={formulario.escopo}
                  onChange={atualizarCampo}
                  required
                  className="w-full rounded-lg border border-[#29384D] bg-[#080F1B] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5A8F97]"
                >
                  <option value="Equipamento">Equipamento</option>
                  <option value="Setor">Setor</option>
                  <option value="Local">Local</option>
                </select>
              </div>

              {/* Entidade associada ao ponto */}
              <div>
                <label
                  htmlFor="entidade"
                  className="mb-2 block text-sm text-[#AAB4C1]"
                >
                  Entidade *
                </label>

                <input
                  id="entidade"
                  name="entidade"
                  value={formulario.entidade}
                  onChange={atualizarCampo}
                  placeholder="Nome da entidade monitorada"
                  required
                  className="w-full rounded-lg border border-[#29384D] bg-[#080F1B] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#4A525B] focus:border-[#5A8F97]"
                />
              </div>

              {/* Modelo do medidor utilizado */}
              <div className="md:col-span-2">
                <label
                  htmlFor="modelo"
                  className="mb-2 block text-sm text-[#AAB4C1]"
                >
                  PZEM Modelo *
                </label>

                <select
                  id="modelo"
                  name="modelo"
                  value={formulario.modelo}
                  onChange={atualizarCampo}
                  required
                  className="w-full rounded-lg border border-[#29384D] bg-[#080F1B] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5A8F97]"
                >
                  <option value="PZEM-004T V3">PZEM-004T V3</option>
                  <option value="PZEM-016">PZEM-016</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Ações do formulário */}
            <div className="flex justify-end gap-3 border-t border-[#202D40] pt-4">
              <button
                type="button"
                onClick={cancelarFormulario}
                className="inline-flex items-center gap-2 rounded-lg border border-[#29384D] px-4 py-2.5 text-sm text-[#AAB4C1] transition hover:bg-[#131E2E]"
              >
                <X size={16} />
                Cancelar
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#17315F] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#21457F]"
              >
                <Save size={16} />
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : (
          /* Tabela de pontos cadastrados */
          <div className="overflow-hidden rounded-xl border border-[#202D40]">
            {pontos.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#111B2A] text-[#8795A7]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ponto</th>
                    <th className="px-4 py-3 font-medium">Escopo</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#202D40]">
                  {pontos.map((ponto) => (
                    <tr
                      key={ponto.id}
                      className="transition hover:bg-[#111B2A]/70"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#C0C5C8]">
                          {ponto.nome}
                        </div>

                        <div className="mt-1 text-xs text-[#718096]">
                          {ponto.dispositivo} · {ponto.modelo}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[#AAB4C1]">
                        {ponto.escopo}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            ponto.ativo
                              ? 'bg-[#153B2B] text-[#69D49A]'
                              : 'bg-[#332B22] text-[#D9B27A]'
                          }`}
                        >
                          {ponto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editarPonto(ponto)}
                            title="Editar ponto"
                            aria-label={`Editar ${ponto.nome}`}
                            className="rounded-lg p-2 text-[#8CA8D8] transition hover:bg-[#17315F]/50 hover:text-white"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => excluirPonto(ponto.id)}
                            title="Excluir ponto"
                            aria-label={`Excluir ${ponto.nome}`}
                            className="rounded-lg p-2 text-[#C77C7C] transition hover:bg-red-950/50 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-12 text-center">
                <MapPin
                  size={30}
                  className="mx-auto mb-3 text-[#4A525B]"
                />

                <p className="text-sm text-[#AAB4C1]">
                  Nenhum ponto de medição cadastrado.
                </p>

                <button
                  type="button"
                  onClick={novoPonto}
                  className="mt-4 text-sm text-[#8EB5FF] hover:text-white"
                >
                  Cadastrar primeiro ponto
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
