import { useState, type ReactNode } from 'react';
import { Check, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { usePlan } from './PlanContext';
import { Boton } from './ui';
import Modal from '../components/Modal';

const ESTADO = {
  idle: null,
  pendiente: { texto: 'Cambios sin guardar…', color: 'text-amber-600' },
  guardando: { texto: 'Guardando…', color: 'text-gray-500' },
  guardado: { texto: 'Guardado', color: 'text-mani-600' },
  error: { texto: 'No se pudo guardar', color: 'text-red-600' },
} as const;

/** Marco comun de las pantallas del plan: selector de plan, estado de guardado y crear/borrar. */
export default function PlanShell({ children }: { children: ReactNode }) {
  const { planes, planId, datos, cargando, error, guardado, seleccionar, crear, eliminar } = usePlan();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [producto, setProducto] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const estado = ESTADO[guardado];

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrabajando(true);
    setFallo(null);
    try {
      await crear(nombre.trim() || 'Plan nuevo', empresa.trim(), producto.trim());
      setAbierto(false);
      setNombre('');
      setEmpresa('');
      setProducto('');
    } catch (err) {
      setFallo(err instanceof Error ? err.message : 'No se pudo crear el plan');
    } finally {
      setTrabajando(false);
    }
  };

  const borrar = async () => {
    if (!window.confirm('¿Eliminar este plan? Esta acción no se puede deshacer.')) return;
    try {
      await eliminar();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Plan</span>
        <select
          className="min-w-[14rem] text-sm"
          value={planId ?? ''}
          disabled={planes.length === 0}
          onChange={(e) => seleccionar(Number(e.target.value))}
        >
          {planes.length === 0 && <option value="">Sin planes</option>}
          {planes.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <Boton onClick={() => setAbierto(true)}><Plus className="w-4 h-4" /> Nuevo plan</Boton>
        {planId !== null && <Boton variante="peligro" onClick={borrar}><Trash2 className="w-4 h-4" /> Eliminar</Boton>}
        <div className={`ml-auto flex items-center gap-1.5 text-sm ${estado?.color ?? ''}`}>
          {guardado === 'guardando' && <Loader2 className="w-4 h-4 animate-spin" />}
          {guardado === 'guardado' && <Check className="w-4 h-4" />}
          {guardado === 'error' && <AlertCircle className="w-4 h-4" />}
          {estado?.texto}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>
      )}

      {cargando ? (
        <div className="p-10 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin inline" /> Cargando plan…</div>
      ) : !datos ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-gray-600 mb-4">Todavía no tienes ningún plan de negocio. Crea uno para empezar.</p>
          <Boton variante="primario" onClick={() => setAbierto(true)}><Plus className="w-4 h-4" /> Crear mi primer plan</Boton>
        </div>
      ) : (
        children
      )}

      <Modal isOpen={abierto} onClose={() => setAbierto(false)} title="Nuevo plan de negocio" size="sm">
        <form onSubmit={enviar} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Nombre del plan
            <input className="w-full mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Plan 2025" autoFocus />
          </label>
          <label className="block text-sm font-medium text-gray-700">Empresa
            <input className="w-full mt-1" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">Producto
            <input className="w-full mt-1" value={producto} onChange={(e) => setProducto(e.target.value)} />
          </label>
          {fallo && <p className="text-sm text-red-600">{fallo}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Boton onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" variante="primario" disabled={trabajando}>Crear plan</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
