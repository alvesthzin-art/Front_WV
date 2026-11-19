import { Building2 } from 'lucide-react';

export function GeralSistema({
  settings,
  updateSetting,
  labelClass,
  inputClass
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#26354B] bg-[#0D1521]">
      {/* Cabeçalho do cartão */}
      <div className="flex items-center gap-3 border-b border-[#26354B]/70 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#28515E] bg-[#14313D] text-[#6CA7B0]">
          <Building2 size={17} />
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            Informações do Sistema
          </h3>

          <p className="mt-1 text-[11px] text-[#647184]">
            Identificação do Watt Vision
          </p>
        </div>
      </div>

      {/* Campos das configurações */}
      <div className="space-y-4 p-5">
        <div>
          <label className={labelClass} htmlFor="empresa">
            Nome da empresa
          </label>

          <input
            id="empresa"
            className={inputClass}
            value={settings.nomeEmpresa}
            onChange={(event) =>
              updateSetting('nomeEmpresa', event.target.value)
            }
            placeholder="Nome da empresa"
          />
        </div>

        <div>
          <label className={labelClass}>
            Unidade de energia
          </label>

          <div className="mt-2 flex items-center justify-between rounded-xl border border-[#1C2D45] bg-[#101724] px-3 py-3 text-[13px] text-[#8E98A6]">
            <span>kWh</span>

            <span className="rounded-md bg-[#080D17] px-2 py-1 text-[9px] text-[#596474]">
              FIXO
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
