export type Area = 'produccion' | 'administracion' | 'ventas';

export interface Inversion { categoria: string; concepto: string; valor: number }
export interface MateriaPrima { nombre: string; cantidad: number; costo_unitario: number }
export interface LineaAnual {
  nombre: string;
  justificacion: string;
  consumo_mes: number;
  costo: number;
  consumo_anio: number;
  valores: number[];
  origen: string | null;
}

export interface ParametrosNomina {
  smlv: number;
  auxilio_transporte: number;
  horas_mes: number;
  f_recargo_nocturno: number;
  f_extra_diurna: number;
  f_extra_nocturna: number;
  f_recargo_festivo: number;
  f_extra_diurna_festiva: number;
  f_extra_nocturna_festiva: number;
  pct_salud_empleado: number;
  pct_pension_empleado: number;
  pct_cesantias: number;
  pct_prima: number;
  pct_vacaciones: number;
  pct_intereses: number;
  pct_salud_empleador: number;
  pct_pension_empleador: number;
  pct_caja: number;
  pct_icbf: number;
  pct_sena: number;
  arl: Record<string, number>;
}

export interface Empleado {
  nombre: string;
  area: Area;
  salario: number;
  dias: number;
  incapacidades: number;
  comisiones: number;
  riesgo: string;
  h_recargo_nocturno: number;
  h_extra_diurna: number;
  h_extra_nocturna: number;
  h_recargo_festivo: number;
  h_extra_diurna_festiva: number;
  h_extra_nocturna_festiva: number;
}

export interface PlanDatos {
  empresa: string;
  producto: string;
  anio_inicial: number;
  n_anios: number;
  inversiones: Inversion[];
  capital_mano_obra: number[];
  capital_gastos: number[];
  crecimiento: number[];
  ipc: number[];
  cantidad: number[];
  precio_inicial: number;
  pct_provision: number;
  pct_credito: number;
  pct_contado: number;
  materias_primas: MateriaPrima[];
  pct_pago_contado: number;
  pct_pago_credito: number;
  mano_obra: number[] | null;
  cif: LineaAnual[];
  gastos: LineaAnual[];
  pct_renta: number;
  pct_reserva: number;
  pct_dividendos: number;
  tasa_oportunidad: number;
  parametros_nomina: ParametrosNomina;
  empleados: Empleado[];
}

export interface PlanResumen { id: number; nombre: string }
export interface Plan extends PlanResumen { datos: PlanDatos }

export interface FilaNomina {
  nombre: string;
  area: Area;
  salario: number;
  valor_hora: number;
  total_extras: number;
  devengado: number;
  auxilio: number;
  salud_empleado: number;
  pension_empleado: number;
  total_deducciones: number;
  neto_pagado: number;
  provisiones: Record<string, number>;
  total_provisiones: number;
  costo_empleado: number;
}

export interface Observacion { nivel: 'info' | 'alerta'; titulo: string; texto: string }

type Serie = number[];
export interface Resultados {
  anios: number[];
  inversion: { activos: number; capital_trabajo_mes: number[]; total: number };
  demanda: { cantidad: Serie; precio: Serie; ingreso: Serie; provision: Serie; ventas_credito: Serie; ventas_contado: Serie };
  materia_prima: {
    lineas: { nombre: string; cantidad: number; costo_unitario: number; costo_por_und: number; valores: Serie }[];
    total: Serie; cantidad_total: number; costo_und_total: number;
    margen_bruto: (number | null)[]; pago_contado: Serie; pago_credito: Serie;
  };
  mano_obra: { valores: Serie; manual: boolean };
  cif: { total: Serie };
  gastos: { total: Serie };
  pyg: Record<'ventas' | 'cmv' | 'utilidad_bruta' | 'gastos' | 'provision' | 'uai' | 'renta' | 'utilidad_neta' | 'reserva' | 'dividendos' | 'utilidad_final', Serie>;
  flujo: {
    ingresos: Serie; pago_mp_contado: Serie; mano_obra: Serie; cif: Serie; gastos: Serie; renta: Serie;
    egresos: Serie; efectivo: Serie; serie: Serie;
  };
  evaluacion: { tasa: number; tir: number | null; vpn: number };
  nomina: {
    empleados: FilaNomina[];
    total_devengado: number; total_neto: number; total_provisiones: number; costo_total_mensual: number;
    costo_mensual_por_area: Record<Area, number>;
    referencia_minimo: FilaNomina & { porcentaje_carga: number };
  };
  observaciones: Observacion[];
}
