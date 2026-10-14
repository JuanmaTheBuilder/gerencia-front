import { NavLink } from 'react-router-dom';
import { Calculator, Package, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';

const menuItems = [
  { path: '/', label: 'Calculadora', icon: Calculator },
  { path: '/insumos', label: 'Insumos', icon: Package },
  { path: '/recetas', label: 'Recetas', icon: ClipboardList },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-700">Calculadora</h1>
        <p className="text-xs text-gray-500 mt-1">Requerimientos y costos</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        v2.0
      </div>
    </aside>
  );
}
