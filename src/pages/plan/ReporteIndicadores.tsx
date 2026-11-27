import { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { usePlan } from '../../plan/PlanContext';
import { dinero } from '../../plan/format';
import { Boton, Card, TablaAnual, type FilaAnual } from '../../plan/ui';
import { calcularReporteFinanciero, formatearIndicador, type FilaBalance } from '../../plan/indicadores';
import { descargarPdfIndicadores } from '../../plan/pdfIndicadores';

function filaBalance(f: FilaBalance): FilaAnual {
  const negrita = f.tipo === "total" || f.tipo === "subtotal";
  return {
    clave: f.clave,
    etiqueta: f.tipo === "titulo"
      ? <span className="text-xs font-bold tracking-wider text-mani-700">{f.etiqueta}</span>
      : <span className={negrita ? "font-bold" : ""}>{f.etiqueta}</span>,
    total: f.tipo === "total",
    celda: (t: number) => (f.tipo === "titulo" ? "" : <span className="tabular-nums">{`$ ${dinero(f.valores[t])}`}</span>),
  };
}

/** Reporte de balance general e indicadores, con descarga directa en PDF. */
export default function ReporteIndicadores() {
  const { resultados: r, datos } = usePlan();
  const [abierto, setAbierto] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!r || !datos) {
    return (
      <Card title="Reporte de indicadores" subtitle="Balance general e indicadores financieros de cada año.">
        <p className="text-sm text-gray-500">Calculando…</p>
      </Card>
    );
  }

  const rep = calcularReporteFinanciero(r, datos.inversiones);
  const anios = r.anios;

  const descargar = async () => {
    setGenerando(true);
    setError(null);
    try {
      await descargarPdfIndicadores(datos, rep, anios);
    } catch {
      setError('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Card
      title="Reporte de indicadores"
      subtitle="Balance general estimado y los indicadores de liquidez, endeudamiento, rentabilidad y eficiencia de cada año."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Boton variante="primario" onClick={() => setAbierto((v) => !v)}>
          {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {abierto ? "Ocultar reporte" : "Ver reporte de indicadores"}
        </Boton>
        <Boton onClick={descargar} disabled={generando}>
          <Download className="w-4 h-4" /> {generando ? 'Generando PDF…' : 'Descargar PDF'}
        </Boton>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {abierto && (
        <div id="reporte-indicadores" className="mt-6 space-y-8">
          <header className="reporte-bloque">
            <p className="text-xs font-bold uppercase tracking-wider text-mani-700">Reporte de indicadores financieros</p>
            <h3 className="font-display text-2xl font-extrabold text-mani-900">{datos.empresa || "Plan de negocio"}</h3>
            <p className="text-sm text-gray-600">
              Producto: {datos.producto || "—"} · Años {anios[0]} a {anios[anios.length - 1]}
            </p>
          </header>

          <section className="reporte-bloque">
            <h4 className="font-display text-lg font-bold text-mani-900">Balance general estimado</h4>
            <p className="text-sm text-gray-600 mb-3">Situación de la empresa al cierre de cada año.</p>
            <TablaAnual anios={anios} filas={rep.balance.map(filaBalance)} etiquetaCabecera="Cuenta" />
            <ul className="mt-4 list-disc pl-5 space-y-1 text-xs text-gray-600">
              {rep.supuestos.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          {rep.grupos.map((g) => (
            <section key={g.titulo} className="reporte-bloque">
              <h4 className="font-display text-lg font-bold text-mani-900">{g.titulo}</h4>
              <p className="text-sm text-gray-600 mb-3">{g.descripcion}</p>
              <TablaAnual
                anios={anios}
                etiquetaCabecera="Indicador"
                filas={g.indicadores.map((i) => ({
                  clave: i.clave,
                  etiqueta: (
                    <span className="block">
                      <b className="block">{i.nombre}</b>
                      <span className="block text-xs text-gray-500">{i.formula}</span>
                      <span className="block text-xs text-gray-600">{i.que}</span>
                    </span>
                  ),
                  celda: (t: number) => <span className="font-semibold tabular-nums">{formatearIndicador(i.valores[t], i.formato)}</span>,
                }))}
              />
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}
