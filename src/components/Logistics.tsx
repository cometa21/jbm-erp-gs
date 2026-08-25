import React from 'react';
import { 
  ClipboardList, 
  Truck, 
  MapPin, 
  Thermometer, 
  FileCheck, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Printer
} from 'lucide-react';
import { Logo } from './Logo';

export function Logistics() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 no-print">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center p-2 shadow-xs">
            <ClipboardList size={28} className="text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Logística, Embarques & Carta Porte
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                Exportación & Nacional
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Trazabilidad en ruta, cadena de frío controlada y despacho con Carta Porte Digital 3.0
            </p>
          </div>
        </div>
      </header>

      {/* Active Shipments List */}
      <div className="space-y-4">
        {[
          {
            id: 'EMB-2026-084',
            dest: 'McAllen, TX, USA (Texas Fresh Citrus LLC)',
            carrier: 'Transportes Refrigerados del Golfo',
            driver: 'Roberto Morales (Lic. 849201)',
            boxes: '1,800 cajas (33.3 Ton)',
            status: 'En Tránsito (Aduana Reynosa)',
            temp: '3.8°C',
            eta: '25/08/2026 06:00 hrs'
          },
          {
            id: 'EMB-2026-085',
            dest: 'Central de Abasto CDMX (Bodega I-42)',
            carrier: 'Fletes Barragán Express',
            driver: 'Héctor Salgado (Lic. 910412)',
            boxes: '1,200 cajas (22.2 Ton)',
            status: 'En Carga en Empacadora',
            temp: '4.1°C',
            eta: '24/08/2026 23:30 hrs'
          },
          {
            id: 'EMB-2026-086',
            dest: 'Puerto de Veracruz (Contenedor Maersk Rotterdam)',
            carrier: 'Líneas Especializadas de Carga S.A.',
            driver: 'Armando Cuéllar (Lic. 551029)',
            boxes: '1,080 cajas (19.4 Ton)',
            status: 'Inspección Fitosanitaria Aprobada',
            temp: '3.5°C',
            eta: '25/08/2026 12:00 hrs'
          }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-emerald-800">{item.id}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {item.status}
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin size={16} className="text-slate-400" />
                {item.dest}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {item.carrier} • Operador: {item.driver} • Carga: <strong className="text-slate-800">{item.boxes}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Cadena de Frío</span>
                <span className="font-mono font-bold text-emerald-700 text-sm flex items-center gap-1">
                  <Thermometer size={14} />
                  {item.temp}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">ETA Destino</span>
                <span className="font-mono font-bold text-slate-800 text-xs">{item.eta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
