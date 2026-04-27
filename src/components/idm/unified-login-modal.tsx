'use client';

import { useState, useEffect } from 'react';
import {
  X, Eye, EyeOff, Loader2, Lock, User, Gamepad2,
  ArrowLeft, UserPlus, LogIn, Sparkles, Shield,
  KeyRound, Eye as ViewIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { TierBadge } from './tier-badge';
import { SkinBadgesRow, SkinAvatarFrame, SkinName } from './skin-renderer';
import { SkinShowcase } from './skin-showcase';
import { getPrimarySkin } from '@/lib/skin-utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils';

type PlayerModalMode = 'choose' | 'login' | 'register' | 'register-confirm';
type AdminModalMode = 'login' | 'change-password';

interface UnifiedLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which tab to show by default */
  defaultTab?: 'peserta' | 'admin';
}

export function UnifiedLoginModal({ open, onOpenChange, defaultTab = 'peserta' }: UnifiedLoginModalProps) {
  const { setPlayerAuth, setAdminAuth, division, adminAuth, playerAuth, clearPlayerAuth, clearAdminAuth, setCurrentView } = useAppStore();
  const dt = useDivisionTheme();

  const [activeTab, setActiveTab] = useState<'peserta' | 'admin'>(defaultTab);

  // Sync defaultTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // ═══ Player Login State ═══
  const [playerMode, setPlayerMode] = useState<PlayerModalMode>('choose');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ═══ Player Register State ═══
  const [regGamertag, setRegGamertag] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regFoundPlayer, setRegFoundPlayer] = useState<{
    id: string; gamertag: string; name: string; division: string; tier: string; avatar?: string | null;
  } | null>(null);
  const [regSearching, setRegSearching] = useState(false);

  // ═══ Admin Login State ═══
  const [adminMode, setAdminMode] = useState<AdminModalMode>('login');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Admin change password
  const [cpUsername, setCpUsername] = useState('');
  const [cpCurrentPassword, setCpCurrentPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');

  // Skin showcase
  const [showSkinShowcase, setShowSkinShowcase] = useState(false);

  const resetPlayerForm = () => {
    setLoginUsername('');
    setLoginPassword('');
    setShowLoginPassword(false);
    setLoginError('');
    setRegGamertag('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegEmail('');
    setRegPhone('');
    setRegError('');
    setRegFoundPlayer(null);
    setRegSearching(false);
  };

  const resetAdminForm = () => {
    setAdminUsername('');
    setAdminPassword('');
    setShowAdminPassword(false);
    setAdminError('');
    setCpUsername('');
    setCpCurrentPassword('');
    setCpNewPassword('');
    setCpConfirmPassword('');
    setCpShowCurrent(false);
    setCpShowNew(false);
    setCpError('');
    setCpSuccess('');
    setAdminMode('login');
  };

  const handlePlayerModeChange = (newMode: PlayerModalMode) => {
    resetPlayerForm();
    setPlayerMode(newMode);
  };

  // ═══ Player: Search for player by gamertag ═══
  const handleSearchPlayer = async () => {
    if (!regGamertag.trim()) return;
    setRegSearching(true);
    setRegError('');
    setRegFoundPlayer(null);

    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(regGamertag.trim())}&division=male`);
      const data = await res.json();

      if (data.players && data.players.length > 0) {
        const exactMatch = data.players.find(
          (p: { gamertag: string }) => p.gamertag.toLowerCase() === regGamertag.trim().toLowerCase()
        );
        const player = exactMatch || data.players[0];
        setRegFoundPlayer({
          id: player.id,
          gamertag: player.gamertag,
          name: player.name,
          division: player.division,
          tier: player.tier,
          avatar: player.avatar,
        });
      } else {
        const res2 = await fetch(`/api/players/search?q=${encodeURIComponent(regGamertag.trim())}&division=female`);
        const data2 = await res2.json();
        if (data2.players && data2.players.length > 0) {
          const exactMatch = data2.players.find(
            (p: { gamertag: string }) => p.gamertag.toLowerCase() === regGamertag.trim().toLowerCase()
          );
          const player = exactMatch || data2.players[0];
          setRegFoundPlayer({
            id: player.id,
            gamertag: player.gamertag,
            name: player.name,
            division: player.division,
            tier: player.tier,
            avatar: player.avatar,
          });
        } else {
          setRegError('Gamertag tidak ditemukan. Pastikan kamu sudah terdaftar sebagai pemain turnamen.');
        }
      }
    } catch {
      setRegError('Terjadi kesalahan saat mencari pemain.');
    } finally {
      setRegSearching(false);
    }
  };

  // ═══ Player: Login handler ═══
  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Login gagal');
        return;
      }

      setPlayerAuth({
        isAuthenticated: true,
        account: data.account,
      });

      toast.success(`Selamat datang, ${data.account.player.gamertag}! 🎮`);
      onOpenChange(false);
      resetPlayerForm();
    } catch {
      setLoginError('Terjadi kesalahan koneksi');
    } finally {
      setLoginLoading(false);
    }
  };

  // ═══ Player: Register handler ═══
  const handlePlayerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 6) {
      setRegError('Password minimal 6 karakter');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi password tidak cocok');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gamertag: regFoundPlayer?.gamertag || regGamertag,
          password: regPassword,
          email: regEmail || undefined,
          phone: regPhone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || 'Registrasi gagal');
        return;
      }

      // Auto-login after registration
      const loginRes = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.account.username,
          password: regPassword,
        }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.account) {
        setPlayerAuth({
          isAuthenticated: true,
          account: loginData.account,
        });
        toast.success(`Akun dibuat! Selamat datang, ${loginData.account.player.gamertag}! 🎉`);
      } else {
        toast.success('Akun berhasil dibuat! Silakan login.');
        handlePlayerModeChange('login');
      }

      onOpenChange(false);
      resetPlayerForm();
    } catch {
      setRegError('Terjadi kesalahan koneksi');
    } finally {
      setRegLoading(false);
    }
  };

  // ═══ Admin: Login handler ═══
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAdminError(data.error || 'Login gagal');
        return;
      }

      setAdminAuth({
        isAuthenticated: true,
        admin: data.admin,
      });

      toast.success('Admin login berhasil! 🔒');
      onOpenChange(false);
      resetAdminForm();
      setCurrentView('admin');
    } catch {
      setAdminError('Terjadi kesalahan koneksi');
    } finally {
      setAdminLoading(false);
    }
  };

  // ═══ Admin: Change Password handler ═══
  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');

    if (cpNewPassword !== cpConfirmPassword) {
      setCpError('Konfirmasi password tidak cocok');
      return;
    }

    if (cpNewPassword.length < 6) {
      setCpError('Password baru minimal 6 karakter');
      return;
    }

    setCpLoading(true);

    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cpUsername, password: cpCurrentPassword }),
      });

      if (!loginRes.ok) {
        setCpError('Username atau password lama tidak sesuai');
        return;
      }

      const changeRes = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: cpCurrentPassword,
          newPassword: cpNewPassword,
        }),
      });

      const changeData = await changeRes.json();

      if (!changeRes.ok) {
        setCpError(changeData.error || 'Gagal mengubah password');
        return;
      }

      setCpSuccess('Password berhasil diubah! Silakan login dengan password baru.');
      setCpCurrentPassword('');
      setCpNewPassword('');
      setCpConfirmPassword('');

      setTimeout(() => {
        setAdminMode('login');
        setCpSuccess('');
      }, 2000);
    } catch {
      setCpError('Terjadi kesalahan koneksi');
    } finally {
      setCpLoading(false);
    }
  };

  // ═══ Determine what to show for each tab ═══
  const isPlayerLoggedIn = playerAuth.isAuthenticated && playerAuth.account;
  const isAdminLoggedIn = adminAuth.isAuthenticated && adminAuth.admin;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-background border-border/50">
        <DialogTitle className="sr-only">Login IDM League</DialogTitle>
        {/* Top accent bar — gradient changes based on active tab */}
        <div className={`h-1 w-full bg-gradient-to-r ${
          activeTab === 'admin'
            ? 'from-idm-gold via-idm-gold-light to-idm-gold'
            : division === 'male'
              ? 'from-idm-male to-idm-male-light'
              : 'from-idm-female to-idm-female-light'
        }`} />

        <div className="p-5 pt-3">
          {/* ═══ Tabs Header ═══ */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'peserta' | 'admin'); }} className="w-full">
            <TabsList className="w-full h-10 bg-muted/50 rounded-xl p-1">
              <TabsTrigger
                value="peserta"
                className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-sm text-xs font-semibold gap-1.5 h-8 data-[state=active]:from-idm-male/80 data-[state=active]:to-idm-male-light/80 data-[state=active]:text-white"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Peserta
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-sm text-xs font-semibold gap-1.5 h-8 data-[state=active]:from-idm-gold data-[state=active]:to-idm-gold-light data-[state=active]:text-black"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </TabsTrigger>
            </TabsList>

            {/* ═══ PESERTA TAB ═══ */}
            <TabsContent value="peserta" className="mt-4">
              {isPlayerLoggedIn ? (
                /* ── Player Already Logged In ── */
                <div>
                  <div className={`p-4 rounded-xl ${division === 'male' ? 'bg-idm-male/5 border border-idm-male/20' : 'bg-idm-female/5 border border-idm-female/20'} mb-4`}>
                    <div className="flex items-center gap-3">
                      <SkinAvatarFrame skin={getPrimarySkin(playerAuth.account!.skins || [])}>
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border/20">
                          <Image
                            src={getAvatarUrl(playerAuth.account!.player.gamertag, playerAuth.account!.player.division as 'male' | 'female', playerAuth.account!.player.avatar)}
                            alt={playerAuth.account!.player.gamertag}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      </SkinAvatarFrame>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <SkinName skin={getPrimarySkin(playerAuth.account!.skins || [])}>
                            <span className="text-sm font-bold truncate">{playerAuth.account!.player.gamertag}</span>
                          </SkinName>
                          <TierBadge tier={playerAuth.account!.player.tier} />
                        </div>
                        {(playerAuth.account!.skins?.length ?? 0) > 0 && (
                          <div className="mt-0.5">
                            <SkinBadgesRow skins={playerAuth.account!.skins || []} />
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground">{playerAuth.account!.player.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {playerAuth.account!.player.division === 'male' ? '🕺 Male' : '💃 Female'} · {playerAuth.account!.player.points} pts
                        </p>
                      </div>
                      <Badge className={`${dt.casinoBadge} text-[9px]`}>✓</Badge>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/30">
                      <p className="text-base font-bold">{playerAuth.account!.player.totalWins}</p>
                      <p className="text-[9px] text-muted-foreground">Menang</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/30">
                      <p className="text-base font-bold">{playerAuth.account!.player.totalMvp}</p>
                      <p className="text-[9px] text-muted-foreground">MVP</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/30">
                      <p className="text-base font-bold">{playerAuth.account!.player.matches}</p>
                      <p className="text-[9px] text-muted-foreground">Match</p>
                    </div>
                  </div>

                  {/* Logout */}
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs border-border/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
                    onClick={async () => {
                      try { await fetch('/api/account/logout', { method: 'POST' }); } catch {}
                      clearPlayerAuth();
                      toast.success('Berhasil logout');
                    }}
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1.5 rotate-180" />
                    Logout
                  </Button>
                </div>
              ) : playerMode === 'choose' ? (
                /* ── Player: Choose Mode ── */
                <div key="choose">
                  <div className="text-center mb-5">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${division === 'male' ? 'from-idm-male/20 to-idm-male/5 border-idm-male/30' : 'from-idm-female/20 to-idm-female/5 border-idm-female/30'} border flex items-center justify-center`}>
                      <Gamepad2 className={`w-6 h-6 ${dt.text}`} />
                    </div>
                    <h2 className="text-base font-bold">Akun Pemain</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Masuk untuk melihat statistik & prestasi kamu
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => handlePlayerModeChange('login')}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} flex items-center justify-center shrink-0`}>
                        <LogIn className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Masuk</p>
                        <p className="text-[10px] text-muted-foreground">Sudah punya akun? Login di sini</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePlayerModeChange('register')}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-idm-gold-warm to-[#e8d5a3] flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4 text-black" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Daftar Akun</p>
                        <p className="text-[10px] text-muted-foreground">Pemain baru? Buat akun dulu</p>
                      </div>
                    </button>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowSkinShowcase(true)}
                      className="w-full p-3 rounded-xl bg-gradient-to-br from-idm-gold/5 to-idm-gold/[0.02] border border-idm-gold/20 hover:border-idm-gold/40 transition-all group"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-idm-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <p className="text-[11px] font-semibold text-idm-gold-warm">
                          Skin Eksklusif Setiap Minggu!
                        </p>
                        <ViewIcon className="w-3.5 h-3.5 text-idm-gold/50 ml-auto shrink-0 mt-0.5 group-hover:text-idm-gold transition-colors" />
                      </div>
                      <div className="space-y-1.5 ml-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm leading-none">🥇</span>
                          <span className="text-[10px] text-muted-foreground">Juara <strong className="text-yellow-400">1</strong> — <strong className="text-yellow-400">Gold Crown</strong> (1 minggu)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm leading-none">⭐</span>
                          <span className="text-[10px] text-muted-foreground">MVP — <strong className="text-gray-300">Platinum Star ✨</strong> (1 minggu)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm leading-none">💎</span>
                          <span className="text-[10px] text-muted-foreground">Penyawer — <strong className="text-emerald-400">Emerald Luxury 💵</strong> (1 minggu)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm leading-none">❤️</span>
                          <span className="text-[10px] text-muted-foreground">Donatur — <strong className="text-rose-400">Maroon Heart</strong> (1 minggu, badge ❤️ permanen!)</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-idm-gold/40 ml-6 mt-2 group-hover:text-idm-gold/60 transition-colors">Tap untuk lihat preview visual →</p>
                    </button>
                  </div>
                </div>
              ) : playerMode === 'login' ? (
                /* ── Player: Login Form ── */
                <div key="login">
                  <div className="text-center mb-4">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${division === 'male' ? 'from-idm-male/20 to-idm-male/5 border-idm-male/30' : 'from-idm-female/20 to-idm-female/5 border-idm-female/30'} border flex items-center justify-center`}>
                      <LogIn className={`w-5 h-5 ${dt.text}`} />
                    </div>
                    <h2 className="text-sm font-bold">Masuk Akun</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Gunakan gamertag dan password kamu</p>
                  </div>

                  <form onSubmit={handlePlayerLogin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Gamertag</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          placeholder="Gamertag kamu"
                          className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-idm-male/50"
                          disabled={loginLoading}
                          autoComplete="username"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Password"
                          className="pl-10 pr-10 h-10 bg-muted/30 border-border/50 focus:border-idm-male/50"
                          disabled={loginLoading}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {loginError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loginLoading || !loginUsername || !loginPassword}
                      className={`w-full h-10 bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white font-semibold`}
                    >
                      {loginLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4 mr-2" />
                      )}
                      {loginLoading ? 'Memverifikasi...' : 'Masuk'}
                    </Button>
                  </form>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handlePlayerModeChange('register')}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Belum punya akun? <span className={`font-semibold ${dt.text}`}>Daftar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlayerModeChange('choose')}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Kembali
                    </button>
                  </div>
                </div>
              ) : playerMode === 'register' && !regFoundPlayer ? (
                /* ── Player: Register - Search Gamertag ── */
                <div key="register-search">
                  <div className="text-center mb-4">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-idm-gold/20 to-idm-gold/5 border border-idm-gold/30 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-idm-gold" />
                    </div>
                    <h2 className="text-sm font-bold">Daftar Akun</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Cari gamertag kamu dulu untuk verifikasi</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Gamertag</label>
                      <div className="relative">
                        <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={regGamertag}
                          onChange={(e) => { setRegGamertag(e.target.value); setRegError(''); }}
                          placeholder="Ketik gamertag kamu"
                          className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                          disabled={regSearching}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchPlayer(); } }}
                        />
                      </div>
                    </div>

                    {regError && (
                      <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {regError}
                      </div>
                    )}

                    <Button
                      onClick={handleSearchPlayer}
                      disabled={regSearching || !regGamertag.trim()}
                      className="w-full h-10 bg-gradient-to-r from-idm-gold to-idm-gold-light text-black font-semibold"
                    >
                      {regSearching ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Gamepad2 className="w-4 h-4 mr-2" />
                      )}
                      {regSearching ? 'Mencari...' : 'Cari Pemain'}
                    </Button>
                  </div>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => handlePlayerModeChange('choose')}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Kembali
                    </button>
                  </div>
                </div>
              ) : playerMode === 'register' && regFoundPlayer ? (
                /* ── Player: Register - Complete Form ── */
                <div key="register-form">
                  <div className="text-center mb-3">
                    <p className="text-[10px] text-muted-foreground">Pemain ditemukan!</p>
                  </div>

                  <div className={`p-3 rounded-xl ${dt.bgSubtle} border ${dt.border} mb-3`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border/20">
                        <Image
                          src={getAvatarUrl(regFoundPlayer.gamertag, regFoundPlayer.division as 'male' | 'female', regFoundPlayer.avatar)}
                          alt={regFoundPlayer.gamertag}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{regFoundPlayer.gamertag}</span>
                          <TierBadge tier={regFoundPlayer.tier} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{regFoundPlayer.name} · {regFoundPlayer.division === 'male' ? '🕺 Male' : '💃 Female'}</p>
                      </div>
                      <Badge className={`${dt.casinoBadge} text-[9px]`}>✓</Badge>
                    </div>
                  </div>

                  <form onSubmit={handlePlayerRegister} className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                          disabled={regLoading}
                          autoComplete="new-password"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Konfirmasi Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Ulangi password"
                          className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                          disabled={regLoading}
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Email <span className="normal-case">(opsional)</span></label>
                      <Input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@contoh.com"
                        className="h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                        disabled={regLoading}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">No. WhatsApp <span className="normal-case">(opsional)</span></label>
                      <Input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                        disabled={regLoading}
                        autoComplete="tel"
                      />
                    </div>

                    {regError && (
                      <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {regError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={regLoading || !regPassword || !regConfirmPassword}
                      className="w-full h-10 bg-gradient-to-r from-idm-gold to-idm-gold-light text-black font-semibold"
                    >
                      {regLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      {regLoading ? 'Membuat Akun...' : 'Buat Akun'}
                    </Button>
                  </form>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => { setRegFoundPlayer(null); setRegError(''); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Cari gamertag lain
                    </button>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            {/* ═══ ADMIN TAB ═══ */}
            <TabsContent value="admin" className="mt-4">
              {isAdminLoggedIn ? (
                /* ── Admin Already Logged In ── */
                <div>
                  <div className="p-4 rounded-xl bg-idm-gold/5 border border-idm-gold/20 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-idm-gold/20 to-idm-gold/5 border border-idm-gold/30 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-idm-gold" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{adminAuth.admin?.username}</p>
                        <p className="text-[10px] text-idm-gold font-semibold uppercase tracking-wider">
                          {adminAuth.admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </p>
                      </div>
                      <Badge className="bg-idm-gold/10 text-idm-gold border-idm-gold/20 text-[9px]">🔒</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full h-9 text-xs bg-gradient-to-r from-idm-gold to-idm-gold-light text-black font-semibold"
                      onClick={() => { onOpenChange(false); setCurrentView('admin'); }}
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                      Buka Admin Panel
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-9 text-xs border-border/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
                      onClick={async () => {
                        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
                        clearAdminAuth();
                        toast.success('Berhasil logout admin');
                      }}
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1.5 rotate-180" />
                      Logout Admin
                    </Button>
                  </div>
                </div>
              ) : adminMode === 'login' ? (
                /* ── Admin: Login Form ── */
                <div key="admin-login">
                  <div className="text-center mb-4">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-idm-gold/20 to-idm-gold/5 border border-idm-gold/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-idm-gold" />
                    </div>
                    <h2 className="text-sm font-bold text-gradient-fury">Admin Login</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Masuk untuk mengakses panel admin</p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Username"
                        className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50 focus:ring-idm-gold/20"
                        disabled={adminLoading}
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Password"
                        className="pl-10 pr-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50 focus:ring-idm-gold/20"
                        disabled={adminLoading}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {adminError && (
                      <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {adminError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={adminLoading || !adminUsername || !adminPassword}
                      className="w-full h-10 bg-gradient-to-r from-idm-gold to-idm-gold-light hover:from-idm-gold-light hover:to-idm-gold text-black font-semibold shadow-sm"
                    >
                      {adminLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      {adminLoading ? 'Memverifikasi...' : 'Masuk'}
                    </Button>
                  </form>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => { setAdminMode('change-password'); setAdminError(''); }}
                      className="text-[10px] text-muted-foreground hover:text-idm-gold transition-colors inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3 h-3" />
                      Ganti Password
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/30 text-center">
                    <p className="text-[9px] text-muted-foreground">
                      🔒 Area khusus admin · Akses terbatas
                    </p>
                  </div>
                </div>
              ) : (
                /* ── Admin: Change Password Form ── */
                <div key="admin-change-password">
                  <div className="text-center mb-4">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-idm-gold/20 to-idm-gold/5 border border-idm-gold/30 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-idm-gold" />
                    </div>
                    <h2 className="text-sm font-bold text-gradient-fury">Ganti Password</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Ubah password akun admin Anda</p>
                  </div>

                  <form onSubmit={handleAdminChangePassword} className="space-y-2.5">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={cpUsername}
                        onChange={(e) => setCpUsername(e.target.value)}
                        placeholder="Username"
                        className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                        disabled={cpLoading}
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={cpShowCurrent ? 'text' : 'password'}
                        value={cpCurrentPassword}
                        onChange={(e) => setCpCurrentPassword(e.target.value)}
                        placeholder="Password lama"
                        className="pl-10 pr-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                        disabled={cpLoading}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setCpShowCurrent(!cpShowCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {cpShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={cpShowNew ? 'text' : 'password'}
                        value={cpNewPassword}
                        onChange={(e) => setCpNewPassword(e.target.value)}
                        placeholder="Password baru (min. 6 karakter)"
                        className="pl-10 pr-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                        disabled={cpLoading}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setCpShowNew(!cpShowNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {cpShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={cpConfirmPassword}
                        onChange={(e) => setCpConfirmPassword(e.target.value)}
                        placeholder="Konfirmasi password baru"
                        className="pl-10 h-10 bg-muted/30 border-border/50 focus:border-idm-gold/50"
                        disabled={cpLoading}
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    {cpError && (
                      <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {cpError}
                      </div>
                    )}

                    {cpSuccess && (
                      <div className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        {cpSuccess}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={cpLoading || !cpUsername || !cpCurrentPassword || !cpNewPassword || !cpConfirmPassword}
                      className="w-full h-10 bg-gradient-to-r from-idm-gold to-idm-gold-light text-black font-semibold"
                    >
                      {cpLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4 mr-2" />
                      )}
                      {cpLoading ? 'Mengubah...' : 'Ubah Password'}
                    </Button>
                  </form>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => { setAdminMode('login'); setCpError(''); setCpSuccess(''); }}
                      className="text-[10px] text-muted-foreground hover:text-idm-gold transition-colors inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Kembali ke Login
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

      {/* Skin Showcase Overlay */}
      <SkinShowcase open={showSkinShowcase} onClose={() => setShowSkinShowcase(false)} />
    </>
  );
}
