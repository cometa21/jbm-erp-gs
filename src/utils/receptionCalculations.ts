/**
 * Función auxiliar para cálculos financieros y operativos en el módulo de Recepción
 * Calcula automáticamente el precio neto total, deducciones de báscula y cargo operativo ($0.40/kg).
 */

export interface ReceptionCalculationParams {
  weightGross: number;
  weightTare: number;
  pricePerKg: number;
  scaleFee: number;
  scaleFeePayment: 'descuento' | 'efectivo';
  extraChargePerKg?: number; // Por defecto 0.40 $/kg
}

export interface ReceptionCalculationResult {
  weightNet: number;
  subtotalFruta: number;
  scaleFeeDeduction: number;
  scaleFeePaidCash: number;
  extraChargePerKg: number;
  extraChargeTotal: number;
  totalDeductions: number;
  totalLiquidated: number;
  effectivePricePerKg: number;
}

/**
 * Calcula en tiempo real los importes de liquidación de fruta:
 * - Kilos netos = Bruto - Tara
 * - Subtotal fruta = Kilos netos * Precio por kg
 * - Cargo operativo = Kilos netos * $0.40/kg (o tarifa configurada)
 * - Retención de báscula = Cuota si aplica 'descuento', 0 si 'efectivo'
 * - Total a liquidar = Subtotal - Cargo operativo - Retención de báscula
 * - Precio neto efectivo/kg = Total a liquidar / Kilos netos
 */
export function calculateReceptionTotals(params: ReceptionCalculationParams): ReceptionCalculationResult {
  const {
    weightGross = 0,
    weightTare = 0,
    pricePerKg = 0,
    scaleFee = 0,
    scaleFeePayment = 'descuento',
    extraChargePerKg = 0.40
  } = params;

  const gross = Math.max(0, Number(weightGross) || 0);
  const tare = Math.max(0, Number(weightTare) || 0);
  const weightNet = Math.max(0, Number((gross - tare).toFixed(2)));
  const price = Math.max(0, Number(pricePerKg) || 0);
  const scaleFeeAmount = Math.max(0, Number(scaleFee) || 0);
  const extraRate = Math.max(0, Number(extraChargePerKg) || 0);

  // Subtotal bruto de la fruta
  const subtotalFruta = Number((weightNet * price).toFixed(2));

  // Deducción de báscula
  const scaleFeeDeduction = scaleFeePayment === 'descuento' ? scaleFeeAmount : 0;
  const scaleFeePaidCash = scaleFeePayment === 'efectivo' ? scaleFeeAmount : 0;

  // Cargo operativo de $0.40/kg (maniobra, pesaje y selección)
  const extraChargeTotal = Number((weightNet * extraRate).toFixed(2));

  // Total de retenciones/descuentos
  const totalDeductions = Number((scaleFeeDeduction + extraChargeTotal).toFixed(2));

  // Total final liquidado al productor
  const totalLiquidated = Number(Math.max(0, subtotalFruta - totalDeductions).toFixed(2));

  // Precio neto real efectivo pagado por kilo
  const effectivePricePerKg = weightNet > 0 ? Number((totalLiquidated / weightNet).toFixed(4)) : 0;

  return {
    weightNet,
    subtotalFruta,
    scaleFeeDeduction,
    scaleFeePaidCash,
    extraChargePerKg: extraRate,
    extraChargeTotal,
    totalDeductions,
    totalLiquidated,
    effectivePricePerKg
  };
}
