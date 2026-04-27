'use client';

import { useAppStore, type AppView } from '@/lib/store';
import Image from 'next/image';
import {
  Gamepad2, Trophy, Users, Shield,
  Home, Flame, Radio, UserPlus, LogOut, Target, KeyRound,
  PanelLeftClose, ChevronRight, Download, X, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CasinoHeroSkeleton, StatsRowSkeleton } from './ui/skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { UnifiedLoginModal } from './unified-login-modal';
import { LandingPage } from './landing-page';
import { DonationPopup } from './donation-popup';
import { NotificationStack } from './notification-stack';
import { useEffect, useState } from 'react';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWA } from '@/hooks/use-pwa';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useHaptic, PullToRefresh } from '@/components/idm/ui/mobile-interactions';
/* PlayerAccountModal replaced by UnifiedLoginModal */

/* ─── Lazy-loaded view components (code-split for smaller initial bundle) ─── */
const viewLoading = (
  <div className="space-y-4">
    <CasinoHeroSkeleton />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex items-center justify-center rounded-xl border border-border/50 bg-card/60 p-4">
        <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
      </div>
      <div className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-2">
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        <div className="skeleton-shimmer h-6 w-32 rounded" />
        <div className="skeleton-shimmer h-1.5 w-full rounded-full" />
      </div>
    </div>
    <StatsRowSkeleton count={4} />
  </div>
);

const Dashboard = dynamic(() => import('./dashboard').then(m => ({ default: m.Dashboard })), {
  loading: () => viewLoading,
});
const LeagueView = dynamic(() => import('./league-view').then(m => ({ default: m.LeagueView })), {
  loading: () => viewLoading,
});
const AdminPanel = dynamic(() => import('./admin-panel').then(m => ({ default: m.AdminPanel })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-idm-gold-warm border-t-transparent rounded-full animate-spin" /></div>,
});
const MatchDayCenter = dynamic(() => import('./match-day-center').then(m => ({ default: m.MatchDayCenter })), {
  loading: () => viewLoading,
});
const RegistrationForm = dynamic(() => import('./registration-form').then(m => ({ default: m.RegistrationForm })), {
  loading: () => <div className="max-w-md mx-auto"><div className="skeleton-shimmer h-96 rounded-2xl" /></div>,
});
const MyTournamentCard = dynamic(() => import('./my-tournament-card').then(m => ({ default: m.MyTournamentCard })), {
  loading: () => <div className="max-w-lg mx-auto"><div className="skeleton-shimmer h-96 rounded-2xl" /></div>,
});

const navItems: { id: AppView; label: string; icon: typeof Gamepad2 }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Gamepad2 },
  { id: 'mytournament', label: 'Tour Saya', icon: Target },
  { id: 'matchday', label: 'Match Day', icon: Radio },
  { id: 'league', label: 'League', icon: Trophy },
];

const actionItems: { id: AppView; label: string; icon: typeof UserPlus }[] = [
  { id: 'register', label: 'Daftar', icon: UserPlus },
];

