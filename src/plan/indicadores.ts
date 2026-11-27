import type { Inversion, Resultados } from './types';
import { dinero, numero, porcentaje } from './format';

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

/** Texto para mostrar un indicador según su formato. */
export function formatearIndicador(v: Valor, formato: FormatoIndicador): string {
  if (v === null) return 'No aplica';
  if (formato === 'pct') return porcentaje(v);
  if (formato === 'veces') return `${numero(v, 2)} veces`;
  if (formato === 'dias') return `${numero(v, 0)} días`;
  return `$ ${dinero(v)}`;
}

/** Según la categoría escrita en el plan, cada inversión va al inventario, a diferidos o a activos fijos. */
export function clasificarInversion(categoria: string): 'inventario' | 'diferido' | 'activo' {
  const c = categoria.toLowerCase();
  if (/materia|empaque|inventario/.test(c)) return 'inventario';
  if (/diferid/.test(c)) return 'diferido';
  return 'activo';
}

/**
 * Balance general estimado al cierre de cada año e indicadores financieros.
 * El modelo no tiene balance propio: las cuentas se derivan de los resultados del plan.
 * Como en la plantilla, el flujo de caja nunca cobra la cartera ni paga las compras a crédito,
 * así que esas cuentas se acumulan. Los CIF se pagan en el flujo pero no pasan por el PyG,
 * y esa diferencia se muestra como renglón aparte y no se fuerza.
 */
