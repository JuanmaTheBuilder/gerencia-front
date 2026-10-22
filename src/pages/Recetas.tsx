import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Utensils, Users, Wrench, AlertTriangle, Link2, Boxes } from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import type {
  Receta,
  RecetaInsumo,
  Insumo,
  Producto,
  RecetaCostosEstandar,
  CostoPersonal,
  CostoRecurso,
} from '../api/types';

const COSTOS_KEY = (recetaId: number) => `receta_costos_${recetaId}`;

function loadCostos(recetaId: number): RecetaCostosEstandar {
  try {
    const raw = localStorage.getItem(COSTOS_KEY(recetaId));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { personal: [], recursos: [] };
}

function saveCostos(recetaId: number, costos: RecetaCostosEstandar) {
  localStorage.setItem(COSTOS_KEY(recetaId), JSON.stringify(costos));
}

export default function Recetas() {
  const { data: recetas, loading, error, refetch } = useApi(api.recetas.list);
  const { data: insumos } = useApi(api.insumos.list);
  const { data: productos } = useApi(api.productos.list);
  const { loading: actionLoading, execute } = useAsyncAction();
  const { toast, showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<{ id: number; nombre: string; version: string } | null>(null);
  const [addingInsumo, setAddingInsumo] = useState<number | null>(null);
  const [editingInsumo, setEditingInsumo] = useState<{ recetaId: number; lineaId: number; cantidad: string } | null>(null);
  const [asociandoProducto, setAsociandoProducto] = useState<Receta | null>(null);
  const [productoParaAsociar, setProductoParaAsociar] = useState('');

  const [newRecipe, setNewRecipe] = useState({ nombre: '', version: '1.0' });
  const [newInsumo, setNewInsumo] = useState({ insumo_id: '', cantidad: '' });

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await execute(() => api.recetas.create({
        nombre: newRecipe.nombre,
        version: newRecipe.version,
        activa: true,
        insumos: [],
      }));
      showToast('Versión creada', 'success');
      setIsCreateOpen(false);
      setNewRecipe({ nombre: '', version: '1.0' });
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleUpdateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;
    try {
      await execute(() => api.recetas.update(editingRecipe.id, {
        nombre: editingRecipe.nombre,
        version: editingRecipe.version,
      }));
      showToast('Versión actualizada', 'success');
      setEditingRecipe(null);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('¿Eliminar esta versión?')) return;
    try {
      await execute(() => api.recetas.delete(id));
      showToast('Versión eliminada', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleAddInsumo = async (e: React.FormEvent, recetaId: number) => {
    e.preventDefault();
    try {
      await execute(() => api.recetas.addInsumo(recetaId, {
        insumo_id: parseInt(newInsumo.insumo_id),
        cantidad: parseFloat(newInsumo.cantidad),
      }));
      showToast('Insumo agregado', 'success');
      setAddingInsumo(null);
      setNewInsumo({ insumo_id: '', cantidad: '' });
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleUpdateInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInsumo) return;
    try {
      await execute(() => api.recetas.updateInsumo(
        editingInsumo.recetaId,
        editingInsumo.lineaId,
        { cantidad: parseFloat(editingInsumo.cantidad) }
      ));
      showToast('Cantidad actualizada', 'success');
      setEditingInsumo(null);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDeleteInsumo = async (recetaId: number, lineaId: number) => {
    if (!confirm('¿Eliminar este insumo de la receta?')) return;
    try {
      await execute(() => api.recetas.deleteInsumo(recetaId, lineaId));
      showToast('Insumo eliminado', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleAsociarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asociandoProducto || !productoParaAsociar) return;
    try {
      await execute(() => api.recetas.asociarProducto(asociandoProducto.id, parseInt(productoParaAsociar)));
      showToast('Producto asociado a la receta', 'success');
      setAsociandoProducto(null);
      setProductoParaAsociar('');
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
          <h1 className="text-2xl font-bold text-gray-900">Recetas y versiones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Definí los insumos por unidad, los costos de personal y los recursos necesarios.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nueva versión
        </button>
      </div>

      {recetas?.length === 0 && (
        <div className="p-8 text-center bg-white rounded-lg shadow border border-gray-200 mb-6">
          <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay versiones creadas.</p>
          <p className="text-sm text-gray-400 mt-1">
            Creá versiones como "Grande" o "Chica" y asocialas a un producto.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {recetas?.map((receta: Receta) => (
          <RecipeCard
            key={receta.id}
            receta={receta}
            insumos={insumos || []}

            onEdit={() => setEditingRecipe({ id: receta.id, nombre: receta.nombre, version: receta.version })}
            onDelete={() => handleDeleteRecipe(receta.id)}
            onAddInsumo={() => setAddingInsumo(receta.id)}
            onEditInsumo={(linea) => setEditingInsumo({ recetaId: receta.id, lineaId: linea.id, cantidad: linea.cantidad })}
            onDeleteInsumo={(linea) => handleDeleteInsumo(receta.id, linea.id)}
            onAsociarProducto={() => setAsociandoProducto(receta)}
          />
        ))}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nueva versión">
        <form onSubmit={handleCreateRecipe}>
          <FormField
            label="Nombre (ej: Grande, Chica)"
            value={newRecipe.nombre}
            onChange={(e) => setNewRecipe({ ...newRecipe, nombre: e.target.value })}
            required
          />
          <FormField
            label="Versión"
            value={newRecipe.version}
            onChange={(e) => setNewRecipe({ ...newRecipe, version: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editingRecipe}
        onClose={() => setEditingRecipe(null)}
        title="Editar versión"
      >
        {editingRecipe && (
          <form onSubmit={handleUpdateRecipe}>
            <FormField
              label="Nombre"
              value={editingRecipe.nombre}
              onChange={(e) => setEditingRecipe({ ...editingRecipe, nombre: e.target.value })}
              required
            />
            <FormField
              label="Versión"
              value={editingRecipe.version}
              onChange={(e) => setEditingRecipe({ ...editingRecipe, version: e.target.value })}
              required
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setEditingRecipe(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={addingInsumo !== null}
        onClose={() => { setAddingInsumo(null); setNewInsumo({ insumo_id: '', cantidad: '' }); }}
        title="Agregar insumo"
      >
        {addingInsumo !== null && (
          <form onSubmit={(e) => handleAddInsumo(e, addingInsumo)}>
            <FormField label="Insumo">
              <select
                value={newInsumo.insumo_id}
                onChange={(e) => setNewInsumo({ ...newInsumo, insumo_id: e.target.value })}
                required
              >
                <option value="">Seleccionar...</option>
                {insumos?.map((i: Insumo) => (
                  <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida?.abreviatura}) — ${parseFloat(i.precio_compra).toFixed(2)}</option>
                ))}
              </select>
            </FormField>
            <p className="text-xs text-gray-500 mb-4">
              La cantidad debe expresarse en la misma unidad del insumo seleccionado.
            </p>
            <FormField
              label="Cantidad por unidad producida"
              type="number"
              step="0.0001"
              min="0"
              value={newInsumo.cantidad}
              onChange={(e) => setNewInsumo({ ...newInsumo, cantidad: e.target.value })}
              required
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setAddingInsumo(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Agregar
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={editingInsumo !== null}
        onClose={() => setEditingInsumo(null)}
        title="Editar cantidad"
      >
        {editingInsumo && (
          <form onSubmit={handleUpdateInsumo}>
            <FormField
              label="Cantidad por unidad producida"
              type="number"
              step="0.0001"
              min="0"
              value={editingInsumo.cantidad}
              onChange={(e) => setEditingInsumo({ ...editingInsumo, cantidad: e.target.value })}
              required
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setEditingInsumo(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={asociandoProducto !== null}
        onClose={() => { setAsociandoProducto(null); setProductoParaAsociar(''); }}
        title={`Asociar producto a ${asociandoProducto?.nombre}`}
      >
        {asociandoProducto && (
          <form onSubmit={handleAsociarProducto}>
            <FormField label="Producto">
              <select
                value={productoParaAsociar}
                onChange={(e) => setProductoParaAsociar(e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {productos?.map((p: Producto) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </FormField>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setAsociandoProducto(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading || !productoParaAsociar}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Asociar
              </button>
            </div>
          </form>
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

function RecipeCard({
  receta,
  insumos,
  onEdit,
  onDelete,
  onAddInsumo,
  onEditInsumo,
  onDeleteInsumo,
  onAsociarProducto,
}: {
  receta: Receta;
  insumos: Insumo[];
  onEdit: () => void;
  onDelete: () => void;
  onAddInsumo: () => void;
  onEditInsumo: (linea: RecetaInsumo) => void;
  onDeleteInsumo: (linea: RecetaInsumo) => void;
  onAsociarProducto: () => void;
}) {
  const { data: detail, loading: loadingDetail } = useApi(() => api.recetas.detail(receta.id), [receta.id]);
  const { data: costo } = useApi(() => api.recetas.costoEstimado(receta.id), [receta.id]);
  const [costos, setCostos] = useState<RecetaCostosEstandar>(() => loadCostos(receta.id));

  useEffect(() => {
    saveCostos(receta.id, costos);
  }, [receta.id, costos]);

  const costoMaterialesUnitario = costo ? parseFloat(costo.costo_total_estimado) : 0;
  const costoPersonalUnitario = costos.personal.reduce((sum, c) => sum + c.horas * c.costo_hora, 0);
  const costoRecursosUnitario = costos.recursos.reduce((sum, c) => sum + c.cantidad * c.costo_unitario, 0);
  const costoTotalUnitario = costoMaterialesUnitario + costoPersonalUnitario + costoRecursosUnitario;

  const lineas = detail?.recetas_insumos || [];
  const insumosConProblemas = lineas
    .map((linea) => ({ linea, insumo: insumos.find((i) => i.id === linea.insumo_id) }))
    .filter(({ insumo }) => !insumo || parseFloat(insumo?.precio_compra || '0') <= 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{receta.nombre}</h2>
          <p className="text-sm text-gray-500">Versión {receta.version}</p>
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

      <div className="bg-primary-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-600">Costo estimado por unidad</p>
        <p className="text-xl font-bold text-primary-700">${costoTotalUnitario.toFixed(2)}</p>
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
          <span>Materiales: ${costoMaterialesUnitario.toFixed(2)}</span>
          <span>•</span>
          <span>Personal: ${costoPersonalUnitario.toFixed(2)}</span>
          <span>•</span>
          <span>Recursos: ${costoRecursosUnitario.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Boxes className="w-4 h-4" />
            Productos asociados
          </h3>
          <button
            onClick={onAsociarProducto}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <Link2 className="w-3.5 h-3.5" />
            Asociar producto
          </button>
        </div>
        {detail && detail.productos_recetas.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {detail.productos_recetas.map((p: Producto) => (
              <li key={p.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {p.nombre}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            Sin productos asociados. Asociá al menos uno para planificar producción.
          </p>
        )}
      </div>

      {insumosConProblemas.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">
            Algunos insumos no tienen precio de compra registrado. El costo estimado de materiales será incompleto.
          </p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Insumos por unidad producida</h3>
          <button
            onClick={onAddInsumo}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar insumo
          </button>
        </div>

        {loadingDetail ? (
          <div className="text-center py-4 text-gray-500">Cargando insumos...</div>
        ) : lineas.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">Sin insumos configurados.</p>
        ) : (
          <table className="w-full text-sm mb-3">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="py-2">Insumo</th>
                <th className="py-2">Cantidad</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea: RecetaInsumo) => {
                const insumo = insumos.find((i) => i.id === linea.insumo_id);
                const sinPrecio = !insumo || parseFloat(insumo.precio_compra) <= 0;
                return (
                  <tr key={linea.id} className="border-b border-gray-100">
                    <td className="py-2">
                      <span className={sinPrecio ? 'text-red-600' : ''}>{insumo?.nombre || 'Insumo'}</span>
                      {sinPrecio && <span className="text-xs text-red-500 block">Sin precio</span>}
                    </td>
                    <td className="py-2">
                      {parseFloat(linea.cantidad).toFixed(4)} {insumo?.unidad_medida?.abreviatura}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => onEditInsumo(linea)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteInsumo(linea)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-4">
        <CostosPersonalEditor
          items={costos.personal}
          onChange={(personal) => setCostos((prev) => ({ ...prev, personal }))}
        />
        <CostosRecursosEditor
          items={costos.recursos}
          onChange={(recursos) => setCostos((prev) => ({ ...prev, recursos }))}
        />
      </div>
    </div>
  );
}

function CostosPersonalEditor({
  items,
  onChange,
}: {
  items: CostoPersonal[];
  onChange: (items: CostoPersonal[]) => void;
}) {
  const add = () => {
    onChange([...items, { id: crypto.randomUUID(), concepto: '', horas: 0, costo_hora: 0 }]);
  };

  const update = (id: string, partial: Partial<CostoPersonal>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...partial } : i)));
  };

  const remove = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const total = items.reduce((sum, i) => sum + i.horas * i.costo_hora, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Mano de obra por unidad
        </h3>
        <span className="text-xs font-semibold text-primary-700">${total.toFixed(2)}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">Registrá tareas o roles con las horas estimadas y su costo hora.</p>
      {items.length === 0 && <p className="text-sm text-gray-400 italic mb-2">Sin costos de personal.</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
            <input
              type="text"
              placeholder="Concepto (ej: Horneado)"
              value={item.concepto}
              onChange={(e) => update(item.id, { concepto: e.target.value })}
              className="col-span-5 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Horas"
              value={item.horas}
              onChange={(e) => update(item.id, { horas: parseFloat(e.target.value) || 0 })}
              className="col-span-3 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="$/hora"
              value={item.costo_hora}
              onChange={(e) => update(item.id, { costo_hora: parseFloat(e.target.value) || 0 })}
              className="col-span-3 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="col-span-1 p-1 text-red-600 hover:bg-red-50 rounded flex justify-center"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar tarea
      </button>
    </div>
  );
}

function CostosRecursosEditor({
  items,
  onChange,
}: {
  items: CostoRecurso[];
  onChange: (items: CostoRecurso[]) => void;
}) {
  const add = () => {
    onChange([...items, { id: crypto.randomUUID(), concepto: '', cantidad: 1, costo_unitario: 0 }]);
  };

  const update = (id: string, partial: Partial<CostoRecurso>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...partial } : i)));
  };

  const remove = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const total = items.reduce((sum, i) => sum + i.cantidad * i.costo_unitario, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Otros recursos por unidad
        </h3>
        <span className="text-xs font-semibold text-primary-700">${total.toFixed(2)}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">Energía, gas, empaque, alquiler de equipo, etc.</p>
      {items.length === 0 && <p className="text-sm text-gray-400 italic mb-2">Sin recursos configurados.</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
            <input
              type="text"
              placeholder="Concepto (ej: Empaque)"
              value={item.concepto}
              onChange={(e) => update(item.id, { concepto: e.target.value })}
              className="col-span-5 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Cantidad"
              value={item.cantidad}
              onChange={(e) => update(item.id, { cantidad: parseFloat(e.target.value) || 0 })}
              className="col-span-3 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="$/unidad"
              value={item.costo_unitario}
              onChange={(e) => update(item.id, { costo_unitario: parseFloat(e.target.value) || 0 })}
              className="col-span-3 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="col-span-1 p-1 text-red-600 hover:bg-red-50 rounded flex justify-center"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar recurso
      </button>
    </div>
  );
}