function DivisionToggle({ compact = false }: { compact?: boolean } = {}) {
  const { division, setDivision } = useAppStore();
  const baseClass = compact ? 'px-3 py-2 text-[11px]' : 'px-3 py-1.5 text-xs';
  return (
    <div className="flex items-center bg-muted rounded-full p-0.5 gap-0.5">
      <button
        onClick={() => { setDivision('male'); toast.success('🕺 Male Division'); }}
        className={`${baseClass} rounded-full font-semibold transition-colors duration-150 ${
          division === 'male'
            ? 'bg-idm-male text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        🕺 Male
      </button>
      <button
        onClick={() => { setDivision('female'); toast.success('💃 Female Division'); }}
        className={`${baseClass} rounded-full font-semibold transition-colors duration-150 ${
          division === 'female'
            ? 'bg-idm-female text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        💃 Female
      </button>
    </div>
  );
}

/* ─── Collapsible Desktop Sidebar ─── */
function DesktopSidebar({ onOpenAccountModal, onOpenAdminModal }: { onOpenAccountModal: () => void; onOpenAdminModal: () => void }) {
  const { currentView, setCurrentView, division, adminAuth, clearAdminAuth, sidebarCollapsed, toggleSidebarCollapsed, playerAuth, clearPlayerAuth } = useAppStore();
  const dt = useDivisionTheme();

  const { data: leagueSummary } = useQuery<{ seasonNumber: number; status: string; completedWeeks: number; totalWeeks: number; percentage: number }>({
    queryKey: ['league-summary'],
    queryFn: () => fetch('/api/league').then(r => r.json()).then(d => {
      const sn = d.ligaChampion?.seasonNumber || d.season?.name?.match(/\d+/)?.[0] ? parseInt(d.season.name.match(/\d+/)[0]) : 1;
      const tw = d.stats?.totalWeeks || 0;
      const cw = d.stats?.playedWeeks || 0;
      return {
        seasonNumber: sn,
        status: d.ligaChampion ? 'completed' : d.preSeason ? 'pre-season' : d.hasData ? 'active' : 'upcoming',
        completedWeeks: cw,
        totalWeeks: tw,
        percentage: tw > 0 ? Math.round((cw / tw) * 100) : 0,
      };
    }),
    staleTime: 60_000,
  });

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    clearAdminAuth();
    setCurrentView('landing');
    toast.success('Berhasil logout');
  };

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-border/60 ${dt.glassStrong} shrink-0 h-full overflow-hidden shadow-lg shadow-black/5 transition-[width] duration-150 ease-in-out ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Logo + Toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-5'} pt-4 pb-2`}>
        <div className={`rounded-xl overflow-hidden shrink-0 ${collapsed ? 'w-9 h-9' : 'w-11 h-11 lg:shadow-lg lg:shadow-idm-gold/10'}`}>
          <Image src="/logo1.webp" alt="IDM" width={48} height={48} className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-gradient-fury text-base font-bold leading-tight truncate">IDM League</h1>
            <p className="text-[10px] text-muted-foreground">Fan Made Edition</p>
          </div>
        )}
      </div>

      {/* Toggle Button — with pulse indicator */}
      <div className={`flex ${collapsed ? 'justify-center' : 'justify-end'} px-2 pb-2`}>
        <button
          onClick={toggleSidebarCollapsed}
          className="group relative p-1.5 rounded-lg transition-all duration-200"
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {/* Pulse glow ring */}
          <span className="absolute inset-0 rounded-lg bg-idm-gold/20" />
          {/* Arrow icon */}
          <span className="relative z-10 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted/60 rounded-lg transition-colors">
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </span>
        </button>
      </div>

      {/* Division Toggle */}
      {!collapsed && (
        <div className="px-5 pb-3">
          <DivisionToggle />
        </div>
      )}

      <div className="section-divider !my-0" />

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-1.5' : 'px-3'} py-3 space-y-0.5 overflow-y-auto custom-scrollbar`}>
        {/* Home */}
        <NavButton
          icon={Home} label="Home" collapsed={collapsed}
          isActive={currentView === 'landing'}
          iconBg={currentView === 'landing' ? dt.iconBg : ''}
          activeGlow={currentView === 'landing'}
          division={division}
          onClick={() => setCurrentView('landing')}
        />

        {!collapsed && (
          <div className="px-3 py-1.5">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Navigasi</p>
          </div>
        )}

        {collapsed && <div className="my-1 mx-auto w-6 h-px bg-border/40" />}

        {/* Action items */}
        {actionItems.map(item => (
          <NavButton
            key={item.id} icon={item.icon} label={item.label} collapsed={collapsed}
            isActive={currentView === item.id}
            iconBg={currentView === item.id ? dt.iconBg : ''}
            activeGlow={currentView === item.id}
            division={division}
            onClick={() => setCurrentView(item.id)}
          />
        ))}

        {/* Nav items */}
        {navItems.map(item => (
          <NavButton
            key={item.id} icon={item.icon} label={item.label} collapsed={collapsed}
            isActive={currentView === item.id}
            iconBg={currentView === item.id ? dt.iconBg : ''}
            activeGlow={currentView === item.id}
            division={division}
            onClick={() => setCurrentView(item.id)}
          />
        ))}

        {collapsed && <div className="my-1 mx-auto w-6 h-px bg-border/40" />}

        {/* Admin — open unified modal if not authenticated */}
        <NavButton
          icon={Shield} label="Admin" collapsed={collapsed}
          isActive={currentView === 'admin'}
          iconBg={currentView === 'admin' ? dt.iconBg : ''}
          activeGlow={currentView === 'admin'}
          division={division}
          onClick={() => adminAuth.isAuthenticated ? setCurrentView('admin') : onOpenAdminModal()}
        />
      </nav>

      {/* Bottom section — only when expanded */}
      {!collapsed && (
        <>
          {/* Player Account Status */}
          {playerAuth.isAuthenticated && playerAuth.account && (
            <div className={`mx-4 p-3 rounded-xl ${division === 'male' ? 'bg-idm-male/5 border border-idm-male/20' : 'bg-idm-female/5 border border-idm-female/20'} mb-2`}>
              <div className="flex items-center gap-2 mb-2">
                <UserCircle className={`w-3 h-3 ${division === 'male' ? 'text-idm-male' : 'text-idm-female'}`} />
                <span className={`text-[10px] font-semibold ${division === 'male' ? 'text-idm-male' : 'text-idm-female'} uppercase tracking-wider`}>
                  Akun Saya
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground font-medium truncate">{playerAuth.account.player.gamertag}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 text-muted-foreground ${division === 'male' ? 'hover:text-idm-male hover:bg-idm-male/10' : 'hover:text-idm-female hover:bg-idm-female/10'}`}
                    onClick={onOpenAccountModal} title="Akun Saya">
                    <UserCircle className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    onClick={async () => { try { await fetch('/api/account/logout', { method: 'POST' }); } catch {} clearPlayerAuth(); toast.success('Berhasil logout'); }} title="Logout">
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Not logged in — show login prompt */}
          {!playerAuth.isAuthenticated && (
            <div className="mx-4 mb-2">
              <button
                onClick={onOpenAccountModal}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors cursor-pointer`}
              >
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">Masuk Akun</span>
              </button>
            </div>
          )}

          {/* Admin Status / Logout */}
          {adminAuth.isAuthenticated && (
            <div className="mx-4 p-3 rounded-xl bg-idm-gold/5 border border-idm-gold/20 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-idm-gold" />
                <span className="text-[10px] font-semibold text-idm-gold uppercase tracking-wider">
                  {adminAuth.admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground font-medium">{adminAuth.admin?.username}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-idm-gold hover:bg-idm-gold/10"
                    onClick={() => setCurrentView('admin')} title="Admin Panel">
                    <KeyRound className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    onClick={handleLogout} title="Logout">
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Season Status */}
          <div className={`mx-4 p-3 rounded-xl ${dt.cardPremium} mb-3`}>
            <div className="flex items-center gap-2 mb-2">
              <Flame className={`w-3 h-3 ${dt.text}`} />
              <span className={`text-[10px] font-semibold ${dt.text} uppercase tracking-wider`}>Season {leagueSummary?.seasonNumber ?? 1}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} transition-all duration-700`}
                style={{ width: `${leagueSummary?.percentage || 0}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5">
              {leagueSummary ? `${leagueSummary.percentage}% • Week ${leagueSummary.completedWeeks}/${leagueSummary.totalWeeks || '?'}` : 'Memuat...'}
            </p>
          </div>
        </>
      )}

      {/* Collapsed: mini admin indicator */}
      {collapsed && adminAuth.isAuthenticated && (
        <div className="px-2 pb-2 flex justify-center">
          <div className="w-8 h-8 rounded-lg bg-idm-gold/10 border border-idm-gold/20 flex items-center justify-center"
            title={`${adminAuth.admin?.username} (${adminAuth.admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'})`}>
            <Shield className="w-3.5 h-3.5 text-idm-gold" />
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─── Nav Button — shared between collapsed & expanded ─── */
function NavButton({ icon: Icon, label, collapsed, isActive, iconBg, activeGlow, division, onClick }: {
  icon: typeof Home; label: string; collapsed: boolean;
  isActive: boolean; iconBg: string; activeGlow: boolean; division: string;
  onClick: () => void;
}) {
  const dt = useDivisionTheme();

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        title={label}
        className={`w-full flex items-center justify-center py-2.5 rounded-lg transition-all duration-200 relative ${
          isActive
            ? `${dt.navActive}`
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`}
      >
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        {isActive && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-sm font-medium transition-all duration-200 rounded-lg ${
        isActive
          ? `${dt.navActive} border-l-2 ${division === 'male' ? 'border-l-idm-male' : 'border-l-idm-female'}`
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${iconBg} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="py-2.5">{label}</span>
      {isActive && (
        <div className={`ml-auto w-1.5 h-1.5 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
      )}
    </button>
  );
}



export function AppShell() {
  const { currentView, donationPopup, hideDonationPopup, division, adminAuth, setAdminAuth, setCurrentView, playerAuth, setPlayerAuth } = useAppStore();
  const dt = useDivisionTheme();
  const { hapticTap } = useHaptic();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { canInstall: _canInstall, promptInstall } = usePWA();
  const [canInstall, setCanInstall] = useState(_canInstall);
  const [dismissed, setDismissed] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalDefaultTab, setAccountModalDefaultTab] = useState<'peserta' | 'admin'>('peserta');

  // Sync with PWA hook + localStorage dismissal
  useEffect(() => {
    const timer = setTimeout(() => {
      if (_canInstall && !localStorage.getItem('pwa-install-dismissed')) {
        setCanInstall(true);
      } else {
        setCanInstall(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [_canInstall]);

  // Check admin session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.admin) {
          setAdminAuth({ isAuthenticated: true, admin: data.admin });
        }
      } catch {
        // Not authenticated
      }
    }
    checkSession();
  }, [setAdminAuth]);

  // Check player session on mount
  useEffect(() => {
    async function checkPlayerSession() {
      try {
        const res = await fetch('/api/account/session');
        const data = await res.json();
        if (data.authenticated && data.account) {
          setPlayerAuth({ isAuthenticated: true, account: data.account });
        }
      } catch {
        // Not authenticated
      }
    }
    checkPlayerSession();
  }, [setPlayerAuth]);

  // Landing page is standalone - no sidebar/header
  if ((currentView as AppView) === 'landing') {
    return (
      <>
        <LandingPage />
        <DonationPopup
          show={donationPopup.show}
          message={donationPopup.message}
          onClose={hideDonationPopup}
        />
        <NotificationStack />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'matchday': return <MatchDayCenter />;
      case 'league': return <LeagueView />;
      case 'admin': return adminAuth.isAuthenticated ? <AdminPanel /> : (() => { /* Open unified modal on admin tab instead of inline login */ setTimeout(() => { setAccountModalDefaultTab('admin'); setAccountModalOpen(true); setCurrentView('dashboard'); }, 0); return null; })();
      case 'register': return <RegistrationForm />;
      case 'mytournament': return <MyTournamentCard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Mobile Header — clean, single account button */}
      <header className={`lg:hidden sticky top-0 z-40 ${dt.glassStrong} px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <Image src="/logo1.webp" alt="IDM" width={28} height={28} className="w-full h-full object-cover" />
          </div>
          <span className="text-gradient-fury text-sm font-bold">IDM League</span>
        </div>
        <div className="flex items-center gap-1">
          <DivisionToggle compact />
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 ${playerAuth.isAuthenticated ? (division === 'male' ? 'text-idm-male' : 'text-idm-female') : adminAuth.isAuthenticated ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}
            onClick={() => { hapticTap(); setAccountModalDefaultTab('peserta'); setAccountModalOpen(true); }}
            title={playerAuth.isAuthenticated ? `Akun: ${playerAuth.account?.player.gamertag}` : 'Masuk Akun'}
          >
            <UserCircle className="w-4.5 h-4.5" />
          </Button>
        </div>
      </header>

      {/* PWA Install Banner — mobile only */}
      {canInstall && !dismissed && (
        <div className={`lg:hidden ${dt.glassStrong} border-b ${dt.border} px-3 py-2 flex items-center gap-2`}>
          <Download className="w-4 h-4 text-idm-gold-warm shrink-0" />
          <p className="text-[11px] flex-1">Install IDM League di HP-mu untuk akses cepat!</p>
          <button
            onClick={() => { promptInstall(); }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black shrink-0"
          >
            Install
          </button>
          <button
            onClick={() => { setDismissed(true); setCanInstall(false); localStorage.setItem('pwa-install-dismissed', '1'); }}
            className="p-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar — Collapsible */}
        <DesktopSidebar onOpenAccountModal={() => { setAccountModalDefaultTab('peserta'); setAccountModalOpen(true); }} onOpenAdminModal={() => { setAccountModalDefaultTab('admin'); setAccountModalOpen(true); }} />

        {/* Main Content */}
        <main className={`flex-1 min-w-0 overflow-y-auto ${dt.bgMesh}`}>
          {isMobile ? (
            <PullToRefresh onRefresh={async () => { queryClient.invalidateQueries(); }}>
              <div
                key={currentView}
                className={`pt-6 px-3 pb-28 sm:pt-6 sm:px-4 sm:pb-28 lg:p-8 lg:pb-8 ${currentView === 'admin' ? 'max-w-[2200px]' : currentView === 'dashboard' || currentView === 'mytournament' ? '' : 'max-w-[1600px]'} mx-auto`}
              >
                {renderView()}
              </div>
            </PullToRefresh>
          ) : (
            <div
              key={currentView}
              className={`pt-6 px-3 pb-28 sm:pt-6 sm:px-4 sm:pb-28 lg:p-8 lg:pb-8 ${currentView === 'admin' ? 'max-w-[2200px]' : currentView === 'dashboard' || currentView === 'mytournament' ? '' : 'max-w-[1600px]'} mx-auto`}
            >
              {renderView()}
            </div>
          )}
        </main>
      </div>

      {/* ═══ FAB: Daftar (Register) — circle bottom-right, above bottom nav ═══ */}
      <button
        onClick={() => { hapticTap(); setCurrentView('register'); }}
        className={`lg:hidden fixed z-[60] right-4 bottom-20 w-12 h-12 rounded-full shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center ${
          currentView === 'register'
            ? 'bg-gradient-to-br from-idm-gold-warm to-[#e8d5a3] ring-2 ring-idm-gold-warm/40'
            : 'bg-gradient-to-br from-idm-gold-warm to-[#e8d5a3]'
        }`}
        aria-label="Daftar Turnamen"
      >
        <span className="text-lg leading-none">📝</span>
      </button>

      {/* ═══ Mobile Bottom Nav — 5 items, clean and spacious ═══ */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${dt.glassStrong} border-t border-border safe-area-bottom`}>
        <div className="flex justify-around py-1 px-1">
          {/* Home */}
          <button
            onClick={() => { hapticTap(); setCurrentView('landing'); }}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-h-[44px] rounded-lg transition-colors duration-200 relative ${
              (currentView as AppView) === 'landing' ? dt.text : 'text-muted-foreground'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">Home</span>
            {(currentView as AppView) === 'landing' && (
              <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
            )}
          </button>

          {/* All 4 nav items — evenly spaced */}
          {navItems.map((navItem) => {
            const Icon = navItem.icon;
            const isActive = currentView === navItem.id;
            return (
              <button
                key={navItem.id}
                onClick={() => { hapticTap(); setCurrentView(navItem.id); }}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-h-[44px] rounded-lg transition-colors duration-200 relative ${
                  isActive ? dt.text : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">{navItem.label}</span>
                {isActive && (
                  <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Donation Popup */}
      <DonationPopup
        show={donationPopup.show}
        message={donationPopup.message}
        onClose={hideDonationPopup}
      />

      {/* Notification Stack */}
      <NotificationStack />

      {/* Unified Login Modal — Peserta + Admin tabs */}
      <UnifiedLoginModal
        open={accountModalOpen}
        onOpenChange={setAccountModalOpen}
        defaultTab={accountModalDefaultTab}
      />

      {/* Footer — desktop only, premium subtle style */}
      <footer className="mt-auto py-4 text-center text-xs text-muted-foreground border-t border-border/60 hidden lg:block">
        <span className="text-gradient-fury font-semibold">IDM League</span> — Fan Made Edition © 2026
      </footer>
    </div>
  );
}
