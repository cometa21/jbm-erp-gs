import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { POSSale, POSCartItem } from '../../types';
import { 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  FileText, 
  Sparkles, 
  X, 
  Receipt,
  Download
} from 'lucide-react';
import { Logo } from '../Logo';

interface POSThermalTicketProps {
  sale: POSSale;
  onClose: () => void;
  onPrint?: () => void;
  showToolbar?: boolean;
}

export const POSThermalTicket: React.FC<POSThermalTicketProps> = ({ 
  sale, 
  onClose, 
  onPrint,
  showToolbar = true 
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [paperTheme, setPaperTheme] = useState<'standard' | 'thermal-tint'>('standard');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const formattedDate = sale.date 
    ? new Date(sale.date).toLocaleString('es-MX', {
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

  const verificationUrl = `https://portal.jbmcitricos.com/ticket/${(sale.folio || 'pos-ticket').toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;

  // Copy structured text summary for WhatsApp / SMS
  const handleCopyWhatsApp = () => {
    const items = sale.items || [];
    const itemsList = items.map(it => 
      `• ${it.name} (${it.calibre || 'S/C'}) × ${it.qty} ${it.item_type === 'caja' ? 'cajas' : 'kg'}: $${(it.subtotal || it.qty * it.unit_price).toFixed(2)}`
    ).join('\n');

    const text = `🍋 *JBM CÍTRICOS - TICKET DE VENTA 80MM*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Folio:* ${sale.folio}\n` +
      `*Fecha:* ${formattedDate}\n` +
      `*Cliente:* ${sale.customer_name || 'Venta Mostrador'}\n` +
      `*Cajero:* ${sale.operator || 'Ventas CDMX'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*DETALLE DE PRODUCTOS:*\n${itemsList}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* $${(sale.subtotal || sale.total).toFixed(2)}\n` +
      (sale.discount_amount > 0 ? `*Descuento:* -$${sale.discount_amount.toFixed(2)}\n` : '') +
      `*IVA (0% Tasa Agrícola):* $0.00\n` +
      `💰 *TOTAL: $${(sale.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Forma de Pago:* ${sale.payment_method || 'Efectivo'}\n` +
      (sale.payment_method === 'Efectivo' && sale.cash_received ? `*Efectivo Recibido:* $${sale.cash_received.toFixed(2)}\n*Cambio:* $${(sale.cash_change || 0).toFixed(2)}\n` : '') +
      (sale.payment_reference ? `*Ref / Aut:* ${sale.payment_reference}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Verificar ticket: ${verificationUrl}\n` +
      `¡Gracias por su compra! • Bodega I-42 CEDA CDMX`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const items: POSCartItem[] = sale.items || [];
  const totalBoxes = items.filter(i => i.item_type === 'caja').reduce((sum, i) => sum + i.qty, 0);
  const totalKg = items.reduce((sum, i) => sum + (i.kg_total || (i.item_type === 'caja' ? i.qty * 18.14 : i.qty)), 0);

  // Pseudo-Barcode visual generator
  const barcodePattern = [2,1,3,1,2,3,1,2,1,3,2,1,1,3,2,1,3,1,2,1,3,2,1,2,3,1,1,2,3,2,1,3,1,2,1,3];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      
      {/* TOOLBAR CONTROLS (Hidden on print via .no-print) */}
      {showToolbar && (
        <div className="w-full max-w-xl mb-3 bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Ticket Térmico POS
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-bold">
                  {paperWidth}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Formato estándar 80mm (.thermal-receipt)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Width Switcher */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded-md font-bold transition-all text-xs ${
                  paperWidth === '80mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Ancho estándar punto de venta (80mm / 48 columnas)"
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded-md font-bold transition-all text-xs ${
                  paperWidth === '58mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Ancho compacto portátil (58mm / 32 columnas)"
              >
                58mm
              </button>
            </div>

            {/* Paper Theme Toggle */}
            <button
              type="button"
              onClick={() => setPaperTheme(prev => prev === 'standard' ? 'thermal-tint' : 'standard')}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                paperTheme === 'thermal-tint' 
                  ? 'bg-amber-950 border-amber-600 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Alternar tono de papel térmico (Blanco / Tintado)"
            >
              <Sparkles size={14} />
            </button>

            {/* Zoom Controls */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 10))}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title="Reducir zoom"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[10px] font-mono font-bold px-1 text-slate-300">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {/* WhatsApp Text */}
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Copiar texto formateado para WhatsApp o SMS"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="text-[11px] font-semibold">{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            {/* Native Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
              title="Imprimir ticket en impresora térmica de 80mm"
            >
              <Printer size={15} />
              <span>Imprimir 80mm</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer"
              title="Cerrar vista previa de ticket"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PAPER ROLL WRAPPER & CONTAINER */}
      <div 
        id="print-modal-container"
        className="w-full flex justify-center overflow-x-auto py-2 transition-transform duration-200"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
      >
        {/* ========================================================================= */}
        {/* THE 80MM THERMAL RECEIPT (.thermal-receipt targeted in index.css @media print) */}
        {/* ========================================================================= */}
        <div
          ref={receiptRef}
          id="thermal-receipt-printable"
          className={`thermal-receipt font-mono relative select-none rounded-xs border transition-all ${
            paperWidth === '80mm' ? 'w-[320px] max-w-[320px]' : 'w-[240px] max-w-[240px]'
          } ${
            paperTheme === 'thermal-tint' 
              ? 'bg-[#faf8f2] text-[#111827] border-amber-200/80 shadow-2xl' 
              : 'bg-white text-black border-slate-300 shadow-2xl'
          }`}
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', Courier, Monaco, monospace",
            padding: paperWidth === '80mm' ? '16px 12px' : '12px 8px',
            lineHeight: 1.25
          }}
        >
          {/* Top Perforation / Tear Notch (Visual decoration) */}
          <div className="absolute -top-1.5 left-0 right-0 h-3 flex overflow-hidden no-print opacity-60 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 bg-slate-200 rotate-45 transform -translate-y-1.5 shrink-0" />
            ))}
          </div>

          {/* 1. BRAND HEADER & TAX IDENTIFICATION */}
          <div className="flex flex-col items-center text-center">
            <Logo variant="mono" className="scale-85 mb-1" />

            <div className="text-[13px] font-black tracking-wider text-black uppercase mt-1">
              JBM CÍTRICOS S.A. DE C.V.
            </div>
            <div className="text-[9px] text-neutral-700 font-bold uppercase tracking-tight">
              EMPAQUE & COMERCIALIZADORA DE CÍTRICOS
            </div>
            <div className="text-[8px] text-neutral-600 mt-0.5">
              Bodega I-42, Nave I • Central de Abasto CDMX
            </div>
            <div className="text-[8px] text-neutral-600">
              Matriz: Martínez de la Torre, Ver. • Tel: (55) 5694-8820
            </div>
            <div className="text-[8px] text-neutral-700 font-bold uppercase mt-0.5">
              RFC: JBM190412TK8 • SENASICA: MICH-EMP-0412
            </div>

            {/* Ticket Folio Highlight Bar */}
            <div className="w-full border-t border-b border-black py-1.5 my-2 text-center bg-black text-white">
              <div className="text-[9px] font-bold tracking-widest uppercase">
                COMPROBANTE DE VENTA POS
              </div>
              <div className="text-xl font-black tracking-tight my-0.5 font-mono">
                {sale.folio || 'VTA-00000'}
              </div>
              <div className="text-[8px] tracking-wider text-neutral-300 font-normal uppercase">
                BODEGA CDMX NAVE I-42
              </div>
            </div>

            {/* Date & Time */}
            <div className="text-[9.5px] text-neutral-700 font-semibold tracking-tight">
              {formattedDate}
            </div>
          </div>

          {/* Dotted Separator */}
          <div className="border-b border-dashed border-black my-2" />

          {/* 2. CUSTOMER & CASHIER METADATA */}
          <div className="space-y-1 text-[10.5px] leading-tight">
            <div className="flex justify-between items-start gap-1">
              <span className="font-bold text-neutral-600 uppercase text-[9.5px] shrink-0">CLIENTE:</span>
              <span className="font-black text-right text-black uppercase truncate max-w-[190px]">
                {sale.customer_name || 'VENTA MOSTRADOR'}
              </span>
            </div>

            {sale.customer_rfc && (
              <div className="flex justify-between items-center gap-1">
                <span className="font-bold text-neutral-600 uppercase text-[9px] shrink-0">RFC:</span>
                <span className="font-bold text-right text-neutral-900 text-[9.5px] font-mono">
                  {sale.customer_rfc}
                </span>
              </div>
            )}

            {sale.customer_phone && (
              <div className="flex justify-between items-center gap-1">
                <span className="font-bold text-neutral-600 uppercase text-[9px] shrink-0">TEL / WA:</span>
                <span className="font-semibold text-right text-neutral-800 text-[9.5px] font-mono">
                  {sale.customer_phone}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-1">
              <span className="font-bold text-neutral-600 uppercase text-[9.5px] shrink-0">CAJERO / OP:</span>
              <span className="font-bold text-right text-black uppercase truncate max-w-[190px]">
                {sale.operator || 'VENTAS CDMX'}
              </span>
            </div>
          </div>

          {/* Dotted Separator */}
          <div className="border-b border-dashed border-black my-2" />

          {/* 3. ITEMS TABLE */}
          <div>
            <div className="flex justify-between font-black text-[9.5px] pb-1 border-b border-black text-black uppercase">
              <span className="w-[44%] text-left">CONCEPTO</span>
              <span className="w-[18%] text-center">CANT</span>
              <span className="w-[18%] text-right">P.U.</span>
              <span className="w-[20%] text-right">TOTAL</span>
            </div>

            <div className="divide-y divide-dashed divide-neutral-300 py-1 space-y-1 text-[10.5px]">
              {items.map((item, idx) => {
                const isBox = item.item_type === 'caja';
                const sub = item.subtotal || (item.qty * item.unit_price);
                const hasItemDiscount = (item.discount_amount && item.discount_amount > 0) || (item.original_price && item.original_price > item.unit_price);
                const origSub = item.original_price ? (item.original_price * item.qty) : (sub + (item.discount_amount || 0));

                return (
                  <div key={idx} className="pt-1">
                    <div className="flex justify-between items-start leading-tight">
                      <div className="w-[44%] pr-1">
                        <span className="font-black text-black uppercase block truncate">
                          {item.name}
                        </span>
                        <span className="text-[8px] text-neutral-500 block truncate">
                          Cal: {item.calibre || 'S/C'} • Lote: {item.lot_code || 'CDMX'}
                        </span>
                        {hasItemDiscount && (
                          <span className="text-[8px] font-bold text-red-700 block truncate">
                            * Descuento: -${(item.discount_amount || (origSub - sub)).toFixed(2)} {item.discount_reason ? `(${item.discount_reason})` : ''}
                          </span>
                        )}
                      </div>
                      <div className="w-[18%] text-center font-bold text-neutral-800 text-[10px]">
                        {item.qty} {isBox ? 'cj' : 'kg'}
                      </div>
                      <div className="w-[18%] text-right font-mono text-neutral-800 text-[10px]">
                        {hasItemDiscount && (
                          <span className="line-through text-neutral-400 text-[8px] block">
                            ${(item.original_price || (origSub / item.qty)).toFixed(2)}
                          </span>
                        )}
                        <span>${item.unit_price.toFixed(2)}</span>
                      </div>
                      <div className="w-[20%] text-right font-black font-mono text-black text-[10.5px]">
                        ${sub.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dotted Separator */}
          <div className="border-b border-dashed border-black my-2" />

          {/* 4. FINANCIAL BREAKDOWN & TOTAL */}
          <div className="space-y-1 text-[10.5px] leading-tight">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-600 uppercase text-[9.5px]">ARTÍCULOS / VOLUMEN:</span>
              <span className="font-bold text-neutral-800 font-mono text-[10px]">
                {items.length} arts • {totalBoxes > 0 ? `${totalBoxes} cjs • ` : ''}{totalKg.toFixed(1)} kg
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-600 uppercase text-[9.5px]">SUBTOTAL:</span>
              <span className="font-bold text-black font-mono text-[11px]">
                ${(sale.subtotal || sale.total).toFixed(2)}
              </span>
            </div>

            {sale.discount_amount > 0 && (
              <div className="space-y-0.5 pt-0.5">
                <div className="flex justify-between items-center text-red-700">
                  <span className="font-bold uppercase text-[9.5px]">
                    DESCUENTO {sale.discount_percent > 0 ? `(${sale.discount_percent}%)` : 'GLOBAL'}:
                  </span>
                  <span className="font-black font-mono text-[11px]">
                    - ${sale.discount_amount.toFixed(2)}
                  </span>
                </div>
                {sale.discount_reason && (
                  <div className="text-[8px] text-neutral-600 italic">
                    Motivo: {sale.discount_reason}
                  </div>
                )}
                {sale.discount_authorized_by && (
                  <div className="text-[8px] text-neutral-600 font-bold">
                    Autorizó: {sale.discount_authorized_by}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-neutral-600">
              <span className="font-bold uppercase text-[9px]">IVA (0% TASA AGRÍCOLA):</span>
              <span className="font-bold font-mono text-[10px]">$0.00</span>
            </div>

            {/* SOLID INVERTED BANNER: GRAND TOTAL */}
            <div className="bg-black text-white px-2.5 py-2 flex justify-between items-center font-mono my-2 rounded-xs">
              <div>
                <div className="text-[9px] font-black tracking-wider uppercase">TOTAL A PAGAR</div>
                <div className="text-[7.5px] text-neutral-300 uppercase">MONEDA NACIONAL MXN</div>
              </div>
              <div className="text-[17px] font-black tracking-tight">
                ${(sale.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 5. PAYMENT METHOD & CHANGE */}
          <div className="space-y-1 text-[10.5px] leading-tight pt-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-600 uppercase text-[9.5px]">MÉTODO DE PAGO:</span>
              <span className="font-black text-black uppercase font-mono text-[10px]">
                {sale.payment_method || 'EFECTIVO'}
              </span>
            </div>

            {sale.payment_method === 'Efectivo' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-600 uppercase text-[9.5px]">EFECTIVO RECIBIDO:</span>
                  <span className="font-bold text-neutral-900 font-mono text-[10.5px]">
                    ${(sale.cash_received || sale.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-neutral-100 px-1 py-0.5 rounded">
                  <span className="font-black text-black uppercase text-[10px]">CAMBIO:</span>
                  <span className="font-black text-black font-mono text-[12px]">
                    ${(sale.cash_change || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {sale.payment_reference && (
              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-600 uppercase text-[9px]">REF / AUTORIZACIÓN:</span>
                <span className="font-bold text-neutral-900 font-mono text-[9.5px]">
                  {sale.payment_reference}
                </span>
              </div>
            )}

            {sale.invoice_requested === 1 && (
              <div className="my-1.5 p-1 bg-amber-50 border border-dashed border-amber-400 text-amber-900 text-[8.5px] font-bold text-center uppercase tracking-wide rounded">
                * FACTURA FISCAL CFDI 4.0 SOLICITADA *
              </div>
            )}
          </div>

          {/* 6. QR CODE & VERIFICATION */}
          <div className="border border-dashed border-black rounded-lg p-2 my-2.5 flex flex-col items-center justify-center bg-white text-center">
            <div className="p-1 bg-white border border-neutral-300 rounded mb-1">
              <QRCodeSVG
                value={verificationUrl}
                size={paperWidth === '80mm' ? 95 : 75}
                level="M"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <div className="text-[8.5px] font-black tracking-wider uppercase text-black">
              CONSULTA ELECTRÓNICA DE TICKET
            </div>
            <div className="text-[7.5px] text-neutral-600 font-mono tracking-tighter truncate max-w-[210px]">
              {verificationUrl}
            </div>
          </div>

          {/* 7. SIMULATED BARCODE */}
          <div className="flex flex-col items-center my-1.5">
            <div className="flex items-center gap-[2px] h-7 overflow-hidden">
              {barcodePattern.map((width, idx) => (
                <div
                  key={idx}
                  className="bg-black h-full"
                  style={{ width: `${width * 1.3}px` }}
                />
              ))}
            </div>
            <span className="text-[8px] font-mono tracking-widest text-neutral-700 mt-0.5">
              *{(sale.folio || 'VTA000').replace(/[^a-zA-Z0-9]/g, '')}*
            </span>
          </div>

          {/* 8. SIGNATURES / POLICIES */}
          <div className="text-[7.5px] text-neutral-600 text-center leading-tight mb-2">
            Revise su producto al momento de entrega en bodega. No se aceptan reclamaciones posteriores al retiro de mercancía.
          </div>

          <div className="grid grid-cols-2 gap-2 text-center my-2 pt-1 border-t border-black">
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-black pb-3 mb-0.5"></div>
              <span className="text-[7.5px] font-black uppercase text-black">
                {sale.operator || 'CAJERO'}
              </span>
              <span className="text-[6.5px] text-neutral-500 uppercase">JBM MOSTRADOR</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-black pb-3 mb-0.5"></div>
              <span className="text-[7.5px] font-black uppercase text-black truncate max-w-[100px]">
                {sale.customer_name || 'CLIENTE'}
              </span>
              <span className="text-[6.5px] text-neutral-500 uppercase">RECIBÍ CONFORME</span>
            </div>
          </div>

          {/* 9. FOOTER SLOGAN */}
          <div className="text-center text-[9px] font-black tracking-[0.16em] text-black uppercase mt-2 mb-0.5">
            ¡GRACIAS POR SU COMPRA!
          </div>
          <div className="text-center text-[7px] text-neutral-500 font-mono">
            JBM CÍTRICOS ERP v2.4 • 80MM THERMAL ENGINE
          </div>

          {/* Bottom Perforation / Tear Notch */}
          <div className="absolute -bottom-1.5 left-0 right-0 h-3 flex overflow-hidden no-print opacity-60 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 bg-slate-200 rotate-45 transform -translate-y-1.5 shrink-0" />
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};
