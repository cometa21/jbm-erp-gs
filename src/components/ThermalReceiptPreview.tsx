import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  Scale, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sliders, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { Logo } from './Logo';

export interface WeighInReceiptData {
  folio: string;
  scale_ticket_folio?: string;
  date?: string;
  producer_name: string;
  producer_rfc?: string;
  origin?: string;
  orchard: string;
  orchard_senasica?: string;
  variety?: string;
  quality?: string;
  plates?: string;
  driver_name?: string;
  weight_gross: number;
  weight_tare: number;
  weight_net: number;
  moisture_deduction_kg?: number;
  payable_net_kg?: number;
  price_per_kg: number;
  subtotal: number;
  scale_fee: number;
  scale_fee_payment?: 'descuento' | 'efectivo';
  extra_charge_per_kg?: number;
  extra_charge_total?: number;
  extra_charge_concept?: string;
  total: number;
  operator: string;
  notes?: string;
  isOffline?: boolean;
  cut_turn?: 'Matutino' | 'Vespertino' | 'Nocturno';
}

interface ThermalReceiptPreviewProps {
  data: WeighInReceiptData;
  isOpen?: boolean;
  onClose?: () => void;
  onPrint?: () => void;
  isLivePreview?: boolean;
  showToolbar?: boolean;
  className?: string;
}

