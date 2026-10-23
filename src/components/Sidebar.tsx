import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  Calculator, 
  Package, 
  ClipboardList, 
  Boxes, 
  TrendingUp, 
  DollarSign, 
  Briefcase,
  Bean
} from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Análisis y Cálculos',
    items: [
      { path: '/', label: 'Calculadora', icon: Calculator },
      { path: '/punto-equilibrio', label: 'Punto de equilibrio', icon: TrendingUp },
      { path: '/precios-venta', label: 'Precios de venta', icon: DollarSign },
    ],
  },
  {
    title: 'Gestión y Catálogo',
    items: [
      { path: '/productos', label: 'Productos', icon: Boxes },
      { path: '/recetas', label: 'Recetas', icon: ClipboardList },
      { path: '/insumos', label: 'Insumos', icon: Package },
      { path: '/recursos', label: 'Recursos', icon: Briefcase },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 select-none shadow-sm">
      {/* Header del Sidebar */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <Bean className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">
              Maní Aburrá
            </h1>
            <p className="text-xs font-medium text-emerald-600 mt-0.5">
              Requerimientos y costos
            </p>
          </div>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <h2 className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {section.title}
              </h2>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-emerald-50/80 text-emerald-700 font-semibold shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Borde indicador activo */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-600 rounded-r-full" />
                      )}
                      
                      <Icon
                        className={clsx(
                          'w-5 h-5 transition-colors duration-200 shrink-0',
                          isActive
                            ? 'text-emerald-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between px-2 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-gray-600">Sistema activo</span>
          </div>
          <span className="text-gray-400 text-[11px] bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">
            v2.0
          </span>
        </div>
      </div>
    </aside>
  );
}