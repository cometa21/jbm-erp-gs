import React, { useState, useEffect } from 'react';
import { POSLocalExpense, POSUserRole } from '../../types';
import { 
  Receipt, Plus, Camera, Upload, Sparkles, RefreshCw, 
  Search, Banknote, CreditCard, DollarSign, Calendar, FileText,
  CheckCircle2, AlertCircle, Check
} from 'lucide-react';

interface POSTabGastosProps {
  currentRole: POSUserRole;
}

export const POSTabGastos: React.FC<POSTabGastosProps> = ({ currentRole }) => {
  const [expenses, setExpenses] = useState<POSLocalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New Expense Form State
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState<POSLocalExpense['category']>('Maniobra y Descarga');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentSource, setPaymentSource] = useState<'caja_efectivo' | 'transferencia_banco'>('caja_efectivo');
  const [supplier, setSupplier] = useState('');
  const [invoiceFolio, setInvoiceFolio] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/expenses');
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Handle OCR receipt image upload & Gemini API processing
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setReceiptImage(base64Data);

      // Call OCR endpoint
      try {
        setOcrRunning(true);
        setOcrSuccess(false);
        const res = await fetch('/api/pos/expenses/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64Data,
            mime_type: file.type || 'image/jpeg'
          })
        });

        if (res.ok) {
          const ocr = await res.json();
          if (ocr.amount) setAmount(ocr.amount);
          if (ocr.concept) setConcept(ocr.concept);
          if (ocr.supplier) setSupplier(ocr.supplier);
          if (ocr.invoice_folio) setInvoiceFolio(ocr.invoice_folio);
          if (ocr.category && ['Maniobra y Descarga', 'Combustible y Flete Local', 'Alimentos Personal', 'Empaque y Cintas', 'Mantenimiento y Servicios', 'Renta y Servicios', 'Otros'].includes(ocr.category)) {
            setCategory(ocr.category);
          }
          setOcrSuccess(true);
        }
      } catch (err) {
        console.error('OCR Error:', err);
      } finally {
        setOcrRunning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !concept.trim()) {
      alert('Por favor ingrese un concepto y monto válido.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        concept,
        category,
        amount: Number(amount),
        payment_source: paymentSource,
        supplier,
        invoice_folio: invoiceFolio,
        receipt_image_url: receiptImage,
        operator: currentRole === 'admin' ? 'Administrador' : 'Ventas CDMX',
        notes
      };

      const res = await fetch('/api/pos/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar gasto');
      }

      setModalOpen(false);
      resetForm();
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Error al registrar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setConcept('');
    setCategory('Maniobra y Descarga');
    setAmount('');
    setPaymentSource('caja_efectivo');
    setSupplier('');
    setInvoiceFolio('');
    setNotes('');
    setReceiptImage('');
    setOcrSuccess(false);
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesCat = filterCategory === 'all' || exp.category === filterCategory;
    const matchesSearch = exp.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exp.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (exp.supplier && exp.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCashExpenses = filteredExpenses.filter(e => e.payment_source === 'caja_efectivo').reduce((sum, e) => sum + e.amount, 0);
  const totalBankExpenses = filteredExpenses.filter(e => e.payment_source === 'transferencia_banco').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header & Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Gastos Operativos Locales CDMX
            </span>
            <span className="text-xs text-slate-500">• Maniobras, Combustible & Comprobantes OCR</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Control de Gastos de Bodega</h1>
          <p className="text-xs text-slate-500">
            Registra y audita pagos realizados desde el cajón de efectivo o transferencias bancarias locales.
          </p>
        </div>

        {/* Action Button & Totals */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold text-rose-700">
              ${totalCashExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-semibold text-rose-900 uppercase">Pagado en Efectivo Caja</div>
          </div>

          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Gasto Local
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'Maniobra y Descarga', label: '💪 Maniobra & Descarga' },
            { id: 'Combustible y Flete Local', label: '⛽ Flete & Combustible' },
            { id: 'Alimentos Personal', label: '🌮 Alimentos' },
            { id: 'Empaque y Cintas', label: '📦 Empaque' },
            { id: 'Mantenimiento y Servicios', label: '🛠️ Mantenimiento' },
            { id: 'Renta y Servicios', label: '🏢 Renta' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                filterCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar gasto, folio, proveedor..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchExpenses}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="px-5 py-3.5">Folio & Fecha</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Concepto / Detalle</th>
                <th className="px-4 py-3.5">Proveedor / Factura</th>
                <th className="px-4 py-3.5 text-center">Fuente de Pago</th>
                <th className="px-4 py-3.5">Operador</th>
                <th className="px-5 py-3.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No se encontraron gastos locales registrados.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-slate-900">{exp.folio}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(exp.date).toLocaleDateString('es-MX')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {exp.concept}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{exp.supplier || 'N/A'}</div>
                      {exp.invoice_folio && (
                        <div className="text-[10px] text-slate-400 font-mono">Fac: {exp.invoice_folio}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        exp.payment_source === 'caja_efectivo'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {exp.payment_source === 'caja_efectivo' ? (
                          <><Banknote className="w-3 h-3" /> Caja POS</>
                        ) : (
                          <><CreditCard className="w-3 h-3" /> SPEI Banco</>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {exp.operator}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-700 text-sm">
                      -${exp.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW EXPENSE MODAL WITH GEMINI OCR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Registrar Gasto Local</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              {/* SMART GEMINI OCR SCANNER BANNER */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Lector Inteligente de Comprobantes (OCR Gemini)</span>
                  </div>
                  {ocrRunning && (
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Procesando imagen...
                    </span>
                  )}
                  {ocrSuccess && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Datos Autocompletados
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm">
                    <Camera className="w-4 h-4" />
                    Subir Ticket o Nota de Remisión
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                  {receiptImage && (
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
                      Comprobante adjunto
                    </span>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Concepto del Gasto *</label>
                  <input
                    type="text"
                    required
                    value={concept}
                    onChange={e => setConcept(e.target.value)}
                    placeholder="Ej. Maniobra y descarga de 800 cajas en andén..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Monto Total ($) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0.1}
                      required
                      value={amount}
                      onChange={e => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Categoría de Gasto</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
                    >
                      <option value="Maniobra y Descarga">Maniobra y Descarga</option>
                      <option value="Combustible y Flete Local">Combustible y Flete Local</option>
                      <option value="Alimentos Personal">Alimentos Personal</option>
                      <option value="Empaque y Cintas">Empaque y Cintas</option>
                      <option value="Mantenimiento y Servicios">Mantenimiento y Servicios</option>
                      <option value="Renta y Servicios">Renta y Servicios</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fuente de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentSource('caja_efectivo')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all flex items-center justify-center gap-1.5 ${
                        paymentSource === 'caja_efectivo'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Caja Efectivo (Turno POS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentSource('transferencia_banco')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all flex items-center justify-center gap-1.5 ${
                        paymentSource === 'transferencia_banco'
                          ? 'bg-blue-100 text-blue-900 border-blue-300 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Transferencia Banco
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Proveedor / Beneficiario</label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={e => setSupplier(e.target.value)}
                      placeholder="Ej. Cuadrilla de Macheteros Nave I"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Folio Factura / Nota</label>
                    <input
                      type="text"
                      value={invoiceFolio}
                      onChange={e => setInvoiceFolio(e.target.value)}
                      placeholder="Ej. NOTA-4481"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
