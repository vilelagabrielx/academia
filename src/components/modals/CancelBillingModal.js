'use client';

import { AlertTriangle, X } from 'lucide-react';

export default function CancelBillingModal({
  isOpen,
  onClose,
  selectedCancelBilling,
  cancelBillingReason,
  setCancelBillingReason,
  handleCancelBillingSubmit,
  cancellingBilling
}) {
  if (!isOpen || !selectedCancelBilling) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 sm:p-6 border-t md:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] md:shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="ios-sheet-handle md:hidden" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Cancelar Cobrança</span>
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCancelBillingSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/10 space-y-1.5">
            <span className="text-slate-400 text-xs font-semibold block">Aluno:</span>
            <span className="font-bold text-white text-base block">
              {selectedCancelBilling.first_name ? `${selectedCancelBilling.first_name} ${selectedCancelBilling.last_name || ''}` : selectedCancelBilling.username}
            </span>
            <div className="flex justify-between items-center text-slate-300 pt-1 text-xs">
              <span>Valor: <strong className="text-rose-400 font-extrabold text-sm">R$ {parseFloat(selectedCancelBilling.amount).toFixed(2)}</strong></span>
              <span>Vencimento: <strong className="font-mono text-white">{String(selectedCancelBilling.due_date).split('T')[0]}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Motivo do Cancelamento (Obrigatório) *</label>
            <textarea
              required
              rows={3}
              value={cancelBillingReason}
              onChange={(e) => setCancelBillingReason(e.target.value)}
              placeholder="Descreva a justificativa (ex: Aluno trancou a matrícula, isenção concedida, etc)..."
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl p-3.5 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-slate-400 bg-white/5 hover:bg-white/10 font-bold min-h-[44px] active:scale-95 transition-all"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={cancellingBilling}
              className="px-6 py-3 rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all min-h-[44px] shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              {cancellingBilling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
