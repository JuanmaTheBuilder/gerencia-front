import { Plus, Trash2, Users } from 'lucide-react';
import { usePlan } from '../../plan/PlanContext';
import { conValor, dinero } from '../../plan/format';
import { Boton, Calc, Card, Leyenda, Num, Txt } from '../../plan/ui';

export default function Inversiones() {
  const { datos, resultados, editar } = usePlan();
  if (!datos) return null;
  const nom = resultados?.nomina.costo_mensual_por_area;

  const traerNomina = () => {
    if (!nom) return;
    editar((d) => ({
      ...d,
      capital_mano_obra: [nom.produccion, nom.produccion, nom.produccion],
      capital_gastos: [nom.administracion + nom.ventas, nom.administracion + nom.ventas, nom.administracion + nom.ventas],
    }));
  };

  return (
    <>
      <Leyenda />

      <Card title="Activos" action={
        <Boton onClick={() => editar((d) => ({ ...d, inversiones: [...d.inversiones, { categoria: '', concepto: '', valor: 0 }] }))}>
          <Plus className="w-4 h-4" /> Agregar renglón
        </Boton>}>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500">
            <th className="py-1.5 pr-2 font-medium">Categoría</th><th className="py-1.5 pr-2 font-medium">Descripción</th>
            <th className="py-1.5 pr-2 font-medium text-right">Valor</th><th />
          </tr></thead>
          <tbody>
            {datos.inversiones.map((inv, i) => (
              <tr key={i}>
                <td className="py-1 pr-2"><Txt value={inv.categoria} onChange={(v) => editar((d) => ({ ...d, inversiones: conValor(d.inversiones, i, { ...inv, categoria: v }) }))} /></td>
                <td className="py-1 pr-2"><Txt value={inv.concepto} placeholder="Detalle (opcional)" onChange={(v) => editar((d) => ({ ...d, inversiones: conValor(d.inversiones, i, { ...inv, concepto: v }) }))} /></td>
                <td className="py-1 pr-2 w-48"><Num decimales={0} value={inv.valor} onChange={(v) => editar((d) => ({ ...d, inversiones: conValor(d.inversiones, i, { ...inv, valor: v }) }))} /></td>
                <td className="py-1 w-10"><button title="Quitar" className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => editar((d) => ({ ...d, inversiones: d.inversiones.filter((_, k) => k !== i) }))}><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Capital de trabajo (3 meses)" subtitle="Mano de obra y gastos de administración y ventas de cada mes. La nómina se puede traer desde la pantalla de Nómina."
        action={<Boton onClick={traerNomina} disabled={!nom}><Users className="w-4 h-4" /> Traer desde nómina</Boton>}>
        <table className="text-sm w-full max-w-2xl">
          <thead><tr className="text-gray-500"><th className="text-left font-medium py-1.5" />{[1, 2, 3].map((m) => <th key={m} className="font-medium text-right px-1">Mes {m}</th>)}</tr></thead>
          <tbody>
            {([['Mano de obra', 'capital_mano_obra'], ['Gastos de administración y ventas', 'capital_gastos']] as const).map(([et, campo]) => (
              <tr key={campo}>
                <td className="py-1 pr-3">{et}</td>
                {[0, 1, 2].map((m) => (
                  <td key={m} className="py-1 px-1"><Num decimales={0} value={datos[campo][m]} onChange={(v) => editar((d) => ({ ...d, [campo]: conValor(d[campo], m, v) }))} /></td>
                ))}
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-1 pr-3">Total por mes</td>
              {[0, 1, 2].map((m) => <td key={m} className="py-1 px-1 text-right"><Calc>{dinero(datos.capital_mano_obra[m] + datos.capital_gastos[m])}</Calc></td>)}
            </tr>
          </tbody>
        </table>
      </Card>

      <div className="rounded-xl bg-mani-600 text-white px-5 py-4 flex items-center justify-between">
        <span className="font-medium">Inversión total (activos + capital de trabajo)</span>
        <span className="text-2xl font-bold tabular-nums">$ {dinero(resultados?.inversion.total)}</span>
      </div>
    </>
  );
}
