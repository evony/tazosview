'use client';

import { useAppStore } from '@/lib/store';
import {
  Trophy, Shield, Star, Zap, Users, Flame, Crown,
  HelpCircle, BookOpen, Scale, AlertCircle, ChevronDown, ChevronRight,
  Award, Swords, Clock, Calendar, CheckCircle2, XCircle, ArrowRight, Target, Music
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PERATURAN — Rules & Format Section
   Tournament rules, scoring format, and FAQ
   ═══════════════════════════════════════════════════════════════ */

/* ─── Expandable FAQ Item ─── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dt = useDivisionTheme();
  return (
    <div className={`rounded-lg border ${dt.borderSubtle} overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${dt.bgSubtle} hover:bg-white/[0.03]`}
      >
        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${dt.iconBg}`}>
          <HelpCircle className={`w-3.5 h-3.5 ${dt.neonText}`} />
        </div>
        <span className="text-xs font-semibold flex-1">{question}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed ml-9">{answer}</p>
        </div>
      )}
    </div>
  );
}

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
              Panduan lengkap format turnamen, sistem poin, dan peraturan pertandingan Tarkam IDM. Pastikan Anda memahami semua aturan sebelum bertanding.
            </p>
          </div>
        </div>
      </Card>

      {/* ═══ Scoring Format ═══ */}
      <div className="stagger-item-subtle stagger-d0">
        <RuleCard
          icon={Trophy}
          title="Sistem Poin Tarkam"
          items={[
            { label: 'Menang Pertandingan', value: '+3 Poin', highlight: true },
            { label: 'Kalah Pertandingan', value: '+1 Poin', highlight: false },
            { label: 'Tidak Hadir / Walkout', value: '0 Poin', highlight: false },
            { label: 'MVP Pekan', value: '+2 Bonus Poin', highlight: true },
            { label: 'Streak 3+ Menang', value: '+1 Bonus Poin', highlight: true },
          ]}
        />
      </div>

      {/* ═══ Tournament Format ═══ */}
      <div className="stagger-item-subtle stagger-d1">
        <RuleCard
          icon={Swords}
          title="Format Turnamen"
          items={[
            { label: 'Jadwal', value: 'Setiap Minggu', highlight: true },
            { label: 'Durasi', value: '2-4 Jam', highlight: false },
            { label: 'Format', value: 'Single Elimination', highlight: true },
            { label: 'Peserta per Match', value: '1 vs 1', highlight: false },
            { label: 'Match Bisa Paralel', value: 'Ja (Efisiensi)', highlight: false },
            { label: 'Divisi', value: 'Male & Female', highlight: true },
          ]}
        />
      </div>

      {/* ═══ Match Rules ═══ */}
      <div className="stagger-item-subtle stagger-d2">
        <RuleCard
          icon={Scale}
          title="Peraturan Pertandingan"
          items={[
            { label: 'Peserta wajib hadir', value: 'Tepat Waktu', highlight: true },
            { label: 'Terlambat / Tidak Hadir', value: 'Walkout (0 poin)', highlight: false },
            { label: 'Penilaian', value: 'Oleh Juri', highlight: false },
            { label: 'Keputusan Juri', value: 'Final & Binding', highlight: true },
            { label: 'MVP Dipilih', value: 'Oleh Organizer', highlight: false },
            { label: 'Hasil Diumumkan', value: 'Real-time', highlight: true },
          ]}
        />
      </div>

      {/* ═══ Season Rules ═══ */}
      <div className="stagger-item-subtle stagger-d3">
        <RuleCard
          icon={Calendar}
          title="Peraturan Season"
          items={[
            { label: 'Season Baru', value: 'Setelah Tournament Selesai', highlight: false },
            { label: 'Poin Reset', value: 'Setiap Season Baru', highlight: true },
            { label: 'Season Champion', value: '#1 di Akhir Season', highlight: true },
            { label: 'MVP Hall of Fame', value: 'Tercatat Selamanya', highlight: false },
            { label: 'Streak', value: 'Reset Setiap Season', highlight: false },
          ]}
        />
      </div>

      {/* ═══ Division Info ═══ */}
      <div className="stagger-item-subtle stagger-d4">
        <RuleCard
          icon={Shield}
          title={`Divisi ${divisionLabel}`}
          items={
            division === 'male'
              ? [
                  { label: 'Hari Pertandingan', value: 'Sabtu', highlight: true },
                  { label: 'Kategori', value: 'Male', highlight: false },
                  { label: 'Tier System', value: 'Aktif', highlight: false },
                ]
              : [
                  { label: 'Hari Pertandingan', value: 'Minggu', highlight: true },
                  { label: 'Kategori', value: 'Female', highlight: false },
                  { label: 'Tier System', value: 'Aktif', highlight: false },
                ]
          }
        />
      </div>

      {/* ═══ FAQ ═══ */}
      <div className="stagger-item-subtle stagger-d5">
        <Card className={`${dt.casinoCard} overflow-hidden`}>
          <div className={dt.casinoBar} />
          <CardContent className="p-0 relative z-10">
            <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
              <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                <HelpCircle className={`w-3 h-3 ${dt.neonText}`} />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider">Pertanyaan Umum</h3>
            </div>
            <div className="p-4 space-y-2">
              <FaqItem
                question="Bagaimana cara mendaftar turnamen?"
                answer="Klik tombol 'Daftar' di halaman Home atau kunjungi halaman pendaftaran. Pilih divisi (Male/Female), isi formulir, dan lakukan pembayaran sesuai instruksi. Setelah disetujui oleh admin, Anda akan masuk ke bracket turnamen."
              />
              <FaqItem
                question="Apa itu sistem poin Tarkam?"
                answer="Tarkam menggunakan sistem poin akumulatif. Setiap kemenangan bernilai +3 poin, kekalahan +1 poin, dan tidak hadir 0 poin. Bonus poin diberikan untuk MVP pekan (+2) dan streak kemenangan (+1). Poin direset setiap season baru."
              />
              <FaqItem
                question="Kapan pertandingan dimulai?"
                answer={`Turnamen ${divisionLabel} diadakan setiap minggu. Divisi Male biasanya pada hari Sabtu dan Female pada hari Minggu. Cek halaman Komunitas untuk jadwal terbaru dan countdown timer.`}
              />
              <FaqItem
                question="Berapa lama satu turnamen berlangsung?"
                answer="Satu putaran turnamen biasanya berlangsung 2-4 jam. Match berjalan back-to-back, bahkan bisa paralel demi efisiensi waktu. Pastikan Anda standby dan siap ketika nama Anda dipanggil."
              />
              <FaqItem
                question="Bagaimana cara menjadi MVP?"
                answer="MVP dipilih oleh organizer berdasarkan performa terbaik di setiap tournament. Faktor penilaian termasuk skill, konsistensi, dan sportivitas. MVP mendapat bonus +2 poin dan tercatat di MVP Hall of Fame."
              />
              <FaqItem
                question="Apa itu Season Champion?"
                answer="Season Champion adalah pemain yang berada di peringkat #1 saat season ditutup. Season berakhir ketika organizer menutup season tersebut. Champion mendapat penghargaan khusus dan tercatat di halaman Season Champion."
              />
              <FaqItem
                question="Apakah poin direset setiap season?"
                answer="Ya, semua poin dan streak direset setiap season baru dimulai. Namun, pencapaian seperti MVP Hall of Fame dan Season Champion tetap tercatat secara permanen."
              />
              <FaqItem
                question="Bagaimana jika saya terlambat atau tidak hadir?"
                answer="Jika Anda tidak hadir atau terlambat saat nama dipanggil, akan dianggap walkout dan mendapat 0 poin. Pastikan Anda hadir tepat waktu sesuai jadwal yang diumumkan."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
