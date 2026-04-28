'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import Image from 'next/image';
import {
  Shield, Users, Music, Trophy, Gift, Plus,
  Crown, X, Loader2, Clock, MapPin, Phone, Globe, Camera, Pencil, Trash2, Search,
  LayoutDashboard, Sliders, Flame, CheckCircle2, XCircle, Wallet, Save, ArrowRight, Calendar, Star, BookOpen,
  UserPlus, MessageCircle, FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TierBadge } from './tier-badge';
import { AdminPlayersTab } from './admin/tabs/admin-players-tab';
import { AdminKeuanganTab } from './admin/tabs/admin-keuangan-tab';
import { AdminLigaSkorTab } from './admin/tabs/admin-liga-skor-tab';
import { CmsPanel } from './cms-panel';
import { TournamentManager } from './tournament-manager';
import { RankingPanel } from './ranking-panel';
import { ClubManagement } from './club-management';
import { CloudinaryPicker } from './cloudinary-picker';
import { AdminOverview } from './admin-overview';
import { AdminSponsorPanel } from './admin-sponsor-panel';
import { AdminAchievementPanel } from './admin-achievement-panel';
import { AdminSkinPanel } from './admin-skin-panel';
import { AdminSettingsPanel } from './admin-settings-panel';
import { AdminDivisionContentTab } from './admin/tabs/admin-division-content-tab';
import { AdminManagement } from './admin-management';
import { AdminSeasonPanel } from './admin-season-panel';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { formatCurrency, getAvatarUrl, formatTarkamSeasonName } from '@/lib/utils';

// Player form type
interface PlayerForm {
  name: string;
  gamertag: string;
  tier: string;
  division: string;
  city: string;
  phone: string;
  joki: string;
  points: string;
  clubId: string;
}

const emptyForm: PlayerForm = {
  name: '',
  gamertag: '',
  tier: 'B',
  division: 'male',
  city: '',
  phone: '',
  joki: '',
  points: '0',
  clubId: '_none',
};

