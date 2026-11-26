import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import EstudioInfo from './EstudioInfo';
import type { Estudio } from '../utils/estudios';

interface ModuloProps {
  id: string;
  titulo: string;
  descripcion?: string;
  icono: LucideIcon;
  estudio: Estudio;
  children: ReactNode;
}

/** Bloque independiente dentro de una página: cabecera propia, icono "?" y contenido. */
export default function Modulo({ id, titulo, descripcion, icono: Icono, estudio, children }: ModuloProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-44 mb-8 rounded-3xl bg-white border-2 border-mani-100 shadow-sm">
      <header className="flex items-start gap-4 p-5 sm:p-6 rounded-t-3xl bg-gradient-to-r from-mani-50 to-white border-b-2 border-mani-100">
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-limon-400 text-mani-900 grid place-items-center">
          <Icono className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-titulo`} className="font-display text-xl sm:text-2xl font-extrabold text-mani-900 tracking-tight">
            {titulo}
          </h2>
          {descripcion && <p className="text-sm text-gray-600 mt-1 max-w-3xl">{descripcion}</p>}
        </div>
        <EstudioInfo estudio={estudio} />
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
