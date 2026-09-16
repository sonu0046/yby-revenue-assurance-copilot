import React from 'react';

export default function CurrencyMismatchModal({
  isOpen,
  contractCurrency,
  invoiceCurrency,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-red-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <div className="w-10 h-10 rounded-full bg-red-950 flex items-center justify-center text-xl font-bold border border-red-500/40">
            ⚠️
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Currency Mismatch Detected</h3>
            <span className="text-xs text-red-400 font-mono">ISO-4217 Invariant Violation</span>
          </div>
        </div>

        <div className="p-4 bg-gray-950 rounded-lg border border-gray-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Contract Locked Currency:</span>
            <span className="font-mono font-bold text-emerald-400">{contractCurrency}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Invoice Billed Currency:</span>
            <span className="font-mono font-bold text-red-400">{invoiceCurrency}</span>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          The deterministic audit engine strictly forbids mixed-currency reconciliations without explicit FX conversion schedules. Calculations have been halted to protect audit integrity.
        </p>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-lg transition-colors"
          >
            Acknowledge & Adjust Data
          </button>
        </div>
      </div>
    </div>
  );
}
