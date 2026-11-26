import { NavLink, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { Boxes, Briefcase, ClipboardList, Package } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const TABS = [
  { to: 'productos', label: 'Productos', icon: Boxes },
  { to: 'recetas', label: 'Recetas', icon: ClipboardList },
  { to: 'insumos', label: 'Insumos', icon: Package },
  { to: 'recursos', label: 'Recursos', icon: Briefcase },
];

/** Catálogo con pestañas superiores: cada pestaña es una interfaz distinta. */
export default function Gestion() {
  return (
    <>
      <PageHeader
        titulo="Gestión y catálogo"
        descripcion="Administra los productos, recetas, insumos y recursos que alimentan los cálculos."
        icono={Boxes}
      >
        <nav aria-label="Secciones del catálogo">
          <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {TABS.map(({ to, label, icon: Icon }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-150',
                      isActive
                        ? 'bg-limon-400 border-limon-400 text-mani-900'
                        : 'border-white/30 text-white hover:bg-white/10',
                    )
                  }
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <Outlet />
    </>
  );
}
