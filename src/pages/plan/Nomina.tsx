import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { usePlan } from '../../plan/PlanContext';
import { conValor, dinero } from '../../plan/format';
import { Boton, Calc, Card, Leyenda, Num, Pct, Titulo, Txt } from '../../plan/ui';
import type { Area, Empleado, ParametrosNomina } from '../../plan/types';

const AREAS: { v: Area; et: string }[] = [
  { v: 'produccion', et: 'Producción' },
  { v: 'administracion', et: 'Administración' },
  { v: 'ventas', et: 'Ventas' },
];

const NUEVO: Empleado = {
  nombre: '', area: 'produccion', salario: 0, dias: 30, incapacidades: 0, comisiones: 0, riesgo: 'III',
  h_recargo_nocturno: 0, h_extra_diurna: 0, h_extra_nocturna: 0, h_recargo_festivo: 0,
  h_extra_diurna_festiva: 0, h_extra_nocturna_festiva: 0,
};

type CampoNum = Exclude<{ [K in keyof Empleado]: Empleado[K] extends number ? K : never }[keyof Empleado], undefined>;
const CAMPOS: { k: CampoNum; et: string; dec: number }[] = [
  { k: 'salario', et: 'Salario', dec: 0 },
  { k: 'dias', et: 'Días', dec: 1 },
  { k: 'incapacidades', et: 'Incapacidades ($)', dec: 0 },
  { k: 'comisiones', et: 'Comisiones ($)', dec: 0 },
  { k: 'h_recargo_nocturno', et: 'H. recargo nocturno', dec: 2 },
  { k: 'h_extra_diurna', et: 'H. extra diurna', dec: 2 },
  { k: 'h_extra_nocturna', et: 'H. extra nocturna', dec: 2 },
  { k: 'h_recargo_festivo', et: 'H. recargo festivo', dec: 2 },
  { k: 'h_extra_diurna_festiva', et: 'H. extra diurna festiva', dec: 2 },
  { k: 'h_extra_nocturna_festiva', et: 'H. extra nocturna festiva', dec: 2 },
];

const PARAMS_MONTO: { k: keyof ParametrosNomina; et: string }[] = [
  { k: 'smlv', et: 'Salario mínimo (SMLV)' }, { k: 'auxilio_transporte', et: 'Auxilio de transporte' }, { k: 'horas_mes', et: 'Horas al mes' },
];
const PARAMS_FACTOR: { k: keyof ParametrosNomina; et: string }[] = [
  { k: 'f_recargo_nocturno', et: 'Recargo nocturno (×)' }, { k: 'f_extra_diurna', et: 'Extra diurna (×)' },
  { k: 'f_extra_nocturna', et: 'Extra nocturna (×)' }, { k: 'f_recargo_festivo', et: 'Recargo festivo (×)' },
  { k: 'f_extra_diurna_festiva', et: 'Extra diurna festiva (×)' }, { k: 'f_extra_nocturna_festiva', et: 'Extra nocturna festiva (×)' },
];
const PARAMS_PCT: { k: keyof ParametrosNomina; et: string }[] = [
  { k: 'pct_salud_empleado', et: 'Salud empleado' }, { k: 'pct_pension_empleado', et: 'Pensión empleado' },
  { k: 'pct_cesantias', et: 'Cesantías' }, { k: 'pct_prima', et: 'Prima' }, { k: 'pct_vacaciones', et: 'Vacaciones' },
  { k: 'pct_intereses', et: 'Intereses de cesantías' }, { k: 'pct_salud_empleador', et: 'Salud empleador' },
  { k: 'pct_pension_empleador', et: 'Pensión empleador' }, { k: 'pct_caja', et: 'Caja de compensación' },
  { k: 'pct_icbf', et: 'ICBF (desde 10 SMLV)' }, { k: 'pct_sena', et: 'SENA (desde 10 SMLV)' },
];

