'use client';

import { X, CreditCard, Calendar, DollarSign, User, FileText } from 'lucide-react';

export default function CreateBillingModal({
  isOpen,
  onClose,
  newBilling,
  setNewBilling,
  students,
  handleCreateBillingSubmit,
  creatingBilling
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5 sm:p-6 border-t md:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] md:shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="ios-sheet-handle md:hidden" />
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Nova Cobrança de Aluno</span>
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateBillingSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aluno *</span>
            </label>
            <select
              required
              value={newBilling.user_id}
              onChange={(e) => setNewBilling({ ...newBilling, user_id: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="">Selecione o aluno...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.username}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Valor (R$) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newBilling.amount}
                onChange={(e) => setNewBilling({ ...newBilling, amount: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-emerald-400 font-extrabold text-base min-h-[44px] focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vencimento *</span>
              </label>
              <input
                type="date"
                required
                value={newBilling.due_date}
                onChange={(e) => setNewBilling({ ...newBilling, due_date: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-white min-h-[44px] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Forma de Pagamento Preferencial</label>
            <select
              value={newBilling.payment_method || 'Pix'}
              onChange={(e) => setNewBilling({ ...newBilling, payment_method: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-white min-h-[44px] focus:outline-none focus:border-emerald-500"
            >
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Boleto">Boleto</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Transferência (TED)">Transferência (TED)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observações (Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={newBilling.notes || ''}
              onChange={(e) => setNewBilling({ ...newBilling, notes: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl p-3.5 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Ex: Referente ao mês de outubro..."
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
              disabled={creatingBilling}
              className="px-6 py-3 rounded-2xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all min-h-[44px] shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {creatingBilling ? 'Gerando...' : 'Salvar Cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
