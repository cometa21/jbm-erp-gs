import React from 'react';
import { Package, Plus, Minus, Search, AlertTriangle } from 'lucide-react';
import type { InventoryItem } from '../types';

export function Supplies() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);

  React.useEffect(() => {
    fetch('/api/inventory').then(res => res.json()).then(setItems);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario de Insumos</h1>
          <p className="text-slate-500">Gestión de materiales de empaque y suministros de campo</p>
        </div>
        <button className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform">
          <Plus size={20} />
          Nuevo Insumo
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
                <Package size={24} />
              </div>
              {item.quantity < 100 && (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle size={12} />
                  Stock Bajo
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{item.item_name}</h3>
            <p className="text-sm text-slate-400 font-medium mb-6">Unidad: {item.unit}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900">{item.quantity.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponible</span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                  <Minus size={20} />
                </button>
                <button className="p-2 bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg text-brand-primary transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h3 className="text-lg font-bold mb-6">Movimientos Recientes</h3>
        <div className="space-y-4">
          {[
            { id: 1, item: 'Pallet Madera', type: 'Salida', qty: 24, date: 'Hoy, 10:45 AM', user: 'Almacén' },
            { id: 2, item: 'Caja Exportación 15kg', type: 'Entrada', qty: 500, date: 'Ayer, 04:20 PM', user: 'Admin' },
            { id: 3, item: 'Esquineros Cartón', type: 'Salida', qty: 120, date: 'Ayer, 11:30 AM', user: 'Almacén' },
          ].map((log) => (
            <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  log.type === 'Entrada' ? "bg-emerald-500" : "bg-rose-500"
                )}></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{log.item}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{log.date} • {log.user}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-black",
                  log.type === 'Entrada' ? "text-emerald-600" : "text-rose-600"
                )}>
                  {log.type === 'Entrada' ? '+' : '-'}{log.qty}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{log.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
