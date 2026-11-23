import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Briefcase, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <Briefcase className="w-6 h-6" />
            </div>
            Recursos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registra y administra los costos fijos mensuales y la inversión inicial del negocio.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/15 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo recurso
        </button>
      </div>

      {/* Banner de Error */}
      {error && (
        <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-800 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-emerald-800">Costos fijos mensuales</p>
          <p className="text-2xl font-bold text-emerald-950 mt-1">
            ${fijosMensuales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-gray-600">Inversión inicial total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${inversionInicial.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <DataTable
          columns={[
            { 
              key: 'nombre', 
              header: 'Nombre',
              render: (item: Recurso) => <span className="font-semibold text-gray-900">{item.nombre}</span>
            },
            {
              key: 'tipo',
              header: 'Tipo',
              render: (item: Recurso) => (
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  {TIPOS.find((t) => t.value === item.tipo)?.label || item.tipo}
                </span>
              ),
            },
            {
              key: 'periodicidad',
              header: 'Periodicidad',
              render: (item: Recurso) => (
                <span className="text-xs text-gray-600">
                  {PERIODICIDADES.find((p) => p.value === item.periodicidad)?.label || item.periodicidad}
                </span>
              ),
            },
            {
              key: 'monto',
              header: 'Monto',
              render: (item: Recurso) => (
                <span className="font-mono text-sm font-bold text-gray-900">
                  ${parseFloat(item.monto).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              key: 'activo',
              header: 'Estado',
              render: (item: Recurso) => (
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
              render: (item: Recurso) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar recurso"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar recurso"
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
          emptyMessage="No hay recursos registrados"
        />
      </div>

      {/* Modal: Crear / Editar Recurso */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar recurso' : 'Nuevo recurso'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FormField label="Nombre">
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
              placeholder="Ej: Arriendo Bodega"
              required
            />
          </FormField>

          <FormField label="Tipo">
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as RecursoTipo })}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
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
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              required
            >
              {PERIODICIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </FormField>

          {formData.periodicidad === 'MENSUAL' && (
            <div className="flex items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id="es_fijo"
                checked={formData.es_fijo}
                onChange={(e) => setFormData({ ...formData, es_fijo: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
              />
              <label htmlFor="es_fijo" className="text-sm font-medium text-gray-700 cursor-pointer">
                Es un costo fijo mensual
              </label>
            </div>
          )}

          <FormField label="Monto">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-medium text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-gray-900 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="0.00"
                required
              />
            </div>
          </FormField>

          <FormField label="Descripción">
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={2}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              placeholder="Detalles adicionales del recurso..."
            />
          </FormField>

          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer">
              Recurso activo
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/15 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar recurso'
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