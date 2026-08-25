import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Thermometer, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import type { DashboardStats } from '../types';

const data = [
  { name: 'Lun', kilos: 12000 },
  { name: 'Mar', kilos: 19000 },
  { name: 'Mie', kilos: 15000 },
  { name: 'Jue', kilos: 22000 },
  { name: 'Vie', kilos: 30000 },
  { name: 'Sab', kilos: 25000 },
  { name: 'Dom', kilos: 10000 },
];

export function Dashboard() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);

  React.useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="p-8">Cargando dashboard...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Control</h1>
          <p className="text-slate-500">Resumen operativo de JBM Cítricos Premium</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Fecha Actual</p>
          <p className="text-lg font-bold">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Kilos Recibidos', value: stats.kilosReceived.toLocaleString(), unit: 'kg', icon: TrendingUp, color: 'emerald', trend: '+12%' },
          { label: 'Cajas Empacadas', value: stats.boxesPacked.toLocaleString(), unit: 'pzas', icon: Package, color: 'amber', trend: '+5%' },
          { label: 'Stock Cámara', value: stats.coldStorageStock, unit: 'pallets', icon: Thermometer, color: 'blue', trend: '-2%' },
          { label: 'Stock Molino', value: stats.millStock, unit: 'tons', icon: Info, color: 'slate', trend: 'Estable' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600`}>
                <kpi.icon size={24} />
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                kpi.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : 
                kpi.trend.startsWith('-') ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
              )}>
                {kpi.trend.startsWith('+') ? <ArrowUpRight size={12} /> : 
                 kpi.trend.startsWith('-') ? <ArrowDownRight size={12} /> : null}
                {kpi.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
                <span className="text-sm text-slate-400 font-medium">{kpi.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6">Recepción Semanal</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="kilos" fill="#15803d" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6">Alertas del Sistema</h3>
          <div className="space-y-4">
            {stats.alerts.map(alert => (
              <div key={alert.id} className={cn(
                "p-4 rounded-xl border flex gap-3",
                alert.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-800" : "bg-blue-50 border-blue-100 text-blue-800"
              )}>
                {alert.type === 'warning' ? <AlertCircle className="shrink-0" size={20} /> : <Info className="shrink-0" size={20} />}
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ))}
            <button className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
