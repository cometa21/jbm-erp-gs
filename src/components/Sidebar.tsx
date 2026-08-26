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
  FileText,
  Settings,
  Menu,
  X,
  Printer
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Logo } from './Logo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Truck, label: 'Recepción y Báscula', path: '/recepcion', badge: 'Tickets' },
  { icon: Factory, label: 'Producción y Calibres', path: '/produccion' },
  { icon: Thermometer, label: 'Cámara Fría & FIFO', path: '/camara' },
  { icon: ShoppingCart, label: 'Ventas / POS', path: '/ventas' },
  { icon: ClipboardList, label: 'Logística & Carta Porte', path: '/logistica' },
  { icon: Wallet, label: 'Liquidaciones & Finanzas', path: '/finanzas' },
  { icon: FileText, label: 'Centro de Documentos', path: '/documentos' },
  { icon: Package, label: 'Inventario de Insumos', path: '/insumos' },
  { icon: Settings, label: 'Configuración de Empresa', path: '/config' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(true);
  const [criticalSuppliesCount, setCriticalSuppliesCount] = React.useState<number>(0);

  React.useEffect(() => {
    const checkCritical = () => {
      fetch('/api/inventory')
        .then(res => res.json())
        .then((items: any[]) => {
          if (Array.isArray(items)) {
            const count = items.filter(i => i.quantity <= (i.critical_stock ?? (i.min_stock * 0.4))).length;
            setCriticalSuppliesCount(count);
          }
        })
        .catch(() => {});
    };

    checkCritical();
    const interval = setInterval(checkCritical, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside 
      className={cn(
        "bg-slate-900 text-white transition-all duration-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 z-30 no-print",
        isOpen ? "w-72" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-slate-800/90 rounded-xl p-1 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <Logo variant="mono" className="scale-75 invert filter" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-white leading-none">JBM CÍTRICOS</span>
              <span className="text-[10px] font-extrabold text-amber-400 tracking-widest mt-0.5">LIMONES BARRAGÁN</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center font-black text-lg">
              J
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Sidebar"
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isSupplies = item.path === '/insumos';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                isActive 
                  ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/30" 
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 font-medium"
              )}
            >
              <item.icon size={20} className={cn("shrink-0", isOpen ? "" : "mx-auto")} />
              {isOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm tracking-tight">{item.label}</span>
                  {isSupplies && criticalSuppliesCount > 0 ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white border border-rose-400 shadow-xs animate-pulse">
                      🚨 {criticalSuppliesCount} Críticos
                    </span>
                  ) : item.badge ? (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-200 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              )}
              {!isOpen && isSupplies && criticalSuppliesCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
              {!isOpen && (
                <div className="absolute left-20 bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  {item.label} {isSupplies && criticalSuppliesCount > 0 ? `(${criticalSuppliesCount} críticos)` : ''}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Status / Operator info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className={cn("flex items-center gap-3", isOpen ? "" : "justify-center")}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-amber-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              CB
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-200 truncate">Carlos Barragán</span>
              <span className="text-[10px] text-emerald-400 font-medium truncate">Operador Báscula • JBM</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

