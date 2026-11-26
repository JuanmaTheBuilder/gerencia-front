import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Boxes, CheckCircle2, Calculator, LayoutDashboard, Briefcase, BarChart3, type LucideIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { usePlan } from '../plan/PlanContext';
import { dinero, porcentaje } from '../plan/format';

function Bloque({ titulo, icono: Icono, to, children }: { titulo: string; icono: LucideIcon; to: string; children: ReactNode }) {
  return (
    <article className="rounded-3xl bg-white border-2 border-mani-100 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 font-display text-lg font-bold text-mani-900">
          <span className="w-10 h-10 rounded-xl bg-limon-400 text-mani-900 grid place-items-center">
            <Icono className="w-5 h-5" aria-hidden="true" />
          </span>
          {titulo}
        </h2>
        <Link
          to={to}
          className="whitespace-nowrap rounded-full border-2 border-mani-900 px-3 py-1.5 text-sm font-semibold text-mani-900 hover:bg-mani-900 hover:text-white"
        >
          Ver detalle
        </Link>
      </header>
      {children}
    </article>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-mani-50 px-3 py-2.5">
      <p className="text-xs font-medium text-gray-600">{etiqueta}</p>
      <p className="text-lg font-bold text-mani-900 tabular-nums">{valor}</p>
    </div>
  );
}

/** Muestra cantidad cuando la lista llegó, "…" mientras carga y "—" si falló. */
function conteo<T>(lista: { data: T[] | null; loading: boolean; error: string | null }) {
  if (lista.loading) return "…";
  if (lista.error) return "—";
  return String(lista.data?.length ?? 0);
}

export default function PanelGeneral() {
  const { datos, resultados: r } = usePlan();
  const precios = useApi(api.preciosVenta.list);
  const equilibrio = useApi(api.puntoEquilibrio.list);
  const productos = useApi(api.productos.list);
  const recetas = useApi(api.recetas.list);
  const insumos = useApi(api.insumos.list);
  const recursos = useApi(api.recursos.list);

  const inversionTotal = datos ? datos.inversiones.reduce((s, i) => s + i.valor, 0) : 0;
  const ultimo = r ? r.anios.length - 1 : -1;
  const vpnPositivo = r ? r.evaluacion.vpn >= 0 : false;

  return (
    <>
      <PageHeader
        titulo="Panel general"
        descripcion="Así va la empresa de un vistazo. Para ver el detalle de cada cálculo, entra a su apartado."
        icono={LayoutDashboard}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Bloque titulo="Análisis y cálculos" icono={Calculator} to="/analisis">
          <div className="grid grid-cols-2 gap-3">
            <Dato etiqueta="Precios de venta guardados" valor={conteo(precios)} />
            <Dato etiqueta="Cálculos de punto de equilibrio" valor={conteo(equilibrio)} />
          </div>
        </Bloque>

        <Bloque titulo="Plan de negocio" icono={Briefcase} to="/plan">
          {datos ? (
            <>
              <p className="text-sm text-gray-700">
                <b className="text-mani-900">{datos.empresa || "Empresa sin nombre"}</b>
                {datos.producto ? ` · ${datos.producto}` : ""}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Dato etiqueta="Inversión total" valor={`$ ${dinero(inversionTotal)}`} />
                <Dato etiqueta="Años proyectados" valor={String(datos.n_anios)} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Todavía no hay un plan. Créalo en Plan de negocio.</p>
          )}
        </Bloque>

        <Bloque titulo="Resultados del plan" icono={BarChart3} to="/resultados">
          {r && ultimo >= 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Dato etiqueta={`Utilidad neta ${r.anios[0]}`} valor={`$ ${dinero(r.pyg.utilidad_neta[0])}`} />
                <Dato etiqueta={`Utilidad neta ${r.anios[ultimo]}`} valor={`$ ${dinero(r.pyg.utilidad_neta[ultimo])}`} />
                <Dato etiqueta="TIR" valor={r.evaluacion.tir === null ? "No aplica" : porcentaje(r.evaluacion.tir, 2)} />
                <Dato etiqueta="VPN" valor={`$ ${dinero(r.evaluacion.vpn)}`} />
              </div>
              <p className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${vpnPositivo ? "bg-mani-50 text-mani-900" : "bg-amber-50 text-amber-900"}`}>
                {vpnPositivo
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  : <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />}
                {vpnPositivo ? "El proyecto recupera la inversión con la tasa de oportunidad." : "El VPN es negativo: revisa supuestos y costos."}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">Los resultados aparecen cuando el plan tiene datos.</p>
          )}
        </Bloque>

        <Bloque titulo="Gestión y catálogo" icono={Boxes} to="/gestion">
          <div className="grid grid-cols-2 gap-3">
            <Dato etiqueta="Productos" valor={conteo(productos)} />
            <Dato etiqueta="Recetas" valor={conteo(recetas)} />
            <Dato etiqueta="Insumos" valor={conteo(insumos)} />
            <Dato etiqueta="Recursos" valor={conteo(recursos)} />
          </div>
        </Bloque>
      </div>
    </>
  );
}
