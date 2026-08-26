import React from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  X, 
  RefreshCw, 
  HelpCircle,
  Package,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { useSuppliesNotificationMonitor } from '../hooks/useSuppliesNotificationMonitor';
import type { InventoryItem } from '../types';
import { useNavigate } from 'react-router-dom';

interface SuppliesNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuppliesNotificationModal({ isOpen, onClose }: SuppliesNotificationModalProps) {
  const navigate = useNavigate();
  const {
    permission,
    isSupported,
    soundEnabled,
    criticalItems,
    criticalCount,
    isChecking,
    lastCheckTime,
    requestPermission,
    toggleSound,
    sendTestNotification,
    checkInventory
  } = useSuppliesNotificationMonitor();

  const [testSent, setTestSent] = React.useState(false);

  if (!isOpen) return null;

  const handleSendTest = () => {
    sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleGoToSupplies = (itemId?: number) => {
    onClose();
    if (itemId) {
      navigate(`/insumos?itemId=${itemId}`);
    } else {
      navigate('/insumos');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className={`p-3 rounded-2xl ${
              permission === 'granted' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {permission === 'granted' ? <BellRing className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  Web Notifications API
                </span>
                <span className="text-xs text-slate-400">Segundo Plano</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Alertas de Desabasto en Navegador
              </h2>
              <p className="text-xs text-slate-300">
                Notificaciones automáticas incluso con la pestaña minimizada o inactiva
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Permission Status Box */}
          <div className={`p-4 rounded-2xl border ${
            permission === 'granted'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : permission === 'denied'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  permission === 'granted' ? 'bg-emerald-200/60 text-emerald-800' :
                  permission === 'denied' ? 'bg-rose-200/60 text-rose-800' :
                  'bg-amber-200/60 text-amber-800'
                }`}>
                  {permission === 'granted' && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                  {permission === 'denied' && <BellOff className="w-5 h-5 text-rose-700" />}
                  {permission === 'default' && <AlertTriangle className="w-5 h-5 text-amber-700" />}
                  {permission === 'unsupported' && <Info className="w-5 h-5 text-slate-700" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold">
                    {permission === 'granted' && 'Notificaciones de Escritorio Habilitadas'}
                    {permission === 'denied' && 'Notificaciones Bloqueadas en tu Navegador'}
                    {permission === 'default' && 'Permiso de Notificación Pendiente'}
                    {permission === 'unsupported' && 'Navegador sin Soporte de Notificaciones'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                    {permission === 'granted' && 'Recibirás avisos emergentes del sistema operativo cuando cualquier caja, etiqueta o tarima caiga por debajo de su umbral crítico.'}
                    {permission === 'denied' && 'Has bloqueado las notificaciones en los permisos del sitio. Para reactivarlas, haz clic en el candado o icono de configuración en la barra de direcciones de tu navegador.'}
                    {permission === 'default' && 'Activa los permisos para que el sistema te alerte en segundo plano cuando se detecte riesgo de desabasto.'}
                    {permission === 'unsupported' && 'Tu entorno actual no admite la API HTML5 de notificaciones.'}
                  </p>
                </div>
              </div>

              {permission === 'default' && (
                <button
                  onClick={requestPermission}
                  className="flex-shrink-0 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Permitir Alertas
                </button>
              )}
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Opciones de Alerta
            </h3>

            {/* Sound Alert Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Chime Sonoro de Alerta</p>
                  <p className="text-[11px] text-slate-400">Emite un tono acústico sintetizado al detectar material crítico</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => toggleSound(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Probar Notificación en Segundo Plano</p>
                <p className="text-[11px] text-slate-400">Envía una alerta de muestra para verificar sonido y ventana emergente</p>
              </div>
              <button
                onClick={handleSendTest}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{testSent ? '¡Notificación Enviada!' : 'Probar Notificación'}</span>
              </button>
            </div>
          </div>

          {/* Current Critical Items Live Summary */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Materiales en Estado Crítico ({criticalCount})
                </h3>
              </div>
              <button
                onClick={() => checkInventory()}
                disabled={isChecking}
                className="text-[11px] text-slate-400 hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors"
                title="Actualizar estado de inventario"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {criticalCount > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {criticalItems.map((item) => {
                  const criticalLimit = item.critical_stock || Math.round(item.min_stock * 0.4);
                  const deficit = Math.max(0, item.min_stock - item.quantity);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleGoToSupplies(item.id)}
                      className="p-3 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/80 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-950 truncate">
                            {item.item_name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-rose-800">
                          <span>Stock: <strong className="text-rose-950">{item.quantity} {item.unit}</strong></span>
                          <span>•</span>
                          <span>Límite Crítico: {criticalLimit} {item.unit}</span>
                          <span>•</span>
                          <span className="text-rose-700 font-semibold">Faltante: {deficit} {item.unit}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-medium">
                  Excelente: Ningún material de empaque se encuentra en nivel crítico actualmente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => handleGoToSupplies()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <span>Ir al Módulo de Insumos</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
