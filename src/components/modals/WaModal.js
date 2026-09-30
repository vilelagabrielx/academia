'use client';

import { MessageCircle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 sm:p-6 border-t md:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] md:shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="ios-sheet-handle md:hidden" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <span>Enviar Lembrete por WhatsApp</span>
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/10 space-y-1">
            <span className="text-slate-400 text-xs font-semibold block">Aluno:</span>
            <span className="font-bold text-white text-base block">
              {selectedWaBilling.first_name ? `${selectedWaBilling.first_name} ${selectedWaBilling.last_name || ''}` : selectedWaBilling.username}
            </span>
            <span className="text-emerald-400 font-mono text-xs block pt-0.5">
              📱 WhatsApp: {selectedWaBilling.whatsapp || 'Não informado no cadastro'}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Mensagem a enviar:</label>
            <textarea
              rows={4}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
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
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenWhatsApp(selectedWaBilling)}
              className="px-6 py-3 rounded-2xl font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 min-h-[44px] cursor-pointer"
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
