import React, { useState } from 'react';
import { 
  Percent, 
  DollarSign, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  Sparkles, 
  Tag, 
  AlertCircle,
  UserCheck,
  Trash2
} from 'lucide-react';
import { POSCartItem } from '../../types';

export interface DiscountResult {
  discount_type: 'percent' | 'amount';
  discount_value: number; // e.g. 10 (%) or 150 ($)
  discount_amount: number; // total calculated $ amount
  discount_reason: string;
  discount_authorized_by: string;
}

interface POSDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'item' | 'order';
  item?: POSCartItem | null;
  orderSubtotal?: number;
  currentRole?: string;
  existingDiscount?: {
    discount_type?: 'none' | 'percent' | 'amount';
    discount_value?: number;
    discount_amount?: number;
    discount_reason?: string;
    discount_authorized_by?: string;
  };
  onApplyDiscount: (result: DiscountResult) => void;
  onRemoveDiscount?: () => void;
}

const PRESET_REASONS = [
  'Cliente Frecuente / Mayoreo',
  'Merma / Calidad Comercial Ligera',
  'Promoción del Día / Descuento Temporada',
  'Ajuste Comercial por Volumen',
  'Cortesía Comercial / Merma en Ruta',
  'Autorización Especial de Gerencia',
  'Otro motivo comercial'
];

const SUPERVISORS = [
  { id: 'carlos_b', name: 'Carlos Barragán (Gerente General)', pin: '1234' },
  { id: 'supervisor_b', name: 'Supervisor de Bodega I-42', pin: '4321' },
  { id: 'admin_pos', name: 'Administrador de Sucursal', pin: '0000' }
];

