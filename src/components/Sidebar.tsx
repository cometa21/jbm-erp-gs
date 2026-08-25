import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Factory, 
  Thermometer, 
  ShoppingCart, 
  ClipboardList, 
  Wallet, 
  Package, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Truck, label: 'Recepción', path: '/recepcion' },
  { icon: Factory, label: 'Producción', path: '/produccion' },
  { icon: Thermometer, label: 'Cámara Fría', path: '/camara' },
  { icon: ShoppingCart, label: 'Ventas / POS', path: '/ventas' },
  { icon: ClipboardList, label: 'Logística', path: '/logistica' },
  { icon: Wallet, label: 'Finanzas', path: '/finanzas' },
  { icon: Package, label: 'Insumos', path: '/insumos' },
  { icon: Settings, label: 'Configuración', path: '/config' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <aside 
      className={cn(
        "bg-brand-dark text-white transition-all duration-300 flex flex-col h-screen sticky top-0",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-xl">J</div>
            <span className="font-bold tracking-tight text-lg">JBM Cítricos</span>
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all group",
              isActive 
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={22} className={cn("shrink-0", isOpen ? "" : "mx-auto")} />
            {isOpen && <span className="font-medium">{item.label}</span>}
            {!isOpen && (
              <div className="absolute left-20 bg-brand-dark text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className={cn("flex items-center gap-3", isOpen ? "" : "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold">AD</div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin User</span>
              <span className="text-xs text-slate-400">Super Admin</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
