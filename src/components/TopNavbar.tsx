import React from 'react';
import { 
  Scale, 
  Clock, 
  MapPin, 
  Wifi, 
  Plus, 
  Package, 
  Bell, 
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { useNavigate } from 'react-router-dom';

export function TopNavbar() {
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = React.useState<string>('');
  const [criticalSuppliesCount, setCriticalSuppliesCount] = React.useState<number>(0);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentDateTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Global Search Bar (Center / Left Responsive) */}
        <div className="flex-1 max-w-2xl flex items-center gap-3">
          <GlobalSearchBar />
        </div>

        {/* Right Info Badges & Quick Action Links */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
          {/* Critical Supplies Alert Indicator */}
          {criticalSuppliesCount > 0 && (
            <button
              onClick={() => navigate('/insumos')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs animate-pulse"
              title={`${criticalSuppliesCount} insumo(s) bajo el nivel crítico de stock`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Insumos Críticos:</span>
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {criticalSuppliesCount}
              </span>
            </button>
          )}

          {/* Plant Location & Scale Status */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Martínez de la Torre</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Báscula 80 Ton OK</span>
            </div>
          </div>

          {/* Live Date and Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{currentDateTime}</span>
          </div>

          {/* Direct Action Button: Nueva Boleta */}
          <button
            onClick={() => navigate('/recepcion')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
            title="Ir a Recepción y Registrar Boleta de Pesaje"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva Boleta</span>
          </button>
        </div>
      </div>
    </header>
  );
}
