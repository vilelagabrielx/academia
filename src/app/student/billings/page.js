'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Upload, CheckCircle2, Clock, AlertCircle, FileText, Download, Eye, Paperclip, Check } from 'lucide-react';

export default function StudentBillingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Proof Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [proofBase64, setProofBase64] = useState('');
  const [filename, setFilename] = useState('');
  const [uploading, setUploading] = useState(false);

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/');
        } else {
          setUser(data.user);
          loadBillings(data.user.id);
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  const loadBillings = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billings?user_id=${userId}`);
      const data = await res.json();
      setBillings(data.billings || []);
    } catch (err) {
      console.error('Error fetching student billings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const submitProof = async (e) => {
    e.preventDefault();
    if (!proofBase64 || !selectedBilling) return alert('Selecione um arquivo de comprovante!');
    setUploading(true);

    try {
      const res = await fetch(`/api/billings/${selectedBilling.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof_base64: proofBase64, proof_filename: filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar comprovante');

      setShowUploadModal(false);
      setProofBase64('');
      setFilename('');
      loadBillings(user.id);
      alert('Comprovante Pix enviado com sucesso! O professor irá conferir e confirmar seu pagamento.');
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/student"
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                Minhas Mensalidades
              </span>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">
                Situação & Comprovantes Pix
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando mensalidades...</div>
        ) : billings.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 text-sm rounded-2xl border border-dashed border-slate-800">
            Nenhuma cobrança registrada para o seu usuário até o momento.
          </div>
        ) : (
          <div className="space-y-4">
            {billings.map((b) => (
              <div
                key={b.id}
                className={`glass-panel p-6 rounded-2xl border space-y-4 transition-all ${
                  b.status === 'paid'
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : b.status === 'overdue'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Valor da Mensalidade</span>
                    <span className="text-2xl font-extrabold text-white">
                      R$ {parseFloat(b.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    {b.status === 'paid' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Pago
                      </span>
                    ) : b.status === 'overdue' ? (
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs inline-flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Atrasado
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Pendente
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Vencimento:</span>
                    <span className="font-semibold text-slate-200">
                      {new Date(b.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Forma de Pagamento:</span>
                    <span className="font-semibold text-slate-200">{b.payment_method}</span>
                  </div>
                </div>

                {/* Comprovante status / action */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  {b.proof_base64 ? (
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
                      <Paperclip className="w-4 h-4" />
                      <span>Comprovante Pix Anexado</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Nenhum comprovante enviado ainda</span>
                  )}

                  <div className="flex items-center gap-2">
                    {b.status !== 'paid' && (
                      <button
                        onClick={() => {
                          setSelectedBilling(b);
                          setShowUploadModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Enviar Comprovante Pix</span>
                      </button>
                    )}

                    {b.receipt_generated && (
                      <button
                        onClick={() => {
                          setSelectedReceipt(b);
                          setShowReceiptModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Ver Recibo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Upload Proof Pix */}
      {showUploadModal && selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                Enviar Comprovante Pix
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={submitProof} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block font-semibold">Mensalidade: R$ {parseFloat(selectedBilling.amount).toFixed(2)}</span>
                <span className="text-slate-400 block">Vencimento: {new Date(selectedBilling.due_date).toLocaleDateString('pt-BR')}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Selecione a Imagem (Print) ou Arquivo PDF do Comprovante:
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={handleFileUpload}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-300 text-xs focus:outline-none"
                />
              </div>

              {filename && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Arquivo selecionado: {filename}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400"
                >
                  {uploading ? 'Enviando...' : 'Enviar Comprovante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Receipt */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950">RECIBO DE PAGAMENTO</h2>
              <p className="text-xs text-slate-500">Academia Pro &bull; Comprovante Quitado</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Aluno:</span>
                <span className="font-bold text-slate-900">{user.first_name} {user.last_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Valor Quitado:</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  R$ {parseFloat(selectedReceipt.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Forma de Pagamento:</span>
                <span className="font-bold">{selectedReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-semibold text-slate-500">Data de Vencimento:</span>
                <span>{new Date(selectedReceipt.due_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-500">Data de Pagamento:</span>
                <span className="font-bold text-emerald-600">
                  {new Date(selectedReceipt.paid_date || Date.now()).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800"
              >
                Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
