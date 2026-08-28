import React, { useState, useEffect, useRef } from 'react';
import { POSInventoryItem } from '../../types';
import { 
  Barcode, Scan, Volume2, VolumeX, CheckCircle2, AlertCircle, 
  XCircle, Zap, Sparkles, BookOpen, X, Copy, Check, ArrowRight
} from 'lucide-react';

interface POSBarcodeScannerProps {
  inventory: POSInventoryItem[];
  onProductScanned: (product: POSInventoryItem) => void;
  disabled?: boolean;
}

export interface ScanResultNotification {
  id: string;
  product?: POSInventoryItem;
  code: string;
  timestamp: Date;
  status: 'success' | 'not_found' | 'out_of_stock';
  message: string;
}

export const POSBarcodeScanner: React.FC<POSBarcodeScannerProps> = ({
  inventory,
  onProductScanned,
  disabled = false
}) => {
  const [scannerInput, setScannerInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScan, setLastScan] = useState<ScanResultNotification | null>(null);
  const [laserActive, setLaserActive] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Buffer references for onKeyDown scanner input
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const laserTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesized Audio Beep for Hardware Scanner simulation
  const playBeep = (type: 'success' | 'error' | 'warning') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High-pitched double beep typical of Honeywell / Zebra POS scanners
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6
        osc.frequency.setValueAtTime(2349, ctx.currentTime + 0.05); // D7
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'error') {
        // Low double-buzz for unrecognized barcode
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(240, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.16);
      } else {
        // Warning buzz for out of stock
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (err) {
      console.warn('Audio feedback error:', err);
    }
  };

  // Core Barcode Processor
  const processBarcode = (rawCode: string): boolean => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return false;

    const upperCode = cleanCode.toUpperCase();

    // Trigger visual laser flash
    setLaserActive(true);
    if (laserTimerRef.current) clearTimeout(laserTimerRef.current);
    laserTimerRef.current = setTimeout(() => setLaserActive(false), 800);

    // Search inventory for matching product
    // 1. Exact match on barcode (e.g. 750108240001)
    // 2. Exact match on SKU (e.g. JBM-EXP-VXX)
    // 3. Exact match on lot_code (e.g. LOT-CDMX-0824A)
    // 4. Exact match on id (#1, ID-1, 1)
    // 5. Match calibre or presentation name prefix
    const matchedProduct = inventory.find(p => {
      const matchBarcode = p.barcode && p.barcode.trim().toUpperCase() === upperCode;
      const matchSku = p.sku && p.sku.trim().toUpperCase() === upperCode;
      const matchLot = p.lot_code && p.lot_code.trim().toUpperCase() === upperCode;
      const matchId = p.id.toString() === upperCode || `#${p.id}` === upperCode || `ID-${p.id}` === upperCode;
      return matchBarcode || matchSku || matchLot || matchId;
    }) || inventory.find(p => {
      return p.calibre && p.calibre.trim().toUpperCase() === upperCode;
    });

    if (matchedProduct) {
      const isBox = matchedProduct.item_type === 'caja';
      const availableStock = isBox ? matchedProduct.boxes_stock : matchedProduct.kg_stock;

      if (availableStock <= 0) {
        playBeep('warning');
        const notif: ScanResultNotification = {
          id: `${Date.now()}-${Math.random()}`,
          product: matchedProduct,
          code: cleanCode,
          timestamp: new Date(),
          status: 'out_of_stock',
          message: `⚠️ Producto agotado en bodega: "${matchedProduct.presentation_name}" (Lote: ${matchedProduct.lot_code})`
        };
        setLastScan(notif);
        return false;
      }

      // Add product to cart!
      onProductScanned(matchedProduct);
      playBeep('success');

      const notif: ScanResultNotification = {
        id: `${Date.now()}-${Math.random()}`,
        product: matchedProduct,
        code: cleanCode,
        timestamp: new Date(),
        status: 'success',
        message: `✅ Agregado: ${matchedProduct.presentation_name} • Calibre ${matchedProduct.calibre} (${matchedProduct.item_type === 'caja' ? 'Caja' : 'Kg'})`
      };
      setLastScan(notif);

      // Auto dismiss banner after 4.5s
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setLastScan(null);
      }, 4500);

      return true;
    } else {
      // Product not found
      playBeep('error');
      const notif: ScanResultNotification = {
        id: `${Date.now()}-${Math.random()}`,
        code: cleanCode,
        timestamp: new Date(),
        status: 'not_found',
        message: `❌ Código de barras "${cleanCode}" no encontrado en el inventario actual de la bodega.`
      };
      setLastScan(notif);

      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setLastScan(null);
      }, 4000);

      return false;
    }
  };

  // Hardware Scanner onKeyDown Global Listener
  useEffect(() => {
    if (disabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting system shortcuts (Ctrl+C, Cmd+R, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      const now = Date.now();
      const timeDelta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // When Enter is pressed:
      if (e.key === 'Enter') {
        const buffer = bufferRef.current.trim();
        if (buffer.length >= 2) {
          const handled = processBarcode(buffer);
          if (handled && isInput) {
            // Prevent unwanted form submit
            e.preventDefault();
          }
          bufferRef.current = '';
          return;
        }
        bufferRef.current = '';
        return;
      }

      // Ignore special control / function keys
      if (e.key.length !== 1) {
        if (e.key === 'Escape') {
          bufferRef.current = '';
          setLastScan(null);
        }
        return;
      }

      // Accumulate keystrokes
      // Hardware scanners typically burst characters under 50ms intervals.
      if (timeDelta > 250) {
        bufferRef.current = e.key;
      } else {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [inventory, disabled, soundEnabled]);

  const handleManualInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (scannerInput.trim()) {
        processBarcode(scannerInput);
        setScannerInput('');
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="space-y-2 mb-3">
      {/* Scanner Bar Container */}
      <div className={`p-2.5 rounded-2xl border transition-all duration-200 ${
        laserActive 
          ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-400/30' 
          : 'bg-slate-900 text-white border-slate-800 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Status and Scanner Input */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              laserActive 
                ? 'bg-emerald-600 text-white animate-pulse' 
                : 'bg-slate-800 text-emerald-400'
            }`}>
              <Barcode className="w-4 h-4" />
            </div>

            {/* Input with onKeyDown capture */}
            <div className="relative flex-1">
              <input
                type="text"
                value={scannerInput}
                onChange={e => setScannerInput(e.target.value)}
                onKeyDown={handleManualInputKeyDown}
                placeholder="Escanear con lector láser o teclear código de barras (Enter)..."
                className={`w-full pl-3 pr-24 py-1.5 rounded-xl text-xs font-mono font-medium transition-all focus:outline-none ${
                  laserActive
                    ? 'bg-white text-slate-900 border border-emerald-400 placeholder-slate-400 ring-2 ring-emerald-500'
                    : 'bg-slate-800/90 text-white border border-slate-700 placeholder-slate-400 focus:bg-slate-800 focus:border-emerald-400'
                }`}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (scannerInput.trim()) {
                      processBarcode(scannerInput);
                      setScannerInput('');
                    }
                  }}
                  disabled={!scannerInput.trim()}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Enter</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Hardware Simulator Buttons & Utilities */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
              <span className={`w-2 h-2 rounded-full ${laserActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
              <span className="font-semibold text-white">onKeyDown</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">HID Láser</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar beeps de escaneo' : 'Activar beeps de escaneo'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Catalog Modal Trigger */}
            <button
              onClick={() => setCatalogModalOpen(true)}
              title="Ver códigos de barras de todo el inventario"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Catálogo Códigos</span>
            </button>
          </div>
        </div>

        {/* Quick Test Barcode Pills */}
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Simular Escaneo:
          </span>
          {inventory.slice(0, 5).map(prod => {
            const codeToUse = prod.barcode || prod.sku || prod.lot_code;
            return (
              <button
                key={prod.id}
                onClick={() => processBarcode(codeToUse)}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-emerald-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-emerald-500 text-[10px] font-mono shrink-0 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="text-emerald-400 font-bold">{prod.calibre}</span>
                <span className="text-slate-400">({codeToUse})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Scan Notification Banner */}
      {lastScan && (
        <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm ${
          lastScan.status === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : lastScan.status === 'out_of_stock'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              lastScan.status === 'success'
                ? 'bg-emerald-600 text-white'
                : lastScan.status === 'out_of_stock'
                ? 'bg-amber-600 text-white'
                : 'bg-rose-600 text-white'
            }`}>
              {lastScan.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : lastScan.status === 'out_of_stock' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-bold truncate">
                {lastScan.message}
              </div>
              <div className="text-[10px] opacity-75 font-mono">
                Código: <span className="font-bold">{lastScan.code}</span> • {lastScan.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {lastScan.product && lastScan.status === 'success' && (
              <button
                onClick={() => processBarcode(lastScan.code)}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                +1 Otro
              </button>
            )}
            <button
              onClick={() => setLastScan(null)}
              className="p-1 rounded-md hover:bg-black/10 text-slate-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Catalog Barcode Cheat Sheet Modal */}
      {catalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Catálogo de Códigos de Barras y Lotes</h3>
                  <p className="text-xs text-slate-400">Escanee con pistola física o haga clic para probar al instante</p>
                </div>
              </div>
              <button
                onClick={() => setCatalogModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inventory.map(item => {
                  const barcode = item.barcode || `7501082400${item.id < 10 ? '0' + item.id : item.id}`;
                  const sku = item.sku || `JBM-POS-${item.id}`;
                  const isBox = item.item_type === 'caja';
                  const stock = isBox ? item.boxes_stock : item.kg_stock;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            isBox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isBox ? 'Caja' : 'Granel'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {stock} {isBox ? 'cajas' : 'kg'} disp.
                          </span>
                        </div>

                        <div className="font-bold text-xs text-slate-900 leading-snug">
                          {item.presentation_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Calibre: <strong className="text-emerald-700">{item.calibre}</strong> • Lote: <span className="font-mono">{item.lot_code}</span>
                        </div>

                        {/* Simulated Visual Barcode */}
                        <div className="mt-3 p-2 bg-white rounded-xl border border-slate-200 flex flex-col items-center">
                          {/* Monospace barcode bars simulation */}
                          <div className="font-mono text-lg font-black tracking-widest text-slate-900 select-none overflow-hidden h-6 flex items-center">
                            ||||| | |||| ||| |||| | ||||| | ||
                          </div>
                          <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                            {barcode}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            SKU: {sku}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyCode(barcode)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedCode === barcode ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            processBarcode(barcode);
                            setCatalogModalOpen(false);
                          }}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Scan className="w-3 h-3" />
                          <span>Escanear y Agregar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Compatible con lectores Honeywell, Zebra, Datalogic, Inateck, Symcode y emuladores HID.</span>
              <button
                onClick={() => setCatalogModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
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
