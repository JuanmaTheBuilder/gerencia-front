import { useState } from 'react';
import { Plus, DollarSign, ToggleRight } from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-primary-600" />
            Precios de venta
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Definí el precio con IVA para cada presentación.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo precio
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <DataTable
        columns={[
          {
            key: 'producto',
            header: 'Producto',
            render: (item: PrecioVenta) => productosMap.get(item.producto_id)?.nombre || `ID ${item.producto_id}`,
          },
          {
            key: 'receta',
            header: 'Presentación',
            render: (item: PrecioVenta) =>
              item.receta_id ? recetasMap.get(item.receta_id)?.nombre || `ID ${item.receta_id}` : '-',
          },
          {
            key: 'precio_con_iva',
            header: 'Precio con IVA',
            render: (item: PrecioVenta) => `$${parseFloat(item.precio_con_iva).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
          },
          {
            key: 'iva',
            header: 'IVA',
            render: (item: PrecioVenta) => `${item.iva_porcentaje}%`,
          },
          {
            key: 'activo',
            header: 'Estado',
            render: (item: PrecioVenta) => (
              <Badge variant={item.activo ? 'success' : 'danger'}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Acciones',
            render: (item: PrecioVenta) =>
              item.activo ? (
                <button
                  onClick={() => handleDesactivar(item.id)}
                  className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                  title="Desactivar"
                >
                  <ToggleRight className="w-4 h-4" />
                </button>
              ) : null,
          },
        ]}
        data={precios || []}
        loading={loading}
        keyExtractor={(item) => item.id}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo precio de venta"
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Producto">
            <select
              value={formData.producto_id}
              onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {productos?.map((p: Producto) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Presentación / receta (opcional)">
            <select
              value={formData.receta_id}
              onChange={(e) => setFormData({ ...formData, receta_id: e.target.value })}
            >
              <option value="">Todas / general</option>
              {recetas?.map((r: Receta) => (
                <option key={r.id} value={r.id}>{r.nombre} (v{r.version})</option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Precio de venta con IVA"
            type="number"
            step="0.01"
            min="0"
            value={formData.precio_con_iva}
            onChange={(e) => setFormData({ ...formData, precio_con_iva: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500 -mt-3 mb-4">
            El IVA aplicado será del 19%. La app calculará el precio sin IVA internamente.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {actionLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => {}} />
        </div>
      )}
    </div>
  );
}
