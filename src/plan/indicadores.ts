import type { Resultados } from './types';

export type Valor = number | null;
export type FormatoIndicador = 'veces' | 'pct' | 'dinero' | 'dias';

export interface FilaBalance {
  clave: string;
  etiqueta: string;
  valores: number[];
  tipo: 'titulo' | 'linea' | 'subtotal' | 'total';
}

export interface Indicador {
  clave: string;
  nombre: string;
  formula: string;
  que: string;
  formato: FormatoIndicador;
  valores: Valor[];
}

export interface GrupoIndicadores {
  titulo: string;
  descripcion: string;
  indicadores: Indicador[];
}

export interface ReporteFinanciero {
  balance: FilaBalance[];
  grupos: GrupoIndicadores[];
  supuestos: string[];
}

const DIAS_ANIO = 365;

/** División segura: devuelve null si el denominador es cero o el resultado no es finito. */
function dividir(a: number, b: number): Valor {
  if (!b) return null;
  const q = a / b;
  return Number.isFinite(q) ? q : null;
}

/** Suma de los primeros `hasta` valores de una serie. */
function acumulado(serie: number[], hasta: number): number {
  return serie.slice(0, hasta).reduce((s, v) => s + v, 0);
}

/**
 * Balance general estimado al cierre de cada año e indicadores financieros.
 * El modelo no tiene balance propio: las cuentas se derivan de los resultados del plan.
 * Si el balance no cuadra, la diferencia se muestra como ajuste y no se fuerza.
 */
