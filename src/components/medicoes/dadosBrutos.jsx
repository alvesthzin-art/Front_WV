
import { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const ITENS_POR_PAGINA = 10;

function converterDataHora(item) {
  // Prioriza a data completa recebida da API.
  if (item.data_hora) {
    const data = new Date(
      String(item.data_hora).replace(' ', 'T')
    );

    if (!Number.isNaN(data.getTime())) {
      return data.getTime();
    }
  }

  // Alternativa para registros que possuem data e hora separadas.
  if (item.data && item.hora) {
    const [dia, mes, ano] = item.data.split('/');
    const data = new Date(
      `${ano}-${mes}-${dia}T${item.hora}`
    );

    if (!Number.isNaN(data.getTime())) {
      return data.getTime();
    }
  }

  return 0;
}

export default function DadosBrutosModal({
  dados = [],
  totalRegistos,
  carregando = false,
  colunaAtiva = 'tensao',
  onFechar,
}) {
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Garante que os registros mais recentes apareçam primeiro.
  const dadosOrdenados = useMemo(() => {
    return [...dados].sort(
      (a, b) => converterDataHora(b) - converterDataHora(a)
    );
  }, [dados]);

  // Usa a quantidade real de registros recebidos.
  const total = totalRegistos ?? dadosOrdenados.length;

  const MAX_PAGINAS = 10;

  const totalPaginas = Math.min(
    Math.ceil(total / ITENS_POR_PAGINA),
    MAX_PAGINAS
  );
  // Evita permanecer em uma página que deixou de existir.
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;

  const dadosPagina = dadosOrdenados.slice(
    inicio,
    inicio + ITENS_POR_PAGINA
  );

  function mudarPagina(numero) {
    setPaginaAtual(
      Math.max(1, Math.min(numero, totalPaginas))
    );
  }

  const colunas = [
    { id: 'data', titulo: 'DATA' },
    { id: 'hora', titulo: 'HORA' },
    { id: 'tensao', titulo: 'TENSÃO (V)' },
    { id: 'corrente', titulo: 'CORRENTE (A)' },
    { id: 'potencia', titulo: 'POTÊNCIA (W)' },
    { id: 'energia', titulo: 'ENERGIA (KWH)' },
  ];

  return (
    <section className="w-full rounded-2xl border border-[#141C2B] bg-[#070B15] p-5 text-slate-300 shadow-2xl sm:p-6">

      {/* Cabeçalho */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-100">
          Dados Brutos
        </h2>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#3B4B66]">
            {total} registros
          </span>

          {onFechar && (
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar dados brutos"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-[#111B2A] hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Tabela */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#101827] font-semibold tracking-wider text-[#3B4B66]">
              {colunas.map((coluna) => {
                const eColunaAtiva =
                  colunaAtiva === coluna.id;

                return (
                  <th
                    key={coluna.id}
                    className={`whitespace-nowrap px-5 py-3.5 font-medium transition-colors ${
                      eColunaAtiva
                        ? 'wv-active-column-header bg-gradient-to-b from-[#183152] via-[#12243F] to-[#0E1A2E] font-semibold text-[#4B8BE8]'
                        : ''
                    }`}
                  >
                    {coluna.titulo}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#0F1626]/30">

            {carregando ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-slate-500"
                >
                  Carregando dados brutos...
                </td>
              </tr>
            ) : dadosPagina.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-slate-500"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              dadosPagina.map((item, index) => {
                const opacidadeLinha = Math.max(
                  0.12,
                  0.45 - index * 0.035
                );

                return (
                  <tr
                    key={`${item.data}-${item.hora}-${inicio + index}`}
                    className="text-slate-300 transition-colors hover:bg-[#09101F]"
                  >
                    {colunas.map((coluna) => {
                      const eColunaAtiva =
                        colunaAtiva === coluna.id;

                      return (
                        <td
                          key={coluna.id}
                          style={
                            eColunaAtiva
                              ? {
                                  backgroundColor: `rgba(16, 32, 58, ${opacidadeLinha})`,
                                }
                              : undefined
                          }
                          className={`whitespace-nowrap px-5 py-3.5 transition-colors ${
                            eColunaAtiva
                              ? 'wv-active-column-cell font-semibold text-slate-100'
                              : ['data', 'hora'].includes(coluna.id)
                                ? 'text-slate-400'
                                : 'text-slate-300'
                          }`}
                        >
                          {item[coluna.id] ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}

          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#3B4B66]">
        <span>
          Página {paginaSegura} de {totalPaginas}
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from(
            { length: totalPaginas },
            (_, i) => i + 1
          ).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => mudarPagina(num)}
              className={`h-7 w-7 rounded-lg text-xs font-medium transition-all ${
                paginaSegura === num
                  ? 'border border-[#2E5899] bg-[#1C3B6E] text-white shadow-sm ring-1 ring-[#3D6EB2]'
                  : 'border border-[#141F33] bg-[#0A1220] text-[#425473] hover:border-[#213554] hover:text-slate-200'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="hidden w-16 sm:block" />
      </footer>

    </section>
  );
}
