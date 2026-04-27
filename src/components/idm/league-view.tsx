'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Calendar, Crown, Shield, Users, Flame,
  Swords, Star, Zap, ChevronRight, TrendingUp, BarChart3, Info
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TierBadge } from './tier-badge';
import { ClubProfile } from './club-profile';
import { useState } from 'react';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import { getAvatarUrl } from '@/lib/utils';

interface ClubMember {
  id: string; gamertag: string; division: string; tier: string; points: number; role: string; avatar?: string | null;
}

interface LeagueClub {
  id: string; name: string; logo: string | null; wins: number; losses: number;
  points: number; gameDiff: number; memberCount: number;
  members: ClubMember[];
}

interface LeagueMatchData {
  id: string; week: number; score1: number | null; score2: number | null;
  status: string; format: string;
  club1: { id: string; name: string; logo: string | null };
  club2: { id: string; name: string; logo: string | null };
}

interface PlayoffData {
  id: string; round: string; score1: number | null; score2: number | null;
  status: string; format: string;
  club1: { id: string; name: string; logo: string | null };
  club2: { id: string; name: string; logo: string | null };
}

interface LeagueData {
  hasData: boolean;
  preSeason?: boolean;
  reason?: 'no_season' | 'no_clubs';
  season?: { id: string; name: string };
  ligaChampion?: {
    id: string; name: string; logo: string | null; seasonNumber: number;
    members: { id: string; gamertag: string; division: string; tier: string; points: number; role: string; avatar?: string | null }[];
  } | null;
  clubs: LeagueClub[];
  leagueMatches: LeagueMatchData[];
  playoffMatches: PlayoffData[];
  topPlayers: { id: string; gamertag: string; division: string; tier: string; points: number; totalWins: number; totalMvp: number; streak: number; avatar?: string | null }[];
  mvpCandidates: { id: string; gamertag: string; tier: string; totalMvp: number; points: number; totalWins: number; streak: number; avatar?: string | null; division?: string }[];
  stats: {
    totalClubs: number; totalMatches: number; completedMatches: number;
    liveMatches: number; totalWeeks: number; playedWeeks: number;
  };
  teamFormat: {
    size: number; main: number; substitute: number; rule: string;
  };
}

