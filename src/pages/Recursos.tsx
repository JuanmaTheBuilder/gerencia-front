import { useState } from 'react';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
import type { Recurso, RecursoFormData, RecursoTipo, RecursoPeriodicidad } from '../api/types';

const TIPOS: { value: RecursoTipo; label: string }[] = [
  { value: 'FISICO', label: 'Físico' },
  { value: 'FINANCIERO', label: 'Financiero' },
  { value: 'HUMANO', label: 'Humano' },
  { value: 'INTANGIBLE_NO_HUMANO', label: 'Intangible no humano' },
];

const PERIODICIDADES: { value: RecursoPeriodicidad; label: string }[] = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'UNICO', label: 'Único (inversión inicial)' },
];

const initialFormData: RecursoFormData = {
  nombre: '',
  tipo: 'FISICO',
  periodicidad: 'MENSUAL',
  es_fijo: true,
  monto: '',
  descripcion: '',
  activo: true,
};

export default function Recursos() {
  const { data, loading, error, refetch } = useApi(api.recursos.list);
  const { loading: actionLoading, execute } = useAsyncAction();
  const { toast, showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recurso | null>(null);
  const [formData, setFormData] = useState<RecursoFormData>(initialFormData);

  const openCreate = () => {
    setEditing(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEdit = (item: Recurso) => {
    setEditing(item);
    setFormData({
      nombre: item.nombre,
      tipo: item.tipo,
      periodicidad: item.periodicidad,
      es_fijo: item.es_fijo,
      monto: item.monto,
      descripcion: item.descripcion || '',
      activo: item.activo,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre,
      tipo: formData.tipo,
      periodicidad: formData.periodicidad,
      es_fijo: formData.periodicidad === 'MENSUAL' ? formData.es_fijo : false,
      monto: parseFloat(formData.monto) || 0,
      descripcion: formData.descripcion,
      activo: formData.activo,
    };
    try {
      if (editing) {
        await execute(() => api.recursos.update(editing.id, payload));
        showToast('Recurso actualizado', 'success');
      } else {
        await execute(() => api.recursos.create(payload));
        showToast('Recurso creado', 'success');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este recurso?')) return;
    try {
      await execute(() => api.recursos.delete(id));
      showToast('Recurso eliminado', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const fijosMensuales = (data || [])
    .filter((r) => r.periodicidad === 'MENSUAL' && r.es_fijo && r.activo)
    .reduce((sum, r) => sum + parseFloat(r.monto), 0);

  const inversionInicial = (data || [])
    .filter((r) => r.periodicidad === 'UNICO' && r.activo)
    .reduce((sum, r) => sum + parseFloat(r.monto), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-primary-600" />
            Recursos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registrá los costos fijos mensuales y la inversión inicial del negocio.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo recurso
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Costos fijos mensuales</p>
          <p className="text-2xl font-bold text-primary-700">${fijosMensuales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Inversión inicial total</p>
          <p className="text-2xl font-bold text-emerald-700">${inversionInicial.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'nombre', header: 'Nombre' },
          {
            key: 'tipo',
            header: 'Tipo',
            render: (item: Recurso) => TIPOS.find((t) => t.value === item.tipo)?.label || item.tipo,
          },
          {
            key: 'periodicidad',
            header: 'Periodicidad',
            render: (item: Recurso) => PERIODICIDADES.find((p) => p.value === item.periodicidad)?.label || item.periodicidad,
          },
          {
            key: 'monto',
            header: 'Monto',
            render: (item: Recurso) => `$${parseFloat(item.monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
          },
          {
            key: 'activo',
            header: 'Estado',
            render: (item: Recurso) => (
              <Badge variant={item.activo ? 'success' : 'danger'}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Acciones',
            render: (item: Recurso) => (
              <div className="flex gap-2">
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
        title={editing ? 'Editar recurso' : 'Nuevo recurso'}
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <FormField label="Tipo">
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as RecursoTipo })}
              required
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Periodicidad">
            <select
              value={formData.periodicidad}
              onChange={(e) => setFormData({ ...formData, periodicidad: e.target.value as RecursoPeriodicidad })}
              required
            >
              {PERIODICIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </FormField>
          {formData.periodicidad === 'MENSUAL' && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="es_fijo"
                checked={formData.es_fijo}
                onChange={(e) => setFormData({ ...formData, es_fijo: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="es_fijo" className="text-sm text-gray-700">
                Es un costo fijo mensual
              </label>
            </div>
          )}
          <FormField
            label="Monto"
            type="number"
            step="0.01"
            min="0"
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
            required
          />
          <FormField
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
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

      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => {}} />
        </div>
      )}
    </div>
  );
}
