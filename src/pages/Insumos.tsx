import { useState } from 'react';
import { Plus, Pencil, Trash2, History, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
import type { Insumo, InsumoFormData, HistorialPrecioInsumo } from '../api/types';

export default function Insumos() {
  const { data, loading, error, refetch } = useApi(api.insumos.list);
  const { data: unidades } = useApi(api.unidadesMedida.list);
  const { loading: actionLoading, execute } = useAsyncAction();
  const { toast, showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCompraOpen, setIsCompraOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [editing, setEditing] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState<InsumoFormData>({
    nombre: '', unidad_medida_id: '', proveedor_id: '', precio_compra: '0', stock_actual: '0', activo: true,
  });
  const [compraData, setCompraData] = useState({ cantidad: '', precio_unitario: '' });

  const openCreate = () => {
    setEditing(null);
    setFormData({ nombre: '', unidad_medida_id: '', proveedor_id: '', precio_compra: '0', stock_actual: '0', activo: true });
    setIsModalOpen(true);
  };

  const openEdit = (item: Insumo) => {
    setEditing(item);
    setFormData({
      nombre: item.nombre,
      unidad_medida_id: item.unidad_medida_id.toString(),
      proveedor_id: '',
      precio_compra: item.precio_compra,
      stock_actual: item.stock_actual,
      activo: item.activo,
    });
    setIsModalOpen(true);
  };

  const openHistory = (item: Insumo) => {
    setSelectedInsumo(item);
    setIsHistoryOpen(true);
  };

  const openCompra = (item: Insumo) => {
    setSelectedInsumo(item);
    setCompraData({ cantidad: '', precio_unitario: item.precio_compra });
    setIsCompraOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre,
      unidad_medida_id: parseInt(formData.unidad_medida_id),
      precio_compra: parseFloat(formData.precio_compra) || 0,
      stock_actual: parseFloat(formData.stock_actual) || 0,
      activo: formData.activo,
    };
    try {
      if (editing) {
        await execute(() => api.insumos.update(editing.id, payload));
        showToast('Insumo actualizado', 'success');
      } else {
        await execute(() => api.insumos.create(payload));
        showToast('Insumo creado', 'success');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este insumo?')) return;
    try {
      await execute(() => api.insumos.delete(id));
      showToast('Insumo eliminado', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsumo) return;
    try {
      await execute(() => api.compras.create({
        detalles: [{
          insumo_id: selectedInsumo.id,
          cantidad: parseFloat(compraData.cantidad),
          precio_unitario: parseFloat(compraData.precio_unitario),
        }],
      }));
      showToast('Compra registrada y stock actualizado', 'success');
      setIsCompraOpen(false);
      setCompraData({ cantidad: '', precio_unitario: '' });
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Insumos</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo insumo
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <DataTable
        columns={[
          { key: 'nombre', header: 'Nombre' },
          {
            key: 'unidad',
            header: 'Unidad',
            render: (item: Insumo) => item.unidad_medida?.abreviatura || '-',
          },
          {
            key: 'precio_compra',
            header: 'Precio',
            render: (item: Insumo) => `$${parseFloat(item.precio_compra).toFixed(2)}`,
          },
          {
            key: 'stock_actual',
            header: 'Stock',
            render: (item: Insumo) => (
              <span className={parseFloat(item.stock_actual) < 10 ? 'text-red-600 font-semibold' : ''}>
                {parseFloat(item.stock_actual).toFixed(2)}
              </span>
            ),
          },
          {
            key: 'activo',
            header: 'Estado',
            render: (item: Insumo) => (
              <Badge variant={item.activo ? 'success' : 'danger'}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Acciones',
            render: (item: Insumo) => (
              <div className="flex gap-2">
                <button
                  onClick={() => openCompra(item)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Registrar compra"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openHistory(item)}
                  className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                  title="Historial de precios"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
        data={data || []}
        loading={loading}
        keyExtractor={(item) => item.id}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar insumo' : 'Nuevo insumo'}
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <FormField label="Unidad de medida">
            <select
              value={formData.unidad_medida_id}
              onChange={(e) => setFormData({ ...formData, unidad_medida_id: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {unidades?.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Precio de compra"
              type="number"
              step="0.01"
              min="0"
              value={formData.precio_compra}
              onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
              required
            />
            <FormField
              label="Stock actual"
              type="number"
              step="0.0001"
              min="0"
              value={formData.stock_actual}
              onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="activo" className="text-sm text-gray-700">Activo</label>
          </div>
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

      {selectedInsumo && (
        <>
          <Modal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            title={`Historial: ${selectedInsumo.nombre}`}
          >
            <InsumoHistoryList insumoId={selectedInsumo.id} />
          </Modal>

          <Modal
            isOpen={isCompraOpen}
            onClose={() => setIsCompraOpen(false)}
            title={`Registrar compra: ${selectedInsumo.nombre}`}
          >
            <form onSubmit={handleCompra}>
              <FormField
                label="Cantidad comprada"
                type="number"
                step="0.0001"
                min="0"
                value={compraData.cantidad}
                onChange={(e) => setCompraData({ ...compraData, cantidad: e.target.value })}
                required
              />
              <FormField
                label="Precio unitario"
                type="number"
                step="0.0001"
                min="0"
                value={compraData.precio_unitario}
                onChange={(e) => setCompraData({ ...compraData, precio_unitario: e.target.value })}
                required
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCompraOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Registrar
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => {}} />
        </div>
      )}
    </div>
  );
}

function InsumoHistoryList({ insumoId }: { insumoId: number }) {
  const { data, loading } = useApi(() => api.insumos.precios(insumoId));

  if (loading) return <div className="p-4 text-center">Cargando...</div>;

  return (
    <DataTable
      columns={[
        {
          key: 'fecha',
          header: 'Fecha',
          render: (item: HistorialPrecioInsumo) => format(new Date(item.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
        },
        {
          key: 'precio',
          header: 'Precio',
          render: (item: HistorialPrecioInsumo) => `$${parseFloat(item.precio).toFixed(4)}`,
        },
      ]}
      data={data || []}
      keyExtractor={(item) => item.id}
      emptyMessage="No hay registros de precios"
    />
  );
}
