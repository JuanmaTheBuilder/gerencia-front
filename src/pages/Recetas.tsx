import { useState } from 'react';
import { Plus, Trash2, Pencil, Utensils } from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import type { Receta, RecetaInsumo, Insumo } from '../api/types';

export default function Recetas() {
  const { data: recetas, loading, error, refetch } = useApi(api.recetas.list);
  const { data: insumos } = useApi(api.insumos.list);
  const { loading: actionLoading, execute } = useAsyncAction();
  const { toast, showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<{ id: number; nombre: string; version: string } | null>(null);
  const [addingInsumo, setAddingInsumo] = useState<number | null>(null);
  const [editingInsumo, setEditingInsumo] = useState<{ recetaId: number; lineaId: number; cantidad: string } | null>(null);
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

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Versiones del producto</h1>
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
            Empezá creando "Grande" y "Chica".
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </select>
            </FormField>
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
}: {
  receta: Receta;
  insumos: Insumo[];
  onEdit: () => void;
  onDelete: () => void;
  onAddInsumo: () => void;
  onEditInsumo: (linea: RecetaInsumo) => void;
  onDeleteInsumo: (linea: RecetaInsumo) => void;
}) {
  const { data: detail, loading: loadingDetail } = useApi(() => api.recetas.detail(receta.id), [receta.id]);
  const { data: costo } = useApi(() => api.recetas.costoEstimado(receta.id), [receta.id]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{receta.nombre}</h2>
          <p className="text-sm text-gray-500">Versión {receta.version}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1 text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-primary-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-600">Costo estimado por unidad</p>
        <p className="text-xl font-bold text-primary-700">
          ${costo ? parseFloat(costo.costo_total_estimado).toFixed(2) : loadingDetail ? '...' : '0.00'}
        </p>
      </div>

      {loadingDetail ? (
        <div className="text-center py-4 text-gray-500">Cargando insumos...</div>
      ) : (
        <>
          {detail && detail.recetas_insumos.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">Sin insumos</p>
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
                {detail?.recetas_insumos.map((linea: RecetaInsumo) => {
                  const insumo = insumos.find((i) => i.id === linea.insumo_id);
                  return (
                    <tr key={linea.id} className="border-b border-gray-100">
                      <td className="py-2">{insumo?.nombre || 'Insumo'}</td>
                      <td className="py-2">
                        {parseFloat(linea.cantidad).toFixed(4)} {insumo?.unidad_medida?.abreviatura}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onEditInsumo(linea)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteInsumo(linea)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
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
        </>
      )}

      <button
        onClick={onAddInsumo}
        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        <Plus className="w-4 h-4" />
        Agregar insumo
      </button>
    </div>
  );
}
