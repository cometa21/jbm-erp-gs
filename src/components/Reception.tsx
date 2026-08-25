import React from 'react';
import { Plus, Search, Scale, Printer, History } from 'lucide-react';
import type { Producer, Batch } from '../types';

export function Reception() {
  const [producers, setProducers] = React.useState<Producer[]>([]);
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    producer_id: '',
    weight_gross: '',
    weight_tare: ''
  });

  React.useEffect(() => {
    fetch('/api/producers').then(res => res.json()).then(setProducers);
    fetch('/api/batches').then(res => res.json()).then(setBatches);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producer_id: parseInt(formData.producer_id),
        weight_gross: parseFloat(formData.weight_gross),
        weight_tare: parseFloat(formData.weight_tare)
      })
    })
    .then(res => res.json())
    .then(() => {
      setShowForm(false);
      setFormData({ producer_id: '', weight_gross: '', weight_tare: '' });
      fetch('/api/batches').then(res => res.json()).then(setBatches);
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recepción de Fruta</h1>
          <p className="text-slate-500">Gestión de entradas y pesaje de producto</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform"
        >
          <Plus size={20} />
          Nueva Entrada
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Nueva Boleta de Recepción</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Productor</label>
                <select 
                  required
                  value={formData.producer_id}
                  onChange={e => setFormData({...formData, producer_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  <option value="">Seleccionar productor...</option>
                  {producers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.location}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Peso Bruto (kg)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={formData.weight_gross}
                    onChange={e => setFormData({...formData, weight_gross: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tara (kg)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={formData.weight_tare}
                    onChange={e => setFormData({...formData, weight_tare: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-colors">
                  Guardar y Generar Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <History size={20} className="text-slate-400" />
            Últimas Entradas
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por productor o folio..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Folio</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Productor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Peso Neto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map(batch => (
                <tr key={batch.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm font-bold text-brand-primary">#{batch.id.toString().padStart(5, '0')}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{batch.producer_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(batch.date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-slate-400" />
                      <span className="font-bold text-slate-900">{batch.weight_net.toLocaleString()} kg</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all">
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
