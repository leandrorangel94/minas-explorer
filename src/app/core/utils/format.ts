/** Formata AAAA-MM-DD como data em pt-BR (ex.: 20/11/2026), sem deslocamento de fuso. */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/** Meses completos entre uma data AAAA-MM-DD e `now` (negativo se a data for futura). */
export function monthsSince(iso: string, now: Date = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  let months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m);
  if (now.getUTCDate() < d) months -= 1;
  return months;
}
