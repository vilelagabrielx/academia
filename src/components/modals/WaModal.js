'use client';

import { MessageCircle } from 'lucide-react';

export default function WaModal({
  isOpen,
  onClose,
  selectedWaBilling,
  waMessage,
  setWaMessage,
  onOpenWhatsApp
}) {
  if (!isOpen || !selectedWaBilling) return null;

  const rawPhone = String(selectedWaBilling.whatsapp || '').replace(/\D/g, '');
  const formattedPhone = rawPhone ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`) : '';
  const waUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}` : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <span>Enviar Lembrete por WhatsApp</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-semibold block">Aluno:</span>
            <span className="font-bold text-white text-sm">
              {selectedWaBilling.first_name ? `${selectedWaBilling.first_name} ${selectedWaBilling.last_name || ''}` : selectedWaBilling.username}
            </span>
            <span className="text-emerald-400 font-mono text-xs block mt-0.5">
              📱 WhatsApp: {selectedWaBilling.whatsapp || 'Não informado no cadastro'}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Mensagem a enviar:</label>
            <textarea
              rows={4}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
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
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenWhatsApp(selectedWaBilling)}
              className="px-5 py-2 rounded-xl font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
