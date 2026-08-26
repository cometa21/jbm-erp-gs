import React, { useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  CheckCircle2, 
  Scale, 
  HelpCircle, 
  X, 
  Loader2, 
  ShieldAlert,
  Printer,
  FileCheck
} from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'warning' | 'emerald' | 'primary' | 'info';

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
  highlighted?: boolean;
  badge?: string;
  badgeColor?: string;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: React.ReactNode;
  isLoading?: boolean;
  summaryItems?: SummaryItem[];
  extraContent?: React.ReactNode;
  confirmInputRequired?: string; // If set, user must type this exact word to confirm (e.g. "ELIMINAR")
  confirmInputPlaceholder?: string;
  id?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancelar',
  variant = 'warning',
  icon,
  isLoading = false,
  summaryItems = [],
  extraContent,
  confirmInputRequired,
  confirmInputPlaceholder = 'Escriba para confirmar...',
  id = 'confirmation-modal'
}: ConfirmationModalProps) {
  const [typedKeyword, setTypedKeyword] = React.useState('');
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Reset typed keyword when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypedKeyword('');
      // Autofocus confirm button if no text confirmation required
      const timer = setTimeout(() => {
        if (!confirmInputRequired && confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, confirmInputRequired]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isKeywordValid = !confirmInputRequired || typedKeyword.trim().toUpperCase() === confirmInputRequired.toUpperCase();

  // Style configurations by variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-600 border border-rose-200',
          defaultIcon: <Trash2 size={24} className="text-rose-600" />,
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-900/20 shadow-md',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          ringFocus: 'focus:ring-rose-500/20 focus:border-rose-500',
          defaultConfirmText: 'Eliminar Registro'
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
          defaultIcon: <CheckCircle2 size={24} className="text-emerald-700" />,
          confirmBtn: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-emerald-900/20 shadow-md',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          ringFocus: 'focus:ring-emerald-500/20 focus:border-emerald-500',
          defaultConfirmText: 'Confirmar y Finalizar'
        };
      case 'primary':
        return {
          iconBg: 'bg-slate-900 text-white border border-slate-700',
          defaultIcon: <FileCheck size={24} className="text-amber-400" />,
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-slate-900/20 shadow-md',
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
          ringFocus: 'focus:ring-slate-500/20 focus:border-slate-500',
          defaultConfirmText: 'Confirmar Acción'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-700 border border-blue-200',
          defaultIcon: <HelpCircle size={24} className="text-blue-700" />,
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-900/20 shadow-md',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          ringFocus: 'focus:ring-blue-500/20 focus:border-blue-500',
          defaultConfirmText: 'Aceptar'
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-100 text-amber-700 border border-amber-200',
          defaultIcon: <AlertTriangle size={24} className="text-amber-600" />,
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-900/20 shadow-md',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          ringFocus: 'focus:ring-amber-500/20 focus:border-amber-500',
          defaultConfirmText: 'Continuar'
        };
    }
  };

  const currentStyles = getVariantStyles();
  const finalConfirmText = confirmText || currentStyles.defaultConfirmText;

  const handleConfirmClick = async () => {
    if (!isKeywordValid || isLoading) return;
    await onConfirm();
  };

  return (
    <div 
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 no-print"
    >
      {/* Modal Card */}
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${currentStyles.iconBg}`}>
              {icon || currentStyles.defaultIcon}
            </div>
            <div>
              <h3 id={`${id}-title`} className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
              {variant === 'danger' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 mt-0.5">
                  <ShieldAlert size={11} /> Acción Irreversible
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {description && (
            <div className="text-sm text-slate-600 leading-relaxed font-normal">
              {description}
            </div>
          )}

          {/* Structured Data Summary Box */}
          {summaryItems.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Resumen de la Operación
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {summaryItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex justify-between items-center py-1.5 first:pt-0 last:pb-0 ${
                      item.highlighted ? 'bg-amber-50/60 -mx-2 px-2 rounded-lg font-semibold' : ''
                    }`}
                  >
                    <span className="text-slate-500 font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-right ${item.highlighted ? 'font-black text-slate-900 text-sm' : 'font-bold text-slate-800'}`}>
                        {item.value}
                      </span>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Extra Content */}
          {extraContent}

          {/* Confirm Keyword Safeguard (e.g. Type "ELIMINAR") */}
          {confirmInputRequired && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Para confirmar, escriba <strong className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{confirmInputRequired}</strong> a continuación:
              </label>
              <input
                type="text"
                value={typedKeyword}
                onChange={e => setTypedKeyword(e.target.value)}
                placeholder={confirmInputPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-xl px-3 py-2 text-sm font-mono outline-none uppercase transition-all"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 pt-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200 bg-white transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirmClick}
            disabled={!isKeywordValid || isLoading}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${currentStyles.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{finalConfirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
