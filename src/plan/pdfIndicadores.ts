import type { PlanDatos } from './types';
import { formatearIndicador, type ReporteFinanciero } from './indicadores';
import { dinero } from './format';

// Colores de la marca (ver --color-mani-* en index.css)
const VERDE_OSCURO: [number, number, number] = [11, 61, 18];
const GRIS_TEXTO: [number, number, number] = [75, 85, 99];

/** Helvetica del PDF no tiene el signo menos tipográfico: se cambia por guion. */
const limpiar = (t: string) => t.replace(/−/g, '-');

function nombreArchivo(empresa: string): string {
  const base = empresa.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
  return `Indicadores_${base || 'plan'}.pdf`;
}

/** Genera y descarga el PDF del reporte de indicadores (no abre el diálogo de impresión). */
export async function descargarPdfIndicadores(datos: PlanDatos, rep: ReporteFinanciero, anios: number[]): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margen = 36;
  const ancho = doc.internal.pageSize.getWidth();
  let y = margen;

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...VERDE_OSCURO);
  doc.text('REPORTE DE INDICADORES FINANCIEROS', margen, y);
  y += 20;
  doc.setFontSize(18);
  doc.text(limpiar(datos.empresa || 'Plan de negocio'), margen, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text(limpiar(`Producto: ${datos.producto || '-'} · Años ${anios[0]} a ${anios[anios.length - 1]}`), margen, y);
  y += 20;

  const tablaOpciones = (startY: number, head: string[], body: string[][], negritas: Set<number>) => {
    autoTable(doc, {
      startY,
      head: [head],
      body,
      margin: { left: margen, right: margen },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: [31, 41, 55], lineColor: [220, 230, 215], lineWidth: 0.5 },
      headStyles: { fillColor: VERDE_OSCURO, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 260 } },
      didParseCell: (data) => {
        if (data.section === 'body' && negritas.has(data.row.index)) data.cell.styles.fontStyle = 'bold';
        if (data.section === 'body' && data.column.index > 0) data.cell.styles.halign = 'right';
        if (data.section === 'body' && data.column.index === 0) data.cell.styles.halign = 'left';
      },
    });
  };
  const siguiente = (fallback: number) =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;

  // Balance general estimado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...VERDE_OSCURO);
  doc.text('Balance general estimado', margen, y);
  y += 6;
  const negritasBalance = new Set<number>();
  const cuerpoBalance = rep.balance.map((f, i) => {
    if (f.tipo === 'total' || f.tipo === 'subtotal' || f.tipo === 'titulo') negritasBalance.add(i);
    return [limpiar(f.etiqueta), ...f.valores.map((v) => (f.tipo === 'titulo' ? '' : `$ ${dinero(v)}`))];
  });
  tablaOpciones(y, ['Cuenta', ...anios.map(String)], cuerpoBalance, negritasBalance);
  y = siguiente(y) + 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRIS_TEXTO);
  const notas = doc.splitTextToSize(rep.supuestos.map((s) => `• ${limpiar(s)}`).join('\n'), ancho - margen * 2);
  if (y + notas.length * 10 > doc.internal.pageSize.getHeight() - margen) {
    doc.addPage();
    y = margen;
  }
  doc.text(notas, margen, y);
  y += notas.length * 10 + 14;

  // Indicadores por grupo
  for (const g of rep.grupos) {
    if (y > doc.internal.pageSize.getHeight() - 140) {
      doc.addPage();
      y = margen;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...VERDE_OSCURO);
    doc.text(g.titulo, margen, y);
    y += 6;
    const cuerpo = g.indicadores.map((i) => [
      limpiar(`${i.nombre}\n${i.formula}`),
      ...i.valores.map((v) => formatearIndicador(v, i.formato)),
    ]);
    tablaOpciones(y, ['Indicador', ...anios.map(String)], cuerpo, new Set());
    y = siguiente(y) + 16;
  }

  doc.save(nombreArchivo(datos.empresa));
}