export function ThermalReceiptPreview({
  data,
  isOpen = true,
  onClose,
  onPrint,
  isLivePreview = false,
  showToolbar = true,
  className = ''
}: ThermalReceiptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [paperTheme, setPaperTheme] = useState<'standard' | 'thermal-tint'>('standard');
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Formatting calculations
  const displayFolio = data.folio || '#PENDIENTE';
  const displayScaleFolio = data.scale_ticket_folio || displayFolio;
  const isScaleDeducted = data.scale_fee_payment !== 'efectivo';
  const extraKgRate = data.extra_charge_per_kg ?? 0.40;
  const extraChargeTotal = data.extra_charge_total ?? ((data.weight_net || 0) * extraKgRate);
  const extraChargeConcept = data.extra_charge_concept || 'Servicios operativos y maniobra';
  const payableNetKg = data.payable_net_kg ?? Math.max(0, (data.weight_net || 0) - (data.moisture_deduction_kg || 0));
  const isOfflineTicket = data.isOffline || Boolean(data.folio && (data.folio.includes('TEMPORAL') || data.folio.includes('OFF-')));

  const formattedDate = data.date 
    ? new Date(data.date).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : new Date().toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

  const portalUrl = `https://portal.jbmcitricos.com/status/${data.folio ? data.folio.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() : 'pesaje'}`;

  // Execute Native Print
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  // Copy structured receipt summary for WhatsApp
  const handleCopySummary = () => {
    const scaleLine = isScaleDeducted
      ? `Cuota Báscula: -$${(data.scale_fee || 0).toFixed(2)} (A Descontar)`
      : `Cuota Báscula: $${(data.scale_fee || 0).toFixed(2)} (Pagado en Efectivo)`;
    
    const extraLine = extraChargeTotal > 0
      ? `\n${extraChargeConcept} ($${extraKgRate.toFixed(2)}/kg): -$${extraChargeTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
      : '';

    const moistureLine = (data.moisture_deduction_kg && data.moisture_deduction_kg > 0)
      ? `\nDesc. Humedad/Agua: -${data.moisture_deduction_kg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg`
      : '';

    const text = `🍋 *JBM CÍTRICOS BARRAGÁN - BOLETA DE BÁSCULA*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Folio Báscula:* ${displayScaleFolio}\n` +
      `*Folio ERP:* ${displayFolio}\n` +
      `*Fecha:* ${formattedDate}\n` +
      `*Productor:* ${data.producer_name || 'SIN ASIGNAR'}\n` +
      `*Huerto:* ${data.orchard || 'Pedernales'}\n` +
      `*Variedad:* ${data.variety || 'Limón Mexicano'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*DETALLE DE PESO:*\n` +
      `• Peso Bruto: ${(data.weight_gross || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg\n` +
      `• Peso Tara:  ${(data.weight_tare || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg\n` +
      `• *PESO NETO: ${(data.weight_net || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg*${moistureLine}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*LIQUIDACIÓN:*\n` +
      `• Precio Pactado: $${(data.price_per_kg || 0).toFixed(2)} / kg\n` +
      `• Subtotal Fruta: $${(data.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n` +
      `• ${scaleLine}${extraLine}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL NETO: $${(data.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Operador: ${data.operator || 'Carlos Barragán'}\n` +
      `Verificar boleta: ${portalUrl}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Pseudo-Barcode visual generator
  const barcodePattern = [3,1,2,1,3,2,1,2,3,1,1,2,3,2,1,3,1,2,1,3,2,1,2,3,1,1,2,3,2,1,3,1,2,1,3];

  return (
    <div id="print-modal-container" className={`flex flex-col items-center w-full ${className}`}>
      
      {/* TOOLBAR CONTROLS (Always hidden on print via .no-print) */}
      {showToolbar && (
        <div className="w-full max-w-xl mb-4 bg-slate-900 text-white rounded-2xl p-3 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scale size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Previsualizador Térmico POS
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-bold">
                  {paperWidth}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formato certificado para rollos térmicos de 80mm (Epson/Star/Munbyn)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Width Toggle */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded-md font-bold transition-all ${
                  paperWidth === '80mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Ancho estándar de ticketera industrial (80mm / 48 col)"
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded-md font-bold transition-all ${
                  paperWidth === '58mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Ancho compacto portátil (58mm / 32 col)"
              >
                58mm
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 10))}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title="Reducir zoom"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-mono font-bold px-1 text-slate-300">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Copy WhatsApp text */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Copiar texto formateado para WhatsApp o SMS"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="text-[11px] font-semibold">{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            {/* Print Direct */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
              title="Imprimir boleta en impresora térmica conectada"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
                title="Cerrar vista previa"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAPER ROLL WRAPPER & CONTAINER */}
      <div 
        className="w-full flex justify-center overflow-x-auto py-2 transition-transform duration-200"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
      >
        {/* ========================================================================= */}
        {/* THE 80MM THERMAL RECEIPT (.thermal-receipt targeted in index.css @media print) */}
        {/* ========================================================================= */}
        <div
          ref={receiptRef}
          id="thermal-receipt-printable"
          className={`thermal-receipt font-mono relative select-none rounded-sm border transition-all ${
            paperWidth === '80mm' ? 'w-[320px] max-w-[320px]' : 'w-[240px] max-w-[240px]'
          } ${
            paperTheme === 'thermal-tint' 
              ? 'bg-[#faf8f2] text-[#111827] border-amber-200/70 shadow-xl' 
              : 'bg-white text-black border-slate-300 shadow-2xl'
          }`}
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', Courier, Monaco, monospace",
            padding: paperWidth === '80mm' ? '18px 14px' : '14px 10px',
            lineHeight: 1.25
          }}
        >
          {/* Top Perforation / Tear Notch (Visual Only) */}
          <div className="absolute -top-1.5 left-0 right-0 h-3 flex overflow-hidden no-print opacity-60 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 bg-slate-200 rotate-45 transform -translate-y-1.5 shrink-0" />
            ))}
          </div>

          {/* 1. OFFICIAL BRAND HEADER */}
          <div className="flex flex-col items-center text-center">
            <Logo variant="mono" className="scale-85 mb-1" />
            
            <div className="text-[13px] font-black tracking-wider text-black uppercase mt-1">
              JBM CÍTRICOS BARRAGÁN
            </div>
            <div className="text-[9px] text-neutral-600 font-bold uppercase tracking-tight">
              EMPAQUE & ACOPIO DE LIMÓN MEXICANO
            </div>
            <div className="text-[8.5px] text-neutral-500 mt-0.5">
              Carretera Apatzingán-Cuatro Caminos Km 4.5
            </div>
            <div className="text-[8.5px] text-neutral-500">
              Apatzingán, Michoacán • Tel. (453) 534-0192
            </div>
            <div className="text-[8.5px] text-neutral-600 font-bold uppercase mt-0.5">
              RFC: CBR-891024-JBM • REG. SENASICA: MICH-EMP-0412
            </div>

            {/* Offline Alert Banner */}
            {isOfflineTicket && (
              <div className="my-2 px-2 py-1 bg-amber-100 border border-dashed border-amber-500 text-amber-950 rounded text-[9px] font-black text-center uppercase tracking-wider">
                ⚠️ BOLETA OFFLINE • SINCRONIZACIÓN PENDIENTE
              </div>
            )}

            {/* Ticket Scale Folio Highlight */}
            <div className="w-full border-t border-b border-black py-1.5 my-2 text-center bg-black text-white">
              <div className="text-[9px] font-bold tracking-widest uppercase">
                {data.scale_ticket_folio ? 'TICKET BÁSCULA CERTIFICADO' : 'BOLETA DE ENTRADA'}
              </div>
              <div className="text-xl font-black tracking-tight my-0.5">
                {displayScaleFolio}
              </div>
              {data.scale_ticket_folio && (
                <div className="text-[8.5px] tracking-wider text-neutral-300 font-normal">
                  CONTROL INTERNO ERP: {displayFolio}
                </div>
              )}
            </div>

            {/* Date & Shift */}
            <div className="text-[10px] text-neutral-700 font-semibold tracking-tight">
              {formattedDate} {data.cut_turn ? `• Turno ${data.cut_turn}` : ''}
            </div>
          </div>

          {/* Dotted Separator */}
          <div className="border-b border-dashed border-black my-2" />

          {/* 2. PRODUCER, HUERTO & ORIGIN TRACEABILITY */}
          <div className="space-y-1 text-[11px] leading-tight">
            <div className="flex justify-between items-start gap-1">
              <span className="font-bold text-neutral-600 uppercase text-[10px] shrink-0">PRODUCTOR:</span>
              <span className="font-black text-right text-black uppercase truncate max-w-[190px]">
                {data.producer_name || 'SIN ASIGNAR'}
              </span>
            </div>

            {data.producer_rfc && (
              <div className="flex justify-between items-center gap-1">
                <span className="font-bold text-neutral-600 uppercase text-[9.5px] shrink-0">RFC:</span>
                <span className="font-bold text-right text-neutral-900 text-[10px]">
                  {data.producer_rfc}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-1">
              <span className="font-bold text-neutral-600 uppercase text-[10px] shrink-0">HUERTO:</span>
              <span className="font-bold text-right text-black uppercase truncate max-w-[190px]">
                {data.orchard || 'Pedernales'}
              </span>
            </div>

            <div className="flex justify-between items-center gap-1">
              <span className="font-bold text-neutral-600 uppercase text-[10px] shrink-0">ORIGEN:</span>
              <span className="font-semibold text-right text-neutral-800 truncate max-w-[190px]">
                {data.origin || 'Cosecha propia'}
              </span>
            </div>

            <div className="flex justify-between items-center gap-1">
              <span className="font-bold text-neutral-600 uppercase text-[10px] shrink-0">VARIEDAD:</span>
              <span className="font-bold text-right text-black uppercase">
                {data.variety || 'LIMÓN MEXICANO'}
              </span>
            </div>

            {data.plates && (
              <div className="flex justify-between items-center gap-1">
                <span className="font-bold text-neutral-600 uppercase text-[10px] shrink-0">PLACAS / CAMIÓN:</span>
                <span className="font-bold text-right text-neutral-900 uppercase">
                  {data.plates}
                </span>
              </div>
            )}
          </div>

          {/* Dotted Separator */}
          <div className="border-b border-dashed border-black my-2" />

          {/* 3. DETALLE DE PESAJE EN BÁSCULA (WEIGH-IN CORE) */}
          <div>
            <div className="text-center text-[10px] font-black tracking-widest uppercase text-black mb-1.5">
              ── DETALLE DE PESO (BÁSCULA) ──
            </div>

            <div className="space-y-1 text-[12px] leading-tight">
              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-700 uppercase text-[11px]">PESO BRUTO (ENTRADA):</span>
                <span className="font-bold text-black font-mono">
                  {(data.weight_gross || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-700 uppercase text-[11px]">PESO TARA (VEHÍCULO):</span>
                <span className="font-bold text-black font-mono">
                  - {(data.weight_tare || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                </span>
              </div>

              {/* Dotted Line */}
              <div className="border-b border-dashed border-neutral-400 my-1" />

              {/* PESO NETO DESTACADO */}
              <div className="flex justify-between items-center py-0.5 bg-neutral-100 px-1.5 rounded">
                <span className="text-[13px] font-black tracking-wider text-black uppercase">
                  PESO NETO FRUTA:
                </span>
                <span className="text-[15px] font-black text-black tracking-tight font-mono">
                  {(data.weight_net || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                </span>
              </div>

              {/* Moisture / Quality Deduction if applicable */}
              {data.moisture_deduction_kg && data.moisture_deduction_kg > 0 && (
                <div className="flex justify-between items-center text-red-700 text-[11px] pt-0.5">
                  <span className="font-bold uppercase">DESC. HUMEDAD / IMPUREZA:</span>
                  <span className="font-bold font-mono">
                    - {data.moisture_deduction_kg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                  </span>
                </div>
              )}

              {payableNetKg !== data.weight_net && (
                <div className="flex justify-between items-center font-bold text-neutral-900 text-[11px]">
                  <span className="uppercase">NETO LIQUIDABLE:</span>
                  <span className="font-black font-mono">
                    {payableNetKg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dotted Separator */}
          <div className="border-b border-dashed border-black my-2" />

          {/* 4. FINANCIAL BREAKDOWN & LIQUIDATION */}
          <div>
            <div className="text-center text-[10px] font-black tracking-widest uppercase text-black mb-1.5">
              ── DESGLOSE DE LIQUIDACIÓN ──
            </div>

            <div className="space-y-1 text-[11px] leading-tight">
              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-600 uppercase text-[10px]">PRECIO POR KG:</span>
                <span className="font-bold text-black font-mono text-[12px]">
                  ${(data.price_per_kg || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-600 uppercase text-[10px]">SUBTOTAL FRUTA:</span>
                <span className="font-bold text-black font-mono text-[12px]">
                  ${(data.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Scale Fee Line */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-600 uppercase text-[10px]">
                  CUOTA BÁSCULA {isScaleDeducted ? '(DESCONTADA)' : '(PAGADA EFECTIVO)'}:
                </span>
                <span className={`font-bold font-mono text-[11.5px] ${isScaleDeducted ? 'text-red-700' : 'text-neutral-700'}`}>
                  {isScaleDeducted ? '- ' : ''}${(data.scale_fee || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Extra Operational Surcharge */}
              {extraChargeTotal > 0 && (
                <div className="flex justify-between items-start gap-1">
                  <span className="font-bold text-neutral-600 uppercase text-[9.5px]">
                    MANIOBRA / SERV. (${extraKgRate.toFixed(2)}/KG):
                  </span>
                  <span className="font-bold text-red-700 font-mono text-[11.5px] text-right">
                    - ${(extraChargeTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* SOLID INVERTED BANNER: GRAND TOTAL */}
            <div className="bg-black text-white px-3 py-2 flex justify-between items-center font-mono my-2.5 rounded-xs">
              <div>
                <div className="text-[9px] font-black tracking-wider uppercase">TOTAL NETO</div>
                <div className="text-[7.5px] text-neutral-300 uppercase">A LIQUIDAR AL PRODUCTOR</div>
              </div>
              <div className="text-[18px] font-black tracking-tight">
                ${(data.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 5. QR CODE & VERIFICATION */}
          <div className="border border-dashed border-black rounded-lg p-2.5 my-3 flex flex-col items-center justify-center bg-white text-center">
            <div className="p-1 bg-white border border-neutral-300 rounded mb-1.5">
              <QRCodeSVG
                value={portalUrl}
                size={paperWidth === '80mm' ? 100 : 80}
                level="M"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <div className="text-[9px] font-black tracking-wider uppercase text-black">
              CONSULTA TU ESTATUS Y PAGO
            </div>
            <div className="text-[8px] text-neutral-600 font-mono tracking-tighter truncate max-w-[220px]">
              {portalUrl}
            </div>
          </div>

          {/* 6. SIMULATED BARCODE */}
          <div className="flex flex-col items-center my-2">
            <div className="flex items-center gap-[2px] h-9 overflow-hidden">
              {barcodePattern.map((width, idx) => (
                <div
                  key={idx}
                  className="bg-black h-full"
                  style={{ width: `${width * 1.4}px` }}
                />
              ))}
            </div>
            <span className="text-[8.5px] font-mono tracking-widest text-neutral-700 mt-0.5">
              *{displayScaleFolio.replace(/[^a-zA-Z0-9]/g, '')}*
            </span>
          </div>

          {/* 7. SIGNATURES / LEGAL DISCLAIMER */}
          <div className="text-[7.5px] text-neutral-500 text-center leading-tight mb-3">
            Fruta certificada conforme a normas fitosanitarias de movilización citrícola. 
            El recibo ampara el pesaje formal de entrada en báscula certificada JBM.
          </div>

          <div className="grid grid-cols-2 gap-3 text-center my-2 pt-2 border-t border-black">
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-black pb-4 mb-1"></div>
              <span className="text-[8px] font-black uppercase text-black">
                {data.operator || 'OPERADOR'}
              </span>
              <span className="text-[7px] text-neutral-500 uppercase">BÁSCULA JBM</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-black pb-4 mb-1"></div>
              <span className="text-[8px] font-black uppercase text-black">
                PRODUCTOR / CHOFER
              </span>
              <span className="text-[7px] text-neutral-500 uppercase">CONFORMIDAD</span>
            </div>
          </div>

          {/* 8. FOOTER SLOGAN */}
          <div className="text-center text-[9px] font-black tracking-[0.18em] text-black uppercase mt-3 mb-1">
            ¡GRACIAS POR SU PREFERENCIA!
          </div>
          <div className="text-center text-[7.5px] text-neutral-400 font-mono">
            JBM CITRICOS ERP v2.4 • 80MM POS ENGINE
          </div>

          {/* Bottom Perforation / Tear Notch (Visual Only) */}
          <div className="absolute -bottom-1.5 left-0 right-0 h-3 flex overflow-hidden no-print opacity-60 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 bg-slate-200 rotate-45 transform -translate-y-1.5 shrink-0" />
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}
