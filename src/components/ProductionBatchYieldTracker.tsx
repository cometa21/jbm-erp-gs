import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  Scale,
  Package,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  ArrowUpRight,
  Info,
  Calendar,
  Filter,
  CheckCircle,
  Warehouse,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';
import type { Batch, ProductionRecord, DiscardReportRow } from '../types';

interface ProductionBatchYieldTrackerProps {
  batches: Batch[];
  productionRuns: ProductionRecord[];
  discards: DiscardReportRow[];
  selectedBatchId: string;
  onSelectBatch: (batchId: string) => void;
}

export const ProductionBatchYieldTracker: React.FC<ProductionBatchYieldTrackerProps> = ({
  batches,
  productionRuns,
  discards,
  selectedBatchId,
  onSelectBatch
}) => {
  const [viewMode, setViewMode] = useState<'yield_percent' | 'weight_kg'>('yield_percent');
  const [activeTab, setActiveTab] = useState<'batch_detail' | 'multi_batch_comparison' | 'calibers'>('batch_detail');

  // Compute stats for all batches
  const batchAnalytics = useMemo(() => {
    return batches.map(batch => {
      const runs = productionRuns.filter(r => String(r.batch_id) === String(batch.id));
      const batchDiscards = discards.filter(d => String(d.batch_id) === String(batch.id));

      const inputWeightKg = Number(batch.weight_net || 0);

      // Color/Quality breakdown
      let verdeKg = 0;
      let alimonadoKg = 0;
      let amarilloKg = 0;
      let totalBoxes = 0;

      runs.forEach(r => {
        const kg = Number(r.weight_total_kg || 0);
        totalBoxes += Number(r.boxes_count || 0);
        if (r.color === 'verde' || r.calibre.startsWith('V-')) {
          verdeKg += kg;
        } else if (r.color === 'alimonado' || r.calibre.startsWith('AL-')) {
          alimonadoKg += kg;
        } else if (r.color === 'amarillo' || r.calibre.startsWith('AM-') || r.destination === 'molino') {
          amarilloKg += kg;
        } else {
          verdeKg += kg;
        }
      });

      const discardKg = batchDiscards.reduce((sum, d) => sum + Number(d.kg || 0), 0);
      const totalProcessedKg = verdeKg + alimonadoKg + amarilloKg + discardKg;
      const remainingKg = Math.max(0, inputWeightKg - totalProcessedKg);
      const progressPercent = inputWeightKg > 0 ? Math.min(100, (totalProcessedKg / inputWeightKg) * 100) : 0;

      const baseDenominator = totalProcessedKg > 0 ? totalProcessedKg : (inputWeightKg > 0 ? inputWeightKg : 1);
      const yieldVerdePct = Number(((verdeKg / baseDenominator) * 100).toFixed(1));
      const yieldAlimonadoPct = Number(((alimonadoKg / baseDenominator) * 100).toFixed(1));
      const yieldAmarilloPct = Number(((amarilloKg / baseDenominator) * 100).toFixed(1));
      const yieldDiscardPct = Number(((discardKg / baseDenominator) * 100).toFixed(1));

      // Benchmark compliance status
      let yieldGrade: 'excelente' | 'bueno' | 'regular' | 'critico' = 'bueno';
      if (yieldVerdePct >= 70) yieldGrade = 'excelente';
      else if (yieldVerdePct >= 55) yieldGrade = 'bueno';
      else if (yieldVerdePct >= 40) yieldGrade = 'regular';
      else yieldGrade = 'critico';

      return {
        batch,
        batchId: batch.id,
        folio: batch.folio || `REC-${batch.id}`,
        producerName: batch.producer_name,
        orchard: batch.orchard,
        date: batch.date,
        inputWeightKg,
        verdeKg,
        alimonadoKg,
        amarilloKg,
        discardKg,
        totalProcessedKg,
        remainingKg,
        totalBoxes,
        progressPercent,
        yieldVerdePct,
        yieldAlimonadoPct,
        yieldAmarilloPct,
        yieldDiscardPct,
        yieldGrade,
        status: remainingKg <= 10 ? 'completado' : progressPercent > 0 ? 'en_clasificacion' : 'en_espera'
      };
    });
  }, [batches, productionRuns, discards]);

  // Current active analyzed batch
  const currentBatchStats = useMemo(() => {
    if (!selectedBatchId && batchAnalytics.length > 0) {
      return batchAnalytics[0];
    }
    return batchAnalytics.find(b => String(b.batchId) === String(selectedBatchId)) || batchAnalytics[0];
  }, [batchAnalytics, selectedBatchId]);

  // Caliber level yield breakdown for active batch
  const caliberBreakdown = useMemo(() => {
    if (!currentBatchStats) return [];
    const runs = productionRuns.filter(r => String(r.batch_id) === String(currentBatchStats.batchId));
    
    const calibersMap: Record<string, { calibre: string; color: string; boxes: number; kg: number; quality: string }> = {};

    runs.forEach(r => {
      const cal = r.calibre || 'V-X';
      if (!calibersMap[cal]) {
        calibersMap[cal] = {
          calibre: cal,
          color: r.color || (cal.startsWith('V-') ? 'verde' : cal.startsWith('AL-') ? 'alimonado' : 'amarillo'),
          boxes: 0,
          kg: 0,
          quality: r.quality || 'primera'
        };
      }
      calibersMap[cal].boxes += Number(r.boxes_count || 0);
      calibersMap[cal].kg += Number(r.weight_total_kg || 0);
    });

    return Object.values(calibersMap).map(item => {
      const pct = currentBatchStats.inputWeightKg > 0 
        ? Number(((item.kg / currentBatchStats.inputWeightKg) * 100).toFixed(1)) 
        : 0;
      return {
        ...item,
        percentage: pct,
        fillColor: item.color === 'verde' ? '#059669' : item.color === 'alimonado' ? '#84cc16' : '#d97706'
      };
    }).sort((a, b) => b.kg - a.kg);
  }, [currentBatchStats, productionRuns]);

  // Recharts yield distribution data for active batch
  const yieldChartData = useMemo(() => {
    if (!currentBatchStats) return [];

    return [
      {
        categoria: '🟢 Exportación 1ra (Verde)',
        shortLabel: 'Exportación 1ra',
        actualPct: currentBatchStats.yieldVerdePct,
        targetPct: 70.0,
        kg: currentBatchStats.verdeKg,
        boxes: Math.round(currentBatchStats.verdeKg / 18.14),
        fill: '#059669',
        targetColor: '#047857'
      },
      {
        categoria: '🟡 Nacional 2da (Alimonado)',
        shortLabel: 'Nacional 2da',
        actualPct: currentBatchStats.yieldAlimonadoPct,
        targetPct: 20.0,
        kg: currentBatchStats.alimonadoKg,
        boxes: Math.round(currentBatchStats.alimonadoKg / 15.0),
        fill: '#84cc16',
        targetColor: '#65a30d'
      },
      {
        categoria: '🟠 Industria / Molino (Amarillo)',
        shortLabel: 'Molino Industrial',
        actualPct: currentBatchStats.yieldAmarilloPct,
        targetPct: 7.0,
        kg: currentBatchStats.amarilloKg,
        boxes: 0,
        fill: '#d97706',
        targetColor: '#b45309'
      },
      {
        categoria: '🔴 Merma / Descarte Calidad',
        shortLabel: 'Descarte / Merma',
        actualPct: currentBatchStats.yieldDiscardPct,
        targetPct: 3.0,
        kg: currentBatchStats.discardKg,
        boxes: 0,
        fill: '#e11d48',
        targetColor: '#be123c'
      }
    ];
  }, [currentBatchStats]);

  // Multi-batch comparative chart data
  const multiBatchChartData = useMemo(() => {
    return batchAnalytics.slice(0, 8).map(b => ({
      folio: b.folio,
      producer: b.producerName.split(' ')[0] || b.producerName,
      inputKg: b.inputWeightKg,
      verdePct: b.yieldVerdePct,
      alimonadoPct: b.yieldAlimonadoPct,
      amarilloPct: b.yieldAmarilloPct,
      discardPct: b.yieldDiscardPct,
      progressPct: Number(b.progressPercent.toFixed(1)),
      totalKg: b.totalProcessedKg
    }));
  }, [batchAnalytics]);

  if (!currentBatchStats) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header with Batch Selector & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Monitoreo de Rendimiento & Desglose de Clasificación
            </span>
            <span className="text-[11px] font-bold text-slate-400">• Recharts Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="text-emerald-700 w-6 h-6" />
            Control de Rendimiento & Avance de Lotes Activos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Balance visual en tiempo real de porcentaje de aprovechamiento por calidad (Exportación, Nacional, Molino y Merma).
          </p>
        </div>

        {/* Action / Selector Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Batch Selector Dropdown */}
          <div className="relative min-w-[220px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Lote Seleccionado:
            </label>
            <div className="relative">
              <select
                value={currentBatchStats.batchId}
                onChange={(e) => onSelectBatch(e.target.value)}
                className="w-full h-10 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 pr-8 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {batchAnalytics.map(b => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.folio} • {b.producerName} ({b.progressPercent.toFixed(0)}% listo - {b.yieldVerdePct}% Export)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab View Mode */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Vista Analítica:
            </label>
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActiveTab('batch_detail')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'batch_detail'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rendimiento Lote
              </button>
              <button
                onClick={() => setActiveTab('multi_batch_comparison')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'multi_batch_comparison'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Comparativo ({batchAnalytics.length} Lotes)
              </button>
              <button
                onClick={() => setActiveTab('calibers')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'calibers'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Calibre
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards for Active Batch */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Entrada Báscula */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Entrada Báscula</span>
          <span className="text-lg font-black text-slate-900 font-mono">
            {currentBatchStats.inputWeightKg.toLocaleString()} kg
          </span>
          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
            {currentBatchStats.producerName.split(' ')[0]} • {currentBatchStats.orchard}
          </span>
        </div>

        {/* Card 2: Procesado Total */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Procesado en Línea</span>
          <span className="text-lg font-black text-blue-700 font-mono">
            {currentBatchStats.totalProcessedKg.toLocaleString()} kg
          </span>
          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
            {currentBatchStats.totalBoxes} cajas producidas
          </span>
        </div>

        {/* Card 3: Avance del Lote */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Avance de Clasificación</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-slate-900 font-mono">
              {currentBatchStats.progressPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${currentBatchStats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Card 4: Rendimiento Exportación Verde */}
        <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">🟢 Rendimiento Export</span>
          <span className="text-lg font-black text-emerald-900 font-mono">
            {currentBatchStats.yieldVerdePct}%
          </span>
          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
            {currentBatchStats.verdeKg.toLocaleString()} kg • Meta 70%
          </span>
        </div>

        {/* Card 5: Nacional Alimonado */}
        <div className="bg-lime-50/80 p-3.5 rounded-2xl border border-lime-200">
          <span className="text-[10px] font-black uppercase text-lime-800 tracking-wider block">🟡 Mercado Nacional</span>
          <span className="text-lg font-black text-lime-900 font-mono">
            {currentBatchStats.yieldAlimonadoPct}%
          </span>
          <span className="text-[10px] font-bold text-lime-700 block mt-0.5">
            {currentBatchStats.alimonadoKg.toLocaleString()} kg
          </span>
        </div>

        {/* Card 6: Merma / Descarte */}
        <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200">
          <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">🔴 Merma / Calidad</span>
          <span className="text-lg font-black text-rose-900 font-mono">
            {currentBatchStats.yieldDiscardPct}%
          </span>
          <span className="text-[10px] font-bold text-rose-700 block mt-0.5">
            {currentBatchStats.discardKg.toLocaleString()} kg descarte
          </span>
        </div>
      </div>

      {/* Main Charts Area */}
      {activeTab === 'batch_detail' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recharts Yield vs Benchmark Chart (7 cols) */}
            <div className="lg:col-span-7 bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="text-emerald-700 w-4 h-4" />
                    Rendimiento Real vs Meta de Empaque ({currentBatchStats.folio})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Comparación del porcentaje obtenido contra el estándar de calidad JBM Cítricos
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                  <button
                    onClick={() => setViewMode('yield_percent')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'yield_percent' ? 'bg-emerald-700 text-white' : 'text-slate-500'}`}
                  >
                    % Rendimiento
                  </button>
                  <button
                    onClick={() => setViewMode('weight_kg')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'weight_kg' ? 'bg-emerald-700 text-white' : 'text-slate-500'}`}
                  >
                    Kilos (kg)
                  </button>
                </div>
              </div>

              {/* Recharts Composed Chart */}
              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={yieldChartData} margin={{ top: 15, right: 15, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="shortLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                      dy={6}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => viewMode === 'yield_percent' ? `${val}%` : `${(val / 1000).toFixed(1)}k`}
                      dx={-5}
                    />
                    <Tooltip content={<CustomYieldTooltip viewMode={viewMode} />} />
                    <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    
                    <Bar 
                      name={viewMode === 'yield_percent' ? 'Rendimiento Obtenido (%)' : 'Kilos Clasificados (kg)'} 
                      dataKey={viewMode === 'yield_percent' ? 'actualPct' : 'kg'} 
                      radius={[6, 6, 0, 0]}
                      barSize={36}
                    >
                      {yieldChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>

                    {viewMode === 'yield_percent' && (
                      <Line 
                        type="monotone" 
                        name="Meta Estándar JBM (%)" 
                        dataKey="targetPct" 
                        stroke="#0f172a" 
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={{ r: 5, fill: '#0f172a' }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Yield summary text */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-center">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Exportación 1ra</span>
                  <span className="text-xs font-black text-emerald-800">{currentBatchStats.yieldVerdePct}% ({currentBatchStats.verdeKg.toFixed(0)} kg)</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Nacional 2da</span>
                  <span className="text-xs font-black text-lime-800">{currentBatchStats.yieldAlimonadoPct}% ({currentBatchStats.alimonadoKg.toFixed(0)} kg)</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Molino / Jugos</span>
                  <span className="text-xs font-black text-amber-800">{currentBatchStats.yieldAmarilloPct}% ({currentBatchStats.amarilloKg.toFixed(0)} kg)</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Merma Auditada</span>
                  <span className="text-xs font-black text-rose-800">{currentBatchStats.yieldDiscardPct}% ({currentBatchStats.discardKg.toFixed(0)} kg)</span>
                </div>
              </div>
            </div>

            {/* Right: Balance & Status Card (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Scale className="text-emerald-700 w-4 h-4" />
                    Balance de Masa del Lote: {currentBatchStats.folio}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    currentBatchStats.yieldGrade === 'excelente' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                    currentBatchStats.yieldGrade === 'bueno' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                    'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    Grado: {currentBatchStats.yieldGrade}
                  </span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  {/* Progress Stack Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Aprovechamiento de Fruta:</span>
                      <span className="font-mono text-emerald-800 font-black">{currentBatchStats.progressPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                      <div 
                        title={`Exportación: ${currentBatchStats.yieldVerdePct}%`}
                        style={{ width: `${currentBatchStats.yieldVerdePct * (currentBatchStats.progressPercent / 100)}%` }} 
                        className="bg-emerald-600 h-full"
                      />
                      <div 
                        title={`Nacional: ${currentBatchStats.yieldAlimonadoPct}%`}
                        style={{ width: `${currentBatchStats.yieldAlimonadoPct * (currentBatchStats.progressPercent / 100)}%` }} 
                        className="bg-lime-500 h-full"
                      />
                      <div 
                        title={`Molino: ${currentBatchStats.yieldAmarilloPct}%`}
                        style={{ width: `${currentBatchStats.yieldAmarilloPct * (currentBatchStats.progressPercent / 100)}%` }} 
                        className="bg-amber-500 h-full"
                      />
                      <div 
                        title={`Merma: ${currentBatchStats.yieldDiscardPct}%`}
                        style={{ width: `${currentBatchStats.yieldDiscardPct * (currentBatchStats.progressPercent / 100)}%` }} 
                        className="bg-rose-500 h-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                      <span>Tolva Inicial: {currentBatchStats.inputWeightKg.toLocaleString()} kg</span>
                      <span>Pendiente: {currentBatchStats.remainingKg.toFixed(0)} kg</span>
                    </div>
                  </div>

                  {/* Operational Metrics Checklist */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Productor & Huerto:</span>
                      <span className="font-bold text-slate-800 text-right">{currentBatchStats.producerName} ({currentBatchStats.orchard})</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Fecha de Entrada Báscula:</span>
                      <span className="font-mono font-bold text-slate-800">{new Date(currentBatchStats.date).toLocaleDateString('es-MX')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Cajas Producidas:</span>
                      <span className="font-mono font-bold text-emerald-700">{currentBatchStats.totalBoxes} cajas</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Factor de Conversión:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currentBatchStats.totalProcessedKg > 0 ? (currentBatchStats.totalBoxes / (currentBatchStats.totalProcessedKg / 1000)).toFixed(1) : '54.0'} cjs / Ton
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance banner */}
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                currentBatchStats.yieldVerdePct >= 70 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' :
                currentBatchStats.yieldVerdePct >= 55 ? 'bg-blue-50 text-blue-900 border border-blue-200' :
                'bg-amber-50 text-amber-900 border border-amber-200'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0 text-current" />
                <span className="font-semibold">
                  {currentBatchStats.yieldVerdePct >= 70 ? 'Lote de Calidad Superior (Rendimiento verde supera el 70% meta de exportación).' :
                   currentBatchStats.yieldVerdePct >= 55 ? 'Lote Aceptable dentro de los parámetros comerciales para empaque mixto.' :
                   'Alerta de calidad: Alto porcentaje de fruta alimonada/amarilla para canal industrial.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Batch Comparative View */}
      {activeTab === 'multi_batch_comparison' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="text-emerald-700 w-4 h-4" />
              Comparativo de Rendimiento de Lotes Activos (Exportación vs Nacional vs Merma)
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Visualización apilada por lote</span>
          </div>

          <div className="h-[320px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiBatchChartData} margin={{ top: 10, right: 15, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="folio" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  dy={6}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val}%`}
                  domain={[0, 100]}
                  dx={-5}
                />
                <Tooltip content={<CustomMultiBatchTooltip />} />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                
                <Bar name="🟢 Exportación Verde (%)" dataKey="verdePct" stackId="a" fill="#059669" />
                <Bar name="🟡 Nacional Alimonado (%)" dataKey="alimonadoPct" stackId="a" fill="#84cc16" />
                <Bar name="🟠 Molino Industrial (%)" dataKey="amarilloPct" stackId="a" fill="#d97706" />
                <Bar name="🔴 Merma / Descarte (%)" dataKey="discardPct" stackId="a" fill="#e11d48" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table of Batches */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-black uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Boleta Lote</th>
                  <th className="p-3">Productor / Huerto</th>
                  <th className="p-3 text-right">Peso Entrada (kg)</th>
                  <th className="p-3 text-right">🟢 Export %</th>
                  <th className="p-3 text-right">🟡 Nac %</th>
                  <th className="p-3 text-right">🟠 Molino %</th>
                  <th className="p-3 text-right">🔴 Merma %</th>
                  <th className="p-3 text-center">Avance</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchAnalytics.map(b => (
                  <tr 
                    key={b.batchId} 
                    className={`hover:bg-slate-50 transition-colors ${String(b.batchId) === String(selectedBatchId) ? 'bg-emerald-50/60 font-semibold' : ''}`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{b.folio}</td>
                    <td className="p-3 text-slate-700">{b.producerName} <span className="text-[10px] text-slate-400">({b.orchard})</span></td>
                    <td className="p-3 text-right font-mono text-slate-900">{b.inputWeightKg.toLocaleString()} kg</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{b.yieldVerdePct}%</td>
                    <td className="p-3 text-right font-mono text-lime-700">{b.yieldAlimonadoPct}%</td>
                    <td className="p-3 text-right font-mono text-amber-700">{b.yieldAmarilloPct}%</td>
                    <td className="p-3 text-right font-mono text-rose-700">{b.yieldDiscardPct}%</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {b.progressPercent.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectBatch(String(b.batchId))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                      >
                        Analizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calibers Breakdown View */}
      {activeTab === 'calibers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package className="text-emerald-700 w-4 h-4" />
              Distribución por Calibre de Empaque (Lote {currentBatchStats.folio})
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{caliberBreakdown.length} calibres procesados</span>
          </div>

          {caliberBreakdown.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Aún no hay registros de calibres clasificados para este lote. Registre empaques en el formulario.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chart */}
              <div className="lg:col-span-7 bg-slate-50/60 p-4 rounded-2xl border border-slate-200 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caliberBreakdown} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="calibre" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      dx={-5}
                    />
                    <Tooltip content={<CustomCaliberTooltip />} />
                    <Bar dataKey="kg" name="Kilos Clasificados (kg)" radius={[6, 6, 0, 0]} barSize={32}>
                      {caliberBreakdown.map((entry, index) => (
                        <Cell key={`cal-cell-${index}`} fill={entry.fillColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="lg:col-span-5 border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-black uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Calibre</th>
                      <th className="p-2.5 text-right">Cajas</th>
                      <th className="p-2.5 text-right">Kilos</th>
                      <th className="p-2.5 text-right">% Lote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caliberBreakdown.map(item => (
                      <tr key={item.calibre} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fillColor }} />
                          {item.calibre} ({item.color})
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">{item.boxes}</td>
                        <td className="p-2.5 text-right font-mono text-slate-900">{item.kg.toLocaleString()} kg</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Tooltip for Yield Chart
function CustomYieldTooltip({ active, payload, viewMode }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 min-w-[180px]">
        <div className="font-bold border-b border-slate-800 pb-1 text-slate-200">{data.categoria}</div>
        <div className="pt-1 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span className="font-sans">Rendimiento Real:</span>
            <span className="font-bold text-emerald-400">{data.actualPct}%</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans">Meta Estándar:</span>
            <span className="font-bold text-slate-100">{data.targetPct}%</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans">Kilos Clasificados:</span>
            <span className="font-bold text-amber-400">{data.kg.toLocaleString()} kg</span>
          </div>
          {data.boxes > 0 && (
            <div className="flex justify-between text-slate-300">
              <span className="font-sans">Cajas Aprox:</span>
              <span className="font-bold text-blue-400">{data.boxes} cjs</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// Tooltip for Multi-Batch Stacked Chart
function CustomMultiBatchTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 min-w-[200px]">
        <div className="font-bold border-b border-slate-800 pb-1 flex justify-between">
          <span>{data.folio}</span>
          <span className="text-emerald-400 font-mono">{data.producer}</span>
        </div>
        <div className="pt-1 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-emerald-400">
            <span className="font-sans">🟢 Exportación Verde:</span>
            <span>{data.verdePct}%</span>
          </div>
          <div className="flex justify-between text-lime-400">
            <span className="font-sans">🟡 Nacional Alimonado:</span>
            <span>{data.alimonadoPct}%</span>
          </div>
          <div className="flex justify-between text-amber-400">
            <span className="font-sans">🟠 Molino Industrial:</span>
            <span>{data.amarilloPct}%</span>
          </div>
          <div className="flex justify-between text-rose-400">
            <span className="font-sans">🔴 Merma / Descarte:</span>
            <span>{data.discardPct}%</span>
          </div>
          <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
            <span className="font-sans">Peso Entrada:</span>
            <span className="text-white font-bold">{data.inputKg.toLocaleString()} kg</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Tooltip for Caliber BarChart
function CustomCaliberTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
        <div className="font-bold border-b border-slate-800 pb-1 text-slate-200">
          Calibre {data.calibre} ({data.color.toUpperCase()})
        </div>
        <div className="pt-1 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-slate-300">
            <span className="font-sans">Kilos Empacados:</span>
            <span className="font-bold text-emerald-400">{data.kg.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span className="font-sans">Cajas Registradas:</span>
            <span className="font-bold text-blue-400">{data.boxes} cjs</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span className="font-sans">% del Lote:</span>
            <span className="font-bold text-amber-400">{data.percentage}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
