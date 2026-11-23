/** Formato de pesos colombianos: 1.234.567 (sin decimales). */
export function dinero(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return Math.round(v).toLocaleString('es-CO');
}

export function porcentaje(v: number | null | undefined, decimales = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${(v * 100).toLocaleString('es-CO', { maximumFractionDigits: decimales })} %`;
}

export function numero(v: number | null | undefined, decimales = 4): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toLocaleString('es-CO', { maximumFractionDigits: decimales });
}

/** Convierte lo que escribe la persona ("1.234,5" o "1234.5") en numero. */
export function leerNumero(texto: string): number {
  const t = texto.trim().replace(/\s/g, '');
  if (!t) return 0;
  // Si hay coma, el punto es separador de miles; si solo hay puntos repetidos, tambien.
  const limpio = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t;
  const n = parseFloat(limpio);
  return Number.isFinite(n) ? n : 0;
}

/** Reemplaza el valor de un arreglo en la posicion i (devuelve copia). */
export function conValor<T>(arr: T[], i: number, v: T): T[] {
  const c = [...arr];
  c[i] = v;
  return c;
}
