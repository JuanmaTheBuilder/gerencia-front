import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  children?: ReactNode;
}

/** Banda de marca al inicio de cada apartado. */
export default function PageHeader({ titulo, descripcion, icono: Icono, children }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-mani-900 text-white p-6 sm:p-8 mb-6 shadow-lg">
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 w-56 h-56 rounded-full bg-limon-400/15" />
      <span aria-hidden="true" className="pointer-events-none absolute right-10 -bottom-24 w-40 h-40 rounded-full bg-limon-400/10" />
      <div className="relative flex flex-col gap-5">
        <div className="flex items-start gap-4 max-w-3xl">
          {Icono && (
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-limon-400 text-mani-900 grid place-items-center">
              <Icono className="w-6 h-6" aria-hidden="true" />
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{titulo}</h1>
            {descripcion && <p className="mt-2 text-mani-50 text-sm sm:text-base">{descripcion}</p>}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
