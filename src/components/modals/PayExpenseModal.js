'use client';

import { CheckCircle2, Upload } from 'lucide-react';

export default function PayExpenseModal({
  isOpen,
  onClose,
  selectedPayExpense,
  payExpenseProofFilename,
  setPayExpenseProofFilename,
  setPayExpenseProofBase64,
  handlePayExpenseSubmit,
  payingExpense
}) {
  if (!isOpen || !selectedPayExpense) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPayExpenseProofFilename(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayExpenseProofBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-rose-400" />
            <span>Confirmar Baixa de Despesa</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
          <span className="text-slate-400 block font-semibold">Despesa:</span>
          <span className="text-sm font-bold text-white block">{selectedPayExpense.description}</span>
          <div className="flex justify-between items-center text-slate-300 pt-1">
            <span>Valor: <strong className="text-rose-400">R$ {parseFloat(selectedPayExpense.amount).toFixed(2)}</strong></span>
            <span>Vencimento: <strong className="font-mono">{String(selectedPayExpense.due_date).split('T')[0]}</strong></span>
          </div>
        </div>

        <form onSubmit={handlePayExpenseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Comprovante de Pagamento (Opcional)</label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 text-center transition-all bg-slate-900/40">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-slate-300 font-medium block">
                {payExpenseProofFilename ? payExpenseProofFilename : 'Anexar comprovante de saída'}
              </span>
              <span className="text-[10px] text-slate-500">Imagens (PNG, JPG) ou PDF</span>
            </div>
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
              disabled={payingExpense}
              className="px-5 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer"
            >
              {payingExpense ? 'Confirmando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
