import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  ClipboardList, 
  Link2, 
  Boxes, 
  AlertCircle, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
import type { Producto, Receta } from '../api/types';

export default function Productos() {
  const { data: productos, loading, error, refetch } = useApi(api.productos.list);
  const { data: recetas } = useApi(api.recetas.list);
  const { loading: actionLoading, execute } = useAsyncAction();
  const { toast, showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  const [asociandoProducto, setAsociandoProducto] = useState<Producto | null>(null);
  const [recetaParaAsociar, setRecetaParaAsociar] = useState('');

  const openCreate = () => {
    setEditing(null);
    setFormData({ nombre: '', descripcion: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: Producto) => {
    setEditing(item);
    setFormData({ nombre: item.nombre, descripcion: item.descripcion || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await execute(() => api.productos.update(editing.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
        }));
        showToast('Producto actualizado', 'success');
      } else {
        await execute(() => api.productos.create({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          activo: true,
        }));
        showToast('Producto creado', 'success');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await execute(() => api.productos.delete(id));
      showToast('Producto eliminado', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleAsociarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asociandoProducto || !recetaParaAsociar) return;
    try {
      await execute(() => api.recetas.asociarProducto(
        parseInt(recetaParaAsociar),
        asociandoProducto.id
      ));
      showToast('Receta asociada al producto', 'success');
      setAsociandoProducto(null);
      setRecetaParaAsociar('');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-7xl mx-auto my-6">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-medium">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-800 text-sm shadow-xs my-6">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <span className="font-semibold">Error al cargar productos:</span> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <Boxes className="w-6 h-6" />
            </div>
            Productos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea los productos finales y asócialos a sus recetas o versiones correspondientes.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/15 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* Estado vacío cuando no hay productos */}
      {productos?.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No hay productos creados</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Empieza creando el producto final (ej: Maní con Sal, Galletas) para luego asociarle sus recetas.
          </p>
        </div>
      )}

      {/* Grid de Tarjetas de Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {productos?.map((producto) => (
          <ProductoCard
            key={producto.id}
            producto={producto}
            onEdit={() => openEdit(producto)}
            onDelete={() => handleDelete(producto.id)}
            onAsociar={() => setAsociandoProducto(producto)}
          />
        ))}
      </div>

      {/* Modal Crear / Editar Producto */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editing ? 'Editar producto' : 'Nuevo producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FormField label="Nombre del producto final">
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
              placeholder="Ej: Maní Aburrá Sal Marina y Limón 50g"
              required
            />
          </FormField>

          <FormField label="Descripción (Opcional)">
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              placeholder="Detalles sobre empaque, canal de venta o características..."
            />
          </FormField>

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
                'Guardar producto'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Asociar Receta */}
      <Modal
        isOpen={asociandoProducto !== null}
        onClose={() => { setAsociandoProducto(null); setRecetaParaAsociar(''); }}
        title={`Asociar receta a ${asociandoProducto?.nombre}`}
      >
        {asociandoProducto && (
          <AsociarRecetaForm
            producto={asociandoProducto}
            todasLasRecetas={recetas || []}
            onCancel={() => { setAsociandoProducto(null); setRecetaParaAsociar(''); }}
            onAsociar={handleAsociarReceta}
            recetaParaAsociar={recetaParaAsociar}
            setRecetaParaAsociar={setRecetaParaAsociar}
            actionLoading={actionLoading}
          />
        )}
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

function AsociarRecetaForm({
  producto,
  todasLasRecetas,
  onCancel,
  onAsociar,
  recetaParaAsociar,
  setRecetaParaAsociar,
  actionLoading,
}: {
  producto: Producto;
  todasLasRecetas: Receta[];
  onCancel: () => void;
  onAsociar: (e: React.FormEvent) => Promise<void>;
  recetaParaAsociar: string;
  setRecetaParaAsociar: (id: string) => void;
  actionLoading: boolean;
}) {
  const { data: asociadas, loading: loadingAsociadas } = useApi(
    () => api.productos.recetas(producto.id),
    [producto.id]
  );

  const asociadasIds = new Set((asociadas || []).map((r) => r.id));
  const disponibles = todasLasRecetas.filter((r) => !asociadasIds.has(r.id));

  return (
    <form onSubmit={onAsociar} className="space-y-4 pt-1">
      {loadingAsociadas ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Cargando recetas disponibles...</span>
        </div>
      ) : (
        <FormField label="Seleccionar receta o versión">
          <select
            value={recetaParaAsociar}
            onChange={(e) => setRecetaParaAsociar(e.target.value)}
            required
            disabled={disponibles.length === 0}
            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-50"
          >
            <option value="">Seleccionar receta...</option>
            {disponibles.map((r: Receta) => (
              <option key={r.id} value={r.id}>
                {r.nombre} (v{r.version})
              </option>
            ))}
          </select>
        </FormField>
      )}

      {!loadingAsociadas && disponibles.length === 0 && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            No hay más recetas disponibles para asociar a este producto. Crea una receta previa en la sección <span className="font-semibold">"Recetas"</span>.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={actionLoading || !recetaParaAsociar}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/15 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {actionLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Asociando...</span>
            </>
          ) : (
            'Asociar receta'
          )}
        </button>
      </div>
    </form>
  );
}

function ProductoCard({
  producto,
  onEdit,
  onDelete,
  onAsociar,
}: {
  producto: Producto;
  onEdit: () => void;
  onDelete: () => void;
  onAsociar: () => void;
}) {
  const { data: recetasAsociadas, loading: loadingRecetas } = useApi(
    () => api.productos.recetas(producto.id),
    [producto.id]
  );

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Header de la Tarjeta */}
        <div className="flex justify-between items-start mb-4 gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
                {producto.nombre}
              </h2>
              {producto.descripcion && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {producto.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Botones Editar / Eliminar */}
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={onEdit} 
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
              title="Editar producto"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete} 
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
              title="Eliminar producto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sección de Recetas Asociadas */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              Recetas asociadas
            </h3>
            <button
              onClick={onAsociar}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/80 transition-all cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              Asociar receta
            </button>
          </div>

          {loadingRecetas ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Cargando recetas...</span>
            </div>
          ) : recetasAsociadas && recetasAsociadas.length > 0 ? (
            <div className="space-y-2">
              {recetasAsociadas.map((r: Receta) => (
                <div key={r.id} className="flex items-center justify-between text-xs bg-gray-50/80 rounded-xl px-3.5 py-2.5 border border-gray-100">
                  <span className="font-semibold text-gray-800">{r.nombre}</span>
                  <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    v{r.version}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Sin recetas asociadas. Asocia una para poder calcular los requerimientos y costos de producción.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}