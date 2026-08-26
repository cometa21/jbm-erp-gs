import React, { useState, useEffect } from 'react';
import { POSTransfer, POSTransferItem, POSTransferReceivedItem, POSUserRole } from '../../types';
import { 
  Truck, CheckCircle2, AlertTriangle, Clock, Search, RefreshCw, 
  Camera, Upload, FileText, ArrowRight, ShieldCheck, Check, Thermometer,
  Eye, Printer, AlertCircle, Sparkles
} from 'lucide-react';

interface POSTabRecepcionesProps {
  currentRole: POSUserRole;
}

export const POSTabRecepciones: React.FC<POSTabRecepcionesProps> = ({ currentRole }) => {
  const [transfers, setTransfers] = useState<POSTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'en_transito' | 'recibido' | 'con_discrepancia'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Receiving Modal State
  const [selectedTransfer, setSelectedTransfer] = useState<POSTransfer | null>(null);
  const [receivingModalOpen, setReceivingModalOpen] = useState(false);
  const [operatorReception, setOperatorReception] = useState('Ventas CDMX');
  const [receivedItems, setReceivedItems] = useState<POSTransferReceivedItem[]>([]);
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Viewing detail voucher modal
  const [viewVoucherTransfer, setViewVoucherTransfer] = useState<POSTransfer | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/transfers');
      const data = await res.json();
      setTransfers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const openReceptionModal = (transfer: POSTransfer) => {
    setSelectedTransfer(transfer);
    // Initialize items with sent quantities as default
    const initialItems: POSTransferReceivedItem[] = transfer.items.map(item => ({
      ...item,
      boxes_received: item.boxes_sent,
      total_kg_received: item.total_kg_sent,
      discrepancy_boxes: 0,
      discrepancy_kg: 0,
      sale_price_box: item.default_sale_price_box || 500.00,
      sale_price_kg: item.default_sale_price_kg || 28.00
    }));
    setReceivedItems(initialItems);
    setDiscrepancyNotes('');
    setEvidencePhotoUrl('');
    setOperatorReception(currentRole === 'admin' ? 'Administrador' : 'Almacén CDMX');
    setReceivingModalOpen(true);
  };

  const handleBoxesReceivedChange = (index: number, val: number) => {
    const updated = [...receivedItems];
    const item = updated[index];
    const boxesReceived = Math.max(0, val);
    const kgPerBox = item.kg_per_box || 18.14;
    const totalKgReceived = boxesReceived * kgPerBox;
    const discrepancyBoxes = boxesReceived - item.boxes_sent;
    const discrepancyKg = totalKgReceived - item.total_kg_sent;

    updated[index] = {
      ...item,
      boxes_received: boxesReceived,
      total_kg_received: Number(totalKgReceived.toFixed(2)),
      discrepancy_boxes: discrepancyBoxes,
      discrepancy_kg: Number(discrepancyKg.toFixed(2))
    };
    setReceivedItems(updated);
  };

  const handleSalePriceChange = (index: number, val: number) => {
    const updated = [...receivedItems];
    const item = updated[index];
    updated[index] = {
      ...item,
      sale_price_box: val,
      sale_price_kg: Number((val / (item.kg_per_box || 18.14)).toFixed(2))
    };
    setReceivedItems(updated);
  };

  // Check if any item has discrepancy
  const totalDiscrepancyBoxes = receivedItems.reduce((sum, item) => sum + item.discrepancy_boxes, 0);
  const hasDiscrepancy = totalDiscrepancyBoxes !== 0;

  // Handle Photo Simulation Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePhotoUrl(reader.result as string);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReception = async () => {
    if (!selectedTransfer) return;

    if (hasDiscrepancy && !discrepancyNotes.trim()) {
      alert('Se requiere una nota explicativa de discrepancia obligatoria cuando las cajas recibidas difieren de lo enviado.');
      return;
    }

    try {
      setProcessing(true);
      const payload = {
        operator_reception: operatorReception,
        items_received: receivedItems,
        discrepancy_notes: discrepancyNotes,
        evidence_photo_url: evidencePhotoUrl
      };

      const res = await fetch(`/api/pos/transfers/${selectedTransfer.id}/process-reception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al procesar recepción');
      }

      const result = await res.json();
      setReceivingModalOpen(false);
      fetchTransfers();
      alert(`Transferencia ${selectedTransfer.folio} procesada exitosamente. Inventario de Bodega CDMX actualizado.`);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la recepción');
    } finally {
      setProcessing(false);
    }
  };

  // Filter transfers
  const filteredTransfers = transfers.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch = t.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.plates_truck.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = transfers.filter(t => t.status === 'en_transito').length;

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header & Stats Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Transferencias Michoacán → CDMX
            </span>
            <span className="text-xs text-slate-500">• Control de Recepción y Discrepancias</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Entrada y Conteo de Mercancía</h1>
          <p className="text-xs text-slate-500">
            Valida los envíos de fruta desde el empaque de origen, captura conteos físicos e ingresa automáticamente al inventario local.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold text-amber-700">{pendingCount}</div>
            <div className="text-[10px] font-semibold text-amber-900 uppercase">En Tránsito</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold text-emerald-700">
              {transfers.filter(t => t.status === 'recibido').length}
            </div>
            <div className="text-[10px] font-semibold text-emerald-900 uppercase">Recibidas Conforme</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold text-rose-700">
              {transfers.filter(t => t.status === 'con_discrepancia').length}
            </div>
            <div className="text-[10px] font-semibold text-rose-900 uppercase">Con Discrepancia</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({transfers.length})
          </button>
          <button
            onClick={() => setFilterStatus('en_transito')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === 'en_transito' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚛 En Tránsito ({transfers.filter(t => t.status === 'en_transito').length})
          </button>
          <button
            onClick={() => setFilterStatus('recibido')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === 'recibido' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✅ Conformes
          </button>
          <button
            onClick={() => setFilterStatus('con_discrepancia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === 'con_discrepancia' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ Con Discrepancia
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por folio, chofer, placas..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchTransfers}
            title="Refrescar lista"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transfers Cards Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs">Cargando transferencias de fruta...</p>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="w-10 h-10 stroke-1 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No hay transferencias con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTransfers.map(transfer => {
            const isEnTransito = transfer.status === 'en_transito';
            const isDiscrepant = transfer.status === 'con_discrepancia';
            const totalBoxesSent = transfer.items.reduce((s, i) => s + (i.boxes_sent || 0), 0);
            const totalKgSent = transfer.items.reduce((s, i) => s + (i.total_kg_sent || 0), 0);

            return (
              <div
                key={transfer.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{transfer.folio}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        isEnTransito
                          ? 'bg-amber-100 text-amber-800'
                          : isDiscrepant
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isEnTransito && <Clock className="w-3 h-3" />}
                        {isDiscrepant && <AlertTriangle className="w-3 h-3" />}
                        {!isEnTransito && !isDiscrepant && <CheckCircle2 className="w-3 h-3" />}
                        {isEnTransito ? 'En Tránsito' : isDiscrepant ? 'Con Discrepancia' : 'Recibido Conforme'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                      <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                      <span>{transfer.thermograph_temp}°C</span>
                    </div>
                  </div>

                  {/* Logistics Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl mb-3 border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Chofer & Transporte</span>
                      <span className="font-semibold text-slate-800">{transfer.driver_name}</span>
                      <span className="text-slate-500 block text-[11px]">Placas: {transfer.plates_truck}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Fecha & Ruta</span>
                      <span className="text-slate-700">{new Date(transfer.departure_date).toLocaleDateString('es-MX')}</span>
                      <span className="text-slate-500 block text-[10px] truncate" title={transfer.origin}>
                        {transfer.origin} → {transfer.destination_bodega}
                      </span>
                    </div>
                  </div>

                  {/* Sent Items Breakdown */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[11px] font-bold text-slate-700 uppercase flex justify-between">
                      <span>Carga Enviada</span>
                      <span className="text-emerald-700 font-extrabold">{totalBoxesSent} cajas ({totalKgSent.toLocaleString('es-MX')} kg)</span>
                    </div>
                    <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-xl p-2 border border-slate-100 text-xs">
                      {transfer.items.map((it, idx) => (
                        <div key={idx} className="py-1 flex justify-between items-center">
                          <span className="font-medium text-slate-800">{it.presentation_name} (Calibre {it.calibre})</span>
                          <span className="font-mono text-slate-600">{it.boxes_sent} cjs ({it.total_kg_sent} kg)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discrepancy Note Preview if exists */}
                  {transfer.discrepancy_notes && (
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-900 mb-3 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Incidencia Registrada:
                      </div>
                      <p className="text-[11px] leading-relaxed">{transfer.discrepancy_notes}</p>
                      {transfer.evidence_photo_url && (
                        <div className="pt-1">
                          <a
                            href={transfer.evidence_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-semibold text-rose-700 underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Ver Foto de Evidencia
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Despachado por: {transfer.operator_departure}
                  </span>

                  <div className="flex gap-2">
                    {isEnTransito ? (
                      <button
                        onClick={() => openReceptionModal(transfer)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Recibir y Contar
                      </button>
                    ) : (
                      <button
                        onClick={() => setViewVoucherTransfer(transfer)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver Acta
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECEPTION & PHYSICAL COUNT MODAL */}
      {receivingModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Recepción de Transferencia {selectedTransfer.folio}</h3>
                  <p className="text-xs text-slate-400">Chofer: {selectedTransfer.driver_name} • Placas: {selectedTransfer.plates_truck}</p>
                </div>
              </div>

              <button
                onClick={() => setReceivingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Operator and Date */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Operador Receptor (CDMX)</label>
                  <input
                    type="text"
                    value={operatorReception}
                    onChange={e => setOperatorReception(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Destino / Almacén</label>
                  <div className="text-xs font-bold text-slate-800 pt-1.5">{selectedTransfer.destination_bodega}</div>
                </div>
              </div>

              {/* Physical Count Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Conteo Físico por Presentación y Fijación de Precios
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
                  <div className="bg-slate-100 px-4 py-2.5 grid grid-cols-12 text-[10px] font-bold text-slate-600 uppercase">
                    <span className="col-span-4">Presentación / Calibre</span>
                    <span className="col-span-2 text-center">Enviado</span>
                    <span className="col-span-2 text-center">Contado Físico</span>
                    <span className="col-span-2 text-center">Diferencia</span>
                    <span className="col-span-2 text-right">Precio Venta ($)</span>
                  </div>

                  {receivedItems.map((item, idx) => {
                    const hasDiff = item.discrepancy_boxes !== 0;

                    return (
                      <div key={idx} className={`px-4 py-3 grid grid-cols-12 items-center gap-2 text-xs ${hasDiff ? 'bg-rose-50/40' : 'bg-white'}`}>
                        <div className="col-span-4">
                          <div className="font-bold text-slate-900">{item.presentation_name}</div>
                          <div className="text-[10px] text-slate-500">Calibre: {item.calibre} • {item.kg_per_box} kg/caja</div>
                        </div>

                        <div className="col-span-2 text-center font-mono text-slate-700">
                          {item.boxes_sent} cjs
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min={0}
                            value={item.boxes_received}
                            onChange={e => handleBoxesReceivedChange(idx, parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-center font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2 text-center font-mono font-bold">
                          {item.discrepancy_boxes === 0 ? (
                            <span className="text-emerald-700">0 cjs</span>
                          ) : (
                            <span className="text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                              {item.discrepancy_boxes > 0 ? `+${item.discrepancy_boxes}` : item.discrepancy_boxes} cjs
                            </span>
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400">$</span>
                            <input
                              type="number"
                              value={item.sale_price_box}
                              onChange={e => handleSalePriceChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-right font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Discrepancy Form if counts differ */}
              {hasDiscrepancy && (
                <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Discrepancia detectada ({totalDiscrepancyBoxes > 0 ? `+${totalDiscrepancyBoxes}` : totalDiscrepancyBoxes} cajas). Se requiere justificación y foto de evidencia:</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-rose-900 uppercase block mb-1">
                      Nota de Discrepancia / Causa del Faltante o Daño *
                    </label>
                    <textarea
                      rows={2}
                      value={discrepancyNotes}
                      onChange={e => setDiscrepancyNotes(e.target.value)}
                      placeholder="Ej. 3 cajas aplastadas por estiba durante trayecto en carretera / Faltante verificado con chofer..."
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-800"
                    />
                  </div>

                  {/* Photo Evidence Uploader */}
                  <div>
                    <label className="text-[10px] font-bold text-rose-900 uppercase block mb-1">
                      Foto de Evidencia (Daño / Andén de Descarga)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5 shadow-sm">
                        <Camera className="w-4 h-4" />
                        {uploadingImage ? 'Cargando...' : 'Tomar / Subir Foto'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {evidencePhotoUrl && (
                        <div className="flex items-center gap-2">
                          <img
                            src={evidencePhotoUrl}
                            alt="Evidencia"
                            className="w-10 h-10 rounded-lg object-cover border border-rose-300"
                          />
                          <span className="text-[11px] text-emerald-700 font-semibold">Foto adjuntada correctamente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setReceivingModalOpen(false)}
                disabled={processing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                onClick={handleSubmitReception}
                disabled={processing}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar Recepción & Procesar a Inventario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW VOUCHER MODAL */}
      {viewVoucherTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Acta de Recepción</h3>
                <p className="text-xs text-slate-500">Folio: {viewVoucherTransfer.folio}</p>
              </div>
              <button
                onClick={() => setViewVoucherTransfer(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Chofer:</span> <span className="font-semibold">{viewVoucherTransfer.driver_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Placas:</span> <span className="font-semibold">{viewVoucherTransfer.plates_truck}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fecha Recepción:</span> <span className="font-semibold">{viewVoucherTransfer.reception_date || 'Recibido'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Receptor:</span> <span className="font-semibold">{viewVoucherTransfer.operator_reception || 'Ventas CDMX'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Estado:</span> <span className="font-bold text-emerald-700">{viewVoucherTransfer.status.toUpperCase()}</span></div>

              {viewVoucherTransfer.discrepancy_notes && (
                <div className="mt-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-1">Notas de Discrepancia:</span>
                  <p className="text-amber-800">{viewVoucherTransfer.discrepancy_notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
              <button
                onClick={() => setViewVoucherTransfer(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
