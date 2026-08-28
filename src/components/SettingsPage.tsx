import React from 'react';
import { 
  Settings, 
  Building2, 
  Scale, 
  Printer, 
  Shield, 
  Save, 
  CheckCircle, 
  Database, 
  Cloud, 
  RefreshCw, 
  Check, 
  Bell, 
  BellRing, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Sparkles,
  ShieldAlert,
  Sun,
  Moon,
  Laptop,
  Eye,
  Zap,
  Clock,
  Compass
} from 'lucide-react';
import { Logo } from './Logo';
import { getCloudBatches, saveCloudBatch } from '../lib/cloudService';
import { useSuppliesNotificationMonitor } from '../hooks/useSuppliesNotificationMonitor';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

export function SettingsPage() {
  const [saved, setSaved] = React.useState(false);
  const [cloudStatus, setCloudStatus] = React.useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [cloudCount, setCloudCount] = React.useState<number | null>(null);
  const [testSent, setTestSent] = React.useState(false);

  const { theme, resolvedTheme, setTheme } = useTheme();

  const {
    permission,
    soundEnabled,
    requestPermission,
    toggleSound,
    sendTestNotification,
    criticalCount
  } = useSuppliesNotificationMonitor();

  const [settings, setSettings] = React.useState({
    name: 'JBM CÍTRICOS BARRAGÁN',
    trade_name: 'LIMONES BARRAGAN',
    rfc: 'JBM980412H82',
    address: 'Carretera Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Ver.',
    phone: '+52 (232) 324-8890',
    email: 'operaciones@jbmcitricos.com',
    portal_url: 'https://portal.jbmcitricos.com',
    scale_fee: 50.00,
    default_price_kg: 18.50
  });

  React.useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data) setSettings(data);
    });
    checkCloudConnection();
  }, []);

  const checkCloudConnection = async () => {
    setCloudStatus('checking');
    try {
      const cloudBatches = await getCloudBatches();
      setCloudCount(cloudBatches.length);
      setCloudStatus('connected');
    } catch (e) {
      console.error('Error connecting to Cloud Firestore:', e);
      setCloudStatus('error');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Configuración del Sistema & Empresa
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Personalización de tickets térmicos, tarifas, notificaciones y apariencia visual para turnos de planta
          </p>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* THEME & NIGHT SHIFT SELECTION CARD (JORNADA NOCTURNA EN PLANTA)           */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              resolvedTheme === 'night-plant'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : resolvedTheme === 'dark'
                ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {resolvedTheme === 'night-plant' ? (
                <Moon size={22} className="text-emerald-400" />
              ) : resolvedTheme === 'dark' ? (
                <Moon size={22} className="text-indigo-400" />
              ) : (
                <Sun size={22} className="text-amber-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Selector de Tema & Modo Jornada Nocturna
                {resolvedTheme === 'night-plant' && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                    Jornada Nocturna Activa
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Paleta de colores de alto contraste antirreflejo para terminales de pesaje, cámaras frías y patios nocturnos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Tema Activo:</span>
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
              {theme === 'light' ? '☀️ Claro' : theme === 'night-plant' ? '🌙 Nocturno Planta' : theme === 'dark' ? '🌑 Oscuro' : '⚡ Automático'}
            </span>
          </div>
        </div>

        {/* Theme Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Option 1: Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              theme === 'light'
                ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sun size={17} />
                </div>
                {theme === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-900">Modo Claro (Diurno)</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Diseño estándar con luz natural para oficinas administrativas y pesaje diurno.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] font-bold text-amber-800">
              <span>● Luz Matutina</span>
            </div>
          </button>

          {/* Option 2: Night-Plant Shift Mode (High Contrast Packing Plant) */}
          <button
            type="button"
            onClick={() => setTheme('night-plant')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              theme === 'night-plant'
                ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-400/50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-700/50">
                  <Moon size={17} />
                </div>
                {theme === 'night-plant' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900">Jornada Nocturna</h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700">
                  Planta
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Fondo ultranegro antirreflejo con alto contraste (WCAG AAA) para cuartos fríos y báscula nocturna.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
              <Zap size={11} />
              <span>Alto Contraste & Cero Fatiga</span>
            </div>
          </button>

          {/* Option 3: Standard Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-400/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-300 flex items-center justify-center">
                  <Sparkles size={17} />
                </div>
                {theme === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-900">Modo Oscuro Balanceado</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Tonalidad pizarra suave para interiores de empaque con iluminación mixta.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600">
              <span>● Slate Profundo</span>
            </div>
          </button>

          {/* Option 4: System / Automated Shift Mode */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              theme === 'system'
                ? 'border-emerald-500 bg-slate-100 ring-2 ring-emerald-400/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                  <Laptop size={17} />
                </div>
                {theme === 'system' && (
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-900">Automático (Turno / SO)</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Cambia automáticamente a Jornada Nocturna a las 19:00 hrs y a Modo Claro al amanecer (07:00 hrs).
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
              <Clock size={11} />
              <span>Programación 19:00 - 07:00</span>
            </div>
          </button>
        </div>

        {/* Plant Environment Simulation Strip */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Eye size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Optimización Visual de Planta JBM
              </h4>
              <p className="text-[11px] text-slate-600">
                La tipografía monocromática y los acentos esmeralda y ámbar garantizan una lectura nítida de pesos en báscula a 3+ metros de distancia.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-[11px] font-bold flex items-center gap-2">
              <span className="text-slate-500">Muestra Báscula:</span>
              <span className="font-mono font-black text-emerald-800">14,850 kg NETO</span>
            </div>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'light' ? 'night-plant' : 'light')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {resolvedTheme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
              <span>{resolvedTheme === 'light' ? 'Probar Modo Nocturno' : 'Probar Modo Claro'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Settings Form */}
        <div className="md:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 size={18} className="text-emerald-700" />
              Datos Fiscales y Comerciales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={settings.trade_name}
                  onChange={e => setSettings({ ...settings, trade_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={e => setSettings({ ...settings, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">R.F.C.</label>
                <input
                  type="text"
                  value={settings.rfc}
                  onChange={e => setSettings({ ...settings, rfc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección de la Empacadora</label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Portal QR para Productores</label>
              <input
                type="text"
                value={settings.portal_url}
                onChange={e => setSettings({ ...settings, portal_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono outline-none"
              />
            </div>

            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 pt-4">
              <Scale size={18} className="text-emerald-700" />
              Parámetros de Báscula y Tarifas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cuota por Pesada en Báscula ($)</label>
                <input
                  type="number"
                  step="5.00"
                  value={settings.scale_fee}
                  onChange={e => setSettings({ ...settings, scale_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Precio Referencia Limón Persa ($/kg)</label>
                <input
                  type="number"
                  step="0.50"
                  value={settings.default_price_kg}
                  onChange={e => setSettings({ ...settings, default_price_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <Save size={18} />
                <span>Guardar Cambios</span>
              </button>

              {saved && (
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle size={16} /> Configuración actualizada correctamente
                </span>
              )}
            </div>
          </form>

          {/* Background Notification Settings Card */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  permission === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {permission === 'granted' ? <BellRing size={18} /> : <Bell size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Notificaciones en Segundo Plano (Web Notifications API)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Alertas automáticas en el navegador cuando el inventario de empaque caiga en nivel crítico
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                permission === 'granted' ? 'bg-emerald-100 text-emerald-800' :
                permission === 'denied' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {permission === 'granted' ? '● Habilitadas' :
                 permission === 'denied' ? '● Bloqueadas en Navegador' :
                 '● Permiso Pendiente'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Permisos del Sistema Operativo</p>
                  <p className="text-[11px] text-slate-500">
                    Permite desplegar alertas nativas flotantes incluso con la pestaña minimizada.
                  </p>
                </div>
                {permission !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestPermission}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Activar Notificaciones
                  </button>
                )}
              </div>

              {/* Sound Option */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? <Volume2 size={16} className="text-emerald-700" /> : <VolumeX size={16} className="text-slate-400" />}
                  <div>
                    <span className="text-xs font-bold text-slate-800">Alerta Sonora (Chime Acústico)</span>
                    <p className="text-[11px] text-slate-400">Emite un tono acústico con Web Audio API</p>
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

              {/* Test Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-xs font-bold text-slate-800">Verificación de Entrega</span>
                  <p className="text-[11px] text-slate-400">Prueba el disparo de notificación emergente y audio</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sendTestNotification();
                    setTestSent(true);
                    setTimeout(() => setTestSent(false), 2500);
                  }}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} className="text-emerald-600" />
                  <span>{testSent ? '¡Enviada!' : 'Probar Notificación'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Preview Card */}
        <div className="md:col-span-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase block mb-4">
              Identidad Oficial JBM
            </span>
            <div className="p-4 bg-white rounded-2xl shadow-inner my-2">
              <Logo variant="full" size="md" />
            </div>
            <h4 className="font-black text-sm text-white mt-4">JBM CÍTRICOS BARRAGÁN</h4>
            <p className="text-xs text-amber-400 font-bold">LIMONES BARRAGÁN</p>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Membrete y logo aplicados en todos los tickets térmicos de báscula, boletas de liquidación y remisiones.
            </p>
          </div>

          <div className="w-full bg-slate-800 p-3 rounded-2xl border border-slate-700 text-left mt-6">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Licencia de Empacadora</span>
            <span className="text-xs font-mono font-bold text-emerald-400">JBM-EMP-VER-2026-V1</span>
          </div>

          {/* Cloud Database Integration Section */}
          <div className="w-full bg-slate-800/90 p-4 rounded-2xl border border-emerald-500/30 text-left mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Database size={15} className="text-emerald-400" />
                <span className="text-xs font-black text-white">Base de Datos Cloud</span>
              </div>
              <button
                onClick={checkCloudConnection}
                disabled={cloudStatus === 'checking'}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} className={cloudStatus === 'checking' ? 'animate-spin' : ''} />
                <span>Probar</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-300">
              Sincronización en tiempo real y persistencia en la nube activa.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">Estado Conexión:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {cloudStatus === 'checking' ? 'Verificando...' : cloudStatus === 'connected' ? 'En Línea (Cloud)' : 'Conectado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
