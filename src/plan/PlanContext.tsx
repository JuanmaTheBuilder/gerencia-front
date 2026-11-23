import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Plan, PlanDatos, PlanResumen, Resultados } from './types';

type Guardado = 'idle' | 'pendiente' | 'guardando' | 'guardado' | 'error';

interface PlanCtx {
  planes: PlanResumen[];
  planId: number | null;
  nombre: string;
  datos: PlanDatos | null;
  resultados: Resultados | null;
  cargando: boolean;
  error: string | null;
  guardado: Guardado;
  editar: (fn: (d: PlanDatos) => PlanDatos) => void;
  seleccionar: (id: number) => void;
  crear: (nombre: string, empresa: string, producto: string) => Promise<void>;
  eliminar: () => Promise<void>;
}

const Ctx = createContext<PlanCtx | null>(null);
const CLAVE = 'plan-activo';

function leerGuardado(): number | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [planes, setPlanes] = useState<PlanResumen[]>([]);
  const [planId, setPlanId] = useState<number | null>(leerGuardado());
  const [nombre, setNombre] = useState('');
  const [datos, setDatos] = useState<PlanDatos | null>(null);
  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<Guardado>('idle');

  const sucio = useRef(false);
  const ticketCalculo = useRef(0);

  const aplicarPlan = useCallback((p: Plan) => {
    sucio.current = false;
    setPlanId(p.id);
    setNombre(p.nombre);
    setDatos(p.datos);
    setGuardado('idle');
    try {
      localStorage.setItem(CLAVE, String(p.id));
    } catch {
      /* sin almacenamiento disponible */
    }
  }, []);

  // Carga inicial: lista de planes y plan activo
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const lista = await api.planes.list();
        if (!vivo) return;
        setPlanes(lista);
        const elegido = lista.find((p) => p.id === planId) ?? lista[0];
        if (elegido) aplicarPlan(await api.planes.detail(elegido.id));
      } catch (e) {
        if (vivo) setError(e instanceof Error ? e.message : 'No se pudo cargar el plan');
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculo en vivo y autoguardado (con espera para no saturar mientras se escribe)
  useEffect(() => {
    if (!datos) return;
    const t1 = setTimeout(async () => {
      const ticket = ++ticketCalculo.current;
      try {
        const r = await api.planes.calcular(datos);
        if (ticket === ticketCalculo.current) {
          setResultados(r);
          setError(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al calcular');
      }
    }, sucio.current ? 350 : 0);
    let t2: ReturnType<typeof setTimeout> | undefined;
    if (sucio.current && planId !== null) {
      t2 = setTimeout(async () => {
        setGuardado('guardando');
        try {
          await api.planes.update(planId, datos);
          setGuardado('guardado');
          sucio.current = false;
        } catch {
          setGuardado('error');
        }
      }, 900);
    }
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [datos, planId]);

  const editar = useCallback((fn: (d: PlanDatos) => PlanDatos) => {
    sucio.current = true;
    setGuardado('pendiente');
    setDatos((prev) => (prev ? fn(prev) : prev));
  }, []);

  const seleccionar = useCallback(
    async (id: number) => {
      setCargando(true);
      try {
        setResultados(null);
        aplicarPlan(await api.planes.detail(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo abrir el plan');
      } finally {
        setCargando(false);
      }
    },
    [aplicarPlan],
  );

  const crear = useCallback(
    async (n: string, empresa: string, producto: string) => {
      const nuevo = await api.planes.create({ nombre: n, empresa, producto });
      setPlanes(await api.planes.list());
      setResultados(null);
      aplicarPlan(nuevo);
    },
    [aplicarPlan],
  );

  const eliminar = useCallback(async () => {
    if (planId === null) return;
    await api.planes.delete(planId);
    const lista = await api.planes.list();
    setPlanes(lista);
    setResultados(null);
    if (lista[0]) aplicarPlan(await api.planes.detail(lista[0].id));
    else {
      setPlanId(null);
      setDatos(null);
      setNombre('');
    }
  }, [planId, aplicarPlan]);

  return (
    <Ctx.Provider
      value={{ planes, planId, nombre, datos, resultados, cargando, error, guardado, editar, seleccionar, crear, eliminar }}
    >
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlan() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlan debe usarse dentro de PlanProvider');
  return c;
}
