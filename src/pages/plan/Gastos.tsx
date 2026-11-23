import { Plus, Trash2, Users } from 'lucide-react';
import { usePlan } from '../../plan/PlanContext';
import { conValor, dinero } from '../../plan/format';
import { conIpc, lineaVacia } from '../../plan/helpers';
import { Boton, Card, Leyenda, Num, TablaAnual, Titulo, Txt } from '../../plan/ui';
import type { LineaAnual } from '../../plan/types';

export default function Gastos() {
  const { datos, resultados, editar } = usePlan();
  if (!datos) return null;
  const anios = Array.from({ length: datos.n_anios }, (_, t) => datos.anio_inicial + t);
  const porArea = resultados?.nomina.costo_mensual_por_area;

  const cambiar = (i: number, cambio: Partial<LineaAnual>) =>
    editar((d) => ({ ...d, gastos: conValor(d.gastos, i, { ...d.gastos[i], ...cambio }) }));

  const traerNomina = (i: number, origen: string) => {
    const mensual = origen === 'nomina_administracion' ? porArea?.administracion : porArea?.ventas;
    editar((d) => ({ ...d, gastos: conValor(d.gastos, i, { ...d.gastos[i], valores: conIpc(d, (mensual ?? 0) * 12) }) }));
  };

  return (
    <>
      <Titulo descripcion="Nómina administrativa y de ventas, publicidad, comisiones y cualquier otro gasto. Las dos nóminas se pueden traer desde la pantalla de Nómina.">
        5 · Gastos de administración y ventas
      </Titulo>
      <Leyenda />
      <Card action={<Boton onClick={() => editar((d) => ({ ...d, gastos: [...d.gastos, lineaVacia()] }))}><Plus className="w-4 h-4" /> Agregar renglón</Boton>}>
        <TablaAnual anios={anios} cabeceraExtras={['Justificación / soporte']}
          filas={[
            ...datos.gastos.map((l, i) => ({
              clave: `g${i}`,
              etiqueta: (
                <div className="flex items-center gap-1">
                  <Txt value={l.nombre} onChange={(v) => cambiar(i, { nombre: v })} />
                  {l.origen && <button title="Traer desde nómina" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" onClick={() => traerNomina(i, l.origen!)}><Users className="w-4 h-4" /></button>}
                  <button title="Quitar" className="p-1 text-gray-400 hover:text-red-600" onClick={() => editar((d) => ({ ...d, gastos: d.gastos.filter((_, k) => k !== i) }))}><Trash2 className="w-4 h-4" /></button>
                </div>),
              extras: [
                l.origen
                  ? <span key="n" className="text-xs text-gray-500">Soportar con la nómina</span>
                  : <Txt key="j" value={l.justificacion} placeholder="Justificar" onChange={(v) => cambiar(i, { justificacion: v })} className="min-w-[12rem]" />,
              ],
              celda: (t: number) => <Num decimales={0} value={l.valores[t] ?? 0} onChange={(v) => cambiar(i, { valores: conValor(l.valores, t, v) })} />,
            })),
            { clave: 'tot', etiqueta: 'TOTAL', total: true, extras: [null], celda: (t: number) => dinero(resultados?.gastos.total[t]) },
          ]} />
        <p className="text-xs text-gray-400 mt-3">El icono de personas toma el costo mensual del área × 12 y lo sube con el IPC; puedes ajustar los valores después.</p>
      </Card>
    </>
  );
}
