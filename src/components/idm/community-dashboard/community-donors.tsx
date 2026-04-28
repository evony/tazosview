'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, HandCoins, Sparkles } from 'lucide-react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { formatCurrencyShort } from '@/lib/utils';
import type { StatsData, TopDonor } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY DONORS — Top donor/supporter community leaderboard
   ═══════════════════════════════════════════════════════ */
interface CommunityDonorsProps {
  maleData?: StatsData;
  femaleData?: StatsData;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function getInitials(name: string): string {
  return name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CommunityDonors({ maleData, femaleData }: CommunityDonorsProps) {
  const dt = useCommunityTheme();

  // Merge topDonors from both divisions and combine same-name donors
  const { donors, totalDonation } = useMemo(() => {
    const donorMap = new Map<string, TopDonor>();

    const mergeDonors = (donors: TopDonor[]) => {
      for (const d of donors) {
        const key = d.donorName.toLowerCase().trim();
        const existing = donorMap.get(key);
        if (existing) {
          donorMap.set(key, {
            donorName: d.donorName,
            totalAmount: existing.totalAmount + d.totalAmount,
            donationCount: existing.donationCount + d.donationCount,
          });
        } else {
          donorMap.set(key, { ...d });
        }
      }
    };

    if (maleData?.topDonors) mergeDonors(maleData.topDonors);
    if (femaleData?.topDonors) mergeDonors(femaleData.topDonors);

    const sorted = Array.from(donorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    const top8 = sorted.slice(0, 8);
    const total = top8.reduce((s, d) => s + d.totalAmount, 0);

    return { donors: top8, totalDonation: total };
  }, [maleData, femaleData]);

  const maxAmount = donors[0]?.totalAmount || 1;

  // Empty state
  if (donors.length === 0) {
    return (
      <Card className={`${dt.casinoCard} overflow-hidden`}>
        <div className={dt.casinoBar} />
        <CardContent className="p-6">
          <div className={`flex flex-col items-center justify-center py-8 ${dt.bgSubtle} rounded-xl`}>
            <Heart className={`w-10 h-10 mb-3 opacity-30 ${dt.text}`} />
            <p className="text-sm text-muted-foreground font-medium">Belum ada donasi</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Jadilah yang pertama menyawer!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${dt.casinoCard} overflow-hidden`}>
      <div className={dt.casinoBar} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <HandCoins className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">Top Saweran</h3>
        <Badge className={`hidden sm:inline-flex ${dt.casinoBadge} ml-auto text-[9px]`}>KOMUNITAS</Badge>
      </div>

      <CardContent className="p-3 lg:p-6">
        {/* Total donation header */}
        <div className={`flex items-center justify-between mb-4 p-3 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Donasi Komunitas</p>
            <p className={`text-lg font-black ${dt.neonGradient}`}>
              {formatCurrencyShort(
                (maleData?.seasonDonationTotal || 0) + (femaleData?.seasonDonationTotal || 0)
              )}
            </p>
          </div>
          <Sparkles className={`w-5 h-5 ${dt.text} opacity-40`} />
        </div>

        {/* Donor rows */}
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {donors.map((donor, i) => {
            const progress = Math.max(5, (donor.totalAmount / maxAmount) * 100);
            const medal = RANK_MEDALS[i] || null;

            return (
              <motion.div
                key={donor.donorName}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className={`group flex items-center gap-3 p-2.5 rounded-xl hover:${dt.hoverBgSubtle} transition-colors duration-200`}
              >
                {/* Rank */}
                <span className="w-6 text-center text-sm shrink-0">
                  {medal || <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                </span>

                {/* Initials avatar */}
                <div className={`w-8 h-8 rounded-lg ${dt.iconBg} flex items-center justify-center shrink-0`}>
                  <span className={`text-[10px] font-bold ${dt.text}`}>{getInitials(donor.donorName)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate">{donor.donorName}</span>
                    <span className={`text-xs font-bold ${dt.neonGradient} shrink-0 ml-2`}>
                      {formatCurrencyShort(donor.totalAmount)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className={`h-1.5 rounded-full ${dt.casinoBar} overflow-hidden`}>
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        i === 0
                          ? 'from-yellow-500 to-amber-400'
                          : i === 1
                          ? 'from-gray-300 to-gray-400'
                          : i === 2
                          ? 'from-amber-600 to-amber-500'
                          : 'from-idm-gold-warm/60 to-idm-gold-warm/40'
                      }`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${progress}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Donation count badge */}
                <Badge className={`text-[8px] shrink-0 ${dt.badgeBg} border`}>
                  {donor.donationCount}x
                </Badge>
              </motion.div>
            );
          })}
        </div>

        {/* Sawer CTA */}
        <div className="mt-4">
          <button
            className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border border-yellow-500/20 ${dt.neonText} hover:from-yellow-500/30 hover:via-amber-500/30 hover:to-yellow-500/30 transition-all duration-300`}
          >
            💰 Sawer Sekarang
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
