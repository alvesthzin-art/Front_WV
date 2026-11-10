import { ChevronDown, RefreshCw } from 'lucide-react';

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
            className="flex h-[36px] cursor-pointer items-center gap-2 rounded-full border border-slate-800 bg-[#111722] px-3 transition hover:border-slate-600"
          >
            <span className="whitespace-nowrap text-xs text-slate-500">
              {filtro.label}
            </span>
            <span className="relative flex items-center">
              <select
                value={valorAtual}
                onChange={(evento) => atualizarFiltro(filtro.key, evento.target.value)}
                className="max-w-[150px] cursor-pointer appearance-none bg-transparent pr-5 text-xs font-medium text-slate-300 outline-none"
              >
                {opcoesFiltro.map((opcao) => (
                  <option key={opcao} value={opcao} className="bg-[#111722]">
                    {opcao}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-0 text-slate-400" />
            </span>
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
