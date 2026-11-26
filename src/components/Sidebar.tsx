import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bean, BarChart3, Boxes, Calculator, LayoutDashboard, Lightbulb, type LucideIcon } from 'lucide-react';

interface MenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const MENU: MenuItem[] = [
  { to: '/', label: 'Panel General', icon: LayoutDashboard, end: true },
  { to: '/analisis', label: 'Análisis y cálculos', icon: Calculator },
  { to: '/plan', label: 'Plan de negocio', icon: Lightbulb },
  { to: '/resultados', label: 'Resultados del plan', icon: BarChart3 },
  { to: '/gestion', label: 'Gestión y catálogo', icon: Boxes },
];

export default function Sidebar() {
  return (
    <aside className="shrink-0 flex flex-col bg-mani-900 text-white select-none md:h-screen md:w-64 md:sticky md:top-0 shadow-xl">
      <div className="flex items-center gap-3 px-5 py-4 md:p-6 md:border-b md:border-white/10">
        <div className="w-11 h-11 rounded-2xl bg-limon-400 text-mani-900 grid place-items-center shadow-lg shadow-black/20">
          <Bean className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-display text-lg font-extrabold leading-tight tracking-tight">Maní Aburrá</h1>
          <p className="text-xs font-medium text-limon-400">Requerimientos y costos</p>
        </div>
      </div>

      <nav
        aria-label="Navegación principal"
        className="flex gap-2 overflow-x-auto px-4 pb-4 md:flex-1 md:flex-col md:overflow-y-auto md:p-4 [scrollbar-width:none]"
      >
        {MENU.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150',
                isActive ? 'bg-limon-400 text-mani-900 shadow-lg shadow-black/20' : 'text-mani-50 hover:bg-white/10',
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden md:flex items-center justify-between gap-2 border-t border-white/10 p-4 text-xs font-medium text-mani-50">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-limon-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-limon-400" />
          </span>
          Sistema activo
        </span>
        <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[11px]">v2.0</span>
      </div>
    </aside>
  );
}
