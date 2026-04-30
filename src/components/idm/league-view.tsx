'use client';

import { useAppStore } from '@/lib/store';
import {
  Trophy, Shield,
  BookOpen, Swords, Scale,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useQuery } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════════════
   PERATURAN — Rules & Format Section
   Tournament rules and scoring format
   Reads from CMS settings (prefix: peraturan_)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Parse JSON items from CMS setting string ─── */
function parseItems(value: string | undefined, fallback: { label: string; value: string; highlight: boolean }[]): { label: string; value: string; highlight: boolean }[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

/* ─── Default fallback data — sesuai logika backend score/route.ts ─── */
const DEFAULTS = {
  peraturan_subtitle: 'Panduan lengkap format turnamen, sistem poin, dan peraturan pertandingan Tarkam IDM. Pastikan Anda memahami semua aturan sebelum bertanding.',
  peraturan_poin_title: 'Sistem Poin Tarkam',
  peraturan_poin_items: JSON.stringify([
    { label: 'Menang Pertandingan', value: '+2 Poin', highlight: true },
    { label: 'Partisipasi Turnamen', value: '+1 Poin (sekali/tournament)', highlight: true },
    { label: 'Seri / Draw (Grup)', value: '+1 Poin', highlight: false },
    { label: 'Kalah Pertandingan', value: '0 Poin', highlight: false },
    { label: 'MVP Turnamen', value: 'Sesuai Hadiah', highlight: true },
    { label: 'Juara 1/2/3', value: 'Sesuai Hadiah', highlight: true },
  ]),
  peraturan_format_title: 'Format Turnamen',
  peraturan_format_items: JSON.stringify([
    { label: 'Jadwal', value: 'Setiap Minggu', highlight: true },
    { label: 'Durasi', value: '2-4 Jam', highlight: false },
    { label: 'Format', value: 'Single Elimination', highlight: true },
    { label: 'Peserta per Match', value: '1 vs 1', highlight: false },
    { label: 'Match Bisa Paralel', value: 'Ya (Efisiensi)', highlight: false },
    { label: 'Divisi', value: 'Male & Female', highlight: true },
  ]),
  peraturan_match_title: 'Peraturan Pertandingan',
  peraturan_match_items: JSON.stringify([
    { label: 'Peserta wajib hadir', value: 'Tepat Waktu', highlight: true },
    { label: 'Penilaian', value: 'Oleh Juri', highlight: false },
    { label: 'Keputusan Juri', value: 'Final & Binding', highlight: true },
    { label: 'MVP Dipilih', value: 'Oleh Organizer', highlight: false },
    { label: 'Hasil Diumumkan', value: 'Real-time', highlight: true },
  ]),
};

/* ─── Rule Card ─── */
function RuleCard({ icon: Icon, title, items, accentColor }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; value: string; highlight?: boolean }[];
  accentColor?: string;
}) {
  const dt = useDivisionTheme();
  return (
    <Card className={`${dt.casinoCard} overflow-hidden`}>
      <div className={dt.casinoBar} />
      <CardContent className="p-0 relative z-10">
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
          <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3 h-3 ${dt.neonText}`} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
        </div>
        <div className="p-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${dt.bgSubtle}`}>
              <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
              <span className={`text-xs font-bold ${item.highlight ? dt.neonText : 'text-foreground'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LeagueView() {
  const { division } = useAppStore();
  const dt = useDivisionTheme();
  const divisionLabel = division === 'male' ? 'Male' : 'Female';

  /* ── Fetch CMS settings ── */
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/settings');
      return res.json() as Promise<{ settings: { id: string; key: string; value: string; type: string }[]; map: Record<string, string> }>;
    },
    staleTime: 60_000,
  });

  const settingsMap = settingsData?.map || {};

  /* ── Parsed items from CMS ── */
  const subtitle = settingsMap.peraturan_subtitle || DEFAULTS.peraturan_subtitle;
  const poinTitle = settingsMap.peraturan_poin_title || DEFAULTS.peraturan_poin_title;
  const poinItems = parseItems(settingsMap.peraturan_poin_items, parseItems(DEFAULTS.peraturan_poin_items, []));
  const formatTitle = settingsMap.peraturan_format_title || DEFAULTS.peraturan_format_title;
  const formatItems = parseItems(settingsMap.peraturan_format_items, parseItems(DEFAULTS.peraturan_format_items, []));
  const matchTitle = settingsMap.peraturan_match_title || DEFAULTS.peraturan_match_title;
  const matchItems = parseItems(settingsMap.peraturan_match_items, parseItems(DEFAULTS.peraturan_match_items, []));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-idm-gold-warm" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══ Hero Banner ═══ */}
      <Card className={`${dt.casinoCard} ${dt.casinoGlow} casino-shimmer overflow-hidden`}>
        <div className={dt.casinoBar} />
        <div className="relative">
          <div className="absolute inset-0">
            <img src="/bg-default.jpg" alt="" className="w-full h-full object-cover object-[center_30%]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
          </div>
          <div className="relative z-10 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${dt.iconBg} flex items-center justify-center`}>
                <BookOpen className={`w-5 h-5 ${dt.neonText}`} />
              </div>
              <div>
                <h2 className={`text-lg font-black ${dt.neonGradient}`}>Peraturan & Format</h2>
                <p className="text-[11px] text-muted-foreground">Divisi {divisionLabel} — Tarkam IDM</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </Card>

      {/* ═══ Scoring Format ═══ */}
      <div className="stagger-item-subtle stagger-d0">
        <RuleCard
          icon={Trophy}
          title={poinTitle}
          items={poinItems}
        />
      </div>

      {/* ═══ Tournament Format ═══ */}
      <div className="stagger-item-subtle stagger-d1">
        <RuleCard
          icon={Swords}
          title={formatTitle}
          items={formatItems}
        />
      </div>

      {/* ═══ Match Rules ═══ */}
      <div className="stagger-item-subtle stagger-d2">
        <RuleCard
          icon={Scale}
          title={matchTitle}
          items={matchItems}
        />
      </div>
    </div>
  );
}