export function AdminPanel() {
  const { division: storeDivision } = useAppStore();
  const dt = useDivisionTheme();
  const qc = useQueryClient();

  const { data: players } = useQuery({
    queryKey: ['admin-players', storeDivision],
    queryFn: async () => { const res = await fetch(`/api/players?division=${storeDivision}`, { credentials: 'include' }); return res.json(); },
  });

  const { data: stats } = useQuery({
    queryKey: ['stats', storeDivision],
    queryFn: async () => { const res = await fetch(`/api/stats?division=${storeDivision}`, { credentials: 'include' }); return res.json(); },
  });

  const { data: donations } = useQuery({
    queryKey: ['admin-donations', storeDivision],
    queryFn: async () => { const res = await fetch(`/api/donations?status=all`, { credentials: 'include' }); return res.json(); },
  });

  const { data: cmsSettings } = useQuery({
    queryKey: ['admin-cms-settings'],
    queryFn: async () => { const res = await fetch('/api/cms/settings', { credentials: 'include' }); const d = await res.json(); return (d?.map || {}) as Record<string, string>; },
  });

  // Get clubs for dropdown — use unified mode to show ALL clubs across both divisions
  // Clubs belong to ALL divisions, so the dropdown should show all clubs
  const clubsSeasonId = stats?.seasonForClubs?.id || stats?.season?.id;
  const { data: clubs } = useQuery({
    queryKey: ['admin-clubs', storeDivision, 'unified'],
    queryFn: async () => {
      const res = await fetch(`/api/clubs?unified=true&division=${storeDivision}`, { credentials: 'include' });
      return res.json();
    },
  });

  // Helper for authenticated fetch
  const authFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Player CRUD mutations
  const createPlayer = useMutation({
    mutationFn: async (data: PlayerForm) => {
      const res = await authFetch('/api/players', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          gamertag: data.gamertag,
          tier: data.tier,
          division: data.division,
          city: data.city || undefined,
          phone: data.phone || undefined,
          joki: data.joki || undefined,
          points: parseInt(data.points) || 0,
          clubId: data.clubId === '_none' ? undefined : data.clubId,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-players'] });
      toast.success('Player berhasil ditambahkan!');
      setPlayerFormOpen(false);
      setFormData(emptyForm);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const updatePlayer = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlayerForm> }) => {
      const res = await authFetch(`/api/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          gamertag: data.gamertag,
          tier: data.tier,
          division: data.division,
          city: data.city,
          phone: data.phone || null,
          joki: data.joki || null,
          points: data.points ? parseInt(data.points) : undefined,
          clubId: data.clubId === '_none' ? null : data.clubId,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-players'] });
      toast.success('Player berhasil diperbarui!');
      setPlayerFormOpen(false);
      setEditingPlayer(null);
      setFormData(emptyForm);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const deletePlayer = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/players?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-players'] });
      toast.success('Player berhasil dihapus!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const updateTier = useMutation({
    mutationFn: async ({ playerId, tier }: { playerId: string; tier: string }) => {
      const res = await authFetch(`/api/players/${playerId}`, {
        method: 'PUT',
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-players', storeDivision] }); toast.success('Tier diperbarui!'); },
  });

  const updateAvatar = useMutation({
    mutationFn: async ({ playerId, avatar }: { playerId: string; avatar: string }) => {
      const res = await authFetch(`/api/players/${playerId}`, {
        method: 'PUT',
        body: JSON.stringify({ avatar }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update avatar');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-players', storeDivision] });
      qc.invalidateQueries({ queryKey: ['player-achievements'] });
      toast.success('Avatar diperbarui!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleAvatarSelect = (url: string, _publicId?: string) => {
    if (editingPlayerId) {
      updateAvatar.mutate({ playerId: editingPlayerId, avatar: url });
      setEditingPlayerId(null);
    }
  };

  const openAvatarPicker = (playerId: string) => {
    setEditingPlayerId(playerId);
    setCloudinaryOpen(true);
  };

  const addDonation = useMutation({
    mutationFn: async (data: { donorName: string; amount: number; message: string; type: string; tournamentId?: string }) => {
      const res = await authFetch('/api/donations', {
        method: 'POST',
        body: JSON.stringify({ ...data, seasonId: stats?.season?.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-donations', storeDivision] }); toast.success('Donasi berhasil ditambahkan!'); },
  });

  const approveDonation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const res = await authFetch('/api/donations', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-donations', storeDivision] });
      qc.invalidateQueries({ queryKey: ['stats', storeDivision] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      toast.success(variables.status === 'approved' ? 'Donasi disetujui ✅' : 'Donasi ditolak ❌');
    },
  });

  const deleteDonation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch('/api/donations', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-donations', storeDivision] }); qc.invalidateQueries({ queryKey: ['feed'] }); toast.success('Donasi dihapus'); },
  });

  // Batch save payment settings — single API call instead of 8 sequential calls
  const savePaymentSettingsBatch = useMutation({
    mutationFn: async (items: { key: string; value: string; type?: string }[]) => {
      const res = await authFetch('/api/cms/settings', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      setPaymentForm(null);
      qc.invalidateQueries({ queryKey: ['admin-cms-settings'] });
      toast.success('Setting pembayaran disimpan!');
    },
  });

  // Pending registrations
  const { data: pendingRegistrations } = useQuery({
    queryKey: ['admin-pending-registrations'],
    queryFn: async () => { const res = await fetch('/api/players?registrationStatus=pending', { credentials: 'include' }); return res.json(); },
  });

  // Active tournament registrations — tournaments not yet in team_generation or later
  const { data: activeTournaments } = useQuery({
    queryKey: ['admin-active-tournaments', stats?.season?.id],
    queryFn: async () => {
      if (!stats?.season?.id) return [];
      const res = await fetch(`/api/tournaments?seasonId=${stats.season.id}`, { credentials: 'include' });
      const all = await res.json();
      return all.filter((t: { status: string }) => !['team_generation', 'bracket_generation', 'main_event', 'finalization', 'completed'].includes(t.status));
    },
    enabled: !!stats?.season?.id,
  });

  // Approve tournament participation — directly from Pemain tab
  const approveTournamentParticipation = useMutation({
    mutationFn: async ({ tournamentId, playerId, tier }: { tournamentId: string; playerId: string; tier: string }) => {
      const res = await authFetch(`/api/tournaments/${tournamentId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ playerId, tier }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-active-tournaments', stats?.season?.id] });
      qc.invalidateQueries({ queryKey: ['admin-players', storeDivision] });
      toast.success('Pemain disetujui!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  // Reject tournament participation — delete participation so player can re-register
  const rejectTournamentParticipation = useMutation({
    mutationFn: async ({ tournamentId, playerId }: { tournamentId: string; playerId: string }) => {
      const res = await authFetch(`/api/tournaments/${tournamentId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ playerId, approve: false }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-active-tournaments', stats?.season?.id] });
      qc.invalidateQueries({ queryKey: ['admin-players', storeDivision] });
      toast.success('Pendaftaran ditolak dan dihapus.');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  // Unapprove tournament participation — rollback approved back to registered
  const unapproveTournamentParticipation = useMutation({
    mutationFn: async ({ tournamentId, playerId }: { tournamentId: string; playerId: string }) => {
      const res = await authFetch(`/api/tournaments/${tournamentId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-active-tournaments', stats?.season?.id] });
      qc.invalidateQueries({ queryKey: ['admin-players', storeDivision] });
      toast.success('Pemain dikembalikan ke status terdaftar.');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  // Move tournament to next phase
  const advanceTournament = useMutation({
    mutationFn: async ({ tournamentId, status }: { tournamentId: string; status: string }) => {
      const res = await authFetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-active-tournaments', stats?.season?.id] });
      toast.success('Status tournament diperbarui!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const approveRegistration = useMutation({
    mutationFn: async ({ playerId, tier }: { playerId: string; tier: string }) => {
      const res = await authFetch(`/api/players/${playerId}`, {
        method: 'PUT',
        body: JSON.stringify({ registrationStatus: 'approved', tier }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-registrations'] }); qc.invalidateQueries({ queryKey: ['admin-players', storeDivision] }); toast.success('Pendaftaran disetujui!'); },
  });

  const rejectRegistration = useMutation({
    mutationFn: async (playerId: string) => {
      const res = await authFetch(`/api/players/${playerId}`, {
        method: 'PUT',
        body: JSON.stringify({ registrationStatus: 'rejected', isActive: false }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-registrations'] }); qc.invalidateQueries({ queryKey: ['admin-players', storeDivision] }); toast.success('Pendaftaran ditolak.'); },
  });

  const scoreLeagueMatch = useMutation({
    mutationFn: async ({ matchId, score1, score2 }: { matchId: string; score1: number; score2: number }) => {
      const res = await authFetch(`/api/league-matches/${matchId}`, {
        method: 'PUT',
        body: JSON.stringify({ score1, score2 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stats', storeDivision] }); toast.success('Skor match berhasil!'); },
  });

  const scorePlayoffMatch = useMutation({
    mutationFn: async ({ matchId, score1, score2 }: { matchId: string; score1: number; score2: number }) => {
      const res = await authFetch(`/api/playoff-matches/${matchId}`, {
        method: 'PUT',
        body: JSON.stringify({ score1, score2 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stats', storeDivision] }); toast.success('Skor playoff berhasil!'); },
  });

  // State
  const [newDonation, setNewDonation] = useState({ donorName: '', amount: '', message: '', type: 'season' });
  const [paymentFormState, setPaymentForm] = useState<Record<string, string> | null>(null);
  const cmsSettingsBase = cmsSettings || {};
  const paymentForm = paymentFormState ?? cmsSettingsBase;
  // When setting a payment form field, always merge from the latest CMS settings base
  // This ensures fields not yet edited by admin are preserved from server data
  const updatePaymentForm = (updates: Partial<Record<string, string>>) => {
    setPaymentForm(prev => ({ ...cmsSettingsBase, ...prev, ...updates }) as Record<string, string>);
  };
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileCategory, setMobileCategory] = useState('dashboard');

  const categoryTabMap: Record<string, string[]> = {
    dashboard: ['dashboard'],
    tournament: ['pemain', 'season-tarkam', 'turnamen', 'keuangan'],
    konten: ['konten', 'konten-divisi'],
    league: ['liga-season', 'liga-club', 'liga-poin', 'liga-skor'],
    system: ['sponsor', 'achievement', 'pengaturan'],
  };

  const [searchPlayer, setSearchPlayer] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  // Player form state
  const [playerFormOpen, setPlayerFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<{ id: string; data: PlayerForm } | null>(null);
  const [formData, setFormData] = useState<PlayerForm>(emptyForm);

  // Cloudinary picker state
  const [cloudinaryOpen, setCloudinaryOpen] = useState(false);
  const [qrisPickerOpen, setQrisPickerOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Open form for new player
  const openNewPlayerForm = () => {
    setEditingPlayer(null);
    setFormData({ ...emptyForm, division: storeDivision });
    setPlayerFormOpen(true);
  };

  // Open form for editing
  const openEditPlayerForm = (player: {
    id: string;
    name: string;
    gamertag: string;
    tier: string;
    division: string;
    city: string;
    phone: string | null;
    joki: string | null;
    points: number;
    clubMembers?: Array<{ profile: { id: string; name: string; logo?: string | null } }>;
  }) => {
    setEditingPlayer({
      id: player.id,
      data: {
        name: player.name,
        gamertag: player.gamertag,
        tier: player.tier,
        division: player.division,
        city: player.city || '',
        phone: player.phone || '',
        joki: player.joki || '',
        points: player.points.toString(),
        clubId: player.clubMembers?.[0]?.profile?.id || '_none',
      }
    });
    setFormData({
      name: player.name,
      gamertag: player.gamertag,
      tier: player.tier,
      division: player.division,
      city: player.city || '',
      phone: player.phone || '',
      joki: player.joki || '',
      points: player.points.toString(),
      clubId: player.clubMembers?.[0]?.profile?.id || '_none',
    });
    setPlayerFormOpen(true);
  };

  // Submit form
  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.gamertag.trim()) {
      toast.error('Nama dan gamertag wajib diisi');
      return;
    }

    if (editingPlayer) {
      updatePlayer.mutate({ id: editingPlayer.id, data: formData });
    } else {
      createPlayer.mutate(formData);
    }
  };

  const filteredPlayers = players?.filter((p: { gamertag: string; name: string }) =>
    p.gamertag.toLowerCase().includes(searchPlayer.toLowerCase()) ||
    p.name.toLowerCase().includes(searchPlayer.toLowerCase())
  ) || [];

  // paymentForm is derived from cmsSettings (no useEffect needed)

  // Count helpers for tab badges
  const playerCount = filteredPlayers?.length || 0;
  const pendingCount = pendingRegistrations?.length || 0;
  const donationCount = donations?.donations?.filter((d: { status: string }) => d.status === 'pending').length || 0;

  return (
    <div className="space-y-3 w-full admin-panel-glass rounded-2xl p-3 sm:p-4 border border-white/[0.06]">
      {/* Header + Season Info */}
      <div className="flex flex-col gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${dt.neonText}`} />
          <h2 className="text-lg font-bold text-gradient-fury">Panel Admin</h2>
          <Badge className="bg-red-500/10 text-red-500 text-[10px] border-0">ADMIN</Badge>
        </div>
        {/* Season Info Indicator */}
        {stats?.season && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-idm-gold-warm/[0.06] border border-idm-gold-warm/10">
            <Calendar className="w-3.5 h-3.5 text-idm-gold-warm shrink-0" />
            <span className="text-[11px] font-medium text-idm-gold-warm truncate">{formatTarkamSeasonName(stats.season.name, stats.season.number)}</span>
            <Badge
              className={
                stats.season.status === 'active'
                  ? 'text-[8px] border-0 px-1.5 py-0 bg-green-500/15 text-green-400'
                  : stats.season.status === 'completed'
                    ? 'text-[8px] border-0 px-1.5 py-0 bg-muted text-muted-foreground'
                    : 'text-[8px] border-0 px-1.5 py-0 bg-idm-gold-warm/15 text-idm-gold-warm'
              }
            >
              {stats.season.status === 'active' ? '● Aktif' : stats.season.status === 'completed' ? 'Selesai' : stats.season.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Division: {storeDivision === 'male' ? '🕺 Male' : '💃 Female'}
            </span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" aria-label="Admin panel navigation">
        {/* Mobile: Grouped category navigation */}
        <div className="sm:hidden space-y-2">
          <div className="grid grid-cols-5 gap-1">
            {([
              { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { key: 'tournament', icon: Music, label: 'Turnamen' },
              { key: 'konten', icon: Globe, label: 'Konten' },
              { key: 'league', icon: Crown, label: 'Liga' },
              { key: 'system', icon: Sliders, label: 'Sistem' },
            ] as const).map(cat => (
              <button
                key={cat.key}
                onClick={() => {
                  setMobileCategory(cat.key);
                  const firstTab = categoryTabMap[cat.key]?.[0];
                  if (firstTab) setActiveTab(firstTab);
                }}
                className={`relative flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-all duration-200 min-h-[44px] justify-center admin-nav-btn ${
                  mobileCategory === cat.key
                    ? 'bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 shadow-sm shadow-idm-gold-warm/10'
                    : 'bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/40 hover:text-foreground/80'
                }`}
              >
                <cat.icon className={`w-4 h-4 transition-transform duration-200 ${mobileCategory === cat.key ? 'scale-110' : ''}`} />
                <span>{cat.label}</span>
                {mobileCategory === cat.key && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-idm-gold-warm admin-nav-indicator" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-0.5">
            {(categoryTabMap[mobileCategory] || []).map(tabValue => {
              const tabConfig: Record<string, { icon: typeof Users; label: string; count?: number }> = {
                dashboard: { icon: LayoutDashboard, label: 'Dashboard' },
                pemain: { icon: Users, label: 'Pemain', count: playerCount },
                'season-tarkam': { icon: Calendar, label: 'Season' },
                turnamen: { icon: Music, label: 'Turnamen' },
                'liga-season': { icon: Calendar, label: 'Season' },
                'liga-club': { icon: Shield, label: 'Club' },
                'liga-poin': { icon: Star, label: 'Poin' },
                'liga-skor': { icon: Trophy, label: 'Skor' },
                sponsor: { icon: Flame, label: 'Sponsor' },
                achievement: { icon: Trophy, label: 'Achievement' },
                konten: { icon: Globe, label: 'Konten' },
                'konten-divisi': { icon: BookOpen, label: 'Divisi' },
                keuangan: { icon: Gift, label: 'Keuangan', count: donationCount || undefined },
                pengaturan: { icon: Sliders, label: 'Pengaturan' },
              };
              const cfg = tabConfig[tabValue];
              if (!cfg) return null;
              const CfgIcon = cfg.icon;
              return (
                <button
                  key={tabValue}
                  onClick={() => setActiveTab(tabValue)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 min-h-[36px] ${
                    activeTab === tabValue
                      ? 'bg-background/95 shadow-sm text-foreground border border-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <CfgIcon className="w-3 h-3" />
                  {cfg.label}
                  {cfg.count !== undefined && cfg.count > 0 && (
                    <Badge className="text-[8px] border-0 bg-idm-gold-warm/15 text-idm-gold-warm px-1 py-0 min-w-[16px] h-3.5 flex items-center justify-center">{cfg.count}</Badge>
                  )}
                  {tabValue === 'pemain' && pendingCount > 0 && (
                    <Badge className="text-[8px] border-0 bg-yellow-500/15 text-yellow-500 px-1 py-0 min-w-[16px] h-3.5 flex items-center justify-center">{pendingCount}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: Compact 5-category navigation */}
        <div className="hidden sm:block space-y-2">
          <div className="grid grid-cols-5 gap-1.5">
            {([
              { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { key: 'tournament', icon: Music, label: 'Turnamen' },
              { key: 'konten', icon: Globe, label: 'Konten' },
              { key: 'league', icon: Crown, label: 'Liga' },
              { key: 'system', icon: Sliders, label: 'Sistem' },
            ] as const).map(cat => (
              <button
                key={cat.key}
                onClick={() => {
                  setMobileCategory(cat.key);
                  const firstTab = categoryTabMap[cat.key]?.[0];
                  if (firstTab) setActiveTab(firstTab);
                }}
                className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-200 admin-nav-btn ${
                  mobileCategory === cat.key
                    ? 'bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 shadow-sm shadow-idm-gold-warm/10'
                    : 'bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/40 hover:text-foreground/80'
                }`}
              >
                <cat.icon className={`w-4 h-4 transition-transform duration-200 ${mobileCategory === cat.key ? 'scale-110' : ''}`} />
                <span>{cat.label}</span>
                {mobileCategory === cat.key && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-idm-gold-warm admin-nav-indicator" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-0.5">
            {(categoryTabMap[mobileCategory] || []).map(tabValue => {
              const tabConfig: Record<string, { icon: typeof Users; label: string; count?: number }> = {
                dashboard: { icon: LayoutDashboard, label: 'Dashboard' },
                pemain: { icon: Users, label: 'Pemain', count: playerCount },
                'season-tarkam': { icon: Calendar, label: 'Season' },
                turnamen: { icon: Music, label: 'Turnamen' },
                'liga-season': { icon: Calendar, label: 'Season' },
                'liga-club': { icon: Shield, label: 'Club' },
                'liga-poin': { icon: Star, label: 'Poin' },
                'liga-skor': { icon: Trophy, label: 'Skor' },
                sponsor: { icon: Flame, label: 'Sponsor' },
                achievement: { icon: Trophy, label: 'Achievement' },
                konten: { icon: Globe, label: 'Konten' },
                'konten-divisi': { icon: BookOpen, label: 'Divisi' },
                keuangan: { icon: Gift, label: 'Keuangan', count: donationCount || undefined },
                pengaturan: { icon: Sliders, label: 'Pengaturan' },
              };
              const cfg = tabConfig[tabValue];
              if (!cfg) return null;
              const CfgIcon = cfg.icon;
              return (
                <button
                  key={tabValue}
                  onClick={() => setActiveTab(tabValue)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tabValue
                      ? 'bg-background/95 shadow-sm text-foreground border border-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <CfgIcon className="w-3 h-3" />
                  {cfg.label}
                  {cfg.count !== undefined && cfg.count > 0 && (
                    <Badge className="text-[8px] border-0 bg-idm-gold-warm/15 text-idm-gold-warm px-1 py-0 min-w-[16px] h-3.5 flex items-center justify-center">{cfg.count}</Badge>
                  )}
                  {tabValue === 'pemain' && pendingCount > 0 && (
                    <Badge className="text-[8px] border-0 bg-yellow-500/15 text-yellow-500 px-1 py-0 min-w-[16px] h-3.5 flex items-center justify-center ml-0.5">{pendingCount}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ====== DASHBOARD TAB ====== */}
        <TabsContent value="dashboard" className="admin-tab-enter">
          <AdminOverview division={storeDivision} />
        </TabsContent>

        {/* ====== PEMAIN TAB ====== */}
        <TabsContent value="pemain" className="admin-tab-enter">
          <AdminPlayersTab
            pendingRegistrations={pendingRegistrations || []}
            approveRegistration={approveRegistration}
            rejectRegistration={rejectRegistration}
            filteredPlayers={filteredPlayers}
            searchPlayer={searchPlayer}
            setSearchPlayer={setSearchPlayer}
            openNewPlayerForm={openNewPlayerForm}
            openEditPlayerForm={openEditPlayerForm}
            openAvatarPicker={openAvatarPicker}
            updateTier={updateTier}
            deletePlayer={deletePlayer}
            setConfirmDialog={setConfirmDialog}
            dt={dt}
          />
        </TabsContent>

        {/* ====== TURNAMEN TAB ====== */}
        <TabsContent value="turnamen" className="admin-tab-enter">
          <div className="space-y-4">
            {/* ── Tournament Registration Overview ── */}
            {activeTournaments?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-idm-gold-warm">
                  <Music className="w-4 h-4" /> Pendaftaran Turnamen Aktif
                </h3>
                {activeTournaments.map((t: {
                  id: string;
                  name: string;
                  weekNumber: number;
                  status: string;
                  participations?: Array<{
                    id: string;
                    playerId: string;
                    status: string;
                    tierOverride?: string | null;
                    player: { id: string; gamertag: string; name: string; tier: string; points: number; division: string };
                  }>;
                }) => {
                  const pending = (t.participations || []).filter((p) => p.status === 'registered');
                  const approved = (t.participations || []).filter((p) => ['approved', 'assigned'].includes(p.status));
                  return (
                    <Card key={t.id} className="border border-green-500/25 bg-green-500/5">
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-green-500" />
                            <p className="text-sm font-semibold">{t.name}</p>
                            <Badge variant="outline" className="text-[9px]">Week {t.weekNumber}</Badge>
                          </div>
                          {approved.length > 0 && (
                            <Button size="sm" className="h-7 text-[10px] bg-idm-gold-warm hover:bg-idm-gold-warm/80 text-black px-3"
                              onClick={() => setConfirmDialog({
                                open: true,
                                title: 'Lanjut ke Generate Tim?',
                                description: `${approved.length} pemain sudah disetujui. Lanjutkan ke fase pembuatan tim? Peserta yang belum disetujui tidak akan ikut.`,
                                onConfirm: () => advanceTournament.mutate({ tournamentId: t.id, status: 'team_generation' })
                              })}>
                              <ArrowRight className="w-3 h-3 mr-1" /> Generate Tim
                            </Button>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-green-500 font-medium">✅ {approved.length} disetujui</span>
                          {pending.length > 0 && (
                            <span className="text-yellow-500 font-medium">⏳ {pending.length} menunggu</span>
                          )}
                          <span className="text-muted-foreground">👥 {(t.participations || []).length} total</span>
                        </div>

                        {/* Combined participant list */}
                        <div className="space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                          {/* Approved players */}
                          {approved.length > 0 && (
                            <>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Peserta Disetujui</p>
                              {approved.map((p) => {
                                const tier = p.tierOverride || p.player?.tier || 'B';
                                const tierColor = tier === 'S' ? 'bg-red-500/15 text-red-400' : tier === 'A' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400';
                                return (
                                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                      <span className="text-xs font-medium truncate">{p.player?.gamertag}</span>
                                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{p.player?.name}</span>
                                      <Badge className={`text-[9px] border-0 px-1.5 py-0 ${tierColor}`}>{tier}</Badge>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                                      onClick={() => setConfirmDialog({
                                        open: true,
                                        title: 'Batalkan Persetujuan?',
                                        description: `Kembalikan "${p.player?.gamertag}" ke status menunggu? Tier akan di-reset.`,
                                        onConfirm: () => unapproveTournamentParticipation.mutate({ tournamentId: t.id, playerId: p.playerId })
                                      })}
                                      title="Batalkan persetujuan">
                                      <ArrowRight className="w-3 h-3 rotate-180" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* Pending players — with ✓/✗ per-row */}
                          {pending.length > 0 && (
                            <>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-2">Menunggu Persetujuan</p>
                              {pending.map((p) => {
                                const currentTier = p.player?.tier || 'B';
                                return (
                                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-yellow-500/10">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded-full bg-yellow-500/15 flex items-center justify-center text-[10px] font-bold text-yellow-500">
                                        {p.player?.gamertag?.charAt(0)?.toUpperCase() || '?'}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-xs font-medium truncate block">{p.player?.gamertag}</span>
                                        <span className="text-[10px] text-muted-foreground">{p.player?.name} · {p.player?.points || 0}pts</span>
                                      </div>
                                      <TierBadge tier={currentTier} />
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Select onValueChange={(tier) => setConfirmDialog({
                                        open: true,
                                        title: 'Setujui Pemain?',
                                        description: `Setujui "${p.player?.gamertag}" sebagai Tier ${tier} di ${t.name}.`,
                                        onConfirm: () => approveTournamentParticipation.mutate({ tournamentId: t.id, playerId: p.playerId, tier })
                                      })}>
                                        <SelectTrigger className="w-20 h-7 text-[10px]"><SelectValue placeholder="✓ Setujui" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="S">Sebagai S</SelectItem>
                                          <SelectItem value="A">Sebagai A</SelectItem>
                                          <SelectItem value="B">Sebagai B</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 touch-icon text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        onClick={() => setConfirmDialog({
                                          open: true,
                                          title: 'Tolak Pendaftaran?',
                                          description: `Tolak dan hapus pendaftaran "${p.player?.gamertag}" dari ${t.name}? Player bisa mendaftar ulang.`,
                                          onConfirm: () => rejectTournamentParticipation.mutate({ tournamentId: t.id, playerId: p.playerId })
                                        })}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* No participants yet */}
                          {pending.length === 0 && approved.length === 0 && (
                            <div className="py-4 text-center">
                              <p className="text-xs text-muted-foreground italic">Belum ada peserta terdaftar</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Tournament Manager */}
            <TournamentManager division={storeDivision} dt={dt} stats={stats} setConfirmDialog={setConfirmDialog} />
          </div>
        </TabsContent>

        {/* ====== KONTEN TAB ====== */}
        <TabsContent value="konten" className="admin-tab-enter">
          <div className="space-y-4">
            <CmsPanel />
          </div>
        </TabsContent>

        {/* ====== KONTEN DIVISI TAB ====== */}
        <TabsContent value="konten-divisi" className="admin-tab-enter">
          <AdminDivisionContentTab />
        </TabsContent>

        {/* ====== SEASON TARKAM TAB ====== */}
        <TabsContent value="season-tarkam" className="admin-tab-enter">
          <div className="space-y-4">
            <AdminSeasonPanel division={storeDivision} dt={dt} setConfirmDialog={setConfirmDialog} mode="tarkam" />
          </div>
        </TabsContent>

        {/* ====== LIGA SEASON TAB ====== */}
        <TabsContent value="liga-season" className="admin-tab-enter">
          <div className="space-y-4">
            <AdminSeasonPanel division={storeDivision} dt={dt} setConfirmDialog={setConfirmDialog} mode="liga" />
          </div>
        </TabsContent>

        {/* ====== LIGA CLUB TAB ====== */}
        <TabsContent value="liga-club" className="admin-tab-enter">
          <div className="space-y-4">
            <ClubManagement division={storeDivision} dt={dt} seasonId={stats?.seasonForClubs?.id || stats?.season?.id} setConfirmDialog={setConfirmDialog} />
          </div>
        </TabsContent>

        {/* ====== LIGA POIN TAB ====== */}
        <TabsContent value="liga-poin" className="admin-tab-enter">
          <div className="space-y-4">
            <RankingPanel division={storeDivision} dt={dt} setConfirmDialog={setConfirmDialog} />
          </div>
        </TabsContent>

        {/* ====== LIGA SKOR TAB ====== */}
        <TabsContent value="liga-skor" className="admin-tab-enter">
          <AdminLigaSkorTab
            stats={stats}
            scoreLeagueMatch={scoreLeagueMatch}
            scorePlayoffMatch={scorePlayoffMatch}
            setConfirmDialog={setConfirmDialog}
            dt={dt}
          />
        </TabsContent>

        {/* ====== KEUANGAN TAB ====== */}
        <TabsContent value="keuangan" className="admin-tab-enter">
          <AdminKeuanganTab
            donations={donations}
            addDonation={addDonation}
            approveDonation={approveDonation}
            deleteDonation={deleteDonation}
            newDonation={newDonation}
            setNewDonation={setNewDonation}
            paymentForm={paymentForm}
            updatePaymentForm={updatePaymentForm}
            savePaymentSettingsBatch={savePaymentSettingsBatch}
            setQrisPickerOpen={setQrisPickerOpen}
            setConfirmDialog={setConfirmDialog}
            dt={dt}
          />
        </TabsContent>

        {/* ====== SPONSOR TAB ====== */}
        <TabsContent value="sponsor" className="admin-tab-enter">
          <div className="space-y-4">
            <AdminSponsorPanel />
          </div>
        </TabsContent>

        {/* ====== ACHIEVEMENT TAB ====== */}
        <TabsContent value="achievement" className="admin-tab-enter">
          <div className="space-y-4">
            <AdminAchievementPanel />
            <AdminSkinPanel />
          </div>
        </TabsContent>

        {/* ====== PENGATURAN TAB ====== */}
        <TabsContent value="pengaturan" className="admin-tab-enter">
          <div className="space-y-4">
            <AdminSettingsPanel />
            <AdminManagement />
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Player Form Dialog */}
      <Dialog open={playerFormOpen} onOpenChange={setPlayerFormOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-1rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? 'Edit Player' : 'Tambah Player Baru'}</DialogTitle>
            <DialogDescription>{editingPlayer ? 'Perbarui informasi player yang sudah terdaftar' : 'Isi form untuk menambahkan player baru ke sistem'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Division */}
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Division</Label>
                <div className="flex items-center bg-muted rounded-lg p-1 mt-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, division: 'male', clubId: '' }))}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors duration-150 ${
                      formData.division === 'male'
                        ? 'bg-idm-male text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🕺 Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, division: 'female', clubId: '' }))}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors duration-150 ${
                      formData.division === 'female'
                        ? 'bg-idm-female text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    💃 Female
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Nama <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="Nama lengkap/nickname"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Gamertag */}
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Gamertag <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="Username unik"
                  value={formData.gamertag}
                  onChange={(e) => setFormData(p => ({ ...p, gamertag: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Tier */}
              <div>
                <Label className="text-xs text-muted-foreground">Tier</Label>
                <Select value={formData.tier} onValueChange={(v) => setFormData(p => ({ ...p, tier: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S Tier</SelectItem>
                    <SelectItem value="A">A Tier</SelectItem>
                    <SelectItem value="B">B Tier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Points */}
              <div>
                <Label className="text-xs text-muted-foreground">Points</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.points}
                  onChange={(e) => setFormData(p => ({ ...p, points: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* City */}
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Kota</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Makassar, Jakarta, etc."
                    value={formData.city}
                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">No. WhatsApp</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="pl-9"
                    type="tel"
                  />
                </div>
              </div>

              {/* Joki */}
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Joki <span className="text-muted-foreground/70">(opsional)</span></Label>
                <Input
                  placeholder="Nama joki jika ada"
                  value={formData.joki}
                  onChange={(e) => setFormData(p => ({ ...p, joki: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Club */}
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Club</Label>
                <Select value={formData.clubId} onValueChange={(v) => setFormData(p => ({ ...p, clubId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih club" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Tanpa Club</SelectItem>
                    {clubs?.map((c: { id: string; name: string }) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlayerFormOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.gamertag.trim() || createPlayer.isPending || updatePlayer.isPending}
            >
              {(createPlayer.isPending || updatePlayer.isPending) ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              {editingPlayer ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloudinary Image Picker — Player Avatars */}
      <CloudinaryPicker
        open={cloudinaryOpen}
        onClose={() => setCloudinaryOpen(false)}
        onSelect={handleAvatarSelect}
        uploadFolder="avatars"
      />

      {/* Cloudinary Image Picker — QRIS QR Code */}
      <CloudinaryPicker
        open={qrisPickerOpen}
        onClose={() => setQrisPickerOpen(false)}
        onSelect={(url) => updatePaymentForm({ donation_qris_image: url })}
        uploadFolder="cms/payment"
      />
    </div>
  );
}
