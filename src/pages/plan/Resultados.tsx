import { AlertTriangle, Info } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePlan } from '../../plan/PlanContext';
import { dinero, porcentaje } from '../../plan/format';
import { Card, TablaAnual } from '../../plan/ui';
import type { Resultados } from '../../plan/types';

function useR() {
  const { resultados, datos } = usePlan();
  return { r: resultados, datos };
}

const Vacio = () => <p className="text-gray-500 text-sm">Calculando…</p>;

export function Pyg() {
  const { r, datos } = useR();
  if (!r || !datos) return <Vacio />;
  const py = r.pyg;
  const f = (clave: string, etiqueta: string, serie: number[], total = false) => ({
    clave, etiqueta, total, celda: (t: number) => dinero(serie[t]),
  });
  return (
    <>
      <Card>
        <TablaAnual anios={r.anios} filas={[
          f('v', 'Ventas', py.ventas), f('cmv', '(−) Costo mercancía vendida', py.cmv), f('ub', '(=) Utilidad bruta', py.utilidad_bruta, true),
          f('g', '(−) Gastos administración y ventas', py.gastos), f('pr', '(−) Gasto provisión deudas malas', py.provision),
          f('uai', '(=) Utilidad antes de impuestos', py.uai, true), f('re', `(−) Impuesto de renta (${porcentaje(datos.pct_renta)})`, py.renta),
          f('un', '(=) Utilidad neta', py.utilidad_neta, true), f('rl', `Reserva legal (${porcentaje(datos.pct_reserva)})`, py.reserva),
          f('di', `Dividendos (${porcentaje(datos.pct_dividendos)})`, py.dividendos), f('uf', 'U. neta final', py.utilidad_final, true),
        ]} />
      </Card>
    </>
  );
}

export function Flujo() {
  const { r } = useR();
  if (!r) return <Vacio />;
  const fl = r.flujo;
  const f = (clave: string, etiqueta: string, serie: number[], total = false) => ({
    clave, etiqueta, total, celda: (t: number) => dinero(serie[t]),
  });
  const datosGrafica = r.anios.map((a, t) => ({ anio: a, Ingresos: fl.ingresos[t], Egresos: fl.egresos[t], Efectivo: fl.efectivo[t] }));
  return (
    <>
      <Card>
        <TablaAnual anios={r.anios} filas={[
          f('i', 'Ventas de contado', fl.ingresos, true), f('mp', 'Pago MP de contado', fl.pago_mp_contado), f('mo', 'Mano de obra', fl.mano_obra),
          f('cif', 'CIF (sin depreciación)', fl.cif), f('ga', 'Gastos de administración y ventas', fl.gastos), f('re', 'Impuesto de renta', fl.renta),
          f('eg', 'TOTAL EGRESOS DEL AÑO', fl.egresos, true), f('ef', 'EFECTIVO GENERADO EN EL AÑO', fl.efectivo, true),
        ]} />
        <p className="text-sm text-gray-500 mt-3">Año 0 (inversión inicial): <b className="tabular-nums">{dinero(fl.serie[0])}</b></p>
      </Card>
      <Card title="Ingresos, egresos y efectivo">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="anio" /><YAxis tickFormatter={(v) => `${Math.round(v / 1e6)} M`} />
              <Tooltip formatter={(v) => dinero(Number(v))} /><Legend />
              <Bar dataKey="Ingresos" fill="#2FA832" /><Bar dataKey="Egresos" fill="#f59e0b" /><Bar dataKey="Efectivo" fill="#13571A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

export function Evaluacion() {
  const { r } = useR();
  if (!r) return <Vacio />;
  const ev = r.evaluacion;
  const acumulado = r.flujo.serie.reduce<number[]>((a, v, i) => [...a, (a[i - 1] ?? 0) + v], []);
  const datosGrafica = acumulado.map((v, i) => ({ anio: i === 0 ? 'Año 0' : String(r.anios[i - 1]), Acumulado: v }));
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <Indicador et="Tasa de oportunidad" v={porcentaje(ev.tasa)} />
        <Indicador et="TIR (tasa interna de retorno)" v={ev.tir === null ? 'No aplica' : porcentaje(ev.tir, 2)}
          nota={ev.tir !== null ? (ev.tir > ev.tasa ? 'Supera la tasa de oportunidad' : 'Está por debajo de la tasa de oportunidad') : undefined} />
        <Indicador et="VPN (valor presente neto)" v={`$ ${dinero(ev.vpn)}`} nota={ev.vpn >= 0 ? 'Positivo' : 'Negativo'} />
      </div>
      <Card title="Flujo de caja acumulado">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="anio" /><YAxis tickFormatter={(v) => `${Math.round(v / 1e6)} M`} />
              <Tooltip formatter={(v) => dinero(Number(v))} />
              <Line type="monotone" dataKey="Acumulado" stroke="#13571A" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

function Indicador({ et, v, nota }: { et: string; v: string; nota?: string }) {
  return (
    <div className="rounded-xl bg-mani-900 text-white px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-slate-300">{et}</p>
      <p className="text-3xl font-bold tabular-nums mt-1">{v}</p>
      {nota && <p className="text-xs text-slate-300 mt-1">{nota}</p>}
    </div>
  );
}

export function Observaciones({ r }: { r: Resultados }) {
  if (r.observaciones.length === 0) return null;
  return (
    <Card title="Observaciones del modelo" subtitle="Solo informativas: explican cómo calcula la plantilla y qué conviene revisar. No cambian ningún número.">
      <ul className="space-y-2">
        {r.observaciones.map((o, i) => (
          <li key={i} className={`flex gap-3 rounded-lg px-3 py-2.5 text-sm ${o.nivel === 'alerta' ? 'bg-amber-50 text-amber-900' : 'bg-limon-50 text-limon-900'}`}>
            {o.nivel === 'alerta' ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <Info className="w-4 h-4 mt-0.5 shrink-0" />}
            <span><b>{o.titulo}.</b> {o.texto}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
