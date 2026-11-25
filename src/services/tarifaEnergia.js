const CHAVE_TARIFA = 'wattvision_tarifa';
const TARIFA_PADRAO = '0.80';

export function lerTarifaEnergia() {
  try {
    return localStorage.getItem(CHAVE_TARIFA) ?? TARIFA_PADRAO;
  } catch {
    return TARIFA_PADRAO;
  }
}

export function salvarTarifaEnergia(texto) {
  try {
    localStorage.setItem(CHAVE_TARIFA, texto);
  } catch { /* armazenamento indisponível */ }
}

export function converterTarifaEnergia(texto) {
  const valor = Number(texto.replace(',', '.'));
  return Number.isFinite(valor) ? Math.max(0, valor) : 0;
}
