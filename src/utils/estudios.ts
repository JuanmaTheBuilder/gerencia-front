export type Estudio =
  | 'Mercado'
  | 'Técnico'
  | 'Administrativo y organizacional'
  | 'Legal'
  | 'Ambiental'
  | 'Financiero'
  | 'Socioeconómico';

/** Qué analiza cada tipo de estudio de la formulación de proyectos. */
export const DESCRIPCION_ESTUDIO: Record<Estudio, string> = {
  Mercado: 'Analiza la demanda, la competencia y el precio al que se venderá el producto.',
  Técnico: 'Define cómo se produce: insumos, recetas, procesos, capacidad y costos de fabricación.',
  'Administrativo y organizacional': 'Estructura de la empresa, personal, y gastos de administración y ventas.',
  Legal: 'Requisitos normativos, permisos, tipo societario y obligaciones legales del negocio.',
  Ambiental: 'Impactos del proyecto sobre el entorno y manejo de residuos.',
  Financiero: 'Inversiones, costos, flujo de caja y rentabilidad del proyecto.',
  Socioeconómico: 'Beneficios del proyecto para la comunidad y la economía local.',
};
