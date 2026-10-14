export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface HistorialPrecioInsumo {
  id: number;
  insumo_id: number;
  precio: string;
  fecha: string;
  compra_id?: number;
}

export interface Insumo {
  id: number;
  nombre: string;
  unidad_medida_id: number;
  proveedor_id?: number;
  precio_compra: string;
  stock_actual: string;
  activo: boolean;
  unidad_medida?: UnidadMedida;
  proveedor?: Proveedor;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface RecetaInsumo {
  id: number;
  receta_id: number;
  insumo_id: number;
  cantidad: string;
  insumo?: Insumo;
}

export interface Receta {
  id: number;
  nombre: string;
  version: string;
  activa: boolean;
  fecha_creacion: string;
}

export interface RecetaDetail extends Receta {
  recetas_insumos: RecetaInsumo[];
  productos_recetas: Producto[];
}

export interface ProductoReceta {
  id: number;
  producto_id: number;
  receta_id: number;
}

export interface CompraDetalle {
  id: number;
  compra_id: number;
  insumo_id: number;
  cantidad: string;
  precio_unitario: string;
  subtotal: string;
  insumo?: Insumo;
}

export interface Compra {
  id: number;
  proveedor_id?: number;
  fecha: string;
  total: string;
  detalles: CompraDetalle[];
  proveedor?: Proveedor;
}

export interface LoteProducto {
  id: number;
  lote_id: number;
  producto_id: number;
  receta_id?: number;
  cantidad: string;
  producto?: Producto;
  receta?: Receta;
}

export interface LoteInsumo {
  id: number;
  lote_id: number;
  insumo_id: number;
  cantidad: string;
  insumo?: Insumo;
}

export interface LoteProduccion {
  id: number;
  fecha: string;
  estado: 'ABIERTO' | 'CERRADO';
  costo_real_total: string;
}

export interface LoteProduccionDetail extends LoteProduccion {
  productos: LoteProducto[];
  insumos: LoteInsumo[];
}

export interface Gasto {
  id: number;
  categoria: string;
  descripcion?: string;
  monto: string;
  fecha: string;
}

export interface GastoLote {
  id: number;
  gasto_id: number;
  lote_id: number;
  monto_asignado: string;
  gasto?: Gasto;
}

export interface CostoHistorico {
  id: number;
  lote_id: number;
  producto_id: number;
  fecha: string;
  cantidad_fabricada: string;
  costo_total: string;
  costo_unitario: string;
  producto?: Producto;
  lote?: LoteProduccion;
}

export interface CostoEstimadoReceta {
  receta_id: number;
  receta_nombre: string;
  producto_id: number | null;
  producto_nombre: string;
  costo_total_estimado: string;
  insumos: {
    insumo_id: number;
    insumo_nombre: string;
    cantidad: string;
    unidad?: string;
    precio_unitario: string;
    costo_insumo: string;
  }[];
}

export interface CostoPorProducto {
  producto_id: number;
  producto_nombre: string;
  cantidad_total_fabricada: string;
  costo_total_acumulado: string;
  costo_unitario_promedio: string;
}

export interface ComparacionEstimadoReal {
  receta_id: number;
  receta_nombre: string;
  producto_id: number;
  producto_nombre: string;
  costo_estimado: string;
  costo_real_promedio: string;
  diferencia: string;
}

// Form input types
export interface InsumoFormData {
  nombre: string;
  unidad_medida_id: string;
  proveedor_id: string;
  precio_compra: string;
  stock_actual: string;
  activo: boolean;
}

export interface ProductoFormData {
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface RecetaInsumoFormData {
  insumo_id: string;
  cantidad: string;
}

export interface RecetaFormData {
  nombre: string;
  version: string;
  activa: boolean;
  insumos: RecetaInsumoFormData[];
}

export interface CompraDetalleFormData {
  insumo_id: string;
  cantidad: string;
  precio_unitario: string;
}

export interface CompraFormData {
  proveedor_id: string;
  detalles: CompraDetalleFormData[];
}

export interface LoteProductoFormData {
  producto_id: string;
  receta_id: string;
  cantidad: string;
}

export interface LoteInsumoFormData {
  insumo_id: string;
  cantidad: string;
}

export interface LoteFormData {
  productos: LoteProductoFormData[];
  insumos: LoteInsumoFormData[];
}

export interface GastoFormData {
  categoria: string;
  descripcion: string;
  monto: string;
}

export interface GastoLoteFormData {
  gasto_id: string;
  monto_asignado: string;
}

export interface ProveedorFormData {
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
}

export interface UnidadMedidaFormData {
  nombre: string;
  abreviatura: string;
}