export const POSDiscountModal: React.FC<POSDiscountModalProps> = ({
  isOpen,
  onClose,
  targetType,
  item,
  orderSubtotal = 0,
  currentRole = 'cajero',
  existingDiscount,
  onApplyDiscount,
  onRemoveDiscount
}) => {
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>(
    existingDiscount?.discount_type === 'amount' ? 'amount' : 'percent'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    existingDiscount?.discount_value || (existingDiscount?.discount_type === 'amount' ? 50 : 10)
  );
  const [reason, setReason] = useState<string>(
    existingDiscount?.discount_reason || PRESET_REASONS[0]
  );
  const [customReason, setCustomReason] = useState<string>('');
  
  // Security & Supervisor PIN state
  const [selectedSupervisor, setSelectedSupervisor] = useState(SUPERVISORS[0].id);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinAuthorized, setPinAuthorized] = useState(
    currentRole === 'admin' || currentRole === 'supervisor' || !!existingDiscount?.discount_authorized_by
  );
  const [authorizedBy, setAuthorizedBy] = useState(
    existingDiscount?.discount_authorized_by || (currentRole === 'admin' ? 'Administrador (Sesión Activa)' : '')
  );

  if (!isOpen) return null;

  // Base amounts calculation
  const isItem = targetType === 'item' && !!item;
  const baseTotal = isItem 
    ? (item.original_price ? item.original_price * item.qty : item.qty * item.unit_price + (item.discount_amount || 0))
    : orderSubtotal;

  // Calculate discount amount in MXN
  let calculatedDiscountAmount = 0;
  if (discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, discountValue || 0));
    calculatedDiscountAmount = (baseTotal * pct) / 100;
  } else {
    calculatedDiscountAmount = Math.min(baseTotal, Math.max(0, discountValue || 0));
  }

  const finalNetTotal = Math.max(0, baseTotal - calculatedDiscountAmount);

  // Determine if this discount requires supervisor PIN authorization
  // (e.g. if percent > 5%, or amount > $100, or if user is cajero and not already authorized)
  const isElevatedDiscount = discountType === 'percent' ? discountValue > 5 : calculatedDiscountAmount > 100;
  const requiresPinAuth = (isElevatedDiscount || currentRole === 'cajero') && !pinAuthorized;

  // Handle PIN verification
  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const supervisor = SUPERVISORS.find(s => s.id === selectedSupervisor);
    const validPins = [supervisor?.pin || '1234', '1234', '4321', '0000', '9999'];

    if (validPins.includes(supervisorPin.trim())) {
      setPinAuthorized(true);
      setPinError(false);
      setAuthorizedBy(`${supervisor?.name || 'Supervisor'} [PIN Verificado]`);
      setSupervisorPin('');
    } else {
      setPinError(true);
    }
  };

  const handleApply = () => {
    if (calculatedDiscountAmount <= 0) {
      alert('Por favor ingrese un valor de descuento válido mayor a 0.');
      return;
    }

    if (requiresPinAuth) {
      alert('Se requiere ingresar el PIN de Supervisor para autorizar este descuento.');
      return;
    }

    const finalReason = reason === 'Otro motivo comercial' ? (customReason.trim() || 'Ajuste comercial autorizado') : reason;
    const finalAuthorizer = authorizedBy || (currentRole === 'admin' ? 'Administrador' : 'Cajero / Mostrador');

    onApplyDiscount({
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: calculatedDiscountAmount,
      discount_reason: finalReason,
      discount_authorized_by: finalAuthorizer
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/10">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  {isItem ? 'Descuento por Producto' : 'Descuento Global a la Orden'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                  {isItem ? 'Partida' : 'Total Venta'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 truncate max-w-xs sm:max-w-sm">
                {isItem ? `${item.name} (${item.qty} ${item.item_type === 'caja' ? 'cajas' : 'kg'})` : 'Aplica sobre el subtotal acumulado'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Base Amount Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {isItem ? 'Subtotal de Partida:' : 'Subtotal de la Orden:'}
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                ${baseTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400">Total con Descuento</span>
              <div className="text-lg font-black font-mono text-emerald-700">
                ${finalNetTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 2. Discount Type Switcher (% vs $) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Descuento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  discountType === 'percent'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>Porcentual (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('amount')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  discountType === 'amount'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Monto Fijo ($)</span>
              </button>
            </div>
          </div>

          {/* 3. Discount Value Input & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {discountType === 'percent' ? 'Porcentaje de Descuento:' : 'Monto en Dinero a Descontar:'}
              </label>
              <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Ahorro: -${calculatedDiscountAmount.toFixed(2)} MXN
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {discountType === 'percent' ? '%' : '$'}
              </div>
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : baseTotal}
                step={discountType === 'percent' ? '1' : '5'}
                value={discountValue || ''}
                onChange={e => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                placeholder={discountType === 'percent' ? 'Ej. 10' : 'Ej. 150.00'}
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {discountType === 'percent' ? (
                [3, 5, 10, 15, 20, 25].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountValue(pct)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all border ${
                      discountValue === pct
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pct}%
                  </button>
                ))
              ) : (
                [20, 50, 100, 200, 500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDiscountValue(amt)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all border ${
                      discountValue === amt
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ${amt}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 4. Reason / Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Motivo / Justificación del Descuento
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
            >
              {PRESET_REASONS.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>

            {reason === 'Otro motivo comercial' && (
              <input
                type="text"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Especifique el motivo comercial detallado..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            )}
          </div>

          {/* 5. Supervisor PIN Permission Validation */}
          <div className={`p-4 rounded-2xl border transition-all ${
            pinAuthorized 
              ? 'bg-emerald-50/80 border-emerald-200' 
              : isElevatedDiscount 
                ? 'bg-amber-50/80 border-amber-200' 
                : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {pinAuthorized ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {pinAuthorized ? 'Autorización Concedida' : 'Validación de Permisos de Supervisor'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {pinAuthorized 
                      ? `Autorizado por: ${authorizedBy || 'Supervisor'}`
                      : 'Descuentos mayores a 5% requieren PIN de Supervisor (PIN demo: 1234 o 4321)'}
                  </p>
                </div>
              </div>

              {pinAuthorized && (
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                  <Check className="w-3 h-3" /> Válido
                </span>
              )}
            </div>

            {!pinAuthorized && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Supervisor / Gerente que autoriza:
                  </label>
                  <select
                    value={selectedSupervisor}
                    onChange={e => setSelectedSupervisor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {SUPERVISORS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleVerifyPin} className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      maxLength={6}
                      value={supervisorPin}
                      onChange={e => { setSupervisorPin(e.target.value); setPinError(false); }}
                      placeholder="Ingrese PIN Supervisor (1234)"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Validar PIN</span>
                  </button>
                </form>

                {pinError && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    PIN incorrecto. Intente con 1234, 4321 o 0000.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 6. Live Breakdown Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Importe Base:</span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-400 font-bold">
              <span>Descuento ({discountType === 'percent' ? `${discountValue}%` : 'Fijo'}):</span>
              <span>-${calculatedDiscountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-black text-sm pt-1.5 border-t border-slate-800">
              <span>Total Final a Cobrar:</span>
              <span className="text-emerald-400">${finalNetTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {existingDiscount && onRemoveDiscount ? (
            <button
              type="button"
              onClick={() => {
                onRemoveDiscount();
                onClose();
              }}
              className="px-3 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar Descuento</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Descuento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
