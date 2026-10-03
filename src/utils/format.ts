/**
 * Utilities for formatting Colombian currency (COP), weights, percentages, and dates
 * strictly adhering to Colombian agroindustrial standards.
 */

export const formatCOP = (amount: number, includeDecimals = false): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0 COP';
  }
  const rounded = includeDecimals ? amount.toFixed(1) : Math.round(amount).toString();
  
  // Format with dot thousand separator as standard in Colombia
  const parts = rounded.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] ? `,${parts[1]}` : '';

  return `$ ${integerPart}${decimalPart} COP`;
};

export const formatSimpleCOP = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0';
  }
  const integerPart = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${integerPart}`;
};

export const formatKilograms = (kg: number, decimals = 1): string => {
  if (isNaN(kg) || kg === null || kg === undefined) return '0 kg';
  const formatted = kg.toFixed(decimals).replace('.', ',');
  return `${formatted} kg`;
};

export const formatGrams = (grams: number): string => {
  if (isNaN(grams) || grams === null || grams === undefined) return '0 g';
  return `${Math.round(grams)} g`;
};

export const formatPercent = (pct: number, decimals = 1): string => {
  if (isNaN(pct) || pct === null || pct === undefined) return '0,0%';
  return `${pct.toFixed(decimals).replace('.', ',')}%`;
};

export const formatColombianDate = (isoStringOrDate: string | Date): string => {
  try {
    const d = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(isoStringOrDate);
  }
};

export const formatColombianDateTime = (isoStringOrDate: string | Date): string => {
  try {
    const d = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(isoStringOrDate);
  }
};

/**
 * Technical agroindustrial costing calculation:
 * Costo Real/kg Deshidratado = (Costo Fresca / (1 - Merma%)) + Costo Energía Túnel
 */
export const calculateDehydratedUnitCost = (
  freshKgPriceCop: number,
  shrinkagePct: number,
  energyCostPerKgDryCop = 2000
): { costPerKgDry: number; costPerGram: number; yieldGramsPerKg: number } => {
  const yieldPct = Math.max(0.1, 100 - shrinkagePct) / 100;
  const rawMaterialCostPerKgDry = freshKgPriceCop / yieldPct;
  const totalCostPerKgDry = Math.round(rawMaterialCostPerKgDry + energyCostPerKgDryCop);
  const costPerGram = Number((totalCostPerKgDry / 1000).toFixed(2));
  const yieldGramsPerKg = Math.round(yieldPct * 1000);

  return {
    costPerKgDry: totalCostPerKgDry,
    costPerGram,
    yieldGramsPerKg,
  };
};