export function calcularReporteFinanciero(r: Resultados, inversiones: Inversion[]): ReporteFinanciero {
  const n = r.anios.length;
  const idx = Array.from({ length: n }, (_, t) => t);
  const sumaClase = (clase: ReturnType<typeof clasificarInversion>) =>
    inversiones.filter((i) => clasificarInversion(i.categoria) === clase).reduce((s, i) => s + i.valor, 0);

  const capital = r.inversion.total;
  const activosFijos = sumaClase('activo');
  const inventarioInicial = sumaClase('inventario');
  const diferidos = sumaClase('diferido');
  // Lo invertido en activos (fijos, inventario y diferidos) sale del capital; el resto es capital de trabajo en caja
  const cajaInicial = capital - r.inversion.activos;

  const efectivo = idx.map((t) => cajaInicial + acumulado(r.flujo.efectivo, t + 1));
  const cxc = idx.map((t) => acumulado(r.demanda.ventas_credito, t + 1) + acumulado(r.pyg.provision, t + 1));
  const inventario = idx.map(() => inventarioInicial);
  const proveedores = idx.map((t) => acumulado(r.materia_prima.pago_credito, t + 1));
  const dividendosPorPagar = idx.map((t) => -acumulado(r.pyg.dividendos, t + 1) || 0); // `|| 0` evita mostrar -0
  const utilidadesRetenidas = idx.map((t) => acumulado(r.pyg.utilidad_final, t + 1));
  const reservaLegal = idx.map((t) => -acumulado(r.pyg.reserva, t + 1));
  const activoCorriente = idx.map((t) => efectivo[t] + cxc[t] + inventario[t]);
  const activoTotal = idx.map((t) => activoCorriente[t] + activosFijos + diferidos);
  const pasivoTotal = idx.map((t) => proveedores[t] + dividendosPorPagar[t]);
  const patrimonio = idx.map((t) => capital + utilidadesRetenidas[t] + reservaLegal[t]);
  const ajuste = idx.map((t) => activoTotal[t] - pasivoTotal[t] - patrimonio[t]);
  const ventas = r.pyg.ventas;

  const balance: FilaBalance[] = [
    { clave: 'h-a', etiqueta: 'ACTIVOS', valores: [], tipo: 'titulo' },
    { clave: 'efectivo', etiqueta: 'Efectivo (caja acumulada)', valores: efectivo, tipo: 'linea' },
    { clave: 'cxc', etiqueta: 'Cuentas por cobrar (ventas a crédito menos provisión)', valores: cxc, tipo: 'linea' },
    { clave: 'inv', etiqueta: 'Inventario de materia prima y empaques', valores: inventario, tipo: 'linea' },
    { clave: 'ac', etiqueta: 'Total activo corriente', valores: activoCorriente, tipo: 'subtotal' },
    { clave: 'af', etiqueta: 'Activos fijos (a costo)', valores: idx.map(() => activosFijos), tipo: 'linea' },
    { clave: 'dif', etiqueta: 'Diferidos (a costo inicial)', valores: idx.map(() => diferidos), tipo: 'linea' },
    { clave: 'at', etiqueta: 'TOTAL ACTIVOS', valores: activoTotal, tipo: 'total' },
    { clave: 'h-p', etiqueta: 'PASIVOS', valores: [], tipo: 'titulo' },
    { clave: 'prov', etiqueta: 'Proveedores por pagar (compras a crédito acumuladas)', valores: proveedores, tipo: 'linea' },
    { clave: 'divp', etiqueta: 'Dividendos por pagar', valores: dividendosPorPagar, tipo: 'linea' },
    { clave: 'pt', etiqueta: 'TOTAL PASIVOS', valores: pasivoTotal, tipo: 'total' },
    { clave: 'h-pat', etiqueta: 'PATRIMONIO', valores: [], tipo: 'titulo' },
    { clave: 'capital', etiqueta: 'Capital aportado', valores: idx.map(() => capital), tipo: 'linea' },
    { clave: 'utr', etiqueta: 'Utilidades retenidas', valores: utilidadesRetenidas, tipo: 'linea' },
    { clave: 'reserva', etiqueta: 'Reserva legal', valores: reservaLegal, tipo: 'linea' },
    { clave: 'pat', etiqueta: 'TOTAL PATRIMONIO', valores: patrimonio, tipo: 'total' },
    { clave: 'pp', etiqueta: 'TOTAL PASIVO + PATRIMONIO', valores: idx.map((t) => pasivoTotal[t] + patrimonio[t]), tipo: 'total' },
    { clave: 'ajuste', etiqueta: 'Diferencia: CIF pagados que la plantilla no lleva al estado de resultados', valores: ajuste, tipo: 'linea' },
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
        clave: 'prueba_acida', nombre: 'Prueba ácida', formula: '(Activo corriente − Inventario) ÷ Pasivo corriente',
        que: 'Como la razón corriente, pero sin contar el inventario, que tarda en convertirse en dinero.', formato: 'veces',
        valores: idx.map((t) => dividir(activoCorriente[t] - inventario[t], pasivoTotal[t])),
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
        clave: 'margen_bruto', nombre: 'Margen bruto (estado de resultados)', formula: 'Utilidad bruta ÷ Ventas',
        que: 'Ganancia después del costo de ventas: materia prima y mano de obra.', formato: 'pct',
        valores: idx.map((t) => dividir(r.pyg.utilidad_bruta[t], ventas[t])),
      },
      {
        clave: 'margen_mp', nombre: 'Margen sobre materia prima', formula: '(Ventas − Materia prima) ÷ Ventas',
        que: 'Lo que queda de cada venta después de pagar solo la materia prima (así lo muestra la hoja Proyecciones).', formato: 'pct',
        valores: r.materia_prima.margen_bruto,
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
      'Los diferidos y el inventario inicial se mantienen en su valor de inversión: el plan no los amortiza ni rota.',
      'Las cuentas por cobrar son las ventas a crédito acumuladas menos la provisión para deudas malas. El flujo de la plantilla nunca cobra la cartera.',
      'Los proveedores por pagar son las compras a crédito acumuladas. El flujo de la plantilla nunca las paga, por eso los días de pago crecen año tras año.',
      'El plan no tiene deuda financiera: el pasivo es corriente y la cobertura de intereses no aplica.',
      'La diferencia son los costos indirectos de fabricación (CIF): el flujo los paga, pero la plantilla no los lleva al estado de resultados. No se fuerza el balance.',
    ],
  };
}
