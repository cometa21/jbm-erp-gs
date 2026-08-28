import React, { useState, useEffect } from 'react';
import { POSCashCut, POSUserRole } from '../../types';
import { 
  Calculator, Banknote, ShieldCheck, AlertTriangle, CheckCircle2, 
  Printer, History, Clock, RefreshCw, ArrowRight, DollarSign, FileText
} from 'lucide-react';

interface POSTabCorteCajaProps {
  currentRole: POSUserRole;
}

export const POSTabCorteCaja: React.FC<POSTabCorteCajaProps> = ({ currentRole }) => {
  const [loading, setLoading] = useState(true);
  const [currentSummary, setCurrentSummary] = useState<any>(null);
  const [cashCutsHistory, setCashCutsHistory] = useState<POSCashCut[]>([]);

  // Shift & Operator
  const [shift, setShift] = useState<'Matutino' | 'Vespertino' | 'Nocturno'>('Matutino');
  const [operator, setOperator] = useState(currentRole === 'admin' ? 'Administrador' : 'Ventas CDMX');
  const [initialFund, setInitialFund] = useState<number>(2000);
  const [notes, setNotes] = useState('');

  // Cash Denomination Breakdown (Arqueo ciego)
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '2': 0,
    '1': 0
  });
  const [directCashTotal, setDirectCashTotal] = useState<number | ''>('');
  const [useDenominations, setUseDenominations] = useState(true);

  // Audit state
  const [auditRevealed, setAuditRevealed] = useState(false);
  const [closingShift, setClosingShift] = useState(false);
  const [closedCutResult, setClosedCutResult] = useState<POSCashCut | null>(null);

  const fetchSummaryAndHistory = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        fetch('/api/pos/cash-cuts/current-summary'),
        fetch('/api/pos/cash-cuts')
      ]);
      const summaryData = await summaryRes.json();
      const historyData = await historyRes.json();

      setCurrentSummary(summaryData);
      setCashCutsHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Error fetching cash cut data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAndHistory();
  }, []);

  // Calculate total declared cash from denominations
  const totalFromDenominations = Object.entries(denominations).reduce((sum, [denom, count]) => {
    return sum + (parseFloat(denom) * (Number(count) || 0));
  }, 0);

  const declaredCash = useDenominations ? totalFromDenominations : (typeof directCashTotal === 'number' ? directCashTotal : 0);

  const handleDenomChange = (denom: string, countStr: string) => {
    const count = parseInt(countStr) || 0;
    setDenominations(prev => ({ ...prev, [denom]: Math.max(0, count) }));
  };

  // Expected Cash calculation
  const totalSalesCash = currentSummary?.totalSalesCash || 0;
  const totalExpensesCash = currentSummary?.totalExpensesCash || 0;
  const calculatedCash = initialFund + totalSalesCash - totalExpensesCash;
  const difference = declaredCash - calculatedCash;

  const handleRevealAudit = () => {
    setAuditRevealed(true);
  };

  const handleCloseShift = async () => {
    if (!confirm('¿Está seguro de cerrar y sellar el turno de caja actual? Esta acción consolidará las ventas y gastos.')) {
      return;
    }

    try {
      setClosingShift(true);
      const payload = {
        shift,
        operator,
        initial_fund: initialFund,
        declared_cash: declaredCash,
        denominations,
        notes
      };

      const res = await fetch('/api/pos/cash-cuts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cerrar turno');
      }

      const newCut: POSCashCut = await res.json();
      setClosedCutResult(newCut);
      fetchSummaryAndHistory();
      setAuditRevealed(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar el corte de caja');
    } finally {
      setClosingShift(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Arqueo y Conciliación Ciega
            </span>
            <span className="text-xs text-slate-500">• Control de Turno y Efectivo</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Corte de Caja Diario</h1>
          <p className="text-xs text-slate-500">
            Realiza el conteo físico de dinero en caja sin sesgos. El sistema compara contra ventas en efectivo y gastos locales.
          </p>
        </div>

        <button
          onClick={fetchSummaryAndHistory}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 7 cols: Arqueo Capture & Audit */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Paso 1: Conteo Físico de Efectivo en Cajón (Arqueo Ciego)
              </h2>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setUseDenominations(true)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${useDenominations ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Desglose
                </button>
                <button
                  onClick={() => setUseDenominations(false)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${!useDenominations ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Total Directo
                </button>
              </div>
            </div>

            {/* Operator and Initial Fund */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Turno</label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Matutino">Turno Matutino (4:00 - 13:00)</option>
                  <option value="Vespertino">Turno Vespertino (13:00 - 20:00)</option>
                  <option value="Nocturno">Turno Nocturno (20:00 - 4:00)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cajero / Operador</label>
                <input
                  type="text"
                  value={operator}
                  onChange={e => setOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fondo Inicial de Caja</label>
                <input
                  type="number"
                  value={initialFund}
                  onChange={e => setInitialFund(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Denomination Grid */}
            {useDenominations ? (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Captura el conteo de billetes y monedas en caja:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {['1000', '500', '200', '100', '50', '20', '10', '5', '2', '1'].map(denom => {
                    const count = denominations[denom] || 0;
                    const subtotal = parseFloat(denom) * count;

                    return (
                      <div key={denom} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                        <span className="text-xs font-black text-slate-800 block">${denom}</span>
                        <input
                          type="number"
                          min={0}
                          value={count || ''}
                          onChange={e => handleDenomChange(denom, e.target.value)}
                          placeholder="0"
                          className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          ${subtotal.toLocaleString('es-MX')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Efectivo Total Contado en Caja ($):
                </label>
                <input
                  type="number"
                  value={directCashTotal}
                  onChange={e => setDirectCashTotal(parseFloat(e.target.value) || '')}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {/* Declared Total Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-900 font-semibold block">Total Efectivo Declarado:</span>
                <span className="text-[11px] text-emerald-700">Conteo físico ingresado por el operador</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-800">
                ${declaredCash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Audit Trigger */}
            {!auditRevealed ? (
              <button
                onClick={handleRevealAudit}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Auditar y Comparar con Sistema
              </button>
            ) : (
              /* REVEALED AUDIT & CONCILIATION */
              <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Paso 2: Conciliación de Turno en Sistema
                </h3>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Fondo Inicial</span>
                    <span className="font-mono font-bold text-slate-800">+${initialFund.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ventas Efectivo</span>
                    <span className="font-mono font-bold text-emerald-900">+${totalSalesCash.toFixed(2)}</span>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Gastos Caja</span>
                    <span className="font-mono font-bold text-rose-900">-${totalExpensesCash.toFixed(2)}</span>
                  </div>
                </div>

                {/* Expected vs Declared Comparison Box */}
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  Math.abs(difference) < 0.01
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : difference > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Efectivo Calculado por Sistema:</span>
                    <span className="font-mono font-bold text-sm">${calculatedCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Efectivo Físico Declarado:</span>
                    <span className="font-mono font-bold text-sm">${declaredCash.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-current/20 flex justify-between items-baseline font-black">
                    <span className="flex items-center gap-1.5 text-sm">
                      {Math.abs(difference) < 0.01 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          CORTE CUADRADO EXACTO
                        </>
                      ) : difference > 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-blue-600" />
                          SOBRANTE EN CAJA
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          FALTANTE EN CAJA
                        </>
                      )}
                    </span>
                    <span className="font-mono text-xl">
                      {difference > 0 ? `+$${difference.toFixed(2)}` : `$${difference.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Observaciones / Notas del Turno
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Comentarios sobre el turno, faltantes justificados, entregas especiales..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Final Close Button */}
                <button
                  onClick={handleCloseShift}
                  disabled={closingShift}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {closingShift ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Cerrar y Sellar Turno Oficialmente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 5 cols: Current Shift Metrics & History */}
        <div className="lg:col-span-5 space-y-4">
          {/* Shift Live Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Métricas del Turno Activo
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Ventas Totales Registradas:</span>
                <span className="font-bold text-slate-900 font-mono">
                  ${(currentSummary?.totalSalesAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>• Pagos con Tarjeta / Bancos:</span>
                <span className="font-mono text-slate-800">
                  ${(currentSummary?.totalSalesCard || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>• Pagos con Transferencia SPEI:</span>
                <span className="font-mono text-slate-800">
                  ${(currentSummary?.totalSalesTransfer || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>• Pagos en Efectivo:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${(currentSummary?.totalSalesCash || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Gastos Locales Pagados de Caja:</span>
                <span className="font-mono font-bold text-rose-600">
                  -${(currentSummary?.totalExpensesCash || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Volumen de Fruta Despachada:</span>
                <span className="font-semibold text-slate-900">
                  {currentSummary?.totalBoxesSold || 0} cajas • {(currentSummary?.totalKgGranelSold || 0).toFixed(1)} kg granel
                </span>
              </div>
            </div>
          </div>

          {/* Cash Cuts History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              Historial de Cortes Previos
            </h3>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {cashCutsHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No hay cortes de caja previos registrados.</p>
              ) : (
                cashCutsHistory.map(cut => (
                  <div key={cut.id} className="py-2.5 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-slate-900">{cut.folio}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(cut.date).toLocaleDateString('es-MX')} • {cut.shift} ({cut.operator})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">
                        ${cut.declared_cash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        cut.status === 'cuadrado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cut.status === 'sobrante'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {cut.status} ({cut.difference >= 0 ? `+$${cut.difference}` : `-$${Math.abs(cut.difference)}`})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CLOSED CUT VOUCHER MODAL */}
      {closedCutResult && (
        <div id="print-modal-container" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4 animate-in fade-in thermal-receipt">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-base text-slate-900">COMPROBANTE DE CORTE DE CAJA</h3>
              <p className="text-xs text-slate-500">JBM Cítricos - Bodega CDMX</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">{closedCutResult.folio}</p>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between"><span>FECHA:</span> <span>{new Date(closedCutResult.date).toLocaleString('es-MX')}</span></div>
              <div className="flex justify-between"><span>TURNO:</span> <span>{closedCutResult.shift}</span></div>
              <div className="flex justify-between"><span>OPERADOR:</span> <span>{closedCutResult.operator}</span></div>
              <div className="flex justify-between pt-2 border-t"><span>FONDO INICIAL:</span> <span>${closedCutResult.initial_fund.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VENTAS EFECTIVO:</span> <span>${closedCutResult.total_cash_sales.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GASTOS LOCALES:</span> <span>-${closedCutResult.total_local_expenses_cash.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>TOTAL SISTEMA:</span> <span>${closedCutResult.calculated_cash.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-900"><span>TOTAL DECLARADO:</span> <span>${closedCutResult.declared_cash.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t">
                <span>DIFERENCIA:</span>
                <span className={closedCutResult.difference === 0 ? 'text-emerald-700' : 'text-rose-600'}>
                  ${closedCutResult.difference.toFixed(2)} ({closedCutResult.status.toUpperCase()})
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Comprobante
              </button>
              <button
                onClick={() => setClosedCutResult(null)}
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
