
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const filters = [
  {
    label: 'Período:',
    key: 'period',
    options: ['Hoje', 'Últimos 7 dias', 'Últimos 30 dias'],
  },
  {
    label: 'Local:',
    key: 'location',
    options: ['Todos', 'Unidade 1', 'Unidade 2'],
  },
  {
    label: 'Setor:',
    key: 'sector',
    options: ['Todos', 'Produção', 'Manutenção'],
  },
  {
    label: 'Equipamento:',
    key: 'equipment',
    options: ['Todos', 'Motor', 'Bomba'],
  },
];

function DashboardFilters() {
  const [values, setValues] = useState({
    period: 'Hoje',
    location: 'Todos',
    sector: 'Todos',
    equipment: 'Todos',
  });

  const [openFilter, setOpenFilter] = useState(null);

  function selectOption(key, option) {
    setValues((current) => ({
      ...current,
      [key]: option,
    }));

    setOpenFilter(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <div key={filter.key} className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenFilter(
                openFilter === filter.key ? null : filter.key
              )
            }
            className="flex h-[36px] items-center gap-2 rounded-full border border-slate-800 bg-[#111722] px-3 transition hover:border-slate-600"
          >
            <span className="whitespace-nowrap text-xs text-slate-500">
              {filter.label}
            </span>

            <span className="whitespace-nowrap text-xs font-medium text-slate-300">
              {values[filter.key]}
            </span>

            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform ${
                openFilter === filter.key ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openFilter === filter.key && (
            <div className="absolute left-0 top-full z-50 mt-2 min-w-full overflow-hidden rounded-xl border border-slate-700 bg-[#111722] py-1 shadow-xl">
              {filter.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectOption(filter.key, option)}
                  className={`block w-full whitespace-nowrap px-4 py-2 text-left text-sm transition hover:bg-slate-800 ${
                    values[filter.key] === option
                      ? 'text-blue-400'
                      : 'text-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DashboardFilters;
