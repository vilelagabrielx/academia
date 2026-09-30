'use client';

import { CheckCircle2, Upload, X, DollarSign, Calendar, User } from 'lucide-react';

export default function PaidBillingModal({
  isOpen,
  onClose,
  selectedPaidBilling,
  paidBillingNotes,
  setPaidBillingNotes,
  paidBillingProofFilename,
  setPaidBillingProofFilename,
  setPaidBillingProofBase64,
  handlePaidBillingSubmit,
  savingPaidBilling
}) {
  if (!isOpen || !selectedPaidBilling) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaidBillingProofFilename(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaidBillingProofBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 sm:p-6 border-t md:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] md:shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="ios-sheet-handle md:hidden" />
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Dar Baixa em Mensalidade</span>
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePaidBillingSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/10 space-y-1.5">
            <span className="text-slate-400 text-xs font-semibold block">Aluno:</span>
            <span className="font-bold text-white text-base block">
              {selectedPaidBilling.first_name ? `${selectedPaidBilling.first_name} ${selectedPaidBilling.last_name || ''}` : selectedPaidBilling.username}
            </span>
            <div className="flex justify-between items-center text-slate-300 pt-1 text-xs">
              <span>Valor: <strong className="text-emerald-400 font-extrabold text-sm">R$ {parseFloat(selectedPaidBilling.amount).toFixed(2)}</strong></span>
              <span>Vencimento: <strong className="font-mono text-white">{String(selectedPaidBilling.due_date).split('T')[0]}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Comprovante de Pagamento (Opcional)</label>
            <div className="relative border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 text-center transition-all bg-[#1C1C1E]/50">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <span className="text-slate-200 font-medium block text-xs sm:text-sm">
                {paidBillingProofFilename ? paidBillingProofFilename : 'Clique ou arraste o comprovante'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Imagens (PNG, JPG) ou PDF</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Observações do Pagamento</label>
            <textarea
              rows={2}
              value={paidBillingNotes}
              onChange={(e) => setPaidBillingNotes(e.target.value)}
              placeholder="Ex: Pago em dinheiro na recepção..."
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl p-3.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-slate-400 bg-white/5 hover:bg-white/10 font-bold min-h-[44px] active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingPaidBilling}
              className="px-6 py-3 rounded-2xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 min-h-[44px] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingPaidBilling ? 'Confirmando...' : 'Confirmar Pagamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
