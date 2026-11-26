import { useId, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { DESCRIPCION_ESTUDIO, type Estudio } from '../utils/estudios';

/** Icono "?" que muestra el tipo de estudio del módulo al pasar el ratón o enfocarlo. */
export default function EstudioInfo({ estudio }: { estudio: Estudio }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button
        type="button"
        aria-describedby={id}
        aria-label={`Tipo de estudio: ${estudio}`}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onClick={() => setAbierto((v) => !v)}
        className="w-10 h-10 rounded-full bg-white text-mani-900 border-2 border-mani-900 grid place-items-center hover:bg-limon-400 focus-visible:ring-4 focus-visible:ring-limon-500 cursor-help"
      >
        <CircleHelp className="w-5 h-5" aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute right-0 top-full mt-2 z-30 w-72 rounded-xl bg-mani-900 text-white text-sm leading-relaxed p-4 shadow-xl transition-opacity duration-150 ${
          abierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <b className="block mb-1 text-limon-400">Estudio de {estudio}</b>
        {DESCRIPCION_ESTUDIO[estudio]}
      </span>
    </span>
  );
}
