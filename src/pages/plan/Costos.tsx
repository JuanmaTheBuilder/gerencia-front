import { useState } from 'react';
import { ClipboardList, Plus, Trash2, Users } from 'lucide-react';
import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { usePlan } from '../../plan/PlanContext';
import { conValor, dinero, numero, porcentaje } from '../../plan/format';
import { Boton, Calc, Card, Leyenda, Num, Pct, TablaAnual, Txt } from '../../plan/ui';
import Modal from '../../components/Modal';
import { conIpc, lineaVacia } from '../../plan/helpers';
import type { LineaAnual } from '../../plan/types';

type Pestana = 'mp' | 'mo' | 'cif';

/** Factor para llevar la unidad del catalogo a gramos o ml. */
function factorUnidad(abreviatura?: string): number {
  switch ((abreviatura ?? '').toLowerCase()) {
    case 'kg': return 1000;
    case 'l': case 'lt': case 'lts': return 1000;
    case 'mg': return 0.001;
    default: return 1;
  }
}

export default function Costos() {
  const { datos, resultados, editar } = usePlan();
  const [tab, setTab] = useState<Pestana>('mp');
  const [modal, setModal] = useState(false);
  const { data: recetas } = useApi(api.recetas.list);
  const [cargandoReceta, setCargandoReceta] = useState(false);
  if (!datos) return null;
  const anios = Array.from({ length: datos.n_anios }, (_, t) => datos.anio_inicial + t);
  const mp = resultados?.materia_prima;
  const sumaPagos = datos.pct_pago_contado + datos.pct_pago_credito;

  const traerReceta = async (id: number) => {
    setCargandoReceta(true);
    try {
      const det = await api.recetas.detail(id);
      editar((d) => ({
        ...d,
        materias_primas: det.recetas_insumos.map((ri) => {
          const f = factorUnidad(ri.insumo?.unidad_medida?.abreviatura);
          return {
            nombre: ri.insumo?.nombre ?? `Insumo ${ri.insumo_id}`,
            cantidad: Number(ri.cantidad) * f,
            costo_unitario: Number(ri.insumo?.precio_compra ?? 0) / f,
          };
        }),
      }));
      setModal(false);
    } finally {
      setCargandoReceta(false);
    }
  };

  const traerNominaMO = () => {
    const mensual = resultados?.nomina.costo_mensual_por_area.produccion ?? 0;
    editar((d) => ({ ...d, mano_obra: conIpc(d, mensual * 12) }));
  };

  const rellenarCif = () =>
    editar((d) => ({
      ...d,
      cif: d.cif.map((l) => (l.consumo_mes > 0 ? { ...l, consumo_anio: l.consumo_mes * 12, valores: conIpc(d, l.consumo_mes * l.costo * 12) } : l)),
    }));

  const cambiarCif = (i: number, cambio: Partial<LineaAnual>) =>
    editar((d) => ({ ...d, cif: conValor(d.cif, i, { ...d.cif[i], ...cambio }) }));

  const pestanas: [Pestana, string][] = [['mp', 'Materia prima'], ['mo', 'Mano de obra'], ['cif', 'CIF']];

  return (
    <>
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {pestanas.map(([k, et]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${tab === k ? 'border-mani-600 text-mani-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {et}
          </button>
        ))}
      </div>
      <Leyenda />

      {tab === 'mp' && (
        <>
          <Card title="Materia prima por unidad" subtitle="Cantidad en gramos o ml que lleva cada unidad y costo por gramo/ml del proveedor."
            action={
              <div className="flex gap-2">
                <Boton onClick={() => setModal(true)}><ClipboardList className="w-4 h-4" /> Traer desde receta</Boton>
                <Boton onClick={() => editar((d) => ({ ...d, materias_primas: [...d.materias_primas, { nombre: '', cantidad: 0, costo_unitario: 0 }] }))}><Plus className="w-4 h-4" /> Agregar</Boton>
              </div>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500">
                  <th className="py-1.5 pr-2 font-medium">Materia prima</th><th className="py-1.5 pr-2 font-medium text-right">Gramos / ml</th>
                  <th className="py-1.5 pr-2 font-medium text-right">Costo por gr/ml</th><th className="py-1.5 pr-2 font-medium text-right">Costo por UND</th><th />
                </tr></thead>
                <tbody>
                  {datos.materias_primas.map((m, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-2"><Txt value={m.nombre} onChange={(v) => editar((d) => ({ ...d, materias_primas: conValor(d.materias_primas, i, { ...m, nombre: v }) }))} /></td>
                      <td className="py-1 pr-2 w-36"><Num decimales={4} value={m.cantidad} onChange={(v) => editar((d) => ({ ...d, materias_primas: conValor(d.materias_primas, i, { ...m, cantidad: v }) }))} /></td>
                      <td className="py-1 pr-2 w-40"><Num decimales={6} value={m.costo_unitario} onChange={(v) => editar((d) => ({ ...d, materias_primas: conValor(d.materias_primas, i, { ...m, costo_unitario: v }) }))} /></td>
                      <td className="py-1 pr-2 w-36 text-right"><Calc>{numero(m.cantidad * m.costo_unitario, 2)}</Calc></td>
                      <td className="py-1 w-10"><button title="Quitar" className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => editar((d) => ({ ...d, materias_primas: d.materias_primas.filter((_, k) => k !== i) }))}><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-mani-50">
                    <td className="py-1.5 px-2">TOTAL</td>
                    <td className="py-1.5 pr-2 text-right">{numero(mp?.cantidad_total, 2)}</td><td />
                    <td className="py-1.5 pr-2 text-right">{numero(mp?.costo_und_total, 2)}</td><td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Costo anual de materia prima" subtitle="Año 1 = costo por unidad × cantidad del año 1. Los siguientes suben con el IPC.">
            <TablaAnual anios={anios}
              filas={[
                ...(mp?.lineas ?? []).map((l, i) => ({ clave: `l${i}`, etiqueta: l.nombre || '—', celda: (t: number) => <Calc>{dinero(l.valores[t])}</Calc> })),
                { clave: 'tot', etiqueta: 'TOTAL', total: true, celda: (t: number) => dinero(mp?.total[t]) },
                { clave: 'mb', etiqueta: 'Margen bruto', celda: (t: number) => <Calc>{porcentaje(mp?.margen_bruto[t])}</Calc> },
              ]} />
          </Card>

          <Card title="Pago a proveedores">
            <div className="grid sm:grid-cols-2 gap-4 max-w-md mb-4">
              <label className="text-sm font-medium text-gray-700">Pago de contado
                <Pct value={datos.pct_pago_contado} onChange={(v) => editar((d) => ({ ...d, pct_pago_contado: v }))} />
              </label>
              <label className="text-sm font-medium text-gray-700">Pago a crédito
                <Pct value={datos.pct_pago_credito} onChange={(v) => editar((d) => ({ ...d, pct_pago_credito: v }))} />
              </label>
            </div>
            {Math.abs(sumaPagos - 1) > 1e-9 && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">Contado + crédito suman {porcentaje(sumaPagos)}; deberían sumar 100 %.</p>}
            <TablaAnual anios={anios} filas={[
              { clave: 'pc', etiqueta: 'Pago contado', celda: (t) => <Calc>{dinero(mp?.pago_contado[t])}</Calc> },
              { clave: 'pk', etiqueta: 'Pago crédito', celda: (t) => <Calc>{dinero(mp?.pago_credito[t])}</Calc> },
            ]} />
          </Card>
        </>
      )}

      {tab === 'mo' && (
        <Card title="Costo de ventas: mano de obra de producción"
          subtitle={datos.mano_obra === null ? 'Como en la plantilla, se calcula como el 5 % de la materia prima.' : 'Valores digitados por año.'}
          action={
            <div className="flex gap-2">
              <Boton onClick={traerNominaMO}><Users className="w-4 h-4" /> Traer desde nómina</Boton>
              {datos.mano_obra === null
                ? <Boton onClick={() => editar((d) => ({ ...d, mano_obra: (resultados?.mano_obra.valores ?? []).map(Math.round) }))}>Digitar valores</Boton>
                : <Boton onClick={() => editar((d) => ({ ...d, mano_obra: null }))}>Usar 5 % de la materia prima</Boton>}
            </div>}>
          <TablaAnual anios={anios} filas={[
            { clave: 'mo', etiqueta: 'Mano de obra por producción',
              celda: (t) => datos.mano_obra === null
                ? <Calc>{dinero(resultados?.mano_obra.valores[t])}</Calc>
                : <Num decimales={0} value={datos.mano_obra[t] ?? 0} onChange={(v) => editar((d) => ({ ...d, mano_obra: conValor(d.mano_obra ?? [], t, v) }))} /> },
          ]} />
          <p className="text-xs text-gray-400 mt-3">«Traer desde nómina» toma el costo mensual del área de producción × 12 y lo sube con el IPC cada año. Puedes ajustar los valores después.</p>
        </Card>
      )}

      {tab === 'cif' && (
        <Card title="Costos indirectos de fabricación" subtitle="Energía, agua, teléfono y lo demás que cuesta fabricar sin ser materia prima ni mano de obra."
          action={
            <div className="flex gap-2">
              <Boton onClick={rellenarCif}>Rellenar desde consumo</Boton>
              <Boton onClick={() => editar((d) => ({ ...d, cif: [...d.cif, lineaVacia()] }))}><Plus className="w-4 h-4" /> Agregar</Boton>
            </div>}>
          <TablaAnual anios={anios} cabeceraExtras={['Consumo mes', 'Costo', 'Consumo año']}
            filas={[
              ...datos.cif.map((l, i) => ({
                clave: `c${i}`,
                etiqueta: (
                  <div className="flex items-center gap-1">
                    <Txt value={l.nombre} onChange={(v) => cambiarCif(i, { nombre: v })} />
                    <button title="Quitar" className="p-1 text-gray-400 hover:text-red-600" onClick={() => editar((d) => ({ ...d, cif: d.cif.filter((_, k) => k !== i) }))}><Trash2 className="w-4 h-4" /></button>
                  </div>),
                extras: [
                  <Num key="a" decimales={2} value={l.consumo_mes} onChange={(v) => cambiarCif(i, { consumo_mes: v })} />,
                  <Num key="b" decimales={2} value={l.costo} onChange={(v) => cambiarCif(i, { costo: v })} />,
                  <Num key="c" decimales={2} value={l.consumo_anio} onChange={(v) => cambiarCif(i, { consumo_anio: v })} />,
                ],
                celda: (t: number) => <Num decimales={0} value={l.valores[t] ?? 0} onChange={(v) => cambiarCif(i, { valores: conValor(l.valores, t, v) })} />,
              })),
              { clave: 'tot', etiqueta: 'TOTAL', total: true, extras: [null, null, null], celda: (t: number) => dinero(resultados?.cif.total[t]) },
            ]} />
          <p className="text-xs text-gray-400 mt-3">«Rellenar desde consumo» calcula consumo mes × costo × 12 para el primer año y lo sube con el IPC. Los valores siguen siendo editables.</p>
        </Card>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Traer materia prima desde una receta" size="md">
        {!recetas || recetas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay recetas en el catálogo.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recetas.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <span className="font-medium text-gray-900">{r.nombre} <span className="text-xs text-gray-400">v{r.version}</span></span>
                <Boton variante="primario" disabled={cargandoReceta} onClick={() => traerReceta(r.id)}>Usar</Boton>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-3">Reemplaza la lista actual. kg y L se convierten a gramos y ml; otras unidades se copian tal cual. Se copian los valores: cambiar el catálogo después no altera este plan.</p>
      </Modal>
    </>
  );
}
