import React, { useState, useEffect } from 'react';
import { POSTabType, POSUserRole } from '../../types';
import { 
  ShoppingCart, Truck, Package, Calculator, Receipt, TrendingUp, 
  ArrowLeft, Shield, User, Building2, Clock, CheckCircle2, ChevronRight,
  Sparkles, Store, Layers, History, BarChart3
} from 'lucide-react';
import { POSTabVentas } from './POSTabVentas';
import { POSTabHistorial } from './POSTabHistorial';
import { POSTabAnalisis } from './POSTabAnalisis';
import { POSTabRecepciones } from './POSTabRecepciones';
import { POSTabInventario } from './POSTabInventario';
import { POSTabCorteCaja } from './POSTabCorteCaja';
import { POSTabGastos } from './POSTabGastos';
import { POSTabRentabilidad } from './POSTabRentabilidad';

interface POSLayoutProps {
  onBackToERP: () => void;
}

interface NavItem {
  id: POSTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: POSUserRole[];
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'ventas',
    label: 'Punto de Venta',
    icon: ShoppingCart,
    roles: ['admin', 'ventas']
  },
  {
    id: 'historial',
    label: 'Historial de Ventas',
    icon: History,
    roles: ['admin', 'ventas', 'finanzas']
  },
  {
    id: 'analisis',
    label: 'Análisis de Ventas',
    icon: BarChart3,
    roles: ['admin', 'ventas', 'finanzas']
  },
  {
    id: 'recepciones',
    label: 'Recepciones',
    icon: Truck,
    roles: ['admin', 'almacen'],
    badge: '1 En camino',
    badgeColor: 'bg-amber-500 text-white'
  },
  {
    id: 'inventario',
    label: 'Inventario Bodega',
    icon: Package,
    roles: ['admin', 'almacen', 'ventas']
  },
  {
    id: 'corte_caja',
    label: 'Corte de Caja',
    icon: Calculator,
    roles: ['admin', 'ventas', 'almacen']
  },
  {
    id: 'gastos',
    label: 'Gastos Locales',
    icon: Receipt,
    roles: ['admin', 'finanzas']
  },
  {
    id: 'rentabilidad',
    label: 'Rentabilidad',
    icon: TrendingUp,
    roles: ['admin'],
    badge: 'Admin',
    badgeColor: 'bg-purple-600 text-white'
  }
];

export const POSLayout: React.FC<POSLayoutProps> = ({ onBackToERP }) => {
  const [currentRole, setCurrentRole] = useState<POSUserRole>('admin');
  const [activeTab, setActiveTab] = useState<POSTabType>('ventas');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter accessible tabs by current role
  const accessibleTabs = NAV_ITEMS.filter(item => item.roles.includes(currentRole));

  // If active tab is not allowed for the new role, switch to first allowed tab
  useEffect(() => {
    const isAllowed = accessibleTabs.some(t => t.id === activeTab);
    if (!isAllowed && accessibleTabs.length > 0) {
      setActiveTab(accessibleTabs[0].id);
    }
  }, [currentRole]);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden select-none">
      {/* ISOLATED POS SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* POS Brand Header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-emerald-400 uppercase">
                JBM CÍTRICOS
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                Punto de Venta CDMX
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Bodega I-42 • CEDA
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1.5 tracking-wider">
              Módulos del Turno ({currentRole})
            </div>

            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const hasAccess = item.roles.includes(currentRole);
              const isActive = activeTab === item.id;

              if (!hasAccess) {
                return (
                  <div
                    key={item.id}
                    title={`Requiere rol: ${item.roles.join(', ')}`}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 opacity-40 flex items-center justify-between cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-600">Bloqueado</span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Shift Info */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Operator Badge */}
          <div className="bg-slate-800/80 p-2.5 rounded-xl text-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              {currentRole.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-xs truncate">
                {currentRole === 'admin' ? 'Super Admin' : currentRole === 'ventas' ? 'Operador Mostrador' : currentRole === 'almacen' ? 'Encargado Bodega' : 'Finanzas CDMX'}
              </div>
              <div className="text-[10px] text-slate-400">
                Turno Matutino • CEDA
              </div>
            </div>
          </div>

          {/* Admin "Volver al ERP" Button */}
          {currentRole === 'admin' && (
            <button
              onClick={onBackToERP}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al ERP General</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN POS CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* POS TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          {/* Active Tab & Bodega Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CDMX</span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-black text-slate-900">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Building2 className="w-3 h-3" /> Nave I-42 Central de Abasto
            </span>
          </div>

          {/* Role Switcher & Clock */}
          <div className="flex items-center gap-4">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime.toLocaleTimeString('es-MX')}</span>
            </div>

            {/* Role Tester Selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-slate-400" /> Rol:
              </span>
              {(['admin', 'ventas', 'almacen', 'finanzas'] as POSUserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                    currentRole === role
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Return to ERP (always accessible to admin or when testing) */}
            {currentRole === 'admin' && (
              <button
                onClick={onBackToERP}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al ERP</span>
              </button>
            )}
          </div>
        </header>

        {/* ACTIVE TAB RENDERER */}
        <main className="flex-1 overflow-y-auto bg-slate-100/70">
          {activeTab === 'ventas' && <POSTabVentas currentRole={currentRole} />}
          {activeTab === 'historial' && (
            <POSTabHistorial 
              currentRole={currentRole} 
              onNavigateToPOS={() => setActiveTab('ventas')} 
            />
          )}
          {activeTab === 'analisis' && <POSTabAnalisis currentRole={currentRole} />}
          {activeTab === 'recepciones' && <POSTabRecepciones currentRole={currentRole} />}
          {activeTab === 'inventario' && <POSTabInventario currentRole={currentRole} />}
          {activeTab === 'corte_caja' && <POSTabCorteCaja currentRole={currentRole} />}
          {activeTab === 'gastos' && <POSTabGastos currentRole={currentRole} />}
          {activeTab === 'rentabilidad' && <POSTabRentabilidad currentRole={currentRole} />}
        </main>
      </div>
    </div>
  );
};
