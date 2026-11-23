import { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  ToggleRight, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Tag,
  Percent
} from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import type { PrecioVenta, PrecioVentaFormData, Producto, Receta } from '../api/types';

export default function PreciosVenta() {
  const { data: precios, loading, error, refetch } = useApi(api.preciosVenta.list);
  const { data: productos } = useApi(api.productos.list);
  const { data: recetas } = useApi(api.recetas.list);
  const { loading: actionLoading, execute } = useAsyncAction();
  const { toast, showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PrecioVentaFormData>({
    producto_id: '',
    receta_id: '',
    precio_con_iva: '',
  });

  const openCreate = () => {
    setFormData({ producto_id: '', receta_id: '', precio_con_iva: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      producto_id: parseInt(formData.producto_id),
      receta_id: formData.receta_id ? parseInt(formData.receta_id) : null,
      precio_con_iva: parseFloat(formData.precio_con_iva) || 0,
    };
    try {
      await execute(() => api.preciosVenta.create(payload));
      showToast('Precio de venta creado', 'success');
      setIsModalOpen(false);
      setFormData({ producto_id: '', receta_id: '', precio_con_iva: '' });
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDesactivar = async (id: number) => {
    if (!confirm('¿Desactivar este precio de venta?')) return;
    try {
      await execute(() => api.preciosVenta.desactivar(id));
      showToast('Precio desactivado', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const productosMap = new Map((productos || []).map((p: Producto) => [p.id, p]));
  const recetasMap = new Map((recetas || []).map((r: Receta) => [r.id, r]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <DollarSign className="w-6 h-6" />
            </div>
            Precios de venta
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define y gestiona los precios finales con IVA para cada producto y presentación.
          </p>
        </div>

        {/* Botón Acción Principal */}
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/15 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo precio
        </button>
      </div>

      {/* Banner de Error */}
      {error && (
        <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-800 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <DataTable
          columns={[
            {
              key: 'producto',
              header: 'Producto',
              render: (item: PrecioVenta) => (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-gray-900">
                    {productosMap.get(item.producto_id)?.nombre || `ID ${item.producto_id}`}
                  </span>
                </div>
              ),
            },
            {
              key: 'receta',
              header: 'Presentación',
              render: (item: PrecioVenta) => (
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  {item.receta_id ? recetasMap.get(item.receta_id)?.nombre || `ID ${item.receta_id}` : 'General / Todas'}
                </span>
              ),
            },
            {
              key: 'precio_con_iva',
              header: 'Precio con IVA',
              render: (item: PrecioVenta) => (
                <span className="font-mono text-sm font-bold text-gray-900">
                  ${parseFloat(item.precio_con_iva).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              key: 'iva',
              header: 'IVA',
              render: (item: PrecioVenta) => (
                <span className="inline-flex items-center gap-0.5 text-xs font-mono font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  {item.iva_porcentaje}%
                </span>
              ),
            },
            {
              key: 'activo',
              header: 'Estado',
              render: (item: PrecioVenta) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  item.activo 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                    : 'bg-rose-50 text-rose-700 border-rose-200/80'
                }`}>
                  {item.activo ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Inactivo
                    </>
                  )}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Acciones',
              render: (item: PrecioVenta) =>
                item.activo ? (
                  <button
                    onClick={() => handleDesactivar(item.id)}
                    className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Desactivar precio"
                  >
                    <ToggleRight className="w-5 h-5" />
                  </button>
                ) : null,
            },
          ]}
          data={precios || []}
          loading={loading}
          keyExtractor={(item) => item.id}
          emptyMessage="No hay precios de venta registrados"
        />
      </div>

      {/* Modal Rediseñado */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo precio de venta"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FormField label="Producto">
            <select
              value={formData.producto_id}
              onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              required
            >
              <option value="">Seleccionar producto...</option>
              {productos?.map((p: Producto) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Presentación / Receta (Opcional)">
            <select
              value={formData.receta_id}
              onChange={(e) => setFormData({ ...formData, receta_id: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            >
              <option value="">Todas / General</option>
              {recetas?.map((r: Receta) => (
                <option key={r.id} value={r.id}>{r.nombre} (v{r.version})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Precio de venta con IVA">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-medium text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_con_iva}
                onChange={(e) => setFormData({ ...formData, precio_con_iva: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-gray-900 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="0.00"
                required
              />
            </div>
          </FormField>

          {/* Banner informativo de impuesto */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <Percent className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              El IVA aplicado por defecto será del <span className="font-semibold">19%</span>. El sistema calculará automáticamente la base gravable sin IVA.
            </p>
          </div>

          {/* Botones de acción modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/15 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar precio'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notifications */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => {}} />
        </div>
      )}
    </div>
  );
}
