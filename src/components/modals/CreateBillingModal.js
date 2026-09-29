'use client';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white">Criar Nova Cobrança de Aluno</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleCreateBillingSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Aluno *</label>
            <select
              required
              value={newBilling.user_id}
              onChange={(e) => setNewBilling({ ...newBilling, user_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
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
              <label className="block font-semibold text-slate-300 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={newBilling.amount}
                onChange={(e) => setNewBilling({ ...newBilling, amount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Vencimento *</label>
              <input
                type="date"
                required
                value={newBilling.due_date}
                onChange={(e) => setNewBilling({ ...newBilling, due_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Forma de Pagamento Preferencial</label>
            <select
              value={newBilling.payment_method || 'Pix'}
              onChange={(e) => setNewBilling({ ...newBilling, payment_method: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
            >
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Boleto">Boleto</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Transferência (TED)">Transferência (TED)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Observações (Opcional)</label>
            <textarea
              rows={2}
              value={newBilling.notes || ''}
              onChange={(e) => setNewBilling({ ...newBilling, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white"
              placeholder="Ex: Referente ao mês de outubro..."
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
              disabled={creatingBilling}
              className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer"
            >
              {creatingBilling ? 'Gerando...' : 'Salvar Cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
