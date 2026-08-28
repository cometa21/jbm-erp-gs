import React from 'react';
import { 
  Scale, 
  Clock, 
  MapPin, 
  Wifi, 
  Plus, 
  Package, 
  Bell, 
  BellRing,
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { useNavigate } from 'react-router-dom';
import { useSuppliesNotificationMonitor } from '../hooks/useSuppliesNotificationMonitor';
import { SuppliesNotificationModal } from './SuppliesNotificationModal';
import { useTheme } from '../context/ThemeContext';

export function TopNavbar() {
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = React.useState<string>('');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = React.useState(false);
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const {
    permission,
    criticalItems,
    criticalCount
  } = useSuppliesNotificationMonitor();

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Global Search Bar (Center / Left Responsive) */}
          <div className="flex-1 max-w-2xl flex items-center gap-3">
            <GlobalSearchBar />
          </div>

          {/* Right Info Badges & Quick Action Links */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Critical Supplies Alert Indicator */}
            {criticalCount > 0 && (
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs animate-pulse"
                title={`${criticalCount} insumo(s) bajo el nivel crítico de stock`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Desabasto Crítico:</span>
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {criticalCount}
                </span>
              </button>
            )}

            {/* Quick Theme Switcher Button (Diurno / Nocturno Planta) */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                resolvedTheme === 'night-plant'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80 hover:bg-emerald-900 shadow-2xs'
                  : resolvedTheme === 'dark'
                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/80 hover:bg-indigo-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={
                resolvedTheme === 'night-plant'
                  ? 'Modo: Jornada Nocturna (Alto Contraste Planta) - Clic para cambiar'
                  : resolvedTheme === 'dark'
                  ? 'Modo: Oscuro Balanceado - Clic para cambiar'
                  : 'Modo: Claro (Diurno) - Clic para cambiar a Jornada Nocturna'
              }
            >
              {resolvedTheme === 'night-plant' ? (
                <>
                  <Moon className="w-4 h-4 text-emerald-400" />
                  <span className="hidden xl:inline text-[11px] font-black text-emerald-300">Nocturno Planta</span>
                </>
              ) : resolvedTheme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-300" />
                  <span className="hidden xl:inline text-[11px] font-bold text-indigo-200">Oscuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span className="hidden xl:inline text-[11px] font-bold text-slate-700">Diurno</span>
                </>
              )}
            </button>

            {/* Notification Center Bell Button */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className={`relative p-2 rounded-xl border transition-colors ${
                criticalCount > 0 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                  : permission === 'granted'
                  ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title={
                permission === 'granted' 
                  ? 'Notificaciones de escritorio activas' 
                  : 'Configurar notificaciones en segundo plano'
              }
            >
              {criticalCount > 0 ? (
                <BellRing className="w-4 h-4 text-rose-600 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4 text-slate-600" />
              )}
              {permission === 'granted' && criticalCount === 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
              {permission === 'default' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>

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

      {/* Supplies Notification Management Modal */}
      <SuppliesNotificationModal 
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </>
  );
}
