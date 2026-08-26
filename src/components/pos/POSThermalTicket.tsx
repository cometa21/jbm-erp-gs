import React from 'react';
import { POSSale } from '../../types';
import { Printer, Download, Share2, CheckCircle2, X } from 'lucide-react';

interface POSThermalTicketProps {
  sale: POSSale;
  onClose: () => void;
}

export const POSThermalTicket: React.FC<POSThermalTicketProps> = ({ sale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*JBM CÍTRICOS - COMPROBANTE DE VENTA*\nFolio: ${sale.folio}\nFecha: ${new Date(sale.date).toLocaleString('es-MX')}\nCliente: ${sale.customer_name}\nTotal: $${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}\nPago: ${sale.payment_method}\n¡Gracias por su preferencia!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const items = sale.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header Actions */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Venta Registrada Exitosamente</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex gap-2 justify-center">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket 80mm
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
        </div>

        {/* Printable Ticket Receipt (80mm width look) */}
        <div className="p-6 bg-amber-50/40 font-mono text-slate-800 text-xs select-all">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="font-bold text-base text-slate-900 tracking-wider">JBM CÍTRICOS S.A. DE C.V.</h2>
            <p className="text-[11px] text-slate-600">DISTRIBUIDORA Y EMPAQUE DE CÍTRICOS</p>
            <p className="text-[10px] text-slate-500">Bodega I-42, Nave I, Central de Abasto CDMX</p>
            <p className="text-[10px] text-slate-500">RFC: JBM190412TK8 • Tel: (55) 5694-8820</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">FOLIO: {sale.folio}</span>
              <span>{new Date(sale.date).toLocaleDateString('es-MX')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>HORA: {new Date(sale.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>OP: {sale.operator || 'Ventas CDMX'}</span>
            </div>
            <div className="text-slate-700 pt-0.5">
              <span className="font-medium">CLIENTE:</span> {sale.customer_name}
            </div>
            {sale.customer_rfc && (
              <div className="text-slate-500 text-[10px]">
                <span>RFC: {sale.customer_rfc}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[11px] pb-1.5 text-slate-900">
              <span className="w-1/2">CONCEPTO</span>
              <span className="w-1/6 text-right">CANT</span>
              <span className="w-1/6 text-right">P.U.</span>
              <span className="w-1/6 text-right">TOTAL</span>
            </div>
            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="w-1/2 pr-1">
                    <div className="font-medium leading-tight text-slate-900">{item.name}</div>
                    <div className="text-[9px] text-slate-500">
                      {item.item_type === 'caja' ? `Lote: ${item.lot_code || 'CDMX'}` : `${item.qty} kg a granel`}
                    </div>
                  </div>
                  <div className="w-1/6 text-right text-slate-700">
                    {item.qty} {item.item_type === 'caja' ? 'cj' : 'kg'}
                  </div>
                  <div className="w-1/6 text-right text-slate-700">
                    ${item.unit_price.toFixed(2)}
                  </div>
                  <div className="w-1/6 text-right font-semibold text-slate-900">
                    ${(item.subtotal || item.qty * item.unit_price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>SUBTOTAL:</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>DESCUENTO:</span>
                <span>-${sale.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL A PAGAR:</span>
              <span>${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="font-medium">FORMA DE PAGO:</span>
              <span className="font-bold text-slate-900">{sale.payment_method.toUpperCase()}</span>
            </div>
            {sale.payment_method === 'Efectivo' && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>EFECTIVO RECIBIDO:</span>
                  <span>${sale.cash_received.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>CAMBIO:</span>
                  <span>${sale.cash_change.toFixed(2)}</span>
                </div>
              </>
            )}
            {sale.payment_reference && (
              <div className="flex justify-between text-slate-600">
                <span>REF / AUT:</span>
                <span>{sale.payment_reference}</span>
              </div>
            )}
            {sale.invoice_requested === 1 && (
              <div className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded font-medium text-center mt-1">
                * FACTURA FISCAL SOLICITADA EN MOSTRADOR *
              </div>
            )}
          </div>

          {/* QR Code & Barcode Simulation */}
          <div className="pt-3 text-center space-y-2">
            <div className="inline-block p-1.5 bg-white border border-slate-300 rounded-lg shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`JBM-${sale.folio}-${sale.total}`)}`}
                alt="Ticket QR"
                className="w-20 h-20 mx-auto"
              />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              * {sale.folio} *
            </p>
            <p className="text-[9px] text-slate-400">
              Gracias por su compra • Verifique su fruta antes de salir de bodega
            </p>
          </div>
        </div>

        {/* Footer Close */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Cerrar Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
