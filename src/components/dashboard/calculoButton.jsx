
import { useMemo, useState } from "react";

const composicaoInicial = [
  {
    id: "1",
    entidade: "Planta Industrial Jandira",
    valor: 1685.3,
    origem: "Calculado",
  },
  {
    id: "2",
    entidade: "Planta Industrial Osasco",
    valor: 2613.6,
    origem: "Calculado",
  },
  {
    id: "3",
    entidade: "Centro Logístico Alphaville",
    valor: 0,
    origem: "Sem dados",
  },
  {
    id: "4",
    entidade: "Subestação Central",
    valor: 245.8,
    origem: "Calculado",
  },
];

const formatarEnergia = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(valor);

export default function CalculoButton({
  composicao = composicaoInicial,
  total,
  cobertura,
  carregando = false,
  erro = null,
  aoAtualizar,
}) {
  const [modalAberto, setModalAberto] = useState(false);

  const dados = useMemo(() => {
    const itens = Array.isArray(composicao) ? composicao : [];

    const somaCalculada = itens.reduce((soma, item) => {
      const valor = Number(item.valor);
      return soma + (Number.isFinite(valor) ? valor : 0);
    }, 0);

    const totalCalculado =
      total != null && Number.isFinite(Number(total))
        ? Number(total)
        : somaCalculada;

    const monitorados = itens.filter(
      (item) =>
        item.origem !== "Sem dados" &&
        item.valor != null &&
        Number.isFinite(Number(item.valor))
    ).length;

    const totalEntidades = itens.length;

    return {
      itens,
      total: totalCalculado,
      monitorados: cobertura?.monitorados ?? monitorados,
      totalEntidades: cobertura?.total ?? totalEntidades,
    };
  }, [composicao, total, cobertura]);

  const percentual =
    dados.totalEntidades > 0
      ? Math.round((dados.monitorados / dados.totalEntidades) * 100)
      : 0;

  const coberturaCompleta =
    dados.totalEntidades > 0 &&
    dados.monitorados >= dados.totalEntidades;

  const fecharModal = () => setModalAberto(false);

  return (
    <>
      {/* Botão compacto no Dashboard */}
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/20 bg-[#101a2d] px-3 py-2 text-xs text-blue-400 transition hover:border-blue-500/60 hover:bg-[#172541]"
      >
        <span aria-hidden="true">Σ</span>
        <span>Ver composição</span>
        <span aria-hidden="true">→</span>
      </button>

      {/* Modal */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-calculo"
            className="my-auto flex max-h-[94dvh] w-full max-w-[610px] flex-col overflow-hidden rounded-[28px] border border-slate-700/80 bg-[#0d1727] text-slate-200 shadow-2xl"
          >
            {/* Cabeçalho */}
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-blue-900/30 bg-gradient-to-r from-[#192b49] to-[#0d1727] px-5 py-5 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-2xl text-blue-400">
                  Σ
                </div>

                <div>
                  <h2
                    id="titulo-calculo"
                    className="text-lg font-semibold sm:text-xl"
                  >
                    Valor Calculado
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Sistema completo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                aria-label="Fechar modal"
                className="rounded-lg px-2 text-2xl text-slate-500 transition hover:bg-white/5 hover:text-white"
              >
                ×
              </button>
            </header>

            {/* Conteúdo rolável */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">
              {carregando ? (
                <div
                  className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-400"
                  role="status"
                >
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
                  Carregando composição...
                </div>
              ) : erro ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300"
                >
                  <p>{erro}</p>

                  {aoAtualizar && (
                    <button
                      type="button"
                      onClick={aoAtualizar}
                      className="mt-4 rounded-lg border border-red-400/30 px-4 py-2 hover:bg-red-500/10"
                    >
                      Tentar novamente
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Tabela */}
                  <div className="overflow-hidden rounded-2xl border border-blue-900/40 bg-[#0e1726]">
                    <div className="border-b border-slate-800 px-5 py-4">
                      <h3 className="font-medium text-slate-200">
                        Composição
                      </h3>
                    </div>

                    <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr] gap-2 border-b border-slate-800 px-4 py-4 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:px-6 sm:text-xs">
                      <span>Entidade</span>
                      <span>Valor</span>
                      <span>Origem</span>
                    </div>

                    {dados.itens.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-slate-400">
                        Nenhuma medição encontrada.
                      </p>
                    ) : (
                      dados.itens.map((item, index) => {
                        const semDados =
                          item.origem === "Sem dados" ||
                          item.valor == null ||
                          !Number.isFinite(Number(item.valor));

                        return (
                          <div
                            key={item.id ?? item.entidade ?? index}
                            className="grid grid-cols-[1.4fr_0.7fr_0.8fr] items-center gap-2 border-b border-slate-800/80 px-4 py-4 last:border-b-0 sm:px-6 sm:py-5"
                          >
                            <span className="break-words text-sm leading-5 text-slate-200 sm:text-base">
                              {item.entidade}
                            </span>

                            <span className="text-sm leading-5 text-slate-300 sm:text-base">
                              {semDados
                                ? "0"
                                : formatarEnergia(Number(item.valor))}
                              <span className="block">kWh</span>
                            </span>

                            <span
                              className={`w-fit max-w-full rounded-full border px-2 py-1 text-[10px] sm:px-3 sm:text-xs ${
                                semDados
                                  ? "border-slate-700/60 bg-slate-800/40 text-slate-500"
                                  : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                              }`}
                            >
                              {semDados
                                ? "Sem dados"
                                : item.origem || "Calculado"}
                            </span>
                          </div>
                        );
                      })
                    )}

                    {/* Total */}
                    <div className="flex justify-end bg-[#070c17] px-4 py-5 sm:px-6">
                      <p className="text-right text-sm font-semibold text-slate-200 sm:text-base">
                        Soma total: {formatarEnergia(dados.total)} kWh
                      </p>
                    </div>
                  </div>

                  {/* Cobertura */}
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-xs ${
                        coberturaCompleta
                          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                          : "border-amber-400/20 bg-amber-500/20 text-amber-200"
                      }`}
                    >
                      {coberturaCompleta
                        ? "Cobertura completa"
                        : "Cobertura parcial"}{" "}
                      · {dados.monitorados}/{dados.totalEntidades}
                      {" · "}
                      {percentual}%
                    </span>
                  </div>

                  {/* Aviso */}
                  {!coberturaCompleta && (
                    <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-[#51401c] p-4 sm:p-5">
                      <span className="mt-0.5 shrink-0 text-amber-100">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                      </span>

                      <p className="text-sm leading-6 text-amber-100/70">
                        Alguns filhos não possuem dados de medição. O valor
                        apresentado reflete apenas as entidades monitoradas.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Rodapé */}
            <footer className="flex shrink-0 justify-end border-t border-slate-800 bg-[#0d1727] px-5 py-5 sm:px-8">
              <button
                type="button"
                onClick={fecharModal}
                className="rounded-xl border border-blue-900/70 px-6 py-3 text-sm text-slate-300 transition hover:border-blue-500 hover:bg-blue-500/5"
              >
                Fechar
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
