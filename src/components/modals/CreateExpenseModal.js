'use client';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white">Cadastrar Nova Despesa (Saída)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleCreateExpenseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Descrição da Despesa *</label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel da Academia, Conta de Luz..."
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Categoria *</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                {expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-rose-400 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Data de Vencimento *</label>
              <input
                type="date"
                required
                value={newExpense.due_date}
                onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
              <select
                value={newExpense.payment_method}
                onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="checkbox"
              id="is_recurring_expense"
              checked={newExpense.is_recurring || false}
              onChange={(e) => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
            <label htmlFor="is_recurring_expense" className="text-slate-300 font-semibold cursor-pointer">
              Despesa Recorrente (Repete mensalmente)
            </label>
          </div>

          {newExpense.is_recurring && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Dia Fixo de Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newExpense.due_day || '5'}
                  onChange={(e) => setNewExpense({ ...newExpense, due_day: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Data de Término (Opcional)</label>
                <input
                  type="date"
                  value={newExpense.end_date || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, end_date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Observações / Notas</label>
            <textarea
              rows={2}
              value={newExpense.notes || ''}
              onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white"
              placeholder="Ex: Fornecedor XYZ, nota fiscal N° 123..."
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
              disabled={creatingExpense}
              className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer"
            >
              {creatingExpense ? 'Cadastrando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
