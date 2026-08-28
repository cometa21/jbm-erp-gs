import React, { useState, useEffect } from 'react';
import { POSProfitabilityData, POSUserRole } from '../../types';
import { 
  TrendingUp, DollarSign, PieChart as PieIcon, BarChart3, 
  ArrowUpRight, ShieldAlert, Sparkles, RefreshCw, Calculator,
  Sliders, Layers, Tag, Percent
} from 'lucide-react';

interface POSTabRentabilidadProps {
  currentRole: POSUserRole;
}

export const POSTabRentabilidad: React.FC<POSTabRentabilidadProps> = ({ currentRole }) => {
  const [data, setData] = useState<POSProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation Tool State
  const [simulatedPricePerKgDelta, setSimulatedPricePerKgDelta] = useState<number>(0);
  const [simulatedFreightCostDelta, setSimulatedFreightCostDelta] = useState<number>(0);

  const fetchProfitability = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/profitability');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching profitability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitability();
  }, []);

  if (currentRole !== 'admin') {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-200 m-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          La pestaña de Rentabilidad Ejecutiva está reservada exclusivamente para el rol de Administrador.
        </p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs">Calculando análisis de rentabilidad y márgenes...</p>
      </div>
    );
  }

  // Simulation Calculations
  const baseRevenue = data.totalGrossRevenue;
  const baseKg = data.totalKgSold || 1;
  const simRevenue = baseRevenue + (simulatedPricePerKgDelta * baseKg);
  const simFreight = data.totalFreightCost * (1 + simulatedFreightCostDelta / 100);
  const simTotalCost = data.totalFruitBaseCost + simFreight + data.totalLocalExpenses;
  const simNetProfit = simRevenue - simTotalCost;
  const simMarginPercent = simRevenue > 0 ? (simNetProfit / simRevenue) * 100 : 0;

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Módulo Ejecutivo (Solo Administrador)
            </span>
            <span className="text-xs text-slate-500">• Análisis de Utilidad & Retorno</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Rentabilidad Bodega CDMX</h1>
          <p className="text-xs text-slate-500">
            Cálculo consolidado de ingresos por venta en mostrador contra costo base de fruta Michoacán, flete de traslado y gastos locales.
          </p>
        </div>

        <button
          onClick={fetchProfitability}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalcular</span>
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Brutos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Ingresos Brutos</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${data.totalGrossRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {data.totalBoxesSold} cajas • {data.totalKgSold.toLocaleString('es-MX')} kg vendidos
          </div>
        </div>

        {/* Costo Total (Fruta + Flete + Gastos) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Costo Total Operativo</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${(data.totalCostOfGoods + data.totalLocalExpenses).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>Fruta: ${data.totalFruitBaseCost.toFixed(0)}</span>
            <span>Flete: ${data.totalFreightCost.toFixed(0)}</span>
          </div>
        </div>

        {/* Utilidad Neta Real */}
        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold uppercase text-emerald-300 mb-1 flex items-center justify-between">
            <span>Utilidad Neta Real</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            ${data.netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-200 mt-1 flex justify-between font-semibold">
            <span>Margen Neto: {data.netMarginPercent.toFixed(1)}%</span>
            <span>ROI: {data.roi.toFixed(1)}%</span>
          </div>
        </div>

        {/* Precio Promedio vs Costo por Kg */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Margen por Kilo</span>
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            +${(data.avgSalePricePerKg - data.avgCostPerKg).toFixed(2)}/kg
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>Venta: ${data.avgSalePricePerKg.toFixed(2)}/kg</span>
            <span>Costo: ${data.avgCostPerKg.toFixed(2)}/kg</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 7 cols: Calibre Profitability Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Rentabilidad por Calibre de Limón
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Precios mostrador vs Costo Michoacán</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="px-4 py-3">Calibre</th>
                  <th className="px-4 py-3 text-right">Kilos Vendidos</th>
                  <th className="px-4 py-3 text-right">Ingresos ($)</th>
                  <th className="px-4 py-3 text-right">Costo Fruta ($)</th>
                  <th className="px-4 py-3 text-right">Utilidad Bruta</th>
                  <th className="px-4 py-3 text-right">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(data.salesByCalibre || {}).map(([calibre, rawStats]) => {
                  const stats = rawStats as { revenue: number; kg: number; cost: number; profit: number };
                  const marginPct = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;

                  return (
                    <tr key={calibre} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        Calibre {calibre}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {stats.kg.toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        ${stats.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ${stats.cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        +${stats.profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {marginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT 5 cols: Expenses Breakdown & Simulation Tool */}
        <div className="lg:col-span-5 space-y-4">
          {/* Expenses Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-slate-500" />
              Estructura de Gastos Operativos CDMX
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {Object.entries(data.expensesByCategory || {}).map(([cat, rawAmt]) => {
                const amt = Number(rawAmt) || 0;
                const pct = data.totalLocalExpenses > 0 ? (amt / data.totalLocalExpenses) * 100 : 0;

                return (
                  <div key={cat} className="py-1.5 flex justify-between items-center">
                    <span className="text-slate-600">{cat}</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">${amt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Sensitivity / Profit Simulator */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Simulador de Sensibilidad de Margen
              </h3>
              <button
                onClick={() => { setSimulatedPricePerKgDelta(0); setSimulatedFreightCostDelta(0); }}
                className="text-[10px] text-slate-400 hover:text-white underline"
              >
                Restablecer
              </button>
            </div>

            {/* Slider 1: Price Delta */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Variación Precio Mostrador ($/kg):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {simulatedPricePerKgDelta >= 0 ? `+$${simulatedPricePerKgDelta.toFixed(2)}` : `-$${Math.abs(simulatedPricePerKgDelta).toFixed(2)}`} / kg
                </span>
              </div>
              <input
                type="range"
                min={-5}
                max={5}
                step={0.5}
                value={simulatedPricePerKgDelta}
                onChange={e => setSimulatedPricePerKgDelta(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Slider 2: Freight Cost Delta */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Variación Flete Michoacán-CDMX (%):</span>
                <span className="font-mono font-bold text-amber-400">
                  {simulatedFreightCostDelta >= 0 ? `+${simulatedFreightCostDelta}%` : `${simulatedFreightCostDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={5}
                value={simulatedFreightCostDelta}
                onChange={e => setSimulatedFreightCostDelta(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Simulated Projected Profit Result */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-xs space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Utilidad Neta Proyectada:</div>
              <div className="text-xl font-black font-mono text-emerald-400">
                ${simNetProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-700">
                <span>Margen Neto Proyectado:</span>
                <span className="font-bold text-emerald-300">{simMarginPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
