import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

interface Item { id: string; titulo: string }

/** Barra de chips pegada arriba: salta a cada módulo y resalta el que está visible. */
export default function ModuloNav({ items }: { items: Item[] }) {
  const [activo, setActivo] = useState(items[0]?.id ?? '');
  const clave = items.map((i) => i.id).join('|');

  useEffect(() => {
    const secciones = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => e !== null);
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.filter((e) => e.isIntersecting).forEach((e) => setActivo(e.target.id));
      },
      { rootMargin: '-160px 0px -60% 0px' },
    );
    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return (
    <nav aria-label="Módulos de la página" className="sticky top-0 z-20 -mx-1 mb-6 bg-[#F7FBF2]/95 backdrop-blur py-3">
      <ul className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <a
              href={`#${i.id}`}
              aria-current={activo === i.id ? 'true' : undefined}
              onClick={() => setActivo(i.id)}
              className={clsx(
                'inline-flex items-center rounded-full border-2 px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-150',
                activo === i.id
                  ? 'bg-mani-900 border-mani-900 text-white'
                  : 'bg-white border-mani-100 text-mani-900 hover:border-mani-500',
              )}
            >
              {i.titulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