export default function Nomina() {
  const { datos, resultados, editar } = usePlan();
  const [params, setParams] = useState(false);
  if (!datos) return null;
  const nm = resultados?.nomina;
  const p = datos.parametros_nomina;

  const cambiar = (i: number, cambio: Partial<Empleado>) =>
    editar((d) => ({ ...d, empleados: conValor(d.empleados, i, { ...d.empleados[i], ...cambio }) }));
  const cambiarParam = (k: keyof ParametrosNomina, v: number) =>
    editar((d) => ({ ...d, parametros_nomina: { ...d.parametros_nomina, [k]: v } }));

  return (
    <>
      <Titulo descripcion="Liquidación mensual de cada empleado: devengado, deducciones, prestaciones y aportes. Los totales por área alimentan la mano de obra y los gastos del plan.">
        6 · Nómina
      </Titulo>
      <Leyenda />

      <Card title="Empleados" subtitle="Horas extra y recargos se digitan en horas del mes. Incapacidades y comisiones, en pesos."
        action={<Boton onClick={() => editar((d) => ({ ...d, empleados: [...d.empleados, { ...NUEVO, nombre: `Empleado ${d.empleados.length + 1}` }] }))}><Plus className="w-4 h-4" /> Agregar empleado</Boton>}>
        {datos.empleados.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay empleados. Agrega el primero.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-separate border-spacing-0">
              <thead><tr className="bg-gray-100 text-left">
                <th className="px-2 py-2 sticky left-0 bg-gray-100 min-w-[11rem]">Empleado</th>
                <th className="px-2 py-2">Área</th><th className="px-2 py-2">Riesgo ARL</th>
                {CAMPOS.map((c) => <th key={c.k} className="px-2 py-2 text-right whitespace-nowrap">{c.et}</th>)}<th />
              </tr></thead>
              <tbody>
                {datos.empleados.map((e, i) => (
                  <tr key={i}>
                    <td className="px-1 py-1 sticky left-0 bg-white border-b border-gray-100"><Txt value={e.nombre} onChange={(v) => cambiar(i, { nombre: v })} /></td>
                    <td className="px-1 py-1 border-b border-gray-100">
                      <select value={e.area} onChange={(ev) => cambiar(i, { area: ev.target.value as Area })} className="text-sm bg-sky-50 border-sky-200">
                        {AREAS.map((a) => <option key={a.v} value={a.v}>{a.et}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1 border-b border-gray-100">
                      <select value={e.riesgo} onChange={(ev) => cambiar(i, { riesgo: ev.target.value })} className="text-sm bg-sky-50 border-sky-200">
                        {Object.keys(p.arl).map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    {CAMPOS.map((c) => (
                      <td key={c.k} className="px-1 py-1 border-b border-gray-100 min-w-[7rem]">
                        <Num decimales={c.dec} value={e[c.k]} onChange={(v) => cambiar(i, { [c.k]: v })} />
                      </td>
                    ))}
                    <td className="px-1 border-b border-gray-100"><button title="Quitar" className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => editar((d) => ({ ...d, empleados: d.empleados.filter((_, k) => k !== i) }))}><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {nm && nm.empleados.length > 0 && (
        <>
          <Card title="Liquidación mensual">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-100 text-right">
                  {['Empleado', 'Devengado', 'Auxilio', 'Deducciones', 'Neto pagado', 'Cesantías', 'Prima', 'Vacaciones', 'Aportes empleador', 'Total provisiones', 'Costo empleado'].map((h, i) => (
                    <th key={h} className={`px-2 py-2 font-semibold whitespace-nowrap ${i === 0 ? 'text-left' : ''}`}>{h}</th>))}
                </tr></thead>
                <tbody>
                  {nm.empleados.map((e, i) => {
                    const pv = e.provisiones;
                    const aportes = pv.salud + pv.pension + pv.caja + pv.icbf + pv.sena + pv.arl;
                    return (
                      <tr key={i} className="text-right hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-left border-b border-gray-100">{e.nombre || '—'}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(e.devengado)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(e.auxilio)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(e.total_deducciones)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100 font-medium">{dinero(e.neto_pagado)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(pv.cesantias)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(pv.prima)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(pv.vacaciones)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(aportes)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">{dinero(e.total_provisiones)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-100 font-semibold"><Calc>{dinero(e.costo_empleado)}</Calc></td>
                      </tr>
                    );
                  })}
                  <tr className="text-right font-semibold bg-emerald-50">
                    <td className="px-2 py-2 text-left">TOTAL</td>
                    <td className="px-2 py-2">{dinero(nm.total_devengado)}</td><td /><td />
                    <td className="px-2 py-2">{dinero(nm.total_neto)}</td><td /><td /><td /><td />
                    <td className="px-2 py-2">{dinero(nm.total_provisiones)}</td>
                    <td className="px-2 py-2">{dinero(nm.costo_total_mensual)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Costo mensual por área" subtitle="Es lo que se trae a mano de obra (producción) y a gastos (administración y ventas).">
            <div className="grid sm:grid-cols-3 gap-4">
              {AREAS.map((a) => (
                <div key={a.v} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{a.et}</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">$ {dinero(nm.costo_mensual_por_area[a.v])}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {nm && (
        <Card title="Referencia: empleado con salario mínimo" subtitle="Lo que le cuesta a la empresa una persona que gana el SMLV (hoja «Nómina (adjunto)»).">
          <div className="grid sm:grid-cols-4 gap-4 text-sm">
            <Dato et="Devengado" v={dinero(nm.referencia_minimo.devengado)} />
            <Dato et="Neto a pagar" v={dinero(nm.referencia_minimo.neto_pagado)} />
            <Dato et="Costo para la empresa" v={dinero(nm.referencia_minimo.costo_empleado)} />
            <Dato et="Carga sobre el devengado" v={`${(nm.referencia_minimo.porcentaje_carga * 100).toFixed(2)} %`} />
          </div>
        </Card>
      )}

      <Card>
        <button className="flex items-center gap-2 text-sm font-semibold text-gray-800" onClick={() => setParams((v) => !v)}>
          {params ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />} Parámetros legales
          <span className="font-normal text-gray-400">(vienen de la plantilla; verifica que estén vigentes)</span>
        </button>
        {params && (
          <div className="mt-4 space-y-5">
            <Grupo titulo="Montos">
              {PARAMS_MONTO.map((x) => <Campo key={x.k} et={x.et}><Num decimales={0} value={p[x.k] as number} onChange={(v) => cambiarParam(x.k, v)} /></Campo>)}
            </Grupo>
            <Grupo titulo="Factores de horas extra y recargos">
              {PARAMS_FACTOR.map((x) => <Campo key={x.k} et={x.et}><Num decimales={2} value={p[x.k] as number} onChange={(v) => cambiarParam(x.k, v)} /></Campo>)}
            </Grupo>
            <Grupo titulo="Porcentajes">
              {PARAMS_PCT.map((x) => <Campo key={x.k} et={x.et}><Pct value={p[x.k] as number} onChange={(v) => cambiarParam(x.k, v)} /></Campo>)}
            </Grupo>
            <Grupo titulo="ARL por nivel de riesgo">
              {Object.keys(p.arl).map((r) => (
                <Campo key={r} et={`Riesgo ${r}`}>
                  <Pct value={p.arl[r]} onChange={(v) => editar((d) => ({ ...d, parametros_nomina: { ...d.parametros_nomina, arl: { ...d.parametros_nomina.arl, [r]: v } } }))} />
                </Campo>
              ))}
            </Grupo>
          </div>
        )}
      </Card>
    </>
  );
}

function Dato({ et, v }: { et: string; v: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{et}</p>
      <p className="text-lg font-bold text-gray-900 tabular-nums">{v}</p>
    </div>
  );
}
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{titulo}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}
function Campo({ et, children }: { et: string; children: React.ReactNode }) {
  return <label className="text-sm text-gray-700">{et}{children}</label>;
}
