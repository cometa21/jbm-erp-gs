import React, { useState, useEffect } from 'react';
import { POSInventoryItem, POSCartItem, POSSale, POSUserRole } from '../../types';
import { 
  ShoppingCart, Trash2, Plus, Minus, Search, CreditCard, Banknote, 
  ArrowRightLeft, Lock, Unlock, ShieldAlert, Check, RefreshCw, User,
  Receipt, Sparkles, Tag, DollarSign, Percent, AlertCircle
} from 'lucide-react';
import { POSThermalTicket } from './POSThermalTicket';

interface POSTabVentasProps {
  currentRole: POSUserRole;
}

export const POSTabVentas: React.FC<POSTabVentasProps> = ({ currentRole }) => {
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'caja' | 'granel'>('all');

  // Customer Details
  const [customerName, setCustomerName] = useState('Venta Mostrador');
  const [customerType, setCustomerType] = useState<'mostrador' | 'mayorista' | 'taqueria' | 'fruteria' | 'restaurante'>('mostrador');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerRfc, setCustomerRfc] = useState('');
  const [invoiceRequested, setInvoiceRequested] = useState(false);

  // Numpad State
  const [numpadMode, setNumpadMode] = useState<'qty' | 'price' | 'discount'>('qty');
  const [numpadBuffer, setNumpadBuffer] = useState<string>('');

  // Price Lock & Admin PIN
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingPriceChange, setPendingPriceChange] = useState<{ index: number; newPrice: number } | null>(null);
  const [priceOverrideUnlocked, setPriceOverrideUnlocked] = useState(false);

  // Checkout Modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto' | 'Credito'>('Efectivo');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [processingSale, setProcessingSale] = useState(false);

  // Completed Sale for Receipt
  const [completedSale, setCompletedSale] = useState<POSSale | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/inventory');
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading POS inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filtered Products
  const filteredProducts = inventory.filter(item => {
    const matchesSearch = item.presentation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.calibre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.lot_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.item_type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product: POSInventoryItem) => {
    const isBox = product.item_type === 'caja';
    const availableStock = isBox ? product.boxes_stock : product.kg_stock;

    if (availableStock <= 0) {
      alert(`El producto ${product.presentation_name} está agotado.`);
      return;
    }

    const existingIndex = cart.findIndex(c => c.inventory_id === product.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const newQty = updated[existingIndex].qty + 1;
      if (newQty > availableStock) {
        alert(`Stock insuficiente. Solo quedan ${availableStock} ${isBox ? 'cajas' : 'kg'}.`);
        return;
      }
      updated[existingIndex].qty = newQty;
      updated[existingIndex].kg_total = isBox ? newQty * (product.kg_per_box || 18.14) : newQty;
      updated[existingIndex].subtotal = updated[existingIndex].qty * updated[existingIndex].unit_price;
      setCart(updated);
      setSelectedCartIndex(existingIndex);
    } else {
      const defaultQty = 1;
      const newItem: POSCartItem = {
        inventory_id: product.id,
        name: product.presentation_name,
        item_type: product.item_type,
        calibre: product.calibre,
        lot_code: product.lot_code,
        qty: defaultQty,
        unit_price: product.default_sale_price,
        subtotal: defaultQty * product.default_sale_price,
        cost_unit_kg: product.base_cost_per_kg,
        kg_total: isBox ? defaultQty * (product.kg_per_box || 18.14) : defaultQty,
        min_price_per_unit: product.min_price_per_unit
      };
      setCart([...cart, newItem]);
      setSelectedCartIndex(cart.length);
    }
  };

  const updateCartItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...cart];
    const item = updated[index];
    const product = inventory.find(p => p.id === item.inventory_id);
    const availableStock = product ? (item.item_type === 'caja' ? product.boxes_stock : product.kg_stock) : 9999;

    if (newQty > availableStock) {
      alert(`Stock insuficiente. Disponible: ${availableStock} ${item.item_type === 'caja' ? 'cajas' : 'kg'}.`);
      return;
    }

    item.qty = newQty;
    item.kg_total = item.item_type === 'caja' ? newQty * (product?.kg_per_box || 18.14) : newQty;
    item.subtotal = newQty * item.unit_price;
    setCart(updated);
  };

  const updateCartItemPrice = (index: number, newPrice: number) => {
    const item = cart[index];
    // Check price floor lock
    if (newPrice < item.min_price_per_unit && !priceOverrideUnlocked && currentRole !== 'admin') {
      setPendingPriceChange({ index, newPrice });
      setPinModalOpen(true);
      return;
    }

    const updated = [...cart];
    updated[index].unit_price = newPrice;
    updated[index].subtotal = updated[index].qty * newPrice;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    const updated = cart.filter((_, idx) => idx !== index);
    setCart(updated);
    if (selectedCartIndex === index) {
      setSelectedCartIndex(updated.length > 0 ? 0 : null);
    } else if (selectedCartIndex !== null && selectedCartIndex > index) {
      setSelectedCartIndex(selectedCartIndex - 1);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCartIndex(null);
    setNumpadBuffer('');
  };

  // Numpad key press
  const handleNumpadKey = (key: string) => {
    if (selectedCartIndex === null || !cart[selectedCartIndex]) return;

    if (key === 'C') {
      setNumpadBuffer('');
      return;
    }

    if (key === 'BACKSPACE') {
      const newBuf = numpadBuffer.slice(0, -1);
      setNumpadBuffer(newBuf);
      applyNumpadValue(newBuf);
      return;
    }

    let newBuf = numpadBuffer;
    if (key === '.') {
      if (!newBuf.includes('.')) {
        newBuf = newBuf === '' ? '0.' : newBuf + '.';
      }
    } else {
      newBuf = newBuf + key;
    }

    setNumpadBuffer(newBuf);
    applyNumpadValue(newBuf);
  };

  const applyNumpadValue = (valStr: string) => {
    if (selectedCartIndex === null || !cart[selectedCartIndex]) return;
    const val = parseFloat(valStr);
    if (isNaN(val)) return;

    if (numpadMode === 'qty') {
      updateCartItemQty(selectedCartIndex, val);
    } else if (numpadMode === 'price') {
      updateCartItemPrice(selectedCartIndex, val);
    } else if (numpadMode === 'discount') {
      // Discount % on item
      const item = cart[selectedCartIndex];
      const product = inventory.find(p => p.id === item.inventory_id);
      const basePrice = product?.default_sale_price || item.unit_price;
      const discounted = Math.max(0, basePrice * (1 - Math.min(val, 100) / 100));
      updateCartItemPrice(selectedCartIndex, discounted);
    }
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin PIN is 1234
    if (enteredPin === '1234') {
      setPriceOverrideUnlocked(true);
      setPinModalOpen(false);
      setPinError(false);
      if (pendingPriceChange) {
        const updated = [...cart];
        updated[pendingPriceChange.index].unit_price = pendingPriceChange.newPrice;
        updated[pendingPriceChange.index].subtotal = updated[pendingPriceChange.index].qty * pendingPriceChange.newPrice;
        setCart(updated);
        setPendingPriceChange(null);
      }
      setEnteredPin('');
    } else {
      setPinError(true);
    }
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTotal = cartSubtotal; // taxes included / zero VAT on fruit
  const totalBoxes = cart.filter(i => i.item_type === 'caja').reduce((sum, i) => sum + i.qty, 0);
  const totalKg = cart.reduce((sum, i) => sum + i.kg_total, 0);

  // Quick Cash Bills
  const handleQuickCash = (amt: number) => {
    setCashReceived(amt);
  };

  const cashChange = Math.max(0, cashReceived - cartTotal);

  // Submit Sale Checkout
  const handleCompleteSale = async () => {
    if (!cart.length) return;
    if (paymentMethod === 'Efectivo' && cashReceived < cartTotal) {
      alert(`El efectivo recibido ($${cashReceived.toFixed(2)}) es menor al total ($${cartTotal.toFixed(2)}).`);
      return;
    }

    try {
      setProcessingSale(true);
      const payload = {
        customer_type: customerType,
        customer_name: customerName || 'Venta Mostrador',
        customer_phone: customerPhone,
        customer_rfc: customerRfc,
        items: cart,
        subtotal: cartSubtotal,
        discount_percent: 0,
        discount_amount: 0,
        tax_amount: 0,
        total: cartTotal,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'Efectivo' ? cashReceived : cartTotal,
        cash_change: paymentMethod === 'Efectivo' ? cashChange : 0,
        payment_reference: paymentReference,
        operator: currentRole === 'admin' ? 'Administrador' : 'Ventas CDMX',
        notes,
        invoice_requested: invoiceRequested ? 1 : 0
      };

      const res = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al procesar la venta');
      }

      const saleData: POSSale = await res.json();
      setCompletedSale(saleData);
      setCheckoutModalOpen(false);
      clearCart();
      fetchInventory(); // refresh stock
    } catch (err: any) {
      alert(err.message || 'Ocurrió un error al cobrar la venta.');
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="h-full flex flex-col xl:flex-row gap-4 p-4 min-h-[calc(100vh-80px)] bg-slate-100/70">
      {/* LEFT: Product Catalog Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        {/* Catalog Header & Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por calibre (V-XX, AL-XX), presentación o lote..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({inventory.length})
              </button>
              <button
                onClick={() => setCategoryFilter('caja')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === 'caja' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📦 Cajas Cerradas
              </button>
              <button
                onClick={() => setCategoryFilter('granel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === 'granel' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🍋 Granel por Kilo
              </button>
            </div>

            <button
              onClick={fetchInventory}
              title="Refrescar catálogo"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs">Cargando inventario de bodega CDMX...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <AlertCircle className="w-10 h-10 stroke-1 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No se encontraron productos disponibles</p>
              <p className="text-xs text-slate-400">Verifica los filtros o recibe transferencias en el almacén</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredProducts.map(product => {
                const isBox = product.item_type === 'caja';
                const stock = isBox ? product.boxes_stock : product.kg_stock;
                const unit = isBox ? 'cajas' : 'kg';
                const isOutOfStock = stock <= 0;
                const isLowStock = product.status === 'bajo_stock';

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`relative text-left p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Badges Bar */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isBox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isBox ? 'Caja Cerrada' : 'Granel / Kilo'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isOutOfStock ? 'bg-rose-100 text-rose-700' : isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {stock} {unit} disponibles
                        </span>
                      </div>

                      {/* Title & Calibre */}
                      <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">
                        {product.presentation_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-emerald-700">Calibre: {product.calibre}</span>
                        <span>•</span>
                        <span>Lote: {product.lot_code}</span>
                      </div>
                    </div>

                    {/* Price and Add Button */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium">Precio Mostrador</div>
                        <div className="text-base font-extrabold text-slate-900">
                          ${product.default_sale_price.toFixed(2)}{' '}
                          <span className="text-[11px] font-normal text-slate-500">/{isBox ? 'caja' : 'kg'}</span>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isOutOfStock ? 'bg-slate-200 text-slate-400' : 'bg-emerald-700 text-white shadow-sm'
                      }`}>
                        +
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart, Customer, Numpad & Fast Checkout */}
      <div className="w-full xl:w-[440px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        {/* Customer Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nombre del Cliente..."
                className="bg-transparent text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-1.5 py-0.5 w-full"
              />
              <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1.5">
                <select
                  value={customerType}
                  onChange={e => setCustomerType(e.target.value as any)}
                  className="bg-slate-800 text-slate-300 rounded text-[10px] px-1 py-0.5 border-none focus:ring-0"
                >
                  <option value="mostrador">Mostrador (General)</option>
                  <option value="taqueria">Taquería</option>
                  <option value="fruteria">Frutería</option>
                  <option value="restaurante">Restaurante / Comedor</option>
                  <option value="mayorista">Mayorista CEDA</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            title="Limpiar Carrito"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="h-44 overflow-y-auto p-2.5 divide-y divide-slate-100 border-b border-slate-200">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1">
              <ShoppingCart className="w-6 h-6 stroke-1 text-slate-300" />
              <p className="text-xs font-medium">Carrito vacío</p>
              <p className="text-[10px]">Toca un producto para agregarlo a la venta</p>
            </div>
          ) : (
            cart.map((item, index) => {
              const isSelected = selectedCartIndex === index;
              const isBox = item.item_type === 'caja';

              return (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedCartIndex(index);
                    setNumpadBuffer('');
                  }}
                  className={`py-2 px-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-emerald-50 border border-emerald-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <span>{item.qty} {isBox ? 'cj' : 'kg'} × ${item.unit_price.toFixed(2)}</span>
                      {isBox && <span className="text-slate-400">({item.kg_total.toFixed(1)} kg)</span>}
                      {item.unit_price < item.min_price_per_unit && (
                        <span className="text-amber-700 font-bold bg-amber-100 px-1 rounded flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Piso
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-extrabold text-xs text-slate-900">${item.subtotal.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(index);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Interactive Fast Numpad */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          {/* Numpad Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            <button
              onClick={() => { setNumpadMode('qty'); setNumpadBuffer(''); }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                numpadMode === 'qty'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3 h-3" /> Cantidad
            </button>
            <button
              onClick={() => { setNumpadMode('price'); setNumpadBuffer(''); }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                numpadMode === 'price'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3 h-3" /> Precio U.
            </button>
            <button
              onClick={() => { setNumpadMode('discount'); setNumpadBuffer(''); }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                numpadMode === 'discount'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Percent className="w-3 h-3" /> Desc %
            </button>
          </div>

          {/* Active Edit Buffer Display */}
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {numpadMode === 'qty' ? 'Ajustar Cantidad:' : numpadMode === 'price' ? 'Modificar Precio:' : 'Descuento (%):'}
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {numpadBuffer ? (
                numpadMode === 'price' ? `$${numpadBuffer}` : numpadMode === 'discount' ? `${numpadBuffer}%` : numpadBuffer
              ) : selectedCartIndex !== null && cart[selectedCartIndex] ? (
                numpadMode === 'qty' ? `${cart[selectedCartIndex].qty}` : numpadMode === 'price' ? `$${cart[selectedCartIndex].unit_price.toFixed(2)}` : '0%'
              ) : '--'}
            </span>
          </div>

          {/* Numpad Buttons Grid */}
          <div className="grid grid-cols-4 gap-1.5 font-mono text-sm font-bold">
            {['7', '8', '9', '+1'].map(k => (
              <button
                key={k}
                onClick={() => {
                  if (k === '+1' && selectedCartIndex !== null) {
                    updateCartItemQty(selectedCartIndex, cart[selectedCartIndex].qty + 1);
                  } else {
                    handleNumpadKey(k);
                  }
                }}
                className={`py-2 rounded-xl border transition-colors ${
                  k === '+1' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {k}
              </button>
            ))}
            {['4', '5', '6', '+5'].map(k => (
              <button
                key={k}
                onClick={() => {
                  if (k === '+5' && selectedCartIndex !== null) {
                    updateCartItemQty(selectedCartIndex, cart[selectedCartIndex].qty + 5);
                  } else {
                    handleNumpadKey(k);
                  }
                }}
                className={`py-2 rounded-xl border transition-colors ${
                  k === '+5' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {k}
              </button>
            ))}
            {['1', '2', '3', '+10'].map(k => (
              <button
                key={k}
                onClick={() => {
                  if (k === '+10' && selectedCartIndex !== null) {
                    updateCartItemQty(selectedCartIndex, cart[selectedCartIndex].qty + 10);
                  } else {
                    handleNumpadKey(k);
                  }
                }}
                className={`py-2 rounded-xl border transition-colors ${
                  k === '+10' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {k}
              </button>
            ))}
            {['C', '0', '.', '⌫'].map(k => (
              <button
                key={k}
                onClick={() => handleNumpadKey(k === '⌫' ? 'BACKSPACE' : k)}
                className={`py-2 rounded-xl border transition-colors ${
                  k === 'C' ? 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Totals & Checkout Trigger */}
        <div className="p-4 bg-white space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Partidas / Fruta Total:</span>
              <span className="font-medium text-slate-700">{cart.length} arts • {totalBoxes} cjs • {totalKg.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-sm">TOTAL A COBRAR:</span>
              <span className="font-black text-2xl text-emerald-700">${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setCashReceived(cartTotal);
              setCheckoutModalOpen(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            COBRAR ${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </button>
        </div>
      </div>

      {/* CHECKOUT / PAYMENT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Cobro de Venta</h3>
                <p className="text-xs text-slate-400">Cliente: {customerName} ({customerType})</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total a Pagar</span>
                <div className="text-xl font-black text-emerald-400">${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Método de Pago</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'Efectivo', label: 'Efectivo', icon: Banknote },
                    { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { id: 'Transferencia', label: 'SPEI', icon: ArrowRightLeft },
                    { id: 'Mixto', label: 'Mixto', icon: Sparkles },
                    { id: 'Credito', label: 'Crédito', icon: Tag }
                  ].map(m => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Denominations / Change Calculator */}
              {paymentMethod === 'Efectivo' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Efectivo Recibido:</label>
                    <input
                      type="number"
                      value={cashReceived || ''}
                      onChange={e => setCashReceived(parseFloat(e.target.value) || 0)}
                      className="w-36 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-right font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Fast Bills Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[cartTotal, 100, 200, 500, 1000, 2000].map((amt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickCash(amt)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                      >
                        {amt === cartTotal ? 'Exacto' : `$${amt}`}
                      </button>
                    ))}
                  </div>

                  {/* Change Output */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Cambio a Entregar:</span>
                    <span className={`text-xl font-black font-mono ${cashChange >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ${cashChange.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Transfer / Card Reference */}
              {(paymentMethod === 'Transferencia' || paymentMethod === 'Tarjeta') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Autorización / Clave Rastreo SPEI
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="Ej. AUT-889124 o Clave de rastreo"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Fiscal Invoice Option */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">¿Requiere Factura Fiscal (CFDI)?</span>
                </div>
                <input
                  type="checkbox"
                  checked={invoiceRequested}
                  onChange={e => setInvoiceRequested(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
              </div>

              {invoiceRequested && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">RFC del Cliente</label>
                    <input
                      type="text"
                      value={customerRfc}
                      onChange={e => setCustomerRfc(e.target.value.toUpperCase())}
                      placeholder="XAXX010101000"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="55-1234-5678"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                disabled={processingSale}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={processingSale}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                {processingSale ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar y Emitir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PIN MODAL FOR PRICE LOCK */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Precio por Debajo del Piso</h3>
            <p className="text-xs text-slate-500 mb-4">
              El precio ingresado es menor al precio base permitido. Ingrese el PIN de Administrador (PIN: 1234) para autorizar el descuento.
            </p>

            <form onSubmit={handleAdminPinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={e => { setEnteredPin(e.target.value); setPinError(false); }}
                placeholder="PIN Administrador"
                autoFocus
                className="w-full px-4 py-2.5 text-center tracking-widest font-mono text-lg bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              {pinError && (
                <p className="text-xs font-semibold text-rose-600">PIN Incorrecto. Intente nuevamente.</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPinModalOpen(false); setPendingPriceChange(null); setEnteredPin(''); }}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETED SALE THERMAL TICKET VIEWER */}
      {completedSale && (
        <POSThermalTicket
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};
