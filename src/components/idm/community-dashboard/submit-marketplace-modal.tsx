'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShoppingBag, Upload, CheckCircle, AlertCircle,
  UserCheck, Sparkles, Gamepad2, Wand2, Shirt, Package, Tag,
  Loader2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface SubmitMarketplaceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type CategoryOption = 'avatar' | 'accessory' | 'jasa_gb' | 'jasa_joki' | 'baju' | 'item' | 'lainnya';

/* ═══════════════════════════════════════════════════════
   CATEGORY CONFIG
   ═══════════════════════════════════════════════════════ */
const CATEGORIES: { id: CategoryOption; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'avatar', label: 'Avatar', icon: <UserCheck className="w-4 h-4" />, desc: 'Avatar, skin karakter' },
  { id: 'accessory', label: 'Aksesoris', icon: <Sparkles className="w-4 h-4" />, desc: 'Wings, effect, aksesoris' },
  { id: 'jasa_gb', label: 'Jasa GB', icon: <Gamepad2 className="w-4 h-4" />, desc: 'Jasa GB rank, dll' },
  { id: 'jasa_joki', label: 'Jasa Joki', icon: <Wand2 className="w-4 h-4" />, desc: 'Joki turnamen, ranking' },
  { id: 'baju', label: 'Baju', icon: <Shirt className="w-4 h-4" />, desc: 'Outfit, set baju couple' },
  { id: 'item', label: 'Item', icon: <Package className="w-4 h-4" />, desc: 'Item game, skin, dll' },
  { id: 'lainnya', label: 'Lainnya', icon: <Tag className="w-4 h-4" />, desc: 'Lain-lain' },
];

/* ═══════════════════════════════════════════════════════
   SUBMIT MARKETPLACE MODAL
   ═══════════════════════════════════════════════════════ */
export function SubmitMarketplaceModal({ open, onClose, onSuccess }: SubmitMarketplaceModalProps) {
  const [form, setForm] = useState({
    sellerName: '',
    sellerWhatsapp: '',
    title: '',
    description: '',
    price: '' as string | number,
    category: 'item' as CategoryOption,
    imageUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function handleClose() {
    if (isSubmitting) return;
    setSubmitResult('idle');
    setErrorMessage('');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitResult('idle');
    setErrorMessage('');

    try {
      const priceNum = typeof form.price === 'string' ? parseInt(form.price) || 0 : form.price;

      const res = await fetch('/api/marketplace/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: priceNum,
          imageUrl: form.imageUrl || undefined,
          sellerWhatsapp: form.sellerWhatsapp || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitResult('error');
        setErrorMessage(data.error || 'Gagal mengajukan iklan');
        return;
      }

      setSubmitResult('success');
      onSuccess();

      // Reset form after success
      setTimeout(() => {
        setForm({
          sellerName: '',
          sellerWhatsapp: '',
          title: '',
          description: '',
          price: '',
          category: 'item',
          imageUrl: '',
        });
        setSubmitResult('idle');
      }, 2000);
    } catch {
      setSubmitResult('error');
      setErrorMessage('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 pb-3 bg-background/95 backdrop-blur-sm border-b border-border/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-idm-gold-warm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Pasang Iklan</h3>
                  <p className="text-[10px] text-muted-foreground">Jual item atau jasa game kamu</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Success State */}
            {submitResult === 'success' ? (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3"
                >
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </motion.div>
                <p className="text-sm font-bold text-foreground mb-1">Iklan Berhasil Diajukan!</p>
                <p className="text-[10px] text-muted-foreground text-center max-w-[240px]">
                  Iklan kamu menunggu approval admin. Setelah disetujui, iklan akan otomatis tampil di marketplace.
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Seller Info */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Info Penjual</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama kamu / nama toko"
                    value={form.sellerName}
                    onChange={(e) => setForm(p => ({ ...p, sellerName: e.target.value }))}
                    maxLength={50}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp (08xxx) — opsional"
                    value={form.sellerWhatsapp}
                    onChange={(e) => setForm(p => ({ ...p, sellerWhatsapp: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Kategori</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[9px] font-semibold transition-all cursor-pointer ${
                          form.category === cat.id
                            ? 'bg-idm-gold-warm/15 border-idm-gold-warm/30 text-idm-gold-warm'
                            : 'bg-white/[0.02] border-border/15 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                        }`}
                      >
                        {cat.icon}
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Item Details */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Detail Iklan</label>
                  <input
                    type="text"
                    required
                    placeholder="Judul item / jasa"
                    value={form.title}
                    onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                    maxLength={100}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors"
                  />
                  <textarea
                    required
                    placeholder="Deskripsi singkat item/jasa kamu..."
                    value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors resize-none"
                  />
                  <div className="text-right">
                    <span className="text-[9px] text-muted-foreground/30">{form.description.length}/500</span>
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Harga (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-idm-gold-warm/60">Rp</span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground/30">Masukkan 0 jika gratis</p>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Gambar (opsional)</label>
                  <input
                    type="url"
                    placeholder="URL gambar item kamu..."
                    value={form.imageUrl}
                    onChange={(e) => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors"
                  />
                </div>

                {/* Error Message */}
                {submitResult === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <p className="text-[10px] text-red-400">{errorMessage}</p>
                  </motion.div>
                )}

                {/* Info Note */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-idm-gold-warm/5 border border-idm-gold-warm/10">
                  <AlertCircle className="w-3.5 h-3.5 text-idm-gold-warm/50 flex-shrink-0 mt-0.5" />
                  <p className="text-[9px] text-muted-foreground/50 leading-relaxed">
                    Iklan kamu akan ditinjau admin terlebih dahulu sebelum tampil di marketplace. Maksimal 3 pengajuan per hari.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !form.sellerName || !form.title || !form.description || !form.price}
                  className="w-full py-3 rounded-xl bg-idm-gold-warm hover:bg-[#e5be4a] disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mengajukan...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Ajukan Iklan
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
