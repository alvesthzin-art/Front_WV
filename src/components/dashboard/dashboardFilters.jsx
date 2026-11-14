import { RefreshCw } from 'lucide-react';

const filtrosConfig = [
  { label: 'Período:', key: 'periodo' },
  { label: 'Local:', key: 'local' },
  { label: 'Setor:', key: 'setor' },
  { label: 'Equipamento:', key: 'equipamento' },
  { label: 'Grandeza:', key: 'grandeza' },
];

export default function DashboardFilters({ filtros, opcoes = {}, onFiltrosChange, atualizadoEm }) {
  const atualizarFiltro = (chave, valor) => {
    onFiltrosChange?.((atuais) => ({ ...atuais, [chave]: valor }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filtrosConfig.map((filtro) => {
        const valorAtual = filtros?.[filtro.key] ?? '';
        const opcoesFiltro = opcoes[filtro.key] ?? [];

        return (
          <label
            key={filtro.key}
            className="wv-filter-control flex h-10 cursor-pointer items-center gap-2 px-3"
          >
            <span className="whitespace-nowrap text-xs text-slate-500">
              {filtro.label}
            </span>
            <select
              value={valorAtual}
              onChange={(evento) => atualizarFiltro(filtro.key, evento.target.value)}
              className="wv-filter-select max-w-[150px] cursor-pointer bg-transparent text-xs font-semibold outline-none"
            >
              {opcoesFiltro.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </label>
        );
      })}

      <div className="ml-auto flex items-center gap-1.5 pl-2 text-[11px] text-[#7b8794]">
        <RefreshCw className="h-3 w-3" />
        <span>{atualizadoEm ? `Atualizado às ${atualizadoEm}` : 'Aguardando atualização'}</span>
      </div>
    </div>
  );
}
