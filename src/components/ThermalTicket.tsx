import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Share2, Copy, Check, Eye } from 'lucide-react';
import { Logo } from './Logo';

export interface TicketData {
  folio?: string;
  scale_ticket_folio?: string;
  date?: string;
  producer_name?: string;
  origin?: string;
  orchard?: string;
  variety?: string;
  quality?: string;
  weight_gross: number;
  weight_tare: number;
  weight_net: number;
  price_per_kg: number;
  subtotal: number;
  scale_fee: number;
  scale_fee_payment?: 'descuento' | 'efectivo';
  extra_charge_per_kg?: number;
  extra_charge_total?: number;
  extra_charge_concept?: string;
  total: number;
  operator?: string;
  notes?: string;
  isOffline?: boolean;
}

interface ThermalTicketProps {
  data: TicketData;
  isLivePreview?: boolean;
  showActions?: boolean;
  onPrint?: () => void;
  className?: string;
}

export function ThermalTicket({
  data,
  isLivePreview = false,
  showActions = true,
  onPrint,
  className = ''
}: ThermalTicketProps) {
  const [copied, setCopied] = React.useState(false);

  const isOfflineTicket = data.isOffline || Boolean(data.folio && (data.folio.includes('TEMPORAL') || data.folio.includes('OFF-')));
  const displayFolio = data.folio || '#PENDIENTE';
  const displayScaleFolio = data.scale_ticket_folio || displayFolio;
  const isScaleDeducted = data.scale_fee_payment !== 'efectivo';
  const extraKgRate = data.extra_charge_per_kg ?? 0.40;
  const extraChargeTotal = data.extra_charge_total ?? ((data.weight_net || 0) * extraKgRate);
  const extraChargeConcept = data.extra_charge_concept || 'Servicios operativos / Maniobra';

  const displayDate = data.date 
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

  const portalUrl = `https://portal.jbmcitricos.com/status/${data.folio ? data.folio.toLowerCase() : 'nuevo'}`;

  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const handleCopySummary = () => {
    const scaleLine = isScaleDeducted
      ? `Cuota Báscula: -$${(data.scale_fee || 0).toFixed(2)} (A Descontar)`
      : `Cuota Báscula: $${(data.scale_fee || 0).toFixed(2)} (Pagado en Efectivo)`;
    const extraLine = extraChargeTotal > 0
      ? `\n${extraChargeConcept} ($${extraKgRate.toFixed(2)}/kg): -$${extraChargeTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
      : '';

    const text = `*JBM CÍTRICOS BARRAGÁN - TICKET DE RECEPCIÓN*\nFolio Báscula: ${displayScaleFolio}\nFolio Interno: ${displayFolio}\nFecha: ${displayDate}\nProductor: ${data.producer_name || 'SIN ASIGNAR'}\nOrigen: ${data.origin || 'Cosecha propia'}\nHuerto: ${data.orchard || 'Pedernales'}\n\n*PESOS:*\nBruto: ${(data.weight_gross || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg\nTara: ${(data.weight_tare || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg\n*NETO: ${(data.weight_net || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg*\n\nPrecio/kg: $${(data.price_per_kg || 0).toFixed(2)}\nSubtotal Fruta: $${(data.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n${scaleLine}${extraLine}\n*TOTAL A LIQUIDAR: $${(data.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}*\n\nConsulta en: ${portalUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Action Controls Header (Hidden on Print) */}
      {showActions && (
        <div className="w-full max-w-[340px] flex items-center justify-between mb-3 px-1 no-print">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isLivePreview && (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Vista Previa Térmica
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              title="Copiar resumen para WhatsApp"
              className="p-1.5 bg-white border border-slate-200 text-slate-700 hover:text-brand-primary rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span className="text-[11px] font-semibold">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleNativePrint}
              title="Imprimir en Ticketera Térmica (80mm)"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      )}

      {/* THE THERMAL RECEIPT CONTAINER (Matches ticket-jbm.jpeg) */}
      <div 
        id="thermal-receipt-printable"
        className="thermal-receipt bg-white text-black w-full max-w-[340px] p-6 rounded-md shadow-lg border border-neutral-200/80 font-mono relative select-none"
        style={{
          fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
          color: '#111827'
        }}
      >
        {/* Top Header */}
        <div className="flex flex-col items-center text-center">
          <Logo variant="mono" className="mb-1" />

          <div className="text-[11px] font-bold tracking-widest text-neutral-600 uppercase mt-2">
            {data.scale_ticket_folio ? 'TICKET DE BÁSCULA' : 'FOLIO DE BÁSCULA'}
          </div>
          <div className="text-2xl font-black tracking-tight text-black my-0.5">
            {displayScaleFolio}
          </div>
          {data.scale_ticket_folio && (
            <div className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">
              FOLIO ERP: {displayFolio}
            </div>
          )}
          {isOfflineTicket && (
            <div className="my-1.5 px-2 py-1 bg-amber-100 border border-amber-400 text-amber-950 rounded text-[9px] font-black text-center uppercase tracking-wider">
              ⚠️ GUARDADO TEMPORAL OFFLINE • SINCRONIZACIÓN PENDIENTE
            </div>
          )}
          <div className="text-[11px] text-neutral-700 font-medium tracking-tight mt-0.5">
            {displayDate}
          </div>
        </div>

        {/* Dashed Line */}
        <div className="border-b border-dashed border-neutral-400 my-3.5" />

        {/* Producer & Origin Meta */}
        <div className="space-y-1.5 text-[12px] leading-tight">
          <div className="flex justify-between items-start gap-2">
            <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px] shrink-0">PRODUCTOR</span>
            <span className="font-bold text-right text-black uppercase truncate">
              {data.producer_name || 'SIN ASIGNAR'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px] shrink-0">VARIEDAD</span>
            <span className="font-bold text-right text-neutral-900 uppercase truncate">
              {data.variety || 'LIMÓN MEXICANO'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px] shrink-0">ORIGEN</span>
            <span className="font-medium text-right text-neutral-800 truncate">
              {data.origin || 'Cosecha propia'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px] shrink-0">HUERTO</span>
            <span className="font-medium text-right text-neutral-800 truncate">
              {data.orchard || 'Pedernales'}
            </span>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center text-[11px] font-black tracking-widest uppercase text-neutral-700 mt-4 mb-2">
          DETALLE DE PESO (KG)
        </div>

        {/* Weights Section */}
        <div className="space-y-1 text-[13px] leading-tight">
          <div className="flex justify-between items-center">
            <span className="font-bold tracking-wider uppercase text-neutral-700 text-[12px]">BRUTO</span>
            <span className="font-bold text-neutral-900">
              {(data.weight_gross || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold tracking-wider uppercase text-neutral-700 text-[12px]">TARA</span>
            <span className="font-bold text-neutral-900">
              - {(data.weight_tare || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Dashed Line */}
        <div className="border-b border-dashed border-neutral-400 my-2.5" />

        {/* NET WEIGHT (Highlighted) */}
        <div className="flex justify-between items-center py-0.5">
          <span className="text-base font-black tracking-wider text-black">NETO</span>
          <span className="text-xl font-black text-black tracking-tight">
            {(data.weight_net || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </span>
        </div>

        {/* Dashed Line */}
        <div className="border-b border-dashed border-neutral-400 my-2.5" />

        {/* Pricing / Breakdown */}
        <div className="space-y-1.5 text-[12px] leading-tight">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px]">PRECIO/KG</span>
            <span className="font-bold text-neutral-900">
              ${(data.price_per_kg || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px]">SUBTOTAL FRUTA</span>
            <span className="font-bold text-neutral-900">
              ${(data.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
              CUOTA BÁSCULA {isScaleDeducted ? '(DESCUENTO)' : '(PAGADO EF.)'}
            </span>
            <span className={`font-bold ${isScaleDeducted ? 'text-red-700' : 'text-neutral-700'}`}>
              {isScaleDeducted ? '- ' : ''}${(data.scale_fee || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {extraChargeTotal > 0 && (
            <div className="flex justify-between items-start gap-1">
              <span className="text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                CARGOS OP. (${extraKgRate.toFixed(2)}/KG)
              </span>
              <span className="font-bold text-red-700 text-right">
                - ${(extraChargeTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* SOLID BLACK INVERTED BAR (TOTAL) */}
        <div className="bg-black text-white px-3 py-2 flex justify-between items-center font-mono my-3.5 rounded-sm">
          <span className="text-xs font-black tracking-wider uppercase">TOTAL A LIQUIDAR</span>
          <span className="text-lg font-black tracking-tight">
            ${(data.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* QR Code Verification Box */}
        <div className="border border-dashed border-neutral-400 rounded-2xl p-3.5 my-4 flex flex-col items-center justify-center bg-neutral-50/70 text-center">
          <div className="p-1.5 bg-white rounded-lg border border-neutral-200 shadow-xs mb-2">
            <QRCodeSVG
              value={portalUrl}
              size={110}
              level="M"
              includeMargin={false}
              fgColor="#111827"
              bgColor="#ffffff"
            />
          </div>
          <div className="text-[10px] font-black tracking-wider uppercase text-neutral-800">
            CONSULTA TU PAGO
          </div>
          <div className="text-[9px] text-neutral-600 font-mono tracking-tighter truncate max-w-[240px] mt-0.5">
            {portalUrl}
          </div>
        </div>

        {/* Signature Lines */}
        <div className="border-t border-neutral-900 pt-2 mt-4" />
        <div className="grid grid-cols-2 gap-4 text-center my-3">
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-neutral-800 pb-4 mb-1"></div>
            <span className="text-[9px] font-black tracking-wider text-neutral-700 uppercase">
              FIRMA OPERADOR
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-neutral-800 pb-4 mb-1"></div>
            <span className="text-[9px] font-black tracking-wider text-neutral-700 uppercase">
              FIRMA PRODUCTOR
            </span>
          </div>
        </div>

        {/* Footer Slogan */}
        <div className="text-center text-[10px] font-black tracking-[0.2em] text-neutral-800 uppercase mt-4 mb-1">
          GRACIAS POR SU PREFERENCIA
        </div>

        {/* Serrated receipt edge design for aesthetics */}
        <div className="absolute -bottom-1.5 left-0 right-0 h-3 flex overflow-hidden no-print opacity-75">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-slate-100 rotate-45 transform -translate-y-1.5 shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
