export function toMl(value, unit) {
  const v = Number(value || 0);
  if (unit === 'ml') return v;
  if (['l', 'L', 'liter', 'Liter'].includes(unit)) return v * 1000;
  throw new Error('Unsupported unit for liquid: ' + unit);
}