export function calcularReporteFinanciero(r: Resultados): ReporteFinanciero {
  const n = r.anios.length;
  const idx = Array.from({ length: n }, (_, t) => t);
  const capital = r.inversion.total;
  const activosFijos = r.inversion.activos;
  const cajaInicial = capital - activosFijos;

  const efectivo = idx.map((t) => cajaInicial + acumulado(r.flujo.efectivo, t + 1));
  const cxc = idx.map((t) => r.demanda.ventas_credito[t]);
  const proveedores = idx.map((t) => r.materia_prima.pago_credito[t]);
  const utilidadesRetenidas = idx.map((t) => acumulado(r.pyg.utilidad_final, t + 1));
  const reservaLegal = idx.map((t) => -acumulado(r.pyg.reserva, t + 1));
  const activoCorriente = idx.map((t) => efectivo[t] + cxc[t]);
  const activoTotal = idx.map((t) => activoCorriente[t] + activosFijos);
  const pasivoTotal = proveedores;
  const patrimonio = idx.map((t) => capital + utilidadesRetenidas[t] + reservaLegal[t]);
  const ajuste = idx.map((t) => activoTotal[t] - pasivoTotal[t] - patrimonio[t]);
  const ventas = r.pyg.ventas;

  const balance: FilaBalance[] = [
    { clave: 'h-a', etiqueta: 'ACTIVOS', valores: [], tipo: 'titulo' },
    { clave: 'efectivo', etiqueta: 'Efectivo (caja acumulada)', valores: efectivo, tipo: 'linea' },
    { clave: 'cxc', etiqueta: 'Cuentas por cobrar (ventas a crédito)', valores: cxc, tipo: 'linea' },
    { clave: 'ac', etiqueta: 'Total activo corriente', valores: activoCorriente, tipo: 'subtotal' },
    { clave: 'af', etiqueta: 'Activos fijos (a costo)', valores: idx.map(() => activosFijos), tipo: 'linea' },
    { clave: 'at', etiqueta: 'TOTAL ACTIVOS', valores: activoTotal, tipo: 'total' },
    { clave: 'h-p', etiqueta: 'PASIVOS', valores: [], tipo: 'titulo' },
    { clave: 'prov', etiqueta: 'Proveedores por pagar', valores: proveedores, tipo: 'linea' },
    { clave: 'pt', etiqueta: 'TOTAL PASIVOS', valores: pasivoTotal, tipo: 'total' },
    { clave: 'h-pat', etiqueta: 'PATRIMONIO', valores: [], tipo: 'titulo' },
    { clave: 'capital', etiqueta: 'Capital aportado', valores: idx.map(() => capital), tipo: 'linea' },
    { clave: 'utr', etiqueta: 'Utilidades retenidas', valores: utilidadesRetenidas, tipo: 'linea' },
    { clave: 'reserva', etiqueta: 'Reserva legal', valores: reservaLegal, tipo: 'linea' },
    { clave: 'pat', etiqueta: 'TOTAL PATRIMONIO', valores: patrimonio, tipo: 'total' },
    { clave: 'pp', etiqueta: 'TOTAL PASIVO + PATRIMONIO', valores: idx.map((t) => pasivoTotal[t] + patrimonio[t]), tipo: 'total' },
    { clave: 'ajuste', etiqueta: 'Diferencia por cuentas no modeladas', valores: ajuste, tipo: 'linea' },
  ];

  const liquidez: GrupoIndicadores = {
    titulo: 'Liquidez',
    descripcion: '¿Tiene la empresa con qué pagar sus deudas de corto plazo?',
    indicadores: [
      {
        clave: 'razon_corriente', nombre: 'Razón corriente', formula: 'Activo corriente ÷ Pasivo corriente',
        que: 'Más de 1 significa que hay activos para cubrir las deudas del año.', formato: 'veces',
        valores: idx.map((t) => dividir(activoCorriente[t], pasivoTotal[t])),
      },
      {
        clave: 'prueba_efectivo', nombre: 'Prueba de efectivo', formula: 'Efectivo ÷ Pasivo corriente',
        que: 'Solo cuenta el dinero disponible frente a las deudas.', formato: 'veces',
        valores: idx.map((t) => dividir(efectivo[t], pasivoTotal[t])),
      },
      {
        clave: 'ktn', nombre: 'Capital de trabajo neto', formula: 'Activo corriente − Pasivo corriente',
        que: 'Dinero libre para operar después de pagar deudas de corto plazo.', formato: 'dinero',
        valores: idx.map((t) => activoCorriente[t] - pasivoTotal[t]),
      },
    ],
  };

  const endeudamiento: GrupoIndicadores = {
    titulo: 'Endeudamiento y cobertura',
    descripcion: '¿Qué parte del negocio está financiada con deudas y cuánto la cubren los activos?',
    indicadores: [
      {
        clave: 'nivel_endeudamiento', nombre: 'Nivel de endeudamiento', formula: 'Pasivo total ÷ Activo total',
        que: 'Porcentaje de los activos que pertenece a acreedores.', formato: 'pct',
        valores: idx.map((t) => dividir(pasivoTotal[t], activoTotal[t])),
      },
      {
        clave: 'cobertura_activos', nombre: 'Cobertura de activos sobre pasivos', formula: 'Activo total ÷ Pasivo total',
        que: 'Cuántas veces los activos cubren las deudas.', formato: 'veces',
        valores: idx.map((t) => dividir(activoTotal[t], pasivoTotal[t])),
      },
      {
        clave: 'apalancamiento', nombre: 'Apalancamiento', formula: 'Pasivo total ÷ Patrimonio',
        que: 'Cuánta deuda hay por cada peso aportado por los dueños.', formato: 'veces',
        valores: idx.map((t) => dividir(pasivoTotal[t], patrimonio[t])),
      },
    ],
  };

  const rentabilidad: GrupoIndicadores = {
    titulo: 'Rentabilidad',
    descripcion: '¿Cuánto queda como ganancia por cada peso vendido o invertido?',
    indicadores: [
      {
        clave: 'margen_bruto', nombre: 'Margen bruto', formula: 'Utilidad bruta ÷ Ventas',
        que: 'Ganancia después del costo de la mercancía vendida.', formato: 'pct',
        valores: idx.map((t) => dividir(r.pyg.utilidad_bruta[t], ventas[t])),
      },
      {
        clave: 'margen_antes_imp', nombre: 'Margen antes de impuestos', formula: 'Utilidad antes de impuestos ÷ Ventas',
        que: 'Ganancia después de gastos y provisiones, antes de renta.', formato: 'pct',
        valores: idx.map((t) => dividir(r.pyg.uai[t], ventas[t])),
      },
      {
        clave: 'margen_neto', nombre: 'Margen neto', formula: 'Utilidad neta ÷ Ventas',
        que: 'Porcentaje de cada venta que queda como utilidad neta.', formato: 'pct',
        valores: idx.map((t) => dividir(r.pyg.utilidad_neta[t], ventas[t])),
      },
      {
        clave: 'roa', nombre: 'ROA (rentabilidad del activo)', formula: 'Utilidad neta ÷ Activo total',
        que: 'Qué tanto genera de utilidad cada peso de activos.', formato: 'pct',
        valores: idx.map((t) => dividir(r.pyg.utilidad_neta[t], activoTotal[t])),
      },
      {
        clave: 'roe', nombre: 'ROE (rentabilidad del patrimonio)', formula: 'Utilidad neta ÷ Patrimonio',
        que: 'Rentabilidad que obtienen los dueños sobre su aporte.', formato: 'pct',
        valores: idx.map((t) => dividir(r.pyg.utilidad_neta[t], patrimonio[t])),
      },
    ],
  };

  const eficiencia: GrupoIndicadores = {
    titulo: 'Rotación y eficiencia',
    descripcion: '¿Qué tan bien se usan los activos y cuánto tarda la empresa en pagar a sus proveedores?',
    indicadores: [
      {
        clave: 'rot_activos', nombre: 'Rotación de activos totales', formula: 'Ventas ÷ Activo total',
        que: 'Cuántas veces al año se recuperan los activos en ventas.', formato: 'veces',
        valores: idx.map((t) => dividir(ventas[t], activoTotal[t])),
      },
      {
        clave: 'rot_af', nombre: 'Rotación de activos fijos', formula: 'Ventas ÷ Activos fijos',
        que: 'Qué tanto se aprovecha la maquinaria y el equipo.', formato: 'veces',
        valores: idx.map((t) => dividir(ventas[t], activosFijos)),
      },
      {
        clave: 'rot_prov', nombre: 'Rotación de proveedores', formula: 'Compras de materia prima ÷ Proveedores por pagar',
        que: 'Cuántas veces al año se paga a los proveedores.', formato: 'veces',
        valores: idx.map((t) => dividir(r.materia_prima.total[t], proveedores[t])),
      },
      {
        clave: 'dias_pago', nombre: 'Días de pago a proveedores', formula: `${DIAS_ANIO} ÷ Rotación de proveedores`,
        que: 'Días promedio que tarda la empresa en pagar sus compras.', formato: 'dias',
        valores: idx.map((t) => {
          const rot = dividir(r.materia_prima.total[t], proveedores[t]);
          return rot ? DIAS_ANIO / rot : null;
        }),
      },
    ],
  };

  return {
    balance,
    grupos: [liquidez, endeudamiento, rentabilidad, eficiencia],
    supuestos: [
      'El modelo no calcula depreciación: los activos fijos aparecen a costo de adquisición.',
      'Las cuentas por cobrar equivalen a las ventas a crédito del año (se asume cobro en el año siguiente).',
      'Los proveedores por pagar equivalen al pago de materia prima a crédito del año.',
      'El plan no tiene deuda financiera: el pasivo es corriente y la cobertura de intereses no aplica.',
      'La diferencia es el efecto de cuentas que el modelo no detalla (inventarios, depreciación, cartera real). No se fuerza el balance.',
    ],
  };
}
