'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, MessageCircle, Crown, Sparkles,
  Shirt, Gamepad2, UserCheck, Wand2, Package, ChevronRight,
  Flame, Tag
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface MarketplaceItem {
  id: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerWhatsapp?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isPremium: boolean;
  createdAt: string;
}

type CategoryFilter = 'all' | 'avatar' | 'accessory' | 'jasa_gb' | 'jasa_joki' | 'baju' | 'item' | 'lainnya';

/* ═══════════════════════════════════════════════════════
   CATEGORY CONFIG
   ═══════════════════════════════════════════════════════ */
const CATEGORIES: { id: CategoryFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'Semua', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'text-idm-gold-warm' },
  { id: 'avatar', label: 'Avatar', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
  { id: 'accessory', label: 'Aksesoris', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-purple-400' },
  { id: 'jasa_gb', label: 'Jasa GB', icon: <Gamepad2 className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
  { id: 'jasa_joki', label: 'Jasa Joki', icon: <Wand2 className="w-3.5 h-3.5" />, color: 'text-orange-400' },
  { id: 'baju', label: 'Baju', icon: <Shirt className="w-3.5 h-3.5" />, color: 'text-pink-400' },
  { id: 'item', label: 'Item', icon: <Package className="w-3.5 h-3.5" />, color: 'text-blue-400' },
  { id: 'lainnya', label: 'Lainnya', icon: <Tag className="w-3.5 h-3.5" />, color: 'text-muted-foreground' },
];

const CATEGORY_COLORS: Record<string, string> = {
  avatar: 'from-cyan-500/20 to-cyan-900/10 border-cyan-500/20',
  accessory: 'from-purple-500/20 to-purple-900/10 border-purple-500/20',
  jasa_gb: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/20',
  jasa_joki: 'from-orange-500/20 to-orange-900/10 border-orange-500/20',
  baju: 'from-pink-500/20 to-pink-900/10 border-pink-500/20',
  item: 'from-blue-500/20 to-blue-900/10 border-blue-500/20',
  lainnya: 'from-gray-500/20 to-gray-900/10 border-gray-500/20',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  avatar: <UserCheck className="w-4 h-4" />,
  accessory: <Sparkles className="w-4 h-4" />,
  jasa_gb: <Gamepad2 className="w-4 h-4" />,
  jasa_joki: <Wand2 className="w-4 h-4" />,
  baju: <Shirt className="w-4 h-4" />,
  item: <Package className="w-4 h-4" />,
  lainnya: <Tag className="w-4 h-4" />,
};

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function formatPrice(price: number): string {
  if (price === 0) return 'GRATIS';
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function getCategoryLabel(cat: string): string {
  return CATEGORIES.find(c => c.id === cat)?.label ?? cat;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/* ═══════════════════════════════════════════════════════
   MARKETPLACE SECTION
   ═══════════════════════════════════════════════════════ */
export function CommunityMarketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, [activeCategory, searchQuery]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await fetch(`/api/marketplace?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const premiumItems = items.filter(i => i.isPremium);
  const regularItems = items.filter(i => !i.isPremium);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-idm-gold-warm" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">Marketplace</h3>
            <p className="text-[10px] text-muted-foreground">Jual-beli item & jasa game</p>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/50">
          {items.length} iklan
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Cari item atau jasa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-border/30 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-idm-gold-warm/30 focus:ring-1 focus:ring-idm-gold-warm/20 transition-colors"
        />
      </div>

      {/* ── Category Pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap border transition-all duration-200 cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-idm-gold-warm/15 border-idm-gold-warm/30 text-idm-gold-warm'
                : 'bg-white/[0.03] border-border/20 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Premium Featured ── */}
      {premiumItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Featured</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {premiumItems.map((item) => (
              <MarketplaceCard key={item.id} item={item} isPremium />
            ))}
          </div>
        </div>
      )}

      {/* ── Regular Items ── */}
      <div className="space-y-2">
        {regularItems.length > 0 && premiumItems.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Semua Iklan</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regularItems.map((item) => (
            <MarketplaceCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-idm-gold-warm/30 border-t-idm-gold-warm rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-idm-gold-warm/10 flex items-center justify-center mb-3">
            <ShoppingBag className="w-7 h-7 text-idm-gold-warm/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground/60 mb-1">Belum Ada Iklan</p>
          <p className="text-[10px] text-muted-foreground/40 max-w-[200px]">
            {activeCategory !== 'all'
              ? `Belum ada iklan di kategori ${getCategoryLabel(activeCategory)}`
              : 'Marketplace segera hadir!'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MARKETPLACE CARD
   ═══════════════════════════════════════════════════════ */
function MarketplaceCard({ item, isPremium = false }: { item: MarketplaceItem; isPremium?: boolean }) {
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.lainnya;
  const catIcon = CATEGORY_ICONS[item.category] || <Tag className="w-4 h-4" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border overflow-hidden transition-all duration-200 hover:scale-[1.01] ${
        isPremium
          ? 'bg-gradient-to-br from-idm-gold-warm/10 via-transparent to-idm-gold-warm/5 border-idm-gold-warm/25 shadow-[0_0_20px_rgba(212,168,83,0.06)]'
          : 'bg-white/[0.02] border-border/15 hover:border-border/30'
      }`}
    >
      {/* Premium badge */}
      {isPremium && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-idm-gold-warm/20 border border-idm-gold-warm/30">
          <Crown className="w-2.5 h-2.5 text-idm-gold-warm" />
          <span className="text-[8px] font-bold text-idm-gold-warm uppercase tracking-wider">Premium</span>
        </div>
      )}

      <div className="flex gap-3 p-3">
        {/* Image / Icon placeholder */}
        <div className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-br ${catColor} border flex items-center justify-center`}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-muted-foreground/40">
              {catIcon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category tag */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[8px] font-bold uppercase tracking-wider ${
              CATEGORIES.find(c => c.id === item.category)?.color || 'text-muted-foreground'
            }`}>
              {getCategoryLabel(item.category)}
            </span>
            <span className="text-muted-foreground/20">•</span>
            <span className="text-[8px] text-muted-foreground/40">{timeAgo(item.createdAt)}</span>
          </div>

          {/* Title */}
          <h4 className="text-xs sm:text-sm font-bold text-foreground truncate mb-0.5 pr-12">
            {item.title}
          </h4>

          {/* Description */}
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 line-clamp-2 mb-2 leading-relaxed">
            {item.description}
          </p>

          {/* Bottom row: price + seller + CTA */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Price */}
              <span className={`text-xs sm:text-sm font-black ${
                item.price === 0 ? 'text-emerald-400' : 'text-idm-gold-warm'
              }`}>
                {formatPrice(item.price)}
              </span>
            </div>

            {/* CTA */}
            <AnimatePresence mode="wait">
              {!showWhatsApp ? (
                <motion.button
                  key="cta"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setShowWhatsApp(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-idm-gold-warm/10 border border-idm-gold-warm/20 text-[10px] font-bold text-idm-gold-warm hover:bg-idm-gold-warm/20 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Hubungi</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </motion.button>
              ) : (
                <motion.div
                  key="wa"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5"
                >
                  {item.sellerWhatsapp ? (
                    <a
                      href={`https://wa.me/${item.sellerWhatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </a>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/40">Tidak ada kontak</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowWhatsApp(false); }}
                    className="text-muted-foreground/30 hover:text-muted-foreground/60 text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Seller */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {item.sellerAvatar ? (
              <img src={item.sellerAvatar} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-idm-gold-warm/10 flex items-center justify-center">
                <span className="text-[7px] font-bold text-idm-gold-warm/60">{item.sellerName.charAt(0)}</span>
              </div>
            )}
            <span className="text-[9px] text-muted-foreground/50 font-medium truncate">{item.sellerName}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
