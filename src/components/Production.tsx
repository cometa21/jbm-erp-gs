import React from 'react';
import { Factory, Layers, CheckCircle, BarChart3, ArrowRight, Sparkles, Scale } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Logo } from './Logo';

const caliberData = [
  { caliber: 'Cal. 110', count: 420, percent: '8%' },
  { caliber: 'Cal. 150', count: 980, percent: '18%' },
  { caliber: 'Cal. 175', count: 1850, percent: '35%' },
  { caliber: 'Cal. 200', count: 1420, percent: '27%' },
  { caliber: 'Cal. 230', count: 480, percent: '9%' },
  { caliber: 'Cal. 250', count: 160, percent: '3%' },
];

export function Production() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center p-2 shadow-xs">
            <Factory size={28} className="text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Producción, Clasificación & Calibres
              </h1>
              <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                Línea Activa
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Empacado de limón persa de exportación, separación por tamaños y control de calidad
            </p>
          </div>
        </div>
      </header>

      {/* Production Lines Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Línea de Lavado & Encerado</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">3,450 kg/hora</p>
            <p className="text-xs text-slate-400 font-semibold">Cera Carnauba Grado Alimento</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full w-[85%] rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Línea de Selección Óptica</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">Calibres 175 & 200</p>
            <p className="text-xs text-slate-400 font-semibold">62% Fruta Primera Calidad</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[74%] rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Armado de Pallets</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">18 Pallets / Turno</p>
            <p className="text-xs text-slate-400 font-semibold">Cajas JBM Premium 40 lbs</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[90%] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Caliber Distribution Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-emerald-700" />
            Distribución de Calibres del Día
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caliberData}>
                <XAxis dataKey="caliber" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#15803d" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Logo variant="mono" className="scale-75 invert filter" />
              <div>
                <h4 className="font-black text-base text-white">Especificación JBM Export</h4>
                <p className="text-xs text-amber-400 font-bold">Standard USDA & European Union</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Color Mínimo:</span>
                <span className="font-bold text-emerald-400">Verde Intenso (Escala 1 a 2)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Peso por Caja:</span>
                <span className="font-bold text-white">18.14 kg (40 lbs exactas)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Tratamiento:</span>
                <span className="font-bold text-white">Fungicida Imazalil + Cera</span>
              </div>
              <div className="flex justify-between pb-2">
                <span>Palletizado:</span>
                <span className="font-bold text-white">54 Cajas por Tarima (9 camadas)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs mt-4">
            <span className="text-emerald-400 font-black block uppercase">Próximo Despacho:</span>
            <span className="text-slate-300">Cámara 1 a Tráiler Refrigerado • 17:00 hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
