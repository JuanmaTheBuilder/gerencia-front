import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { usePlan } from '../../plan/PlanContext';
import { conValor, dinero, porcentaje } from '../../plan/format';
import { Boton, Calc, Card, Leyenda, Num, Pct, TablaAnual } from '../../plan/ui';
import Modal from '../../components/Modal';

export default function Demanda() {
  const { datos, resultados, editar } = usePlan();
  const { data: precios } = useApi(api.preciosVenta.list);
  const { data: productos } = useApi(api.productos.list);
  const [modal, setModal] = useState(false);
  if (!datos) return null;
  const r = resultados?.demanda;
  const anios = Array.from({ length: datos.n_anios }, (_, t) => datos.anio_inicial + t);
  const sumaVentas = datos.pct_credito + datos.pct_contado;

  const activos = (precios ?? []).filter((p) => p.activo);
  const nombreProducto = (id: number) => productos?.find((p) => p.id === id)?.nombre ?? `Producto ${id}`;

  return (
    <>
      <Leyenda />

      <Card title="Cantidad y precio" action={
        <Boton onClick={() => setModal(true)}><DollarSign className="w-4 h-4" /> Traer precio desde catálogo</Boton>}>
        <div className="max-w-xs mb-4">
          <label className="text-sm font-medium text-gray-700">Precio de venta inicial (sin IVA)
            <Num decimales={2} value={datos.precio_inicial} onChange={(v) => editar((d) => ({ ...d, precio_inicial: v }))} />
          </label>
        </div>
        <TablaAnual
          anios={anios}
          filas={[
            { clave: 'cant', etiqueta: 'Cantidad', celda: (t) => <Num decimales={0} value={datos.cantidad[t] ?? 0} onChange={(v) => editar((d) => ({ ...d, cantidad: conValor(d.cantidad, t, v) }))} /> },
            { clave: 'precio', etiqueta: 'Precio de venta (crece con el sector)', celda: (t) => <Calc>{dinero(r?.precio[t])}</Calc> },
            { clave: 'ing', etiqueta: 'Total ingreso (cantidad × precio)', total: true, celda: (t) => dinero(r?.ingreso[t]) },
          ]}
        />
      </Card>

      <Card title="Cartera" subtitle="Cómo se reparten las ventas y cuánto se provisiona por deudas malas.">
        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mb-4">
          <label className="text-sm font-medium text-gray-700">Ventas a crédito
            <Pct value={datos.pct_credito} onChange={(v) => editar((d) => ({ ...d, pct_credito: v }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Ventas de contado
            <Pct value={datos.pct_contado} onChange={(v) => editar((d) => ({ ...d, pct_contado: v }))} />
          </label>
          <label className="text-sm font-medium text-gray-700">Provisión deudas malas
            <Pct value={datos.pct_provision} onChange={(v) => editar((d) => ({ ...d, pct_provision: v }))} />
          </label>
        </div>
        {Math.abs(sumaVentas - 1) > 1e-9 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            Crédito + contado suman {porcentaje(sumaVentas)}; deberían sumar 100 %.
          </p>
        )}
        <TablaAnual
          anios={anios}
          filas={[
            { clave: 'prov', etiqueta: 'Provisión para deudas malas', celda: (t) => <Calc>{dinero(r?.provision[t])}</Calc> },
            { clave: 'cred', etiqueta: 'Ventas a crédito', celda: (t) => <Calc>{dinero(r?.ventas_credito[t])}</Calc> },
            { clave: 'cont', etiqueta: 'Ventas de contado', celda: (t) => <Calc>{dinero(r?.ventas_contado[t])}</Calc> },
          ]}
        />
      </Card>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Precios de venta del catálogo" size="md">
        {activos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay precios de venta activos. Créalos en «Precios de venta».</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {activos.map((p) => {
              const sinIva = Number(p.precio_con_iva) / (1 + Number(p.iva_porcentaje) / 100);
              return (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{nombreProducto(p.producto_id)}</p>
                    <p className="text-xs text-gray-500">Con IVA {dinero(Number(p.precio_con_iva))} · IVA {p.iva_porcentaje} % · sin IVA {dinero(sinIva)}</p>
                  </div>
                  <Boton variante="primario" onClick={() => { editar((d) => ({ ...d, precio_inicial: Math.round(sinIva * 100) / 100 })); setModal(false); }}>Usar</Boton>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-3">Se copia el precio sin IVA; cambiar el catálogo después no altera este plan.</p>
      </Modal>
    </>
  );
}
