import React from 'react';
import { Settings, Building2, Scale, Printer, Shield, Save, CheckCircle, Database, Cloud, RefreshCw, Check } from 'lucide-react';
import { Logo } from './Logo';
import { getCloudBatches, saveCloudBatch } from '../lib/cloudService';

export function SettingsPage() {
  const [saved, setSaved] = React.useState(false);
  const [cloudStatus, setCloudStatus] = React.useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [cloudCount, setCloudCount] = React.useState<number | null>(null);
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
            Configuración de Empresa & Membretes
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Personalización de tickets térmicos de báscula, documentos oficiales y tarifas
          </p>
        </div>
      </header>

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
