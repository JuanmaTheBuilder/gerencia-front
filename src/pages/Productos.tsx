import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, ClipboardList, Link2 } from 'lucide-react';
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


  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Creá los productos finales y asocialos a sus recetas o versiones.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {productos?.length === 0 && (
        <div className="p-8 text-center bg-white rounded-lg shadow border border-gray-200 mb-6">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay productos creados.</p>
          <p className="text-sm text-gray-400 mt-1">
            Empezá creando el producto final (ej: Pan, Galletas).
          </p>
        </div>
      )}

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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={handleSubmit}>
          <FormField
            label="Nombre del producto final"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <FormField
            label="Descripción (opcional)"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-4">
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
    <form onSubmit={onAsociar}>
      {loadingAsociadas ? (
        <p className="text-sm text-gray-500 mb-4">Cargando recetas asociadas...</p>
      ) : (
        <FormField label="Receta o versión">
          <select
            value={recetaParaAsociar}
            onChange={(e) => setRecetaParaAsociar(e.target.value)}
            required
            disabled={disponibles.length === 0}
          >
            <option value="">Seleccionar...</option>
            {disponibles.map((r: Receta) => (
              <option key={r.id} value={r.id}>{r.nombre} (v{r.version})</option>
            ))}
          </select>
        </FormField>
      )}
      {!loadingAsociadas && disponibles.length === 0 && (
        <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg mt-2">
          No hay recetas disponibles. Creá una primero en "Recetas".
        </p>
      )}
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={actionLoading || !recetaParaAsociar}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Asociar
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
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary-50 p-2 rounded-lg">
            <Package className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{producto.nombre}</h2>
            {producto.descripcion && (
              <p className="text-sm text-gray-500">{producto.descripcion}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Recetas asociadas
          </h3>
          <button
            onClick={onAsociar}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <Link2 className="w-3.5 h-3.5" />
            Asociar receta
          </button>
        </div>

        {loadingRecetas ? (
          <p className="text-sm text-gray-500">Cargando recetas...</p>
        ) : recetasAsociadas && recetasAsociadas.length > 0 ? (
          <ul className="space-y-2">
            {recetasAsociadas.map((r: Receta) => (
              <li key={r.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-800">{r.nombre}</span>
                <Badge variant={r.activa ? 'success' : 'default'}>v{r.version}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 bg-yellow-50 text-yellow-800 rounded-lg px-3 py-2">
            Sin recetas asociadas. Asociá una para poder calcular costos de producción.
          </p>
        )}
      </div>
    </div>
  );
}
