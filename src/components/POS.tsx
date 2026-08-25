import React from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const products = [
  { id: 1, name: 'Limón Persa 1ra', price: 450, unit: 'Caja 15kg', image: 'https://picsum.photos/seed/lemon1/200/200' },
  { id: 2, name: 'Limón Persa 2da', price: 320, unit: 'Caja 15kg', image: 'https://picsum.photos/seed/lemon2/200/200' },
  { id: 3, name: 'Naranja Valencia', price: 180, unit: 'Bulto 20kg', image: 'https://picsum.photos/seed/orange/200/200' },
  { id: 4, name: 'Toronja Roja', price: 280, unit: 'Caja 15kg', image: 'https://picsum.photos/seed/grapefruit/200/200' },
  { id: 5, name: 'Malla Limón 1kg', price: 35, unit: 'Pza', image: 'https://picsum.photos/seed/mesh/200/200' },
  { id: 6, name: 'Caja Madera Vacía', price: 25, unit: 'Pza', image: 'https://picsum.photos/seed/box/200/200' },
];

export function POS() {
  const [cart, setCart] = React.useState<{product: any, qty: number}[]>([]);
  const [search, setSearch] = React.useState('');

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? {...item, qty: item.qty + 1} : item));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean) as any);
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-100 overflow-hidden">
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
        <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2 ml-4">
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Todos</button>
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Cítricos</button>
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Empaque</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-brand-primary transition-all group"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-slate-100">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-bold text-slate-900 leading-tight mb-1">{product.name}</h4>
                <p className="text-xs text-slate-400 font-medium mb-3">{product.unit}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-brand-primary">${product.price}</span>
                  <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <Plus size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="w-full lg:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={24} className="text-brand-primary" />
            Carrito de Venta
          </h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                <ShoppingCart size={64} strokeWidth={1} />
                <p className="font-medium">El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <img src={item.product.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-400 font-medium">${item.product.price} / {item.product.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                    <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="font-bold text-sm text-slate-900">${(item.product.price * item.qty).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Subtotal</span>
              <span>${(total * 0.84).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm">
              <span>IVA (16%)</span>
              <span>${(total * 0.16).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-2xl pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-primary hover:text-brand-primary transition-all">
              <Banknote size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">Efectivo</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-primary hover:text-brand-primary transition-all">
              <CreditCard size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">Tarjeta</span>
            </button>
          </div>

          <button 
            disabled={cart.length === 0}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3"
          >
            Pagar Ahora
            <CreditCard size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
