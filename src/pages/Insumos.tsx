import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  History, 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-mani-50 text-mani-600 border border-mani-100/80">
              <Package className="w-6 h-6" />
            </div>
            Insumos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona el inventario de materias primas, costos de compra y unidades de medida.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-mani-600 hover:bg-mani-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-mani-600/15 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo insumo
        </button>
      </div>

      {/* Banner de Error */}
      {error && (
        <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-800 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <DataTable
          columns={[
            { 
              key: 'nombre', 
              header: 'Nombre',
              render: (item: Insumo) => <span className="font-semibold text-gray-900">{item.nombre}</span>
            },
            {
              key: 'unidad',
              header: 'Unidad',
              render: (item: Insumo) => (
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  {item.unidad_medida?.abreviatura || '-'}
                </span>
              ),
            },
            {
              key: 'precio_compra',
              header: 'Precio',
              render: (item: Insumo) => (
                <span className="font-mono text-sm font-bold text-gray-900">
                  ${parseFloat(item.precio_compra).toFixed(2)}
                </span>
              ),
            },
            {
              key: 'stock_actual',
              header: 'Stock',
              render: (item: Insumo) => (
                <span className={`font-mono text-sm font-bold ${
                  parseFloat(item.stock_actual) < 10 ? 'text-rose-600' : 'text-gray-700'
                }`}>
                  {parseFloat(item.stock_actual).toFixed(2)}
                </span>
              ),
            },
            {
              key: 'activo',
              header: 'Estado',
              render: (item: Insumo) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  item.activo 
                    ? 'bg-mani-50 text-mani-700 border-mani-200/80' 
                    : 'bg-rose-50 text-rose-700 border-rose-200/80'
                }`}>
                  {item.activo ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-mani-600" />
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
              render: (item: Insumo) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openCompra(item)}
                    className="p-1.5 text-mani-600 hover:text-mani-700 hover:bg-mani-50 rounded-lg transition-colors cursor-pointer"
                    title="Registrar compra"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openHistory(item)}
                    className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Historial de precios"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-gray-400 hover:text-mani-600 hover:bg-mani-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar insumo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar insumo"
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
          emptyMessage="No hay insumos registrados"
        />
      </div>

      {/* Modal: Crear / Editar Insumo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar insumo' : 'Nuevo insumo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FormField label="Nombre">
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-mani-500/20 focus:border-mani-500 transition-all outline-none font-medium"
              placeholder="Ej: Sal Marina"
              required
            />
          </FormField>

          <FormField label="Unidad de medida">
            <select
              value={formData.unidad_medida_id}
              onChange={(e) => setFormData({ ...formData, unidad_medida_id: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-mani-500/20 focus:border-mani-500 transition-all outline-none"
              required
            >
              <option value="">Seleccionar unidad...</option>
              {unidades?.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Precio de compra por unidad de medida">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-medium text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_compra}
                onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-gray-900 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-mani-500/20 focus:border-mani-500 transition-all outline-none"
                required
              />
            </div>
          </FormField>
          
          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            Este precio debe corresponder a una unidad de la medida seleccionada (ej: $ por kg, $ por litro).
          </p>

          <FormField label="Stock actual">
            <input
              type="number"
              step="0.0001"
              min="0"
              value={formData.stock_actual}
              onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-mani-500/20 focus:border-mani-500 transition-all outline-none font-mono"
              required
            />
          </FormField>

          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="w-4 h-4 rounded text-mani-600 focus:ring-mani-500 border-gray-300 cursor-pointer"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer">
              Insumo activo
            </label>
          </div>

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
              className="px-5 py-2 bg-mani-600 hover:bg-mani-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-mani-600/15 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar insumo'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modales condicionales del Insumo Seleccionado */}
      {selectedInsumo && (
        <>
          <Modal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            title={`Historial de precios: ${selectedInsumo.nombre}`}
          >
            <InsumoHistoryList insumoId={selectedInsumo.id} />
          </Modal>

          <Modal
            isOpen={isCompraOpen}
            onClose={() => setIsCompraOpen(false)}
            title={`Registrar compra: ${selectedInsumo.nombre}`}
          >
            <form onSubmit={handleCompra} className="space-y-4 pt-1">
              <FormField label="Cantidad comprada">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={compraData.cantidad}
                  onChange={(e) => setCompraData({ ...compraData, cantidad: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-mani-500/20 focus:border-mani-500 transition-all outline-none font-mono"
                  placeholder="0.0000"
                  required
                />
              </FormField>

              <FormField label="Precio unitario de compra">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-medium text-sm">$</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={compraData.precio_unitario}
                    onChange={(e) => setCompraData({ ...compraData, precio_unitario: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-gray-900 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-mani-500/20 focus:border-mani-500 transition-all outline-none"
                    required
                  />
                </div>
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCompraOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-mani-600 hover:bg-mani-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-mani-600/15 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    'Registrar compra'
                  )}
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* Toast Notifications */}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-5 h-5 animate-spin text-mani-600" />
        <span>Cargando historial de precios...</span>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <DataTable
        columns={[
          {
            key: 'fecha',
            header: 'Fecha',
            render: (item: HistorialPrecioInsumo) => (
              <span className="font-medium text-gray-900">
                {format(new Date(item.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
            ),
          },
          {
            key: 'precio',
            header: 'Precio registrado',
            render: (item: HistorialPrecioInsumo) => (
              <span className="font-mono font-bold text-gray-900">
                ${parseFloat(item.precio).toFixed(4)}
              </span>
            ),
          },
        ]}
        data={data || []}
        keyExtractor={(item) => item.id}
        emptyMessage="No hay registros de precios anteriores"
      />
    </div>
  );
}