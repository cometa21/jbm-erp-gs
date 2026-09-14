/**
 * JBM CÍTRICOS PREMIUM ERP - THERMAL RECEIPT PRINTING UTILITY
 * 
 * Reusable utility for printing 80mm/58mm thermal receipts and weight tickets
 * directly to connected thermal POS printers (Epson, Star Micronics, Munbyn, etc.).
 * 
 * Leverages the '.thermal-receipt' CSS class and standard high-contrast thermal
 * typography and layout defined in the application's stylesheet.
 */

import { Batch } from '../types';

export interface WeightTicketReceiptData {
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

export interface ThermalPrintOptions {
  paperWidth?: '80mm' | '58mm';
  copies?: number;
  autoPrint?: boolean;
  showCutLine?: boolean;
  customFooter?: string;
  title?: string;
}

/**
 * Normalizes either a Batch entity or a partial receipt object into a complete WeightTicketReceiptData object.
 */
export function formatBatchToReceiptData(batch: Batch | Partial<WeightTicketReceiptData>): WeightTicketReceiptData {
  const isBatch = 'id' in batch && typeof (batch as Batch).id === 'number';
  const idStr = isBatch ? String((batch as Batch).id).padStart(5, '0') : '00001';
  
  const folio = batch.folio || `#REC-${idStr}`;
  const scale_ticket_folio = batch.scale_ticket_folio || folio;
  
  const weight_gross = Number(batch.weight_gross) || 0;
  const weight_tare = Number(batch.weight_tare) || 0;
  const weight_net = Number(batch.weight_net) || Math.max(0, weight_gross - weight_tare);
  
  const price_per_kg = Number(batch.price_per_kg) || 18.50;
  const subtotal = Number(batch.subtotal) || (weight_net * price_per_kg);
  const scale_fee = Number(batch.scale_fee) ?? 50;
  const scale_fee_payment = batch.scale_fee_payment || 'descuento';
  
  const extra_charge_per_kg = Number(batch.extra_charge_per_kg) ?? 0.40;
  const extra_charge_total = Number(batch.extra_charge_total) ?? (weight_net * extra_charge_per_kg);
  const extra_charge_concept = batch.extra_charge_concept || 'Servicios operativos y maniobra';
  
  const scaleDeduction = scale_fee_payment === 'descuento' ? scale_fee : 0;
  const calculatedTotal = Math.max(0, subtotal - scaleDeduction - extra_charge_total);
  const total = Number(batch.total) || calculatedTotal;
  
  return {
    folio,
    scale_ticket_folio,
    date: batch.date || new Date().toISOString(),
    producer_name: batch.producer_name || 'SIN ASIGNAR',
    producer_rfc: (batch as any).producer_rfc || '',
    origin: batch.origin || 'Cosecha propia',
    orchard: batch.orchard || 'Pedernales',
    orchard_senasica: (batch as any).orchard_senasica || '',
    variety: batch.variety || 'Limón Mexicano',
    quality: batch.quality || 'Exportación 1ra',
    plates: (batch as any).plates || '',
    driver_name: (batch as any).driver_name || '',
    weight_gross,
    weight_tare,
    weight_net,
    moisture_deduction_kg: Number((batch as any).moisture_deduction_kg) || 0,
    payable_net_kg: Number((batch as any).payable_net_kg) || weight_net,
    price_per_kg,
    subtotal,
    scale_fee,
    scale_fee_payment,
    extra_charge_per_kg,
    extra_charge_total,
    extra_charge_concept,
    total,
    operator: batch.operator || 'Carlos Barragán',
    notes: batch.notes || '',
    isOffline: Boolean((batch as any).isOffline || (batch.folio && (batch.folio.includes('TEMPORAL') || batch.folio.includes('OFF-')))),
    cut_turn: (batch as any).cut_turn || 'Matutino'
  };
}

/**
 * Generates the clean HTML string decorated with the `.thermal-receipt` class
 * designed for direct 80mm / 58mm thermal ticket printers.
 */
export function generateThermalReceiptHTML(
  inputData: Batch | WeightTicketReceiptData,
  options: ThermalPrintOptions = {}
): string {
  const data = formatBatchToReceiptData(inputData);
  const paperWidth = options.paperWidth || '80mm';
  const widthMm = paperWidth === '58mm' ? '54mm' : '76mm';
  const maxContainerWidth = paperWidth === '58mm' ? '240px' : '320px';
  
  const isScaleDeducted = data.scale_fee_payment !== 'efectivo';
  const payableNetKg = data.payable_net_kg ?? Math.max(0, data.weight_net - (data.moisture_deduction_kg || 0));
  
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
  
  // Barcode lines pattern
  const barcodeBars = [3,1,2,1,3,2,1,2,3,1,1,2,3,2,1,3,1,2,1,3,2,1,2,3,1,1,2,3,2,1,3,1,2,1,3];
  const barcodeHtml = barcodeBars
    .map(w => `<div style="background-color: #000000; height: 34px; width: ${w * 1.3}px; display: inline-block; margin-right: 1.5px;"></div>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${options.title || `Boleta Báscula - ${data.scale_ticket_folio || data.folio}`}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      background: #ffffff;
      color: #000000;
      font-family: 'JetBrains Mono', 'Courier New', Courier, Monaco, monospace;
      font-size: 11px;
      line-height: 1.25;
      display: flex;
      justify-content: center;
      padding: 10px 0;
    }

    /* THE REQUIRED THERMAL-RECEIPT CLASS */
    .thermal-receipt {
      font-family: 'JetBrains Mono', 'Courier New', Courier, Monaco, monospace;
      letter-spacing: -0.01em;
      width: ${widthMm};
      max-width: ${maxContainerWidth};
      background: #ffffff;
      color: #000000;
      padding: 4mm 3mm;
      margin: 0 auto;
    }

    .dashed-line {
      border-bottom: 1px dashed #000000;
      margin: 7px 0;
      width: 100%;
    }

    .solid-line {
      border-bottom: 1px solid #000000;
      margin: 7px 0;
      width: 100%;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }

    .bold { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .folio-box {
      border-top: 1px solid #000000;
      border-bottom: 1px solid #000000;
      background-color: #000000;
      color: #ffffff;
      padding: 5px 2px;
      margin: 6px 0;
      text-align: center;
    }

    .highlight-box {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      margin: 4px 0;
      border-radius: 2px;
    }

    .total-banner {
      background-color: #000000;
      color: #ffffff;
      padding: 6px 8px;
      margin: 7px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .signature-box {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      padding-top: 4px;
      gap: 12px;
    }

    .signature-col {
      flex: 1;
      text-align: center;
    }

    .signature-line {
      border-bottom: 1px solid #000000;
      height: 24px;
      margin-bottom: 4px;
    }

    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
      }
      .thermal-receipt {
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 1.5mm 2.5mm !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="thermal-receipt">
    <!-- BRAND HEADER -->
    <div class="text-center">
      <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.05em;">JBM CÍTRICOS BARRAGÁN</div>
      <div style="font-size: 9px; font-weight: 700;" class="uppercase">EMPAQUE & ACOPIO DE LIMÓN MEXICANO</div>
      <div style="font-size: 8.5px; margin-top: 2px;">Carretera Apatzingán-Cuatro Caminos Km 4.5</div>
      <div style="font-size: 8.5px;">Apatzingán, Michoacán • Tel. (453) 534-0192</div>
      <div style="font-size: 8px; font-weight: 700; margin-top: 2px;" class="uppercase">
        RFC: CBR-891024-JBM • REG. SENASICA: MICH-EMP-0412
      </div>
      
      ${data.isOffline ? `
        <div style="margin: 5px 0; padding: 3px; border: 1px dashed #000; background: #fff; font-size: 8.5px; font-weight: 900;" class="uppercase text-center">
          ⚠️ BOLETA OFFLINE • SINCRONIZACIÓN PENDIENTE
        </div>
      ` : ''}

      <!-- FOLIO HIGHLIGHT -->
      <div class="folio-box">
        <div style="font-size: 8.5px; letter-spacing: 0.1em; font-weight: 700;" class="uppercase">
          ${data.scale_ticket_folio ? 'TICKET BÁSCULA CERTIFICADO' : 'BOLETA DE ENTRADA'}
        </div>
        <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.02em; margin: 1px 0;">
          ${data.scale_ticket_folio || data.folio}
        </div>
        ${data.scale_ticket_folio ? `
          <div style="font-size: 8px; color: #e2e8f0; font-weight: normal;">
            CONTROL ERP: ${data.folio}
          </div>
        ` : ''}
      </div>

      <div style="font-size: 9.5px; font-weight: 700; margin-bottom: 2px;">
        ${formattedDate} ${data.cut_turn ? `• Turno ${data.cut_turn}` : ''}
      </div>
    </div>

    <div class="dashed-line"></div>

    <!-- PRODUCER & TRACEABILITY -->
    <div>
      <div class="row">
        <span style="font-size: 9px; font-weight: 700; color: #333;" class="uppercase">PRODUCTOR:</span>
        <span style="font-size: 11px; font-weight: 900;" class="uppercase text-right">${data.producer_name}</span>
      </div>
      ${data.producer_rfc ? `
        <div class="row">
          <span style="font-size: 8.5px; font-weight: 700; color: #555;" class="uppercase">RFC:</span>
          <span style="font-size: 9px; font-weight: 700;">${data.producer_rfc}</span>
        </div>
      ` : ''}
      <div class="row">
        <span style="font-size: 9px; font-weight: 700; color: #333;" class="uppercase">HUERTO:</span>
        <span style="font-size: 10px; font-weight: 900;" class="uppercase text-right">${data.orchard}</span>
      </div>
      <div class="row">
        <span style="font-size: 9px; font-weight: 700; color: #333;" class="uppercase">ORIGEN:</span>
        <span style="font-size: 10px; font-weight: 700;" class="uppercase text-right">${data.origin}</span>
      </div>
      <div class="row">
        <span style="font-size: 9px; font-weight: 700; color: #333;" class="uppercase">VARIEDAD:</span>
        <span style="font-size: 10px; font-weight: 900;" class="uppercase text-right">${data.variety}</span>
      </div>
      ${data.plates ? `
        <div class="row">
          <span style="font-size: 9px; font-weight: 700; color: #333;" class="uppercase">PLACAS:</span>
          <span style="font-size: 9.5px; font-weight: 700;" class="uppercase">${data.plates}</span>
        </div>
      ` : ''}
    </div>

    <div class="dashed-line"></div>

    <!-- WEIGH-IN BREAKDOWN -->
    <div>
      <div class="text-center" style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.08em; margin-bottom: 4px;">
        ── DETALLE DE PESO (BÁSCULA) ──
      </div>

      <div class="row">
        <span style="font-size: 10px; font-weight: 700;" class="uppercase">PESO BRUTO (ENTRADA):</span>
        <span style="font-size: 11px; font-weight: 700;">${data.weight_gross.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
      </div>

      <div class="row">
        <span style="font-size: 10px; font-weight: 700;" class="uppercase">PESO TARA (VEHÍCULO):</span>
        <span style="font-size: 11px; font-weight: 700;">- ${data.weight_tare.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
      </div>

      <div class="dashed-line"></div>

      <div class="highlight-box row" style="align-items: center; margin: 2px 0;">
        <span style="font-size: 11.5px; font-weight: 900;" class="uppercase">PESO NETO FRUTA:</span>
        <span style="font-size: 13.5px; font-weight: 900;">${data.weight_net.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
      </div>

      ${data.moisture_deduction_kg ? `
        <div class="row" style="color: #991b1b; font-size: 9.5px; font-weight: 700; margin-top: 3px;">
          <span class="uppercase">DESC. HUMEDAD / AGUA:</span>
          <span>- ${data.moisture_deduction_kg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg</span>
        </div>
      ` : ''}

      ${payableNetKg !== data.weight_net ? `
        <div class="row" style="font-size: 10px; font-weight: 900; margin-top: 2px;">
          <span class="uppercase">NETO LIQUIDABLE:</span>
          <span>${payableNetKg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg</span>
        </div>
      ` : ''}
    </div>

    <div class="dashed-line"></div>

    <!-- FINANCIAL SETTLEMENT -->
    <div>
      <div class="text-center" style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.08em; margin-bottom: 4px;">
        ── DESGLOSE DE LIQUIDACIÓN ──
      </div>

      <div class="row">
        <span style="font-size: 9.5px; font-weight: 700; color: #444;" class="uppercase">PRECIO POR KG:</span>
        <span style="font-size: 11px; font-weight: 700;">$${data.price_per_kg.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div class="row">
        <span style="font-size: 9.5px; font-weight: 700; color: #444;" class="uppercase">SUBTOTAL FRUTA:</span>
        <span style="font-size: 11px; font-weight: 700;">$${data.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div class="row">
        <span style="font-size: 9px; font-weight: 700; color: #444;" class="uppercase">
          CUOTA BÁSCULA ${isScaleDeducted ? '(DESCONTADA)' : '(PAGADA EFECTIVO)'}:
        </span>
        <span style="font-size: 10.5px; font-weight: 700; ${isScaleDeducted ? 'color: #991b1b;' : ''}">
          ${isScaleDeducted ? '- ' : ''}$${data.scale_fee.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      ${(data.extra_charge_total && data.extra_charge_total > 0) ? `
        <div class="row" style="color: #991b1b;">
          <span style="font-size: 8.5px; font-weight: 700;" class="uppercase">
            ${data.extra_charge_concept || 'MANIOBRA / SERV.'} ($${(data.extra_charge_per_kg || 0.4).toFixed(2)}/KG):
          </span>
          <span style="font-size: 10.5px; font-weight: 700;">
            - $${data.extra_charge_total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ` : ''}

      <!-- GRAND TOTAL SOLID BANNER -->
      <div class="total-banner">
        <div>
          <div style="font-size: 9px; font-weight: 900; letter-spacing: 0.05em;" class="uppercase">TOTAL NETO</div>
          <div style="font-size: 7.5px; color: #cbd5e1;" class="uppercase">A LIQUIDAR AL PRODUCTOR</div>
        </div>
        <div style="font-size: 17px; font-weight: 900; letter-spacing: -0.02em;">
          $${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>

    <!-- QR & BARCODE VERIFICATION -->
    <div style="border: 1px dashed #000; padding: 6px; margin: 8px 0; text-align: center;">
      <div style="font-size: 8.5px; font-weight: 900; letter-spacing: 0.05em;" class="uppercase">
        CONSULTA TU ESTATUS Y PAGO EN LÍNEA
      </div>
      <div style="font-size: 7.5px; color: #444; word-break: break-all; margin-top: 1px;">
        ${portalUrl}
      </div>
    </div>

    <!-- SIMULATED BARCODE -->
    <div class="text-center" style="margin: 6px 0;">
      <div style="display: flex; justify-content: center; align-items: center; height: 34px;">
        ${barcodeHtml}
      </div>
      <div style="font-size: 8px; letter-spacing: 0.15em; margin-top: 2px;">
        *${(data.scale_ticket_folio || data.folio).replace(/[^a-zA-Z0-9]/g, '')}*
      </div>
    </div>

    <!-- SIGNATURES -->
    <div style="font-size: 7.5px; color: #555; text-align: center; margin-top: 6px;">
      Fruta certificada conforme a normas fitosanitarias de movilización citrícola.
      Ampara el pesaje formal de entrada en báscula certificada JBM.
    </div>

    <div class="signature-box">
      <div class="signature-col">
        <div class="signature-line"></div>
        <div style="font-size: 8px; font-weight: 900;" class="uppercase">${data.operator || 'OPERADOR'}</div>
        <div style="font-size: 7px; color: #555;" class="uppercase">BÁSCULA JBM</div>
      </div>
      <div class="signature-col">
        <div class="signature-line"></div>
        <div style="font-size: 8px; font-weight: 900;" class="uppercase">PRODUCTOR / CHOFER</div>
        <div style="font-size: 7px; color: #555;" class="uppercase">CONFORMIDAD</div>
      </div>
    </div>

    <!-- FOOTER SLOGAN -->
    <div class="text-center" style="margin-top: 12px;">
      <div style="font-size: 9px; font-weight: 900; letter-spacing: 0.15em;" class="uppercase">
        ¡GRACIAS POR SU PREFERENCIA!
      </div>
      <div style="font-size: 7.5px; color: #666; margin-top: 1px;">
        ${options.customFooter || 'JBM CÍTRICOS ERP • MOTOR TÉRMICO 80MM'}
      </div>
    </div>

  </div>

</body>
</html>
  `.trim();
}

/**
 * Copies a compact WhatsApp/SMS formatted string summary of the weight ticket to clipboard.
 */
export async function copyWeightTicketSummaryToClipboard(
  inputData: Batch | WeightTicketReceiptData
): Promise<string> {
  const data = formatBatchToReceiptData(inputData);
  const isScaleDeducted = data.scale_fee_payment !== 'efectivo';
  
  const scaleLine = isScaleDeducted
    ? `Cuota Báscula: -$${data.scale_fee.toFixed(2)} (A Descontar)`
    : `Cuota Báscula: $${data.scale_fee.toFixed(2)} (Pagado en Efectivo)`;

  const extraLine = (data.extra_charge_total && data.extra_charge_total > 0)
    ? `\n${data.extra_charge_concept || 'Maniobra'} ($${(data.extra_charge_per_kg || 0.4).toFixed(2)}/kg): -$${data.extra_charge_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    : '';

  const moistureLine = (data.moisture_deduction_kg && data.moisture_deduction_kg > 0)
    ? `\nDesc. Humedad/Agua: -${data.moisture_deduction_kg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg`
    : '';

  const formattedDate = data.date ? new Date(data.date).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');

  const text = `🍋 *JBM CÍTRICOS BARRAGÁN - BOLETA DE BÁSCULA*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Folio Báscula:* ${data.scale_ticket_folio || data.folio}\n` +
    `*Folio ERP:* ${data.folio}\n` +
    `*Fecha:* ${formattedDate}\n` +
    `*Productor:* ${data.producer_name}\n` +
    `*Huerto:* ${data.orchard}\n` +
    `*Variedad:* ${data.variety}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*DETALLE DE PESO:*\n` +
    `• Peso Bruto: ${data.weight_gross.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg\n` +
    `• Peso Tara:  ${data.weight_tare.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg\n` +
    `• *PESO NETO: ${data.weight_net.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg*${moistureLine}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*LIQUIDACIÓN:*\n` +
    `• Precio Pactado: $${data.price_per_kg.toFixed(2)} / kg\n` +
    `• Subtotal Fruta: $${data.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n` +
    `• ${scaleLine}${extraLine}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *TOTAL NETO: $${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Operador: ${data.operator}\n` +
    `Consulta: https://portal.jbmcitricos.com/status/${data.folio.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()}`;

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
  return text;
}

/**
 * Executes direct thermal receipt printing using a hidden isolated iframe with the
 * '.thermal-receipt' class, bypassing screen layout interference. Falls back to window.print()
 * if iframe printing is blocked by the environment.
 */
export async function printThermalReceiptDirectly(
  inputData: Batch | WeightTicketReceiptData,
  options: ThermalPrintOptions = {}
): Promise<boolean> {
  const htmlContent = generateThermalReceiptHTML(inputData, options);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('printThermalReceiptDirectly called outside of browser environment');
    return false;
  }

  return new Promise<boolean>((resolve) => {
    try {
      // 1. Check if an isolated print iframe already exists, or create one
      const iframeId = 'jbm-thermal-print-frame';
      let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc || !iframe.contentWindow) {
        throw new Error('Unable to access print iframe contentWindow');
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for resources to load, then trigger print
      const triggerPrint = () => {
        try {
          if (!iframe?.contentWindow) {
            resolve(false);
            return;
          }
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          
          // Cleanup after print dialog dismisses
          setTimeout(() => {
            try {
              iframe?.remove();
            } catch (e) {
              // Ignore cleanup error
            }
          }, 1000);
          resolve(true);
        } catch (printErr) {
          console.warn('Iframe print error, falling back to window.print():', printErr);
          fallbackPrintWithDomInjection(htmlContent).then(resolve);
        }
      };

      // Ensure content is parsed before printing
      if (iframeDoc.readyState === 'complete') {
        setTimeout(triggerPrint, 150);
      } else {
        iframe.onload = () => setTimeout(triggerPrint, 150);
      }
    } catch (err) {
      console.warn('Primary iframe print failed, falling back to window.print():', err);
      fallbackPrintWithDomInjection(htmlContent).then(resolve);
    }
  });
}

/**
 * Fallback printing strategy: injects a temporary hidden container with the `.thermal-receipt`
 * class into the main document and invokes native window.print().
 */
async function fallbackPrintWithDomInjection(htmlContent: string): Promise<boolean> {
  try {
    const containerId = 'jbm-fallback-thermal-print-container';
    let existing = document.getElementById(containerId);
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = containerId;
    container.className = 'thermal-receipt-print-wrapper';
    container.innerHTML = htmlContent;
    
    // Embed inline print stylesheet targeting this container
    const style = document.createElement('style');
    style.innerHTML = `
      @media screen {
        #${containerId} { display: none !important; }
      }
      @media print {
        body > *:not(#${containerId}) { display: none !important; }
        #${containerId} { display: block !important; width: 80mm !important; margin: 0 auto !important; }
      }
    `;
    container.appendChild(style);
    document.body.appendChild(container);

    window.print();

    // Clean up after small delay
    setTimeout(() => {
      container.remove();
    }, 1500);

    return true;
  } catch (e) {
    console.error('Fallback print also failed:', e);
    // As absolute last resort, invoke native print
    window.print();
    return true;
  }
}

/**
 * Convenience method specifically for Reception module tickets:
 * Formats a batch and sends it directly to the thermal printer.
 */
export const printWeightTicketDirectly = printThermalReceiptDirectly;
