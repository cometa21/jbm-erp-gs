import React, { useState, useMemo } from 'react';
import {
  Package,
  Layers,
  Tag,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  ShoppingCart,
  Factory,
  Info,
  Check,
  Scale
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface SuppliesProductionSimulatorProps {
  items: InventoryItem[];
  onOpenPurchaseOrder: () => void;
  onRefreshData: () => void;
}

const PRESENTACIONES_SIMULADOR = [
  { 
    id: 'caja_18kg', 
    name: 'Caja JBM Export 18.14 kg (40 lbs)', 
    weight_kg: 18.14, 
    boxes_per_pallet: 54,
    box_search: '18.14',
    label_search: '4048',
    requires_wax: true,
    requires_paper: true,
    desc: 'Exportación USDA / EU en cartón corrugado de alta resistencia'
  },
  { 
    id: 'caja_15kg', 
    name: 'Caja Exportación 15 kg Master', 
    weight_kg: 15.0, 
    boxes_per_pallet: 60,
    box_search: '15 kg',
    label_search: '4045',
    requires_wax: true,
    requires_paper: false,
    desc: 'Empaque estándar para autoservicios y exportación'
  },
  { 
    id: 'caja_20kg', 
    name: 'Caja Nacional 20 kg Madera/Plástico', 
    weight_kg: 20.0, 
    boxes_per_pallet: 48,
    box_search: '20 kg',
    label_search: 'PLU',
    requires_wax: false,
    requires_paper: false,
    desc: 'Mercado nacional y Centrales de Abasto'
  },
  { 
    id: 'arpilla_25kg', 
    name: 'Arpilla Malla Polietileno 25 kg', 
    weight_kg: 25.0, 
    boxes_per_pallet: 40,
    box_search: 'Arpilla',
    label_search: 'QR',
    requires_wax: false,
    requires_paper: false,
    desc: 'Comercialización a granel en malla tejida'
  },
];

export function SuppliesProductionSimulator({
  items,
  onOpenPurchaseOrder,
  onRefreshData
}: SuppliesProductionSimulatorProps) {
  const [selectedPresId, setSelectedPresId] = useState<string>('caja_18kg');
  const [targetBoxes, setTargetBoxes] = useState<number>(500);
  const [isApplyingDeduction, setIsApplyingDeduction] = useState(false);
  const [deductionFeedback, setDeductionFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const selectedPres = useMemo(() => {
    return PRESENTACIONES_SIMULADOR.find(p => p.id === selectedPresId) || PRESENTACIONES_SIMULADOR[0];
  }, [selectedPresId]);

  // Find corresponding inventory items in stock
  const bomCalculations = useMemo(() => {
    const boxes = Math.max(0, targetBoxes);
    const totalFruitKg = boxes * selectedPres.weight_kg;
    const palletsNeeded = boxes > 0 ? Math.ceil(boxes / selectedPres.boxes_per_pallet) : 0;
    const cornerProtectors = palletsNeeded * 4;
    const strappingSeals = palletsNeeded * 4;
    const labelsNeeded = boxes;
    const litersWax = selectedPres.requires_wax ? Number(((totalFruitKg / 1000) * 0.5).toFixed(2)) : 0;
    const paperSheets = selectedPres.requires_paper ? boxes : 0;

    // Helper to find item
    const findItem = (terms: string[]) => {
      return items.find(i => 
        terms.some(t => 
          i.item_name.toLowerCase().includes(t.toLowerCase()) || 
          (i.category && i.category.toLowerCase().includes(t.toLowerCase()))
        )
      );
    };

    const boxItem = findItem([selectedPres.box_search, 'caja']);
    const labelItem = findItem([selectedPres.label_search, 'etiqueta', 'plu']);
    const palletItem = findItem(['pallet', 'tarima']);
    const cornerItem = findItem(['esquinero']);
    const sealsItem = findItem(['grapas', 'fleje']);
    const waxItem = findItem(['cera']);
    const paperItem = findItem(['papel']);

    const calculateItemStatus = (invItem: InventoryItem | undefined, required: number, unitLabel: string) => {
      const currentStock = invItem ? invItem.quantity : 0;
      const deficit = Math.max(0, required - currentStock);
      const remainingStock = Math.max(0, currentStock - required);
      const status: 'ok' | 'warning' | 'critical' = 
        !invItem ? 'critical' :
        currentStock < required ? 'critical' :
        (currentStock - required) <= (invItem.min_stock || 100) ? 'warning' : 'ok';

      // Max boxes possible with current stock
      const maxBoxesFromThis = invItem && required > 0 ? Math.floor((currentStock / (required / boxes))) : 999999;

      return {
        item: invItem,
        required,
        currentStock,
        remainingStock,
        deficit,
        status,
        unit: invItem?.unit || unitLabel,
        maxBoxesPossible: maxBoxesFromThis
      };
    };

    const waxRequiredDisplay = waxItem && waxItem.unit.toLowerCase().includes('tambo') 
      ? Number((litersWax / 200).toFixed(3)) 
      : litersWax;

    const materials = [
      {
        name: `Envase / ${selectedPres.name.split('(')[0].trim()}`,
        icon: Package,
        calc: calculateItemStatus(boxItem, boxes, 'pzas'),
        isCrucial: true
      },
      {
        name: 'Etiquetas de Calibre / PLU & Trazabilidad',
        icon: Tag,
        calc: calculateItemStatus(labelItem, labelsNeeded, 'pzas'),
        isCrucial: true
      },
      {
        name: 'Tarimas de Madera Tratada HT (NIMF-15)',
        icon: Layers,
        calc: calculateItemStatus(palletItem, palletsNeeded, 'tarimas'),
        isCrucial: true
      },
      {
        name: 'Esquineros de Cartón Reforzado 2.0m',
        icon: ShieldCheck,
        calc: calculateItemStatus(cornerItem, cornerProtectors, 'pzas'),
        isCrucial: false
      },
      {
        name: 'Grapas Metálicas / Sellos de Fleje',
        icon: ShieldCheck,
        calc: calculateItemStatus(sealsItem, strappingSeals, 'pzas'),
        isCrucial: false
      },
      ...(selectedPres.requires_wax ? [{
        name: 'Cera Cítrica Carnauba Grado Alimento',
        icon: Sparkles,
        calc: calculateItemStatus(waxItem, waxRequiredDisplay, waxItem?.unit || 'litros'),
        isCrucial: false
      }] : []),
      ...(selectedPres.requires_paper ? [{
        name: 'Papel Encerado Microperforado 30x30 cm',
        icon: Package,
        calc: calculateItemStatus(paperItem, paperSheets, 'pliegos'),
        isCrucial: false
      }] : [])
    ];

    // Overall bottleneck and capacity
    const bottlenecks = materials
      .filter(m => m.calc.item)
      .map(m => ({ name: m.name, maxBoxes: m.calc.maxBoxesPossible }));
    
    const minBottleneck = bottlenecks.length > 0
      ? bottlenecks.reduce((min, b) => b.maxBoxes < min.maxBoxes ? b : min, bottlenecks[0])
      : { name: 'Sin datos', maxBoxes: 0 };

    const hasCriticalDeficit = materials.some(m => m.calc.status === 'critical');
    const hasWarningDeficit = materials.some(m => m.calc.status === 'warning');

    const totalEstimatedCost = materials.reduce((sum, m) => {
      const costU = m.calc.item?.cost_unit || 0;
      return sum + (m.calc.required * costU);
    }, 0);

    return {
      totalFruitKg,
      palletsNeeded,
      materials,
      bottlenecks,
      minBottleneck,
      hasCriticalDeficit,
      hasWarningDeficit,
      totalEstimatedCost
    };
  }, [items, selectedPres, targetBoxes]);

  // Fast preset quantity buttons
  const presetQuantities = [150, 300, 500, 800, 1080, 1500];

  // Apply manual direct deduction from warehouse
  const handleDirectDeduction = async () => {
    if (targetBoxes <= 0) return;
    if (!window.confirm(`¿Confirmas descontar de almacén los insumos requeridos para ${targetBoxes} cajas (${selectedPres.name})?`)) {
      return;
    }

    setIsApplyingDeduction(true);
    setDeductionFeedback(null);
    try {
      // Loop each material and deduct
      const results: string[] = [];
      for (const mat of bomCalculations.materials) {
        if (mat.calc.item && mat.calc.required > 0) {
          const res = await fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: mat.calc.item.id,
              delta: -mat.calc.required,
              type: 'Salida',
              reason: `Consumo Directo Simulado: ${targetBoxes} Cajas de ${selectedPres.name}`,
              user: 'Línea de Empaque JBM'
            })
          });
          if (res.ok) {
            results.push(`${mat.calc.item.item_name} (-${mat.calc.required})`);
          }
        }
      }

      setDeductionFeedback({
        success: true,
        message: `Se descontaron exitosamente los insumos para ${targetBoxes} cajas en almacén.`
      });
      onRefreshData();
    } catch (err: any) {
      setDeductionFeedback({
        success: false,
        message: err.message || 'Error al aplicar el descuento de insumos.'
      });
    } finally {
      setIsApplyingDeduction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              <Factory size={14} />
              <span>Simulador de Consumo BOM (Bill of Materials)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Cálculo & Proyección de Descuento de Insumos por Producción
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Calcula al instante el volumen exacto de cajas de cartón, etiquetas, tarimas, esquineros y cera que consumirá tu corrida de empaque, y verifica si tu stock actual es suficiente para cumplir el pedido.
            </p>
          </div>

          {/* Quick Metric: Capacity */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-center sm:text-right shrink-0">
            <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider block">
              Capacidad Máxima con Stock Actual
            </span>
            <div className="text-3xl font-black font-mono text-white tracking-tight mt-0.5">
              {bomCalculations.minBottleneck.maxBoxes.toLocaleString('es-MX')} <span className="text-xs font-bold text-emerald-200 uppercase">Cajas</span>
            </div>
            <span className="text-[11px] text-slate-300 block mt-0.5">
              Cuello de botella: <strong className="text-amber-300">{bomCalculations.minBottleneck.name.split('/')[0]}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {deductionFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
          deductionFeedback.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {deductionFeedback.success ? <CheckCircle2 size={20} className="text-emerald-700" /> : <AlertTriangle size={20} className="text-rose-700" />}
            <span className="text-xs font-bold">{deductionFeedback.message}</span>
          </div>
          <button 
            onClick={() => setDeductionFeedback(null)}
            className="text-xs font-black underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Target Configuration */}
        <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders size={18} className="text-emerald-700" />
            <h3 className="text-base font-black text-slate-900">Parámetros de Empaque</h3>
          </div>

          {/* 1. Presentation Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
              1. Presentación / Tipo de Caja
            </label>
            <div className="space-y-2">
              {PRESENTACIONES_SIMULADOR.map((p) => {
                const isSelected = selectedPresId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPresId(p.id)}
                    className={`w-full p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {p.name}
                      </span>
                      {isSelected && <Check size={16} className="text-emerald-700 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600 font-bold mt-1.5 pt-1.5 border-t border-slate-200/60">
                      <span>⚖️ {p.weight_kg} kg/caja</span>
                      <span>🪵 {p.boxes_per_pallet} cajas/tarima</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Target Box Count */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                2. Volumen a Empacar
              </label>
              <span className="text-xs font-mono font-bold text-slate-500">
                Total Fruta: <strong>{bomCalculations.totalFruitKg.toLocaleString('es-MX')} kg</strong>
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                value={targetBoxes}
                onChange={(e) => setTargetBoxes(Math.max(0, parseInt(e.target.value) || 0))}
                min="1"
                step="10"
                className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 text-2xl font-mono font-black text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none text-center"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-slate-400">
                Cajas
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {presetQuantities.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setTargetBoxes(qty)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                    targetBoxes === qty
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tarimas Calculadas:</span>
              <strong className="font-mono text-slate-900">{bomCalculations.palletsNeeded} tarimas ({selectedPres.boxes_per_pallet} c/u)</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Costo Estimado Insumos:</span>
              <strong className="font-mono text-emerald-800">${bomCalculations.totalEstimatedCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Costo Insumos / Caja:</span>
              <strong className="font-mono text-slate-900">
                ${targetBoxes > 0 ? (bomCalculations.totalEstimatedCost / targetBoxes).toFixed(2) : '0.00'} MXN
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column: Live BOM Recipe & Stock Impact Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Package size={18} className="text-emerald-700" />
                  <span>Desglose de Insumos Requeridos vs. Stock Real</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Proyección de consumo para <strong>{targetBoxes.toLocaleString('es-MX')} cajas</strong> de {selectedPres.name}
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {bomCalculations.hasCriticalDeficit ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span>⚠️ Desabasto de Insumos</span>
                  </div>
                ) : bomCalculations.hasWarningDeficit ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>🟡 Stock al Límite</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-black">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>🟢 Stock Suficiente</span>
                  </div>
                )}
              </div>
            </div>

            {/* Materials Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 rounded-l-xl">Material de Empaque</th>
                    <th className="py-3 px-2 text-right">A Consumir</th>
                    <th className="py-3 px-2 text-right">Stock Actual</th>
                    <th className="py-3 px-2 text-right">Stock Proyectado</th>
                    <th className="py-3 px-3 text-center rounded-r-xl">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bomCalculations.materials.map((mat, idx) => {
                    const { required, currentStock, remainingStock, deficit, status, unit } = mat.calc;
                    const Icon = mat.icon;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              status === 'critical' ? 'bg-rose-100 text-rose-700' :
                              status === 'warning' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">
                                {mat.name}
                              </span>
                              {mat.calc.item && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {mat.calc.item.item_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-black text-rose-700 text-sm">
                          -{required.toLocaleString('es-MX')} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-700 text-xs">
                          {currentStock.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400">{unit}</span>
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-black text-xs">
                          <span className={status === 'critical' ? 'text-rose-700' : status === 'warning' ? 'text-amber-700' : 'text-slate-900'}>
                            {remainingStock.toLocaleString('es-MX')} {unit}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {status === 'critical' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] uppercase">
                              Faltan {deficit.toLocaleString('es-MX')}
                            </span>
                          ) : status === 'warning' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] uppercase">
                              Cerca de mín.
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                              <Check size={11} /> Cubierto
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info size={14} className="text-slate-400 shrink-0" />
              <span>Los descuentos se auditan en la bitácora con detalle de lote y corrida.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {bomCalculations.hasCriticalDeficit && (
                <button
                  type="button"
                  onClick={onOpenPurchaseOrder}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ShoppingCart size={15} className="text-amber-700" />
                  <span>Generar Orden de Compra</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDirectDeduction}
                disabled={isApplyingDeduction || targetBoxes <= 0}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <TrendingDown size={15} />
                <span>{isApplyingDeduction ? 'Descontando...' : 'Aplicar Descuento a Stock'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
