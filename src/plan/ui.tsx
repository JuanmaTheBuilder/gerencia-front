import { useState, type ReactNode } from 'react';
import { dinero, leerNumero, numero as fmtNumero, porcentaje } from './format';

const base = 'rounded-md border px-2 py-1.5 text-sm text-right w-full min-w-[5.5rem]';
const entrada = `${base} bg-limon-50 border-limon-200 focus:bg-white`;

interface NumProps {
  value: number;
  onChange: (v: number) => void;
  decimales?: number;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  miles?: boolean;
}

/** Campo numerico editable (azul, como en la plantilla). Confirma al salir del campo. */
export function Num({ value, onChange, decimales = 2, className = '', disabled, placeholder, miles = true }: NumProps) {
  const [borrador, setBorrador] = useState<string | null>(null);
  const mostrado = borrador ?? (value ? (miles ? fmtNumero(value, decimales) : String(value)) : '');
  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      placeholder={placeholder ?? '0'}
      className={`${entrada} ${className} ${disabled ? 'opacity-60' : ''}`}
      value={mostrado}
      onFocus={() => setBorrador(value ? String(value).replace('.', ',') : '')}
      onChange={(e) => setBorrador(e.target.value)}
      onBlur={() => {
        if (borrador !== null) onChange(leerNumero(borrador));
        setBorrador(null);
      }}
    />
  );
}

/** Porcentaje: se muestra como 35 % y se guarda como 0,35. */
export function Pct({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [borrador, setBorrador] = useState<string | null>(null);
  const mostrado = borrador ?? (value ? fmtNumero(value * 100, 4) : '');
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        placeholder="0"
        className={`${entrada} pr-6 ${disabled ? 'opacity-60' : ''}`}
        value={mostrado}
        onFocus={() => setBorrador(value ? String(+(value * 100).toFixed(6)).replace('.', ',') : '')}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={() => {
          if (borrador !== null) onChange(leerNumero(borrador) / 100);
          setBorrador(null);
        }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
    </div>
  );
}

export function Txt({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md border px-2 py-1.5 text-sm bg-limon-50 border-limon-200 focus:bg-white w-full ${className}`}
    />
  );
}

export function Card({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border-2 border-mani-100 shadow-sm p-5 mb-5">
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h2 className="text-lg font-bold text-mani-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Titulo({ children, descripcion }: { children: ReactNode; descripcion?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{children}</h1>
      {descripcion && <p className="text-sm text-gray-500 mt-1 max-w-3xl">{descripcion}</p>}
    </header>
  );
}

export function Leyenda() {
  return (
    <div className="flex gap-4 text-xs text-gray-500 mb-3">
      <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded bg-limon-100 border border-limon-300" /> Se llena</span>
      <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded bg-mani-100 border border-mani-300" /> Se calcula</span>
    </div>
  );
}

export function Boton({ children, onClick, variante = 'secundario', disabled, type = 'button' }: {
  children: ReactNode; onClick?: () => void; variante?: 'primario' | 'secundario' | 'peligro'; disabled?: boolean; type?: 'button' | 'submit';
}) {
  const estilos = {
    primario: 'bg-mani-600 text-white hover:bg-mani-700',
    secundario: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    peligro: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium ${estilos[variante]}`}>
      {children}
    </button>
  );
}

export interface FilaAnual {
  clave: string;
  etiqueta: ReactNode;
  celda: (t: number) => ReactNode;
  total?: boolean;
  extras?: ReactNode[]; // columnas antes de los anios (por ejemplo B, C, D)
}

/** Tabla con un renglon por concepto y una columna por ano. */
export function TablaAnual({ anios, filas, cabeceraExtras = [], etiquetaCabecera = 'Concepto' }: {
  anios: number[]; filas: FilaAnual[]; cabeceraExtras?: string[]; etiquetaCabecera?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left font-semibold px-3 py-2 sticky left-0 bg-gray-100 min-w-[14rem]">{etiquetaCabecera}</th>
            {cabeceraExtras.map((c) => <th key={c} className="px-2 py-2 text-right font-semibold whitespace-nowrap">{c}</th>)}
            {anios.map((a) => <th key={a} className="px-2 py-2 text-right font-semibold min-w-[7.5rem]">{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.clave} className={f.total ? 'bg-mani-50 font-semibold' : 'hover:bg-gray-50'}>
              <td className={`px-3 py-1.5 border-b border-gray-100 sticky left-0 ${f.total ? 'bg-mani-50' : 'bg-white'}`}>{f.etiqueta}</td>
              {(f.extras ?? cabeceraExtras.map(() => null)).map((x, i) => (
                <td key={i} className="px-1.5 py-1 border-b border-gray-100">{x}</td>
              ))}
              {anios.map((_, t) => (
                <td key={t} className="px-1.5 py-1 border-b border-gray-100 text-right">{f.celda(t)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Valor calculado (fondo verde suave). */
export function Calc({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded px-2 py-1 bg-mani-50 tabular-nums">{children}</span>;
}

export const D = dinero;
export const P = porcentaje;