export function LeagueView() {
  const [selectedClub, setSelectedClub] = useState<LeagueClub | null>(null);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  // Safe score comparison — avoids non-null assertions on nullable score fields
  const scoreGt = (a: number | null | undefined, b: number | null | undefined) =>
    a !== null && a !== undefined && b !== null && b !== undefined && a > b;

  const { data, isLoading } = useQuery<LeagueData>({
    queryKey: ['league'],
    queryFn: async () => {
      const res = await fetch('/api/league');
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-idm-gold-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const d = data;
  const isNoSeason = d.reason === 'no_season';
  const isNoClubs = d.reason === 'no_clubs';

  if (!d.hasData) {
    return (
      <div className="animate-fade-enter">
        <div className="relative rounded-2xl overflow-hidden border border-idm-gold-warm/20" style={{ background: 'linear-gradient(135deg, #0a0806 0%, #1a1208 30%, #0d0a06 60%, #120a14 100%)' }}>
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(var(--idm-gold-warm) 1px, transparent 1px), linear-gradient(90deg, var(--idm-gold-warm) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.1) 0%, transparent 50%)' }} />
          <div className="relative p-8 sm:p-12 z-10">
            <div className="flex flex-col items-center text-center">
              {/* Animated icon */}
              <div
                className="animate-fade-enter relative mb-6"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-idm-gold-warm/20 to-idm-gold-warm/5 border border-idm-gold-warm/20 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-idm-gold-warm" />
                </div>
                <div
                  className="animate-bob-fade absolute -top-1 -right-1 w-3 h-3 rounded-full bg-idm-gold-warm opacity-70"
                />
              </div>

              {/* Season name badge if available */}
              {isNoClubs && d.season && (
                <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] border-idm-gold-warm/20 font-bold uppercase tracking-wider mb-3">
                  {d.season.name} — AKTIF
                </Badge>
              )}

              <h3 className="text-xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, var(--idm-gold-warm), #f5d78e, var(--idm-gold-warm))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {isNoSeason ? 'Season Belum Dimulai' : 'Liga Belum Dimulai'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                {isNoSeason
                  ? 'Liga IDM akan tersedia setelah season dimulai dan club terbentuk. Club di Liga IDM bebas mix atau tidak mix dari divisi male dan female.'
                  : 'Season sudah aktif, tapi club belum terbentuk. Liga IDM akan dimulai setelah club terdaftar dan pemain dialokasikan.'}
              </p>

              {/* What to expect */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {(isNoSeason ? [
                  { icon: Shield, label: 'Bebas Mix', desc: 'Male & female bebas digabung' },
                  { icon: Swords, label: 'Match Mingguan', desc: 'Jadwal liga setiap pekan' },
                  { icon: Crown, label: 'Playoff', desc: 'Grand Final BO5' },
                ] : [
                  { icon: Users, label: 'Club Formation', desc: 'Menunggu pembentukan club' },
                  { icon: Swords, label: 'Match Mingguan', desc: 'Jadwal liga setiap pekan' },
                  { icon: Crown, label: 'Playoff', desc: 'Grand Final BO5' },
                ]).map((step, i) => (
                  <div key={i} className="p-3 rounded-xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 text-center">
                    <step.icon className="w-5 h-5 mx-auto mb-1.5 text-idm-gold-warm" />
                    <p className="text-xs font-semibold">{step.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                ))}
              </div>

              {/* League format preview */}
              <div className="mt-4 p-3 rounded-xl border border-idm-gold-warm/10 bg-idm-gold-warm/5 w-full max-w-lg">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-idm-gold-warm shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-idm-gold-warm">Format Liga</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      3 pemain inti + 2 cadangan per tim.
                      Peserta <span className="text-idm-gold-warm font-semibold">bebas mix</span> dari divisi male dan female — skuad champion dapat memilih anggota dari divisi mana saja.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Season Champion Card — shown even when current season has no clubs */}
        {d.ligaChampion && (
          <div
            className="animate-fade-enter mt-4 rounded-2xl border border-idm-gold-warm/25 overflow-hidden"
            style={{ animationDelay: '0.3s', background: 'linear-gradient(135deg, #0c0a06 0%, #1a1208 40%, #0d0a06 70%, #0c0a06 100%)' }}
          >
            <div className="h-0.5 bg-gradient-to-r from-transparent via-idm-gold-warm to-transparent" />
            <div className="relative p-4 sm:p-5 z-10">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <ClubLogoImage clubName={d.ligaChampion.name} dbLogo={d.ligaChampion.logo} alt={d.ligaChampion.name} width={48} height={48} className="w-12 h-12 rounded-xl object-cover border border-idm-gold-warm/25" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-md">
                    <Crown className="w-3 h-3 text-[#0c0a06]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm text-[8px] border-idm-gold-warm/20 font-bold uppercase tracking-wider">Season {d.ligaChampion.seasonNumber} Champion</Badge>
                    <Badge className="bg-yellow-500/10 text-yellow-500 text-[8px] border-0">Liga IDM</Badge>
                  </div>
                  <h4 className="text-base font-black text-white truncate">{d.ligaChampion.name}</h4>
                  <p className="text-[11px] text-muted-foreground">Juara Liga IDM Season {d.ligaChampion.seasonNumber} — {d.ligaChampion.members.length} pemain (male & female)</p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {d.ligaChampion.members.slice(0, 5).map(m => (
                    <div
                      key={m.id}
                      className={`w-7 h-7 rounded-md overflow-hidden shrink-0 border ${m.division === 'male' ? 'border-cyan-500/20' : 'border-purple-500/20'}`}
                      title={m.gamertag}
                    >
                      <Image
                        src={getAvatarUrl(m.gamertag, m.division as 'male' | 'female', m.avatar)}
                        alt={m.gamertag}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                  {d.ligaChampion.members.length > 5 && (
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[8px] font-bold border border-white/10 bg-white/5 text-muted-foreground">
                      +{d.ligaChampion.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { clubs, leagueMatches, playoffMatches, topPlayers, mvpCandidates, stats, teamFormat } = data;
  const weeks = [...new Set(leagueMatches.map(m => m.week))].sort((a, b) => a - b);

  // ═══ PRE-SEASON STATE: Clubs exist but no matches played yet ═══
  if (d.preSeason) {
    const maleCount = clubs.reduce((acc, c) => acc + c.members.filter(m => m.division === 'male').length, 0);
    const femaleCount = clubs.reduce((acc, c) => acc + c.members.filter(m => m.division === 'female').length, 0);
    const totalMembers = clubs.reduce((acc, c) => acc + c.memberCount, 0);
    const clubsFemale = clubs.filter(c => c.members.some(m => m.division === 'female')).length;

    return (
      <div className="animate-fade-enter space-y-4">
        {/* Hero Banner - Pre-Season */}
        <div className="relative rounded-2xl overflow-hidden border border-idm-gold-warm/20" style={{ background: 'linear-gradient(135deg, #0a0806 0%, #1a1208 30%, #0d0a06 60%, #120a14 100%)' }}>
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(var(--idm-gold-warm) 1px, transparent 1px), linear-gradient(90deg, var(--idm-gold-warm) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.12) 0%, transparent 50%)' }} />
          <div className="relative p-6 sm:p-8 z-10">
            <div className="flex flex-col items-center text-center">
              {/* Animated Trophy */}
              <div
                className="animate-fade-enter relative mb-5"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-idm-gold-warm/20 to-idm-gold-warm/5 border border-idm-gold-warm/20 flex items-center justify-center" style={{ boxShadow: '0 0 40px rgba(212,168,83,0.15)' }}>
                  <Trophy className="w-9 h-9 text-idm-gold-warm" />
                </div>
                <div
                  className="animate-bob-fade absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-idm-gold-warm/80"
                />
              </div>

              {/* Season Badge */}
              <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] border-idm-gold-warm/20 font-bold uppercase tracking-wider mb-3">
                {d.season?.name} — PRE-SEASON
              </Badge>

              <h3 className="text-2xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, var(--idm-gold-warm), #f5d78e, var(--idm-gold-warm))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Liga IDM
              </h3>
              <p className="text-sm text-muted-foreground max-w-lg mb-6 leading-relaxed">
                {stats.totalClubs} club sudah terbentuk dan siap bertanding. Liga IDM menunggu jadwal resmi — pertarungan antar club, peserta bebas mix dari divisi male dan female.
              </p>

              {/* Live Stats */}
              <div className="grid grid-cols-4 gap-3 w-full max-w-md mb-6">
                <div className="p-3 rounded-xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 text-center">
                  <p className="text-lg font-bold text-idm-gold-warm">{stats.totalClubs}</p>
                  <p className="text-[9px] text-muted-foreground">Clubs</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                  <p className="text-lg font-bold text-cyan-400">{maleCount}</p>
                  <p className="text-[9px] text-muted-foreground">Male</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                  <p className="text-lg font-bold text-purple-400">{femaleCount}</p>
                  <p className="text-[9px] text-muted-foreground">Female</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 text-center">
                  <p className="text-lg font-bold text-green-400">{clubsFemale}/{stats.totalClubs}</p>
                  <p className="text-[9px] text-muted-foreground">Bebas Mix</p>
                </div>
              </div>

              {/* Format Info */}
              <div className="p-3 rounded-xl border border-idm-gold-warm/10 bg-idm-gold-warm/5 w-full max-w-lg">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-idm-gold-warm shrink-0 mt-0.5" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-idm-gold-warm">Format Tim Liga</span>
                      <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[9px] border-0">{teamFormat.size} Pemain</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-medium">{teamFormat.main} pemain inti</span> + <span className="text-foreground font-medium">{teamFormat.substitute} cadangan</span> per tim.
                      Peserta <span className="text-idm-gold-warm font-semibold">bebas mix</span> dari divisi male dan female.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Season 1 Champion Card */}
        {d.ligaChampion && (
          <div
            className="animate-fade-enter rounded-2xl border border-idm-gold-warm/25 overflow-hidden"
            style={{ animationDelay: '0.3s', background: 'linear-gradient(135deg, #0c0a06 0%, #1a1208 40%, #0d0a06 70%, #0c0a06 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--idm-gold-warm) 1px, transparent 1px), linear-gradient(90deg, var(--idm-gold-warm) 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
            <div className="h-0.5 bg-gradient-to-r from-transparent via-idm-gold-warm to-transparent" />
            <div className="relative p-4 sm:p-5 z-10">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <ClubLogoImage clubName={d.ligaChampion.name} dbLogo={d.ligaChampion.logo} alt={d.ligaChampion.name} width={48} height={48} className="w-12 h-12 rounded-xl object-cover border border-idm-gold-warm/25" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-md">
                    <Crown className="w-3 h-3 text-[#0c0a06]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm text-[8px] border-idm-gold-warm/20 font-bold uppercase tracking-wider">Season {d.ligaChampion.seasonNumber} Champion</Badge>
                    <Badge className="bg-yellow-500/10 text-yellow-500 text-[8px] border-0">Liga IDM</Badge>
                  </div>
                  <h4 className="text-base font-black text-white truncate">{d.ligaChampion.name}</h4>
                  <p className="text-[11px] text-muted-foreground">Juara Liga IDM Season {d.ligaChampion.seasonNumber} — {d.ligaChampion.members.length} pemain (male & female)</p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {d.ligaChampion.members.slice(0, 8).map(m => (
                    <div
                      key={m.id}
                      className="w-7 h-7 rounded-md overflow-hidden shrink-0 border border-white/10"
                      title={m.gamertag}
                    >
                      <Image
                        src={getAvatarUrl(m.gamertag, m.division as 'male' | 'female', m.avatar)}
                        alt={m.gamertag}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                  {d.ligaChampion.members.length > 8 && (
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[8px] font-bold border border-white/10 bg-white/5 text-muted-foreground">
                      +{d.ligaChampion.members.length - 8}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Club Preview Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-idm-gold-warm" />
            <h3 className="text-sm font-semibold">Club Terdaftar</h3>
            <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[9px] border-0">{stats.totalClubs}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {clubs.map((club, idx) => {
              const clubFemale = club.members.filter(m => m.division === 'female').length;
              return (
                <div
                  key={club.id}
                  className="animate-fade-enter-sm p-3 rounded-xl border border-idm-gold-warm/10 bg-idm-gold-warm/5 hover:bg-idm-gold-warm/10 transition-colors cursor-pointer"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => setSelectedClub(club)}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold truncate">{club.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{club.memberCount}</span>
                    {clubFemale > 0 && <span className="text-purple-400">♀{clubFemale}</span>}
                    <span className="ml-auto">
                      {clubFemale > 0 ? (
                        <span className="text-green-500 text-[9px]">✓ bebas mix</span>
                      ) : (
                        <span className="text-red-400 text-[9px]">⚠ need ♀</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What's Next */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: 'Menunggu Jadwal', desc: 'Liga IDM akan dijadwalkan setelah pendanaan terpenuhi', status: 'waiting' },
            { icon: Swords, label: 'Match Antar Club', desc: 'Club bertanding, peserta bebas mix dari divisi mana saja', status: 'upcoming' },
            { icon: Crown, label: 'Playoff', desc: 'Top club melaju ke playoff Grand Final', status: 'upcoming' },
          ].map((step, i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <step.icon className="w-5 h-5 text-idm-gold-warm" />
                <span className="text-xs font-semibold">{step.label}</span>
                <Badge className={`text-[8px] border-0 ml-auto ${
                  step.status === 'waiting' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-muted text-muted-foreground'
                }`}>
                  {step.status === 'waiting' ? 'Menunggu' : 'Akan Datang'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Club Profile Modal */}
        {selectedClub && (
          <ClubProfile
            club={{
              ...selectedClub,
              logo: selectedClub.logo,
              division: 'league',
              members: selectedClub.members.map(m => ({
                id: m.id,
                name: m.gamertag,
                gamertag: m.gamertag,
                tier: m.tier,
                points: m.points,
                avatar: m.avatar,
              })),
            }}
            onClose={() => setSelectedClub(null)}
            rank={clubs.findIndex(c => c.id === selectedClub.id) + 1}
          />
        )}
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">

      {/* ═══ HERO BANNER — Liga IDM ═══ */}
      <div className="stagger-item-fast stagger-d0">
        <div className="relative rounded-2xl overflow-hidden border border-idm-gold-warm/20" style={{ background: 'linear-gradient(135deg, #0a0806 0%, #1a1208 30%, #0d0a06 60%, #120a14 100%)' }}>
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(var(--idm-gold-warm) 1px, transparent 1px), linear-gradient(90deg, var(--idm-gold-warm) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {/* Gold radial glow */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.1) 0%, transparent 50%)' }} />

          <div className="relative p-5 lg:p-6 z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Logo */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-idm-gold-warm/20 to-idm-gold-warm/5 border border-idm-gold-warm/20 flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 30px rgba(212,168,83,0.1)' }}>
                <Trophy className="w-7 h-7 text-idm-gold-warm" />
              </div>
              {/* Title */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[9px] border-idm-gold-warm/20 font-bold uppercase tracking-wider">Liga IDM</Badge>
                  {d.season && <Badge className="bg-muted/50 text-muted-foreground text-[9px] border-0">{d.season.name}</Badge>}
                </div>
                <h2 className="text-xl lg:text-2xl font-bold" style={{ background: 'linear-gradient(135deg, var(--idm-gold-warm), #f5d78e, var(--idm-gold-warm))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  IDM League
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Club bertanding — peserta bebas mix dari divisi male dan female</p>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-idm-gold-warm">{stats.totalClubs}</p>
                  <p className="text-[9px] text-muted-foreground">Clubs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-idm-gold-warm">{stats.completedMatches}</p>
                  <p className="text-[9px] text-muted-foreground">Dimainkan</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-idm-gold-warm">{stats.totalWeeks > 0 ? `${weeks.length}/${stats.totalWeeks}` : '-'}</p>
                  <p className="text-[9px] text-muted-foreground">{stats.totalWeeks > 0 ? 'Weeks' : 'Jadwal'}</p>
                </div>
              </div>
            </div>

            {/* Season Progress — Liga IDM doesn't have fixed weekly schedule */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                <span>Progress Liga</span>
                <span className="text-idm-gold-warm font-semibold">
                  {stats.totalWeeks > 0
                    ? `${Math.round((stats.playedWeeks / stats.totalWeeks) * 100)}%`
                    : stats.completedMatches > 0
                      ? `${stats.completedMatches} match selesai`
                      : 'Menunggu Jadwal'
                  }
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                {stats.totalWeeks > 0 ? (
                  <div className="h-full rounded-full" style={{ width: `${(stats.playedWeeks / stats.totalWeeks) * 100}%`, background: 'linear-gradient(90deg, var(--idm-gold-warm), #f5d78e, var(--idm-gold-warm))' }} />
                ) : (
                  <div className="h-full rounded-full w-0" style={{ background: 'linear-gradient(90deg, var(--idm-gold-warm), #f5d78e, var(--idm-gold-warm))' }} />
                )}
              </div>
              {stats.totalWeeks === 0 && (
                <p className="text-[9px] text-muted-foreground/60 mt-1 text-center">Jadwal liga bergantung pada pendanaan & sponsor</p>
              )}
            </div>

            {/* Team Format Info */}
            <div className="mt-4 p-3 rounded-xl border border-idm-gold-warm/10 bg-idm-gold-warm/5">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-idm-gold-warm shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-idm-gold-warm">Format Tim Liga</span>
                    <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[9px] border-0">{teamFormat.size} Pemain</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">{teamFormat.main} pemain inti</span> + <span className="text-foreground font-medium">{teamFormat.substitute} cadangan</span> per tim.
                    Peserta <span className="text-idm-gold-warm font-semibold">bebas mix</span> dari divisi male dan female — skuad champion dapat memilih anggota dari divisi mana saja.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LIVE INDICATOR ═══ */}
      {stats.liveMatches > 0 && (
        <div className="stagger-item-fast stagger-d1">
          <div className="relative rounded-xl overflow-hidden border border-red-500/20 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5 p-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-500">{stats.liveMatches} Match Sedang Berlangsung!</span>
              <ChevronRight className="w-4 h-4 text-red-500 ml-auto" />
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-muted/50 h-auto p-1">
          <TabsTrigger value="standings" className="text-[11px] py-2 tab-premium">Klasemen</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[11px] py-2 tab-premium">Jadwal</TabsTrigger>
          <TabsTrigger value="stats" className="text-[11px] py-2 tab-premium">Statistik</TabsTrigger>
          <TabsTrigger value="playoff" className="text-[11px] py-2 tab-premium">Playoff</TabsTrigger>
        </TabsList>

        {/* ═══ STANDINGS ═══ */}
        <TabsContent value="standings" className="mt-4">
          <div className="space-y-2">
            {clubs.map((club, idx) => {
              const isChampion = d.ligaChampion?.id === club.id;
              const isTop4 = idx < 4;
              const isExpanded = expandedClub === club.id;
              const maleCount = club.members.filter(m => m.division === 'male').length;
              const femaleCount = club.members.filter(m => m.division === 'female').length;
              const wr = club.wins + club.losses > 0 ? Math.round((club.wins / (club.wins + club.losses)) * 100) : 0;

              return (
                <div key={club.id} className="stagger-item" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div
                    className={`rounded-xl transition-all cursor-pointer ${
                      isChampion ? 'border border-idm-gold-warm/20' : isTop4 ? 'border border-border/30' : 'border border-border/20'
                    }`}
                    style={isChampion ? { background: 'linear-gradient(135deg, rgba(212,168,83,0.06) 0%, rgba(20,17,10,0.6) 50%, rgba(212,168,83,0.04) 100%)' } : { background: 'rgba(20,17,10,0.4)' }}
                    onClick={() => setExpandedClub(isExpanded ? null : club.id)}
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-3 p-3">
                      {/* Rank */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === 0 ? 'bg-idm-gold-warm/20 text-idm-gold-warm' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-amber-600/20 text-amber-600' :
                        isTop4 ? 'bg-idm-gold-warm/10 text-idm-gold-warm/60' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                      </div>

                      {/* Club Logo */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                        <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} width={40} height={40} className={`w-full h-full object-cover ${isChampion ? 'ring-2 ring-idm-gold-warm/40' : ''}`} />
                      </div>

                      {/* Club Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isChampion ? 'text-idm-gold-warm' : ''}`}>{club.name}</p>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-green-500 font-medium">{club.wins}W</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-red-500 font-medium">{club.losses}L</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">SG: <span className={club.gameDiff > 0 ? 'text-green-500' : club.gameDiff < 0 ? 'text-red-500' : ''}>{club.gameDiff > 0 ? '+' : ''}{club.gameDiff}</span></span>
                          <span className="text-muted-foreground">•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />{club.memberCount}
                          </span>
                          {femaleCount > 0 && (
                            <span className="text-purple-400 font-medium">♀{femaleCount}</span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0 pl-3 border-l border-border/50">
                        <p className={`text-xl font-bold ${isChampion ? 'text-idm-gold-warm' : 'text-foreground'}`}>{club.points}</p>
                        <p className="text-[9px] text-muted-foreground">PTS</p>
                      </div>

                      {/* Expand arrow */}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Expanded: Team Roster */}
                    {isExpanded && (
                      <div
                        className="animate-fade-enter border-t border-border/30"
                      >
                        <div className="px-4 py-3 space-y-2">
                          {/* Roster header */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Susunan Tim</span>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-cyan-500/10 text-cyan-400 text-[9px] border-0">♂ {maleCount}</Badge>
                              <Badge className="bg-purple-500/10 text-purple-400 text-[9px] border-0">♀ {femaleCount}</Badge>
                            </div>
                          </div>

                          {/* Main players */}
                          {club.members.length > 0 ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Flame className="w-3 h-3 text-idm-gold-warm" />
                                <span className="text-[10px] font-semibold text-idm-gold-warm">Pemain Inti ({Math.min(3, club.members.length)})</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {club.members.slice(0, 3).map(m => (
                                  <div key={m.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] border ${
                                    m.division === 'male' ? 'bg-cyan-500/5 border-cyan-500/10' : 'bg-purple-500/5 border-purple-500/10'
                                  }`}>
                                    <div className="w-7 h-7 rounded-md overflow-hidden shrink-0">
                                      <Image
                                        src={getAvatarUrl(m.gamertag, m.division as 'male' | 'female', m.avatar)}
                                        alt={m.gamertag}
                                        width={28}
                                        height={28}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                      />
                                    </div>
                                    <span className="font-medium">{m.gamertag}</span>
                                    <TierBadge tier={m.tier} />
                                  </div>
                                ))}
                              </div>

                              {/* Substitutes */}
                              {club.members.length > 3 && (
                                <>
                                  <div className="flex items-center gap-1.5 mb-1 mt-2">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-semibold text-muted-foreground">Cadangan ({club.members.length - 3})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {club.members.slice(3).map(m => (
                                      <div key={m.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] border opacity-70 ${
                                        m.division === 'male' ? 'bg-cyan-500/5 border-cyan-500/10' : 'bg-purple-500/5 border-purple-500/10'
                                      }`}>
                                        <div className="w-6 h-6 rounded-md overflow-hidden shrink-0">
                                          <Image
                                            src={getAvatarUrl(m.gamertag, m.division as 'male' | 'female', m.avatar)}
                                            alt={m.gamertag}
                                            width={24}
                                            height={24}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                          />
                                        </div>
                                        <span className="font-medium">{m.gamertag}</span>
                                        <TierBadge tier={m.tier} />
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}

                              {/* Mix validation badge */}
                              {femaleCount > 0 ? (
                                <Badge className="bg-green-500/10 text-green-500 text-[9px] border-0 mt-1">✓ Bebas mix</Badge>
                              ) : (
                                <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[9px] border-0 mt-1">✨ Cross-division</Badge>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-3">Belum ada anggota terdaftar</p>
                          )}

                          {/* Click to see full profile */}
                          <button
                            className="w-full text-center text-[10px] text-idm-gold-warm font-semibold py-2 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10 hover:bg-idm-gold-warm/10 transition-colors min-h-[36px]"
                            onClick={(e) => { e.stopPropagation(); setSelectedClub(club); }}
                          >
                            Lihat Profil Club →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {clubs.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada club terdaftar di liga</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ SCHEDULE ═══ */}
        <TabsContent value="schedule" className="mt-4">
          <div className="space-y-4">
            {weeks.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada jadwal match</p>
              </div>
            )}
            {weeks.map((week, idx) => {
              const weekMatches = leagueMatches.filter(m => m.week === week);
              const completed = weekMatches.filter(m => m.status === 'completed').length;
              return (
                <div key={week} className="stagger-item" style={{ animationDelay: `${idx * 50}ms` }}>
                  <Card className="overflow-hidden" style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                    <CardContent className="p-0">
                      {/* Week header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30" style={{ background: 'rgba(212,168,83,0.03)' }}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-idm-gold-warm" />
                          <h3 className="text-sm font-semibold">Week {week}</h3>
                        </div>
                        <Badge className={`text-[10px] border-0 ${
                          completed === weekMatches.length ? 'bg-green-500/10 text-green-500' :
                          completed > 0 ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {completed === weekMatches.length ? '✅ Selesai' : `${completed}/${weekMatches.length} Dimainkan`}
                        </Badge>
                      </div>

                      {/* Matches */}
                      <div className="p-3 space-y-2">
                        {weekMatches.map(m => {
                          const isLive = m.status === 'live';
                          return (
                            <div key={m.id} className={`p-3 rounded-xl transition-all border ${
                              isLive ? 'border-red-500/20 bg-red-500/5' :
                              m.status === 'completed' ? 'border-border/20 bg-muted/30' :
                              'border-idm-gold-warm/10 bg-idm-gold-warm/5'
                            }`}>
                              <div className="flex items-center justify-between">
                                {/* Club 1 */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {m.club1.logo ? (
                                    <ClubLogoImage clubName={m.club1.name} dbLogo={m.club1.logo} alt={m.club1.name} width={32} height={32} className={`w-8 h-8 rounded-lg object-cover shrink-0 ${m.status === 'completed' && scoreGt(m.score1, m.score2) ? 'ring-1 ring-idm-gold-warm/30' : ''}`} />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      m.status === 'completed' && scoreGt(m.score1, m.score2) ? 'bg-idm-gold-warm/15 text-idm-gold-warm' : 'bg-idm-gold-warm/10 text-idm-gold-warm/60'
                                    }`}>
                                      {m.club1.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className={`text-sm font-medium truncate ${
                                    m.status === 'completed' && scoreGt(m.score1, m.score2) ? 'text-idm-gold-warm font-bold' : ''
                                  }`}>{m.club1.name}</span>
                                </div>

                                {/* Score / VS */}
                                <div className="flex items-center gap-2 mx-3 shrink-0">
                                  {isLive ? (
                                    <span className="text-[10px] font-bold text-red-500 live-dot px-2 py-1 rounded bg-red-500/10">LIVE</span>
                                  ) : m.status === 'completed' ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/50">
                                      <span className={`text-base font-bold ${scoreGt(m.score1, m.score2) ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>{m.score1}</span>
                                      <span className="text-[10px] text-muted-foreground">-</span>
                                      <span className={`text-base font-bold ${scoreGt(m.score2, m.score1) ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}>{m.score2}</span>
                                    </div>
                                  ) : (
                                    <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] border-0">VS</Badge>
                                  )}
                                </div>

                                {/* Club 2 */}
                                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                  <span className={`text-sm font-medium truncate ${
                                    m.status === 'completed' && scoreGt(m.score2, m.score1) ? 'text-idm-gold-warm font-bold' : ''
                                  }`}>{m.club2.name}</span>
                                  {m.club2.logo ? (
                                    <ClubLogoImage clubName={m.club2.name} dbLogo={m.club2.logo} alt={m.club2.name} width={32} height={32} className={`w-8 h-8 rounded-lg object-cover shrink-0 ${m.status === 'completed' && scoreGt(m.score2, m.score1) ? 'ring-1 ring-idm-gold-warm/30' : ''}`} />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      m.status === 'completed' && scoreGt(m.score2, m.score1) ? 'bg-idm-gold-warm/15 text-idm-gold-warm' : 'bg-idm-gold-warm/10 text-idm-gold-warm/60'
                                    }`}>
                                      {m.club2.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Format badge */}
                              <div className="flex items-center justify-center mt-2">
                                <Badge className={`text-[9px] border-0 ${
                                  m.format === 'BO5' ? 'bg-idm-gold-warm/10 text-idm-gold-warm' : 'bg-muted text-muted-foreground'
                                }`}>{m.format}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ STATISTICS ═══ */}
        <TabsContent value="stats" className="mt-4">
          <div className="space-y-4">
            {/* MVP Race */}
            <div className="stagger-item-fast stagger-d0">
              <Card style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center">
                      <Crown className="w-3.5 h-3.5 text-idm-gold-warm" />
                    </div>
                    <h3 className="text-sm font-semibold">MVP Race</h3>
                    <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[9px] border-0 ml-auto">LIGA IDM</Badge>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {mvpCandidates.map((p, idx) => (
                      <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${
                        idx === 0 ? 'bg-idm-gold-warm/5 border border-idm-gold-warm/10' : 'bg-muted/30 border border-border/20'
                      }`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-idm-gold-warm/20 text-idm-gold-warm' :
                          idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                          idx === 2 ? 'bg-amber-600/20 text-amber-600' :
                          'bg-muted text-muted-foreground'
                        }`}>{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-idm-gold-warm/20">
                          <Image
                            src={getAvatarUrl(p.gamertag, (p.division || 'male') as 'male' | 'female', p.avatar)}
                            alt={p.gamertag}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{p.gamertag}</span>
                            <TierBadge tier={p.tier} />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-idm-gold-warm" />{p.totalMvp} MVP</span>
                            <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{p.streak} streak</span>
                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{p.totalWins}W</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-idm-gold-warm">{p.points} pts</span>
                      </div>
                    ))}
                    {mvpCandidates.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">Belum ada MVP</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <div className="stagger-item-fast stagger-d1">
              <Card style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-idm-gold-warm" />
                    </div>
                    <h3 className="text-sm font-semibold">Top Performers</h3>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {topPlayers.slice(0, 10).map((p, idx) => (
                      <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${
                        idx === 0 ? 'bg-idm-gold-warm/5 border border-idm-gold-warm/10' : 'bg-muted/20'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-idm-gold-warm/20 text-idm-gold-warm' : 'bg-muted text-muted-foreground'
                        }`}>{idx + 1}</span>
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                          <Image
                            src={getAvatarUrl(p.gamertag, p.division as 'male' | 'female', p.avatar)}
                            alt={p.gamertag}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{p.gamertag}</span>
                            <TierBadge tier={p.tier} />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-idm-gold-warm">{p.points} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Club Power Rankings */}
            <div className="stagger-item-fast stagger-d2">
              <Card style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-idm-gold-warm" />
                    </div>
                    <h3 className="text-sm font-semibold">Peringkat Kekuatan Club</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {clubs.slice(0, 4).map((club, idx) => {
                      const wr = club.wins + club.losses > 0 ? Math.round((club.wins / (club.wins + club.losses)) * 100) : 0;
                      return (
                        <div key={club.id} className={`p-3 rounded-xl cursor-pointer interactive-scale border ${
                          idx === 0 ? 'border-idm-gold-warm/20 bg-idm-gold-warm/5' : 'border-border/20 bg-muted/20'
                        }`} onClick={() => setSelectedClub(club)}>
                          <div className="flex items-center gap-2 mb-2">
                            <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} width={20} height={20} className="w-4 h-4 rounded object-cover shrink-0" />
                            <span className={`text-xs font-semibold truncate ${idx === 0 ? 'text-idm-gold-warm' : ''}`}>{club.name}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center">
                            <div>
                              <p className="text-sm font-bold text-green-500">{club.wins}</p>
                              <p className="text-[8px] text-muted-foreground">WIN</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-idm-gold-warm">{wr}%</p>
                              <p className="text-[8px] text-muted-foreground">WR</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold">{club.gameDiff > 0 ? `+${club.gameDiff}` : club.gameDiff}</p>
                              <p className="text-[8px] text-muted-foreground">SG</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══ PLAYOFF ═══ */}
        <TabsContent value="playoff" className="mt-4">
          <div>
            <Card className="overflow-hidden" style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.15)' }}>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border/30" style={{ background: 'rgba(212,168,83,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-idm-gold-warm" />
                    <h3 className="text-sm font-semibold">Playoff Bracket</h3>
                    <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] border-0 ml-auto">🏆 BO5 Format</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-center gap-4 lg:gap-8 overflow-x-auto py-4">
                    {/* Semifinals */}
                    <div className="space-y-6">
                      <p className="text-[10px] text-muted-foreground text-center font-semibold mb-2 uppercase tracking-wider">Semifinal</p>
                      {playoffMatches.filter(m => m.round.startsWith('semifinal')).map(m => (
                        <div key={m.id} className="p-3 rounded-xl bg-muted/50 min-w-[160px] border border-border/30 interactive-scale">
                          <div className="space-y-2">
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && scoreGt(m.score1, m.score2) ? 'font-bold text-idm-gold-warm' : ''}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ClubLogoImage clubName={m.club1.name} dbLogo={m.club1.logo} alt={m.club1.name} width={18} height={18} className="w-[18px] h-[18px] rounded object-cover shrink-0" />
                                <span className="truncate">{m.club1.name}</span>
                              </div>
                              <span className="font-mono shrink-0 ml-2">{m.score1 ?? '-'}</span>
                            </div>
                            <div className="h-px bg-border" />
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && scoreGt(m.score2, m.score1) ? 'font-bold text-idm-gold-warm' : ''}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ClubLogoImage clubName={m.club2.name} dbLogo={m.club2.logo} alt={m.club2.name} width={18} height={18} className="w-[18px] h-[18px] rounded object-cover shrink-0" />
                                <span className="truncate">{m.club2.name}</span>
                              </div>
                              <span className="font-mono shrink-0 ml-2">{m.score2 ?? '-'}</span>
                            </div>
                          </div>
                          <Badge className="mt-2 text-[9px] border-0 bg-idm-gold-warm/10 text-idm-gold-warm">BO5</Badge>
                        </div>
                      ))}
                      {playoffMatches.filter(m => m.round.startsWith('semifinal')).length === 0 && (
                        <div className="p-3 rounded-xl bg-muted/30 min-w-[160px] text-center border border-dashed border-idm-gold-warm/20">
                          <Swords className="w-5 h-5 text-idm-gold-warm/30 mx-auto mb-1" />
                          <p className="text-[10px] text-muted-foreground">Menunggu</p>
                        </div>
                      )}
                    </div>

                    {/* Connector */}
                    <div className="hidden lg:flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="w-8 h-px bg-idm-gold-warm/30" />
                      <Trophy className="w-4 h-4 text-idm-gold-warm" />
                      <div className="w-8 h-px bg-idm-gold-warm/30" />
                    </div>

                    {/* Grand Final */}
                    <div>
                      <p className="text-[10px] text-muted-foreground text-center font-semibold mb-2 uppercase tracking-wider">Grand Final</p>
                      {playoffMatches.filter(m => m.round === 'grand_final').map(m => (
                        <div key={m.id} className="p-4 rounded-xl min-w-[180px] border border-idm-gold-warm/20" style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.08) 0%, rgba(20,17,10,0.6) 50%, rgba(212,168,83,0.05) 100%)' }}>
                          <div className="space-y-2">
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && scoreGt(m.score1, m.score2) ? 'font-bold text-idm-gold-warm' : ''}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ClubLogoImage clubName={m.club1.name} dbLogo={m.club1.logo} alt={m.club1.name} width={18} height={18} className="w-[18px] h-[18px] rounded object-cover shrink-0" />
                                <span className="truncate">{m.club1.name}</span>
                              </div>
                              <span className="font-mono shrink-0 ml-2">{m.score1 ?? '-'}</span>
                            </div>
                            <div className="h-px bg-idm-gold-warm/20" />
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && scoreGt(m.score2, m.score1) ? 'font-bold text-idm-gold-warm' : ''}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ClubLogoImage clubName={m.club2.name} dbLogo={m.club2.logo} alt={m.club2.name} width={18} height={18} className="w-[18px] h-[18px] rounded object-cover shrink-0" />
                                <span className="truncate">{m.club2.name}</span>
                              </div>
                              <span className="font-mono shrink-0 ml-2">{m.score2 ?? '-'}</span>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <Badge className="text-[9px] border-0 bg-idm-gold-warm/15 text-idm-gold-warm" style={{ boxShadow: '0 0 12px rgba(212,168,83,0.15)' }}>🏆 BO5 Grand Final</Badge>
                          </div>
                        </div>
                      ))}
                      {playoffMatches.filter(m => m.round === 'grand_final').length === 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 min-w-[180px] text-center border border-dashed border-idm-gold-warm/20">
                          <Crown className="w-6 h-6 text-idm-gold-warm/30 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Segera Hadir</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    {/* Club Profile Modal */}
    {selectedClub && (
      <ClubProfile
        club={{
          ...selectedClub,
          logo: selectedClub.logo,
          division: 'league', // League is unified mixed competition
          rank: clubs.findIndex(c => c.id === selectedClub.id) + 1,
          members: selectedClub.members.map(m => ({
            id: m.id,
            name: m.gamertag,
            gamertag: m.gamertag,
            tier: m.tier,
            points: m.points,
            avatar: m.avatar,
          })),
        }}
        onClose={() => setSelectedClub(null)}
        rank={clubs.findIndex(c => c.id === selectedClub.id) + 1}
      />
    )}
    </>
  );
}
