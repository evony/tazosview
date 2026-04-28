'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShoppingBag, Upload, CheckCircle, AlertCircle,
  UserCheck, Sparkles, Gamepad2, Wand2, Shirt, Package, Tag,
  Loader2, LogIn, ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

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
  const { playerAuth } = useAppStore();
  const isLoggedIn = playerAuth.isAuthenticated && !!playerAuth.account;

  const [form, setForm] = useState({
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

  // Auto-fill WhatsApp from player phone when logged in
  useEffect(() => {
    if (isLoggedIn && playerAuth.account?.player?.phone && !form.sellerWhatsapp) {
      setForm(p => ({ ...p, sellerWhatsapp: playerAuth.account!.player!.phone! }));
    }
  }, [isLoggedIn, playerAuth.account]);

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
        credentials: 'include', // Include player session cookie
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

  // Get player info for display
  const playerGamertag = playerAuth.account?.player?.gamertag || '';
  const playerAvatar = playerAuth.account?.player?.avatar || null;
  const playerTier = playerAuth.account?.player?.tier || '';

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

            {/* Not Logged In State */}
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <div className="w-14 h-14 rounded-full bg-idm-gold-warm/10 flex items-center justify-center mb-3">
                  <LogIn className="w-7 h-7 text-idm-gold-warm/60" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">Login Diperlukan</p>
                <p className="text-[10px] text-muted-foreground text-center max-w-[240px] mb-4">
                  Kamu harus login dengan akun gamertag terlebih dahulu untuk memasang iklan di marketplace. Ini agar identitas penjual bisa diverifikasi.
                </p>
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-idm-gold-warm hover:bg-[#e5be4a] text-black text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login Sekarang
                </button>
              </div>
            ) : submitResult === 'success' ? (
              /* Success State */
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
              /* Form — only shown when logged in */
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Verified Seller Badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <div className="relative flex-shrink-0">
                    {playerAvatar ? (
                      <img src={playerAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-idm-gold-warm/15 flex items-center justify-center">
                        <span className="text-sm font-bold text-idm-gold-warm">{playerGamertag.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <ShieldCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">{playerGamertag}</span>
                      <Badge tier={playerTier} />
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400 font-semibold">Penjual Terverifikasi</span>
                    </div>
                  </div>
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

                {/* WhatsApp */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp (opsional)</label>
                  <input
                    type="tel"
                    placeholder="08xxx — untuk dihubungi pembeli"
                    value={form.sellerWhatsapp}
                    onChange={(e) => setForm(p => ({ ...p, sellerWhatsapp: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors"
                  />
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
                    Iklan kamu akan ditinjau admin terlebih dahulu sebelum tampil di marketplace. Maksimal 5 pengajuan per hari. Nama penjual otomatis menggunakan gamertag kamu.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !form.title || !form.description || !form.price}
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

/* ═══════════════════════════════════════════════════════
   TIER BADGE — inline small badge
   ═══════════════════════════════════════════════════════ */
function Badge({ tier }: { tier: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    S: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'S' },
    A: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'A' },
    B: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'B' },
  };
  const c = config[tier] || config.B;
  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0 rounded text-[8px] font-black ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
