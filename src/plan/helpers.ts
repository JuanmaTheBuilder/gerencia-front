import type { LineaAnual, PlanDatos } from './types';

/** Serie por año a partir de un valor del primer año que crece con el IPC. */
export function conIpc(d: PlanDatos, primero: number): number[] {
  const serie: number[] = [];
  for (let t = 0; t < d.n_anios; t++) serie.push(t === 0 ? primero : serie[t - 1] * (1 + (d.ipc[t] ?? 0)));
  return serie.map((v) => Math.round(v));
}

export function lineaVacia(nombre = ''): LineaAnual {
  return { nombre, justificacion: '', consumo_mes: 0, costo: 0, consumo_anio: 0, valores: [], origen: null };
}
