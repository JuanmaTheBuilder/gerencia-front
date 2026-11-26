import { usePlan } from '../../plan/PlanContext';
import { conValor } from '../../plan/format';
import { Card, Leyenda, Num, Pct, TablaAnual, Txt } from '../../plan/ui';

export default function Supuestos() {
  const { datos, editar } = usePlan();
  if (!datos) return null;
  const anios = Array.from({ length: datos.n_anios }, (_, t) => datos.anio_inicial + t);

  return (
    <>
      <Leyenda />

      <Card title="Datos generales">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-gray-700">Empresa
            <Txt className="mt-1" value={datos.empresa} onChange={(v) => editar((d) => ({ ...d, empresa: v }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Producto
            <Txt className="mt-1" value={datos.producto} onChange={(v) => editar((d) => ({ ...d, producto: v }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Año inicial
            <Num className="mt-1" decimales={0} miles={false} value={datos.anio_inicial} onChange={(v) => editar((d) => ({ ...d, anio_inicial: Math.round(v) || 2025 }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Años a proyectar
            <Num className="mt-1" decimales={0} value={datos.n_anios}
              onChange={(v) => editar((d) => ({ ...d, n_anios: Math.min(10, Math.max(1, Math.round(v) || 6)) }))} />
          </label>
        </div>
      </Card>

      <Card title="Crecimiento del sector e IPC" subtitle="El crecimiento sube el precio de venta; el IPC sube el costo de la materia prima. El primer año no usa ninguno.">
        <TablaAnual
          anios={anios}
          filas={[
            { clave: 'crec', etiqueta: 'Crecimiento del sector',
              celda: (t) => t === 0 ? <span className="text-gray-300">—</span> : <Pct value={datos.crecimiento[t] ?? 0} onChange={(v) => editar((d) => ({ ...d, crecimiento: conValor(d.crecimiento, t, v) }))} /> },
            { clave: 'ipc', etiqueta: 'IPC',
              celda: (t) => t === 0 ? <span className="text-gray-300">—</span> : <Pct value={datos.ipc[t] ?? 0} onChange={(v) => editar((d) => ({ ...d, ipc: conValor(d.ipc, t, v) }))} /> },
          ]}
        />
      </Card>

      <Card title="Impuestos, utilidades y evaluación">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-gray-700">Impuesto de renta
            <Pct value={datos.pct_renta} onChange={(v) => editar((d) => ({ ...d, pct_renta: v }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Reserva legal
            <Pct value={datos.pct_reserva} onChange={(v) => editar((d) => ({ ...d, pct_reserva: v }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Dividendos
            <Pct value={datos.pct_dividendos} onChange={(v) => editar((d) => ({ ...d, pct_dividendos: v }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Tasa de interés de oportunidad
            <Pct value={datos.tasa_oportunidad} onChange={(v) => editar((d) => ({ ...d, tasa_oportunidad: v }))} />
            <span className="text-xs font-normal text-gray-400">Tasa del banco</span>
          </label>
        </div>
      </Card>
    </>
  );
}
