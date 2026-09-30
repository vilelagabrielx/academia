'use client';

import { X, TrendingDown, Calendar, DollarSign, Tag, FileText, RefreshCw } from 'lucide-react';

export default function CreateExpenseModal({
  isOpen,
  onClose,
  newExpense,
  setNewExpense,
  expenseCategories,
  paymentMethods,
  handleCreateExpenseSubmit,
  creatingExpense
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5 sm:p-6 border-t md:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] md:shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="ios-sheet-handle md:hidden" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <span>Cadastrar Nova Despesa (Saída)</span>
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateExpenseSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Descrição da Despesa *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel da Academia, Conta de Luz..."
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-white min-h-[44px] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Categoria *</span>
              </label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-white min-h-[44px] focus:outline-none focus:border-rose-500"
              >
                {expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                <span>Valor (R$) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-rose-400 font-extrabold text-base min-h-[44px] focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span>Vencimento *</span>
              </label>
              <input
                type="date"
                required
                value={newExpense.due_date}
                onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-white min-h-[44px] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Forma de Pagamento</label>
              <select
                value={newExpense.payment_method}
                onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 text-white min-h-[44px] focus:outline-none focus:border-rose-500"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
            <input
              type="checkbox"
              id="is_recurring_expense"
              checked={newExpense.is_recurring || false}
              onChange={(e) => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
              className="w-5 h-5 accent-rose-500 rounded-lg cursor-pointer"
            />
            <label htmlFor="is_recurring_expense" className="text-slate-200 font-semibold cursor-pointer select-none">
              Despesa Recorrente (Repete mensalmente)
            </label>
          </div>

          {newExpense.is_recurring && (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/10 animate-in fade-in">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Dia Fixo Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newExpense.due_day || '5'}
                  onChange={(e) => setNewExpense({ ...newExpense, due_day: e.target.value })}
                  className="w-full bg-[#26262A] border border-white/10 rounded-xl px-3 py-2 text-white min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Data Término (Opcional)</label>
                <input
                  type="date"
                  value={newExpense.end_date || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, end_date: e.target.value })}
                  className="w-full bg-[#26262A] border border-white/10 rounded-xl px-3 py-2 text-white min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Observações / Notas</label>
            <textarea
              rows={2}
              value={newExpense.notes || ''}
              onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl p-3.5 text-white focus:outline-none focus:border-rose-500"
              placeholder="Ex: Fornecedor XYZ, nota fiscal N° 123..."
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
              disabled={creatingExpense}
              className="px-6 py-3 rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all min-h-[44px] shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              {creatingExpense ? 'Cadastrando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
