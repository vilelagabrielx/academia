'use client';

import { CheckCircle2, Upload } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Dar Baixa em Mensalidade</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handlePaidBillingSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Aluno:</span>
            <span className="font-bold text-white text-sm block">
              {selectedPaidBilling.first_name ? `${selectedPaidBilling.first_name} ${selectedPaidBilling.last_name || ''}` : selectedPaidBilling.username}
            </span>
            <div className="flex justify-between items-center text-slate-300 pt-1">
              <span>Valor: <strong className="text-emerald-400 font-black">R$ {parseFloat(selectedPaidBilling.amount).toFixed(2)}</strong></span>
              <span>Vencimento: <strong className="font-mono">{String(selectedPaidBilling.due_date).split('T')[0]}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Comprovante de Pagamento (Opcional)</label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-center transition-all bg-slate-900/40">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-slate-300 font-medium block">
                {paidBillingProofFilename ? paidBillingProofFilename : 'Clique ou arraste o comprovante aqui'}
              </span>
              <span className="text-[10px] text-slate-500">Imagens (PNG, JPG) ou PDF</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Observações do Pagamento</label>
            <textarea
              rows={2}
              value={paidBillingNotes}
              onChange={(e) => setPaidBillingNotes(e.target.value)}
              placeholder="Ex: Pago em dinheiro na recepção..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingPaidBilling}
              className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
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
