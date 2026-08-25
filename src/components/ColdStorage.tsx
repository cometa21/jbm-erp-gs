import React from 'react';
import { Thermometer, Droplets, Box, ArrowRight, Info } from 'lucide-react';
import { motion } from 'motion/react';

const zones = [
  { id: 'A1', temp: 3.8, hum: 85, pallets: 12, capacity: 20, status: 'optimal' },
  { id: 'A2', temp: 4.2, hum: 82, pallets: 18, capacity: 20, status: 'warning' },
  { id: 'B1', temp: 3.5, hum: 88, pallets: 5, capacity: 20, status: 'optimal' },
  { id: 'B2', temp: 3.9, hum: 84, pallets: 15, capacity: 20, status: 'optimal' },
  { id: 'C1', temp: 4.0, hum: 80, pallets: 20, capacity: 20, status: 'full' },
  { id: 'C2', temp: 3.7, hum: 86, pallets: 8, capacity: 20, status: 'optimal' },
];

export function ColdStorage() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cámara Fría</h1>
          <p className="text-slate-500">Monitoreo de inventario y condiciones ambientales</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3">
            <Thermometer className="text-blue-500" size={20} />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Temp. Promedio</p>
              <p className="text-sm font-bold">3.85 °C</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3">
            <Droplets className="text-cyan-500" size={20} />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Hum. Promedio</p>
              <p className="text-sm font-bold">84.2 %</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Warehouse Map */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold">Mapa de Almacén</h3>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Óptimo</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Advertencia</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Lleno</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <motion.div
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                <div className={cn(
                  "p-6 rounded-2xl border-2 transition-all",
                  zone.status === 'optimal' ? "bg-emerald-50/30 border-emerald-100 group-hover:border-emerald-500" :
                  zone.status === 'warning' ? "bg-amber-50/30 border-amber-100 group-hover:border-amber-500" :
                  "bg-slate-50 border-slate-200 group-hover:border-slate-400"
                )}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xl font-black text-slate-300 group-hover:text-slate-900 transition-colors">{zone.id}</span>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      zone.status === 'optimal' ? "bg-emerald-500" :
                      zone.status === 'warning' ? "bg-amber-500" : "bg-slate-400"
                    )}></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase">Ocupación</span>
                      <span className="text-sm font-bold">{zone.pallets}/{zone.capacity}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          zone.status === 'optimal' ? "bg-emerald-500" :
                          zone.status === 'warning' ? "bg-amber-500" : "bg-slate-400"
                        )}
                        style={{ width: `${(zone.pallets / zone.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Thermometer size={14} />
                      <span className="text-xs font-bold">{zone.temp}°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Droplets size={14} />
                      <span className="text-xs font-bold">{zone.hum}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FIFO Status & Details */}
        <div className="space-y-6">
          <div className="bg-brand-dark text-white p-6 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info size={20} className="text-brand-secondary" />
              Estado FIFO
            </h3>
            <p className="text-slate-400 text-sm mb-6">Próximos pallets a salir según fecha de ingreso:</p>
            <div className="space-y-4">
              {[
                { id: 'P-8421', zone: 'C1', time: 'hace 4 días', variety: 'Persa' },
                { id: 'P-8425', zone: 'C1', time: 'hace 3 días', variety: 'Persa' },
                { id: 'P-8430', zone: 'A2', time: 'hace 2 días', variety: 'Valencia' },
              ].map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-brand-secondary/20 text-brand-secondary flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.id}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Zona {item.zone} • {item.variety}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-brand-secondary uppercase">{item.time}</p>
                    <ArrowRight size={14} className="ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">
              Gestionar Despachos
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h3 className="text-lg font-bold mb-4">Resumen de Stock</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Limón Persa</span>
                <span className="text-sm font-bold">84 pallets</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Naranja Valencia</span>
                <span className="text-sm font-bold">32 pallets</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Toronja Ruby</span>
                <span className="text-sm font-bold">8 pallets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
