import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { usePlan } from '../../plan/PlanContext';
import { Card, Titulo } from '../../plan/ui';

type Formato = 'xlsx' | 'pdf';

/** Botón único con minilista: al elegir Excel o PDF se genera y descarga el reporte. */
export default function Reporte() {
  const { planId, guardado, datos } = usePlan();
  const [menu, setMenu] = useState(false);
  const [generando, setGenerando] = useState<Formato | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const sinGuardar = guardado === 'pendiente' || guardado === 'guardando';

  const generar = async (formato: Formato) => {
    if (planId === null) return;
    setMenu(false);
    setGenerando(formato);
    setMensaje(null);
    try {
      await api.planes.reporte(planId, formato);
      setMensaje({ tipo: 'ok', texto: `Reporte ${formato === 'xlsx' ? 'Excel' : 'PDF'} generado.` });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo generar el reporte' });
    } finally {
      setGenerando(null);
    }
  };

  return (
    <>
      <Titulo descripcion="Genera el plan de negocio y de proyecciones con los datos y cálculos actuales, con el aspecto de la plantilla.">10 · Reporte</Titulo>
      <Card title={datos?.empresa || 'Plan de negocio'} subtitle={datos?.producto ? `Producto: ${datos.producto}` : undefined}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative" ref={caja}>
            <button
              onClick={() => setMenu((v) => !v)}
              disabled={generando !== null || planId === null}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
              aria-haspopup="menu" aria-expanded={menu}>
              {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generando ? 'Generando…' : 'Generar reporte'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {menu && (
              <div role="menu" className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                <button role="menuitem" onClick={() => generar('xlsx')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span><b className="block">Excel (.xlsx)</b><span className="text-xs text-gray-500">Con fórmulas, como la plantilla</span></span>
                </button>
                <button role="menuitem" onClick={() => generar('pdf')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 border-t border-gray-100">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span><b className="block">PDF</b><span className="text-xs text-gray-500">Listo para imprimir o entregar</span></span>
                </button>
              </div>
            )}
          </div>
          {sinGuardar && <span className="text-sm text-amber-600">Espera a que termine de guardar para que el reporte incluya tus últimos cambios.</span>}
        </div>
        {mensaje && (
          <p className={`mt-4 text-sm ${mensaje.tipo === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{mensaje.texto}</p>
        )}
        <ul className="mt-5 text-sm text-gray-500 list-disc pl-5 space-y-1">
          <li>Incluye inversiones, demanda, costos, gastos, pérdidas y ganancias, flujo de caja, TIR, VPN y la nómina.</li>
          <li>Las líneas de «Nombre completo estudiante» salen en blanco para completarlas al entregar.</li>
        </ul>
      </Card>
    </>
  );
}
