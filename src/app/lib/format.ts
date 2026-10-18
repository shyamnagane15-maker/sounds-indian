const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// 1250 -> "₹1,250" (Indian digit grouping). Empty string when there is no price.
export function formatINR(value: unknown): string {
  const n = toNumber(value);
  if (n === null) return '';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)}`;
}

// How much lower the Indian LISTED price is, as a whole percent.
// Returns null when either price is missing or the Indian one isn't lower.
export function savingsPercent(price: unknown, foreignPrice: unknown): number | null {
  const p = toNumber(price);
  const f = toNumber(foreignPrice);
  if (p === null || f === null || f <= 0 || p < 0 || p >= f) return null;
  return Math.round((1 - p / f) * 100);
}
