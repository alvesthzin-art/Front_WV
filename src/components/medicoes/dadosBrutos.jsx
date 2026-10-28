import React, { useState } from 'react';
import { X } from 'lucide-react';

// Dados demonstrativos com variação de medições
const DADOS_DEMO = [
  { data: '28/10/2026', hora: '10:01', tensao: '215,8', corrente: '65,5', potencia: '10,66', energia: '103,3' },
  { data: '28/10/2026', hora: '09:51', tensao: '215,9', corrente: '66,0', potencia: '19,90', energia: '104,6' },
  { data: '28/10/2026', hora: '09:41', tensao: '217,6', corrente: '81,9', potencia: '10,22', energia: '105,6' },
  { data: '28/10/2026', hora: '09:31', tensao: '215,4', corrente: '61,5', potencia: '13,27', energia: '107,3' },
  { data: '28/10/2026', hora: '09:21', tensao: '217,1', corrente: '60,8', potencia: '15,53', energia: '108,6' },
  { data: '28/10/2026', hora: '09:11', tensao: '219,0', corrente: '58,0', potencia: '18,65', energia: '110,6' },
  { data: '28/10/2026', hora: '09:01', tensao: '226,5', corrente: '59,1', potencia: '15,08', energia: '112,5' },
  { data: '28/10/2026', hora: '08:51', tensao: '218,2', corrente: '71,0', potencia: '19,88', energia: '116,8' },
  { data: '28/10/2026', hora: '08:41', tensao: '217,3', corrente: '60,0', potencia: '12,75', energia: '117,0' },
  { data: '28/10/2026', hora: '08:31', tensao: '219,2', corrente: '68,0', potencia: '14,57', energia: '120,0' },
  { data: '28/10/2026', hora: '08:21', tensao: '226,9', corrente: '58,9', potencia: '18,18', energia: '120,8' },
  { data: '28/10/2026', hora: '08:11', tensao: '216,5', corrente: '64,4', potencia: '12,41', energia: '122,9' },
  { data: '28/10/2026', hora: '08:01', tensao: '223,5', corrente: '56,2', potencia: '13,49', energia: '121,1' },
  { data: '28/10/2026', hora: '07:51', tensao: '216,8', corrente: '68,1', potencia: '18,83', energia: '123,7' },
  { data: '28/10/2026', hora: '07:41', tensao: '215,2', corrente: '77,4', potencia: '19,07', energia: '125,9' },
];

const ITENS_POR_PAGINA = 10;

export default function DadosBrutosModal({
  dados = DADOS_DEMO,
  totalRegistos,
  carregando = false,
  colunaAtiva = 'tensao',
  onFechar,
}) {
  const [paginaAtual, setPaginaAtual] = useState(1);

  const total = totalRegistos ?? 50;
  const totalPaginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA)) || 4;

  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
  const dadosPagina = dados.slice(inicio, inicio + ITENS_POR_PAGINA);

  function mudarPagina(numero) {
    setPaginaAtual(Math.max(1, Math.min(numero, totalPaginas)));
  }

  const colunas = [
    { id: 'data', titulo: 'DATA' },
    { id: 'hora', titulo: 'HORA' },
    { id: 'tensao', titulo: 'TENSÃO (V)' },
    { id: 'corrente', titulo: 'CORRENTE (A)' },
    { id: 'potencia', titulo: 'POTÊNCIA (KW)' },
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

      {/* Tabela com Degradê Azul Global na Coluna Ativa */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#101827] font-semibold tracking-wider text-[#3B4B66]">
              {colunas.map((coluna) => {
                const eColunaAtiva = colunaAtiva === coluna.id;
                return (
                  <th
                    key={coluna.id}
                    className={`whitespace-nowrap px-5 py-3.5 font-medium transition-colors ${
                      eColunaAtiva
                        ? 'bg-gradient-to-b from-[#183152] via-[#12243F] to-[#0E1A2E] font-semibold text-[#4B8BE8]'
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
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  Carregando dados brutos...
                </td>
              </tr>
            ) : dadosPagina.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              dadosPagina.map((item, index) => {
                // Suaviza o tom de azul à medida que desce pelas linhas da tabela
                const opacidadeLinha = Math.max(0.12, 0.45 - index * 0.035);

                return (
                  <tr
                    key={`${item.data}-${item.hora}-${inicio + index}`}
                    className="text-slate-300 transition-colors hover:bg-[#09101F]"
                  >
                    {colunas.map((coluna) => {
                      const eColunaAtiva = colunaAtiva === coluna.id;
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
                              ? 'font-semibold text-slate-100'
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

      {/* Rodapé e Paginação Numérica estilo Foto 1 */}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#3B4B66]">
        <span>
          Página {paginaSegura} de {totalPaginas}
        </span>

        {/* Botões de navegação numéricos */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
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