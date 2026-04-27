'use client';

import { useState } from 'react';
import {
  X, Eye, EyeOff, Loader2, Lock, User, Gamepad2,
  ArrowLeft, UserPlus, LogIn, Sparkles, Shield,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { TierBadge } from './tier-badge';
import { toast } from 'sonner';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils';

type ModalMode = 'choose' | 'login' | 'register' | 'register-confirm';

interface PlayerAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerAccountModal({ open, onOpenChange }: PlayerAccountModalProps) {
  const { setPlayerAuth, division } = useAppStore();
  const dt = useDivisionTheme();

  const [mode, setMode] = useState<ModalMode>('choose');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register state
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

  const resetForm = () => {
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

  const handleModeChange = (newMode: ModalMode) => {
    resetForm();
    setMode(newMode);
  };

  // Search for player by gamertag (for registration)
  const handleSearchPlayer = async () => {
    if (!regGamertag.trim()) return;
    setRegSearching(true);
    setRegError('');
    setRegFoundPlayer(null);

    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(regGamertag.trim())}&division=male`);
      const data = await res.json();

      if (data.players && data.players.length > 0) {
        // Find exact match first
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
        // Try female division
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

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
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
      resetForm();
    } catch {
      setLoginError('Terjadi kesalahan koneksi');
    } finally {
      setLoginLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
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
        handleModeChange('login');
      }

      onOpenChange(false);
      resetForm();
    } catch {
      setRegError('Terjadi kesalahan koneksi');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-background border-border/50">
        <DialogTitle className="sr-only">Akun Pemain IDM League</DialogTitle>
        {/* Top accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`} />

        <div className="p-6">
          {mode === 'choose' && (
            <div key="choose">
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${division === 'male' ? 'from-idm-male/20 to-idm-male/5 border-idm-male/30' : 'from-idm-female/20 to-idm-female/5 border-idm-female/30'} border flex items-center justify-center`}>
                  <Gamepad2 className={`w-7 h-7 ${dt.text}`} />
                </div>
                <h2 className="text-lg font-bold">Akun Pemain</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Masuk untuk melihat statistik & prestasi kamu
                </p>
              </div>

              {/* Choice buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleModeChange('login')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-left group cursor-pointer`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} flex items-center justify-center shrink-0`}>
                    <LogIn className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Masuk</p>
                    <p className="text-[10px] text-muted-foreground">Sudah punya akun? Login di sini</p>
                  </div>
                </button>

                <button
                  onClick={() => handleModeChange('register')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-left group cursor-pointer`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-idm-gold-warm to-[#e8d5a3] flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Daftar Akun</p>
                    <p className="text-[10px] text-muted-foreground">Pemain baru? Buat akun dulu</p>
                  </div>
                </button>
              </div>

              {/* Info */}
              <div className="mt-5 p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-idm-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Akun pemain terhubung ke data turnamen IDM League.
                      Dapatkan skin eksklusif untuk pemenang juara & MVP! 🏆
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div key="login">
              {/* Header */}
              <div className="text-center mb-5">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${division === 'male' ? 'from-idm-male/20 to-idm-male/5 border-idm-male/30' : 'from-idm-female/20 to-idm-female/5 border-idm-female/30'} border flex items-center justify-center`}>
                  <LogIn className={`w-6 h-6 ${dt.text}`} />
                </div>
                <h2 className="text-base font-bold">Masuk Akun</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Gunakan gamertag dan password kamu
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-3">
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

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Belum punya akun? <span className={`font-semibold ${dt.text}`}>Daftar di sini</span>
                </button>
              </div>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('choose')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Kembali
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && !regFoundPlayer && (
            <div key="register-search">
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-idm-gold/20 to-idm-gold/5 border border-idm-gold/30 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-idm-gold" />
                </div>
                <h2 className="text-base font-bold">Daftar Akun</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Cari gamertag kamu dulu untuk verifikasi
                </p>
              </div>

              {/* Search Gamertag */}
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

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('choose')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Kembali
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && regFoundPlayer && (
            <div key="register-form">
              {/* Found player confirmation */}
              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground">Pemain ditemukan!</p>
              </div>

              <div className={`p-3 rounded-xl ${dt.bgSubtle} border ${dt.border} mb-4`}>
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

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="space-y-3">
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
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Cari gamertag lain
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
