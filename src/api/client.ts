const API_URL = import.meta.env.VITE_API_URL || 'https://gerencia-front-ebon.vercel.app';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  return handleResponse<T>(response);
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function del(path: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }
}

export async function download(path: string, fallbackName: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'No se pudo generar el reporte' }));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = match ? match[1] : fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

// Specific API endpoints
export const api = {
  // Health
  health: () => get<{ status: string }>('/health'),

  // Unidades de medida
  unidadesMedida: {
    list: () => get<import('./types').UnidadMedida[]>('/api/v1/unidades-medida/'),
    create: (data: unknown) => post<import('./types').UnidadMedida>('/api/v1/unidades-medida/', data),
    update: (id: number, data: unknown) => patch<import('./types').UnidadMedida>(`/api/v1/unidades-medida/${id}`, data),
    delete: (id: number) => del(`/api/v1/unidades-medida/${id}`),
  },

  // Proveedores
  proveedores: {
    list: () => get<import('./types').Proveedor[]>('/api/v1/proveedores/'),
    create: (data: unknown) => post<import('./types').Proveedor>('/api/v1/proveedores/', data),
    update: (id: number, data: unknown) => patch<import('./types').Proveedor>(`/api/v1/proveedores/${id}`, data),
    delete: (id: number) => del(`/api/v1/proveedores/${id}`),
  },

  // Insumos
  insumos: {
    list: (activo?: boolean) => {
      const query = activo !== undefined ? `?activo=${activo}` : '';
      return get<import('./types').Insumo[]>(`/api/v1/insumos/${query}`);
    },
    create: (data: unknown) => post<import('./types').Insumo>('/api/v1/insumos/', data),
    update: (id: number, data: unknown) => patch<import('./types').Insumo>(`/api/v1/insumos/${id}`, data),
    delete: (id: number) => del(`/api/v1/insumos/${id}`),
    detail: (id: number) => get<import('./types').Insumo & { historial_precios: import('./types').HistorialPrecioInsumo[] }>(`/api/v1/insumos/${id}`),
    precios: (id: number) => get<import('./types').HistorialPrecioInsumo[]>(`/api/v1/insumos/${id}/precios`),
    registrarPrecio: (id: number, data: unknown) => post<import('./types').HistorialPrecioInsumo>(`/api/v1/insumos/${id}/precios`, data),
  },

  // Productos
  productos: {
    list: (activo?: boolean) => {
      const query = activo !== undefined ? `?activo=${activo}` : '';
      return get<import('./types').Producto[]>(`/api/v1/productos/${query}`);
    },
    create: (data: unknown) => post<import('./types').Producto>('/api/v1/productos/', data),
    update: (id: number, data: unknown) => patch<import('./types').Producto>(`/api/v1/productos/${id}`, data),
    delete: (id: number) => del(`/api/v1/productos/${id}`),
    recetas: (id: number) => get<import('./types').Receta[]>(`/api/v1/productos/${id}/recetas`),
  },

  // Recetas
  recetas: {
    list: (activa?: boolean) => {
      const query = activa !== undefined ? `?activa=${activa}` : '';
      return get<import('./types').Receta[]>(`/api/v1/recetas/${query}`);
    },
    create: (data: unknown) => post<import('./types').RecetaDetail>('/api/v1/recetas/', data),
    detail: (id: number) => get<import('./types').RecetaDetail>(`/api/v1/recetas/${id}`),
    update: (id: number, data: unknown) => patch<import('./types').Receta>(`/api/v1/recetas/${id}`, data),
    delete: (id: number) => del(`/api/v1/recetas/${id}`),
    addInsumo: (id: number, data: unknown) => post<import('./types').RecetaInsumo>(`/api/v1/recetas/${id}/insumos`, data),
    updateInsumo: (id: number, recetaInsumoId: number, data: unknown) => patch<import('./types').RecetaInsumo>(`/api/v1/recetas/${id}/insumos/${recetaInsumoId}`, data),
    deleteInsumo: (id: number, recetaInsumoId: number) => del(`/api/v1/recetas/${id}/insumos/${recetaInsumoId}`),
    asociarProducto: (id: number, productoId: number) => post<import('./types').ProductoReceta>(`/api/v1/recetas/${id}/productos/${productoId}`, {}),
    costoEstimado: (id: number) => get<import('./types').CostoEstimadoReceta>(`/api/v1/recetas/${id}/costo-estimado`),
  },

  // Compras
  compras: {
    list: () => get<import('./types').Compra[]>('/api/v1/compras/'),
    create: (data: unknown) => post<import('./types').Compra>('/api/v1/compras/', data),
    detail: (id: number) => get<import('./types').Compra>(`/api/v1/compras/${id}`),
    delete: (id: number) => del(`/api/v1/compras/${id}`),
  },

  // Lotes
  lotes: {
    list: (estado?: string) => {
      const query = estado ? `?estado=${estado}` : '';
      return get<import('./types').LoteProduccion[]>(`/api/v1/lotes-produccion/${query}`);
    },
    create: (data: unknown) => post<import('./types').LoteProduccionDetail>('/api/v1/lotes-produccion/', data),
    detail: (id: number) => get<import('./types').LoteProduccionDetail>(`/api/v1/lotes-produccion/${id}`),
    cerrar: (id: number) => patch<import('./types').LoteProduccionDetail>(`/api/v1/lotes-produccion/${id}/cerrar`, {}),
    asignarGasto: (id: number, data: unknown) => post<import('./types').GastoLote>(`/api/v1/lotes-produccion/${id}/gastos`, data),
  },

  // Gastos
  gastos: {
    list: () => get<import('./types').Gasto[]>('/api/v1/gastos/'),
    create: (data: unknown) => post<import('./types').Gasto>('/api/v1/gastos/', data),
    update: (id: number, data: unknown) => patch<import('./types').Gasto>(`/api/v1/gastos/${id}`, data),
    delete: (id: number) => del(`/api/v1/gastos/${id}`),
  },

  // Reportes
  reportes: {
    costosPorProducto: () => get<import('./types').CostoPorProducto[]>('/api/v1/reportes/costos-por-producto'),
    evolucionCostos: (productoId?: number) => {
      const query = productoId ? `?producto_id=${productoId}` : '';
      return get<import('./types').CostoHistorico[]>(`/api/v1/reportes/evolucion-costos${query}`);
    },
    comparacion: () => get<import('./types').ComparacionEstimadoReal[]>('/api/v1/reportes/comparacion-estimado-real'),
    costoReceta: (id: number) => get<import('./types').CostoEstimadoReceta>(`/api/v1/reportes/costo-receta/${id}`),
  },

  // Recursos
  recursos: {
    list: () => get<import('./types').Recurso[]>('/api/v1/recursos/'),
    create: (data: unknown) => post<import('./types').Recurso>('/api/v1/recursos/', data),
    update: (id: number, data: unknown) => patch<import('./types').Recurso>(`/api/v1/recursos/${id}`, data),
    delete: (id: number) => del(`/api/v1/recursos/${id}`),
  },

  // Precios de venta
  preciosVenta: {
    list: () => get<import('./types').PrecioVenta[]>('/api/v1/precios-venta/'),
    activo: (productoId: number) => get<import('./types').PrecioVenta>(`/api/v1/precios-venta/producto/${productoId}`),
    create: (data: unknown) => post<import('./types').PrecioVenta>('/api/v1/precios-venta/', data),
    desactivar: (id: number) => patch<import('./types').PrecioVenta>(`/api/v1/precios-venta/${id}/desactivar`, {}),
  },

  // Plan de negocio y proyecciones
  planes: {
    list: () => get<import('../plan/types').PlanResumen[]>('/api/v1/planes/'),
    create: (data: { nombre: string; empresa?: string; producto?: string }) =>
      post<import('../plan/types').Plan>('/api/v1/planes/', data),
    detail: (id: number) => get<import('../plan/types').Plan>(`/api/v1/planes/${id}`),
    update: (id: number, datos: import('../plan/types').PlanDatos, nombre?: string) =>
      put<import('../plan/types').Plan>(`/api/v1/planes/${id}`, { datos, nombre }),
    delete: (id: number) => del(`/api/v1/planes/${id}`),
    calcular: (datos: import('../plan/types').PlanDatos) =>
      post<import('../plan/types').Resultados>('/api/v1/planes/calcular', datos),
    reporte: (id: number, formato: 'xlsx' | 'pdf') =>
      download(`/api/v1/planes/${id}/reporte?formato=${formato}`, `Plan.${formato}`),
  },

  // Punto de equilibrio
  puntoEquilibrio: {
    calcular: (data: unknown) => post<import('./types').PuntoEquilibrio>('/api/v1/punto-equilibrio/calcular', data),
    list: () => get<import('./types').PuntoEquilibrio[]>('/api/v1/punto-equilibrio/'),
    detail: (id: number) => get<import('./types').PuntoEquilibrio>(`/api/v1/punto-equilibrio/${id}`),
  },
};
