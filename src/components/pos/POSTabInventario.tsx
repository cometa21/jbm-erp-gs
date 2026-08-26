import React, { useState, useEffect } from 'react';
import { POSInventoryItem, POSUserRole } from '../../types';
import { 
  Package, Scissors, Edit3, Search, RefreshCw, AlertTriangle, 
  CheckCircle2, ArrowRight, DollarSign, Lock, Sparkles, Scale,
  Layers, Check
} from 'lucide-react';

interface POSTabInventarioProps {
  currentRole: POSUserRole;
}

export const POSTabInventario: React.FC<POSTabInventarioProps> = ({ currentRole }) => {
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalibre, setSelectedCalibre] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // "Desencajonar" (Bulk Transformation) Modal State
  const [transformModalOpen, setTransformModalOpen] = useState(false);
  const [selectedBoxItem, setSelectedBoxItem] = useState<POSInventoryItem | null>(null);
  const [boxesToOpen, setBoxesToOpen] = useState<number>(1);
  const [mermaKg, setMermaKg] = useState<number>(0);
  const [transformNotes, setTransformNotes] = useState('');
  const [processingTransform, setProcessingTransform] = useState(false);

  // Price Edit Modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<POSInventoryItem | null>(null);
  const [newSalePrice, setNewSalePrice] = useState<number>(0);
  const [newMinPrice, setNewMinPrice] = useState<number>(0);
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/inventory');
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filtered Items
  const calibresList = Array.from(new Set(inventory.map(i => i.calibre))).filter(Boolean);

  const filteredItems = inventory.filter(item => {
    const matchesCalibre = selectedCalibre === 'all' || item.calibre === selectedCalibre;
    const matchesSearch = item.presentation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.lot_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.calibre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCalibre && matchesSearch;
  });

  // Calculate totals
  const totalBoxes = inventory.filter(i => i.item_type === 'caja').reduce((sum, i) => sum + i.boxes_stock, 0);
  const totalBulkKg = inventory.filter(i => i.item_type === 'granel').reduce((sum, i) => sum + i.kg_stock, 0);
  const totalFruitKg = inventory.reduce((sum, i) => {
    return sum + (i.item_type === 'caja' ? i.boxes_stock * (i.kg_per_box || 18.14) : i.kg_stock);
  }, 0);

  // Open Transformation Modal
  const handleOpenTransform = (item: POSInventoryItem) => {
    setSelectedBoxItem(item);
    setBoxesToOpen(Math.min(1, item.boxes_stock));
    setMermaKg(0);
    setTransformNotes(`Apertura para venta a granel en mostrador CDMX`);
    setTransformModalOpen(true);
  };

  // Submit Transformation
  const handleExecuteTransform = async () => {
    if (!selectedBoxItem) return;
    if (boxesToOpen <= 0 || boxesToOpen > selectedBoxItem.boxes_stock) {
      alert(`Cantidad de cajas inválida. Disponible: ${selectedBoxItem.boxes_stock}`);
      return;
    }

    try {
      setProcessingTransform(true);
      const payload = {
        source_inventory_id: selectedBoxItem.id,
        boxes_to_open: boxesToOpen,
        merma_kg: mermaKg,
        operator: currentRole === 'admin' ? 'Administrador' : 'Almacén CDMX',
        notes: transformNotes
      };

      const res = await fetch('/api/pos/inventory/transform-to-granel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al desencajonar');
      }

      setTransformModalOpen(false);
      fetchInventory();
      alert(`Se abrieron ${boxesToOpen} cajas exitosamente y se agregaron los kilos netos a la existencia a granel.`);
    } catch (err: any) {
      alert(err.message || 'Error en la transformación');
    } finally {
      setProcessingTransform(false);
    }
  };

  // Open Price Edit Modal
  const handleOpenPriceEdit = (item: POSInventoryItem) => {
    setEditingItem(item);
    setNewSalePrice(item.default_sale_price);
    setNewMinPrice(item.min_price_per_unit);
    setPriceModalOpen(true);
  };

  // Save Price
  const handleSavePrice = async () => {
    if (!editingItem) return;
    try {
      setSavingPrice(true);
      const res = await fetch(`/api/pos/inventory/${editingItem.id}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_sale_price: newSalePrice,
          min_price_per_unit: newMinPrice
        })
      });

      if (!res.ok) throw new Error('Error al actualizar precio');

      setPriceModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Error al guardar precio');
    } finally {
      setSavingPrice(false);
    }
  };

  // Transformation calculations
  const grossKgOpened = selectedBoxItem ? boxesToOpen * (selectedBoxItem.kg_per_box || 18.14) : 0;
  const netKgAdded = Math.max(0, grossKgOpened - mermaKg);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header & Bodega Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Bodega CDMX (Central de Abasto)
            </span>
            <span className="text-xs text-slate-500">• Control de Existencias & Granel</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Inventario en Bodega</h1>
          <p className="text-xs text-slate-500">
            Monitoreo en tiempo real de cajas cerradas y fruta a granel. Procesa apertura de cajas (desencajonado) y precios.
          </p>
        </div>

        {/* Bodega Totals Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold text-amber-800">{totalBoxes} cjs</div>
            <div className="text-[10px] font-semibold text-amber-900 uppercase">Cajas Cerradas</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold text-emerald-800">{totalBulkKg.toFixed(1)} kg</div>
            <div className="text-[10px] font-semibold text-emerald-900 uppercase">Granel para Kilo</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold text-slate-900">{totalFruitKg.toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg</div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Kilos Totales Fruta</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Calibres Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCalibre('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              selectedCalibre === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos los Calibres
          </button>
          {calibresList.map(cal => (
            <button
              key={cal}
              onClick={() => setSelectedCalibre(cal)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedCalibre === cal
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Calibre {cal}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar lote o producto..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchInventory}
            title="Refrescar inventario"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inventory Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="px-5 py-3.5">Presentación / Producto</th>
                <th className="px-4 py-3.5">Tipo & Lote</th>
                <th className="px-4 py-3.5 text-center">Calibre</th>
                <th className="px-4 py-3.5 text-center">Stock Actual</th>
                <th className="px-4 py-3.5 text-right">Costo Base Fruta</th>
                <th className="px-4 py-3.5 text-right">Precio Mostrador</th>
                <th className="px-4 py-3.5 text-right">Precio Piso (Mín)</th>
                <th className="px-5 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isBox = item.item_type === 'caja';
                const stock = isBox ? item.boxes_stock : item.kg_stock;
                const isLowStock = item.status === 'bajo_stock' || stock <= (isBox ? 10 : 100);
                const isOut = stock <= 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{item.presentation_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {isBox ? `${item.kg_per_box || 18.14} kg por caja` : 'Venta a granel'}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isBox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isBox ? 'Caja' : 'Granel'}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">{item.lot_code}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {item.calibre}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="font-mono font-extrabold text-sm text-slate-900">
                        {stock} {isBox ? 'cajas' : 'kg'}
                      </div>
                      <div className={`text-[10px] font-semibold ${
                        isOut ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {isOut ? '● Agotado' : isLowStock ? '● Stock Bajo' : '● Disponible'}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right font-mono text-slate-600">
                      ${item.base_cost_per_kg.toFixed(2)}/kg
                    </td>

                    <td className="px-4 py-4 text-right font-mono font-bold text-emerald-800 text-sm">
                      ${item.default_sale_price.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-right font-mono text-slate-500">
                      <span className="flex items-center justify-end gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        ${item.min_price_per_unit.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* If box, allow "Desencajonar" */}
                        {isBox && (
                          <button
                            onClick={() => handleOpenTransform(item)}
                            disabled={stock <= 0}
                            title="Abrir Cajas a Granel (Desencajonar)"
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Abrir a Granel</span>
                          </button>
                        )}

                        {/* Price Edit Button */}
                        <button
                          onClick={() => handleOpenPriceEdit(item)}
                          title="Modificar Precios y Piso"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DESENCAJONAR (TRANSFORM TO GRANEL) MODAL */}
      {transformModalOpen && selectedBoxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Apertura de Cajas a Granel</h3>
                  <p className="text-[11px] text-slate-500">Desencajonar para venta por kilo en mostrador</p>
                </div>
              </div>
              <button
                onClick={() => setTransformModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Selected Product Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedBoxItem.presentation_name}</div>
              <div className="flex justify-between text-slate-600">
                <span>Calibre: {selectedBoxItem.calibre}</span>
                <span>Lote: {selectedBoxItem.lot_code}</span>
              </div>
              <div className="text-emerald-700 font-semibold">
                Stock actual: {selectedBoxItem.boxes_stock} cajas ({selectedBoxItem.kg_per_box} kg/caja)
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Número de Cajas a Abrir:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={selectedBoxItem.boxes_stock}
                    value={boxesToOpen}
                    onChange={e => setBoxesToOpen(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-medium">cajas</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Merma / Fruta no apta detectada (kg):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={mermaKg}
                    onChange={e => setMermaKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-medium">kg merma</span>
                </div>
              </div>

              {/* Live Transformation Summary */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Kilos Brutos ({boxesToOpen} cjs × {selectedBoxItem.kg_per_box} kg):</span>
                  <span className="font-mono">{grossKgOpened.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Menos Merma:</span>
                  <span className="font-mono">-{mermaKg.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between font-extrabold text-amber-900 pt-1 border-t border-amber-200">
                  <span>Kilos Netos a Ingresar a Granel:</span>
                  <span className="font-mono text-sm text-emerald-800">+{netKgAdded.toFixed(2)} kg</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notas de Transformación:
                </label>
                <input
                  type="text"
                  value={transformNotes}
                  onChange={e => setTransformNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setTransformModalOpen(false)}
                disabled={processingTransform}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteTransform}
                disabled={processingTransform || boxesToOpen <= 0}
                className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                {processingTransform ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                Confirmar Desencajonado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICE EDIT MODAL */}
      {priceModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Modificar Precios</h3>
                  <p className="text-[11px] text-slate-500">{editingItem.presentation_name}</p>
                </div>
              </div>
              <button onClick={() => setPriceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Precio de Venta Mostrador ($/{editingItem.item_type === 'caja' ? 'caja' : 'kg'}):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newSalePrice}
                  onChange={e => setNewSalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Precio Piso Mínimo (Bloqueo de Descuento sin PIN):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newMinPrice}
                  onChange={e => setNewMinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Si un vendedor intenta cobrar por debajo de este precio, el sistema exigirá el PIN de Administrador.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setPriceModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePrice}
                disabled={savingPrice}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                {savingPrice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Guardar Precios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
