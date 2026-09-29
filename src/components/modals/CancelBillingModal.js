'use client';

import { AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Cancelar Cobrança</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleCancelBillingSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Aluno:</span>
            <span className="font-bold text-white text-sm block">
              {selectedCancelBilling.first_name ? `${selectedCancelBilling.first_name} ${selectedCancelBilling.last_name || ''}` : selectedCancelBilling.username}
            </span>
            <div className="flex justify-between items-center text-slate-300 pt-1">
              <span>Valor: <strong className="text-rose-400">R$ {parseFloat(selectedCancelBilling.amount).toFixed(2)}</strong></span>
              <span>Vencimento: <strong className="font-mono">{String(selectedCancelBilling.due_date).split('T')[0]}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Motivo do Cancelamento (Obrigatório) *</label>
            <textarea
              required
              rows={3}
              value={cancelBillingReason}
              onChange={(e) => setCancelBillingReason(e.target.value)}
              placeholder="Descreva a justificativa (ex: Aluno trancou a matrícula, isenção concedida, etc)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 font-bold"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={cancellingBilling}
              className="px-5 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer"
            >
              {cancellingBilling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
