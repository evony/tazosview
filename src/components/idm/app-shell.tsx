'use client';

import { useAppStore, type AppView } from '@/lib/store';
import Image from 'next/image';
import {
  Users, Shield,
  Home, Flame, LogOut, KeyRound,
  PanelLeftClose, ChevronRight, Download, X, UserCircle,
  Zap, Star, HelpCircle, Bell,
  Gamepad2, Trophy, Radio, Target, Calendar
} from 'lucide-react';
import { formatTarkamSeasonName } from '@/lib/utils';
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
import { useShellTheme } from '@/hooks/use-shell-theme';
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
const CommunityDashboard = dynamic(() => import('./community-dashboard').then(m => ({ default: m.CommunityDashboard })), {
  loading: () => viewLoading,
});

/* ─── Navigation Items — Community-focused ─── */
type NavItemDef = {
  id: AppView;
  label: string;
  icon: typeof Home;
  division?: 'male' | 'female';
  isSubItem?: boolean;
};

const communityNavItems: NavItemDef[] = [
  { id: 'community', label: 'Komunitas', icon: Users },
  { id: 'dashboard', label: 'Male', icon: Zap, division: 'male' },
  { id: 'dashboard', label: 'Female', icon: Star, division: 'female' },
];

/* Division sub-menu items — shown when a division is active */
const divisionSubItems: NavItemDef[] = [
  { id: 'mytournament', label: 'Tour Saya', icon: Target, isSubItem: true },
  { id: 'matchday', label: 'Match Day', icon: Radio, isSubItem: true },
  { id: 'league', label: 'League', icon: Trophy, isSubItem: true },
];

/* ─── Collapsible Desktop Sidebar ─── */
function DesktopSidebar({ onOpenAccountModal, onOpenAdminModal }: { onOpenAccountModal: () => void; onOpenAdminModal: () => void }) {
  const { currentView, setCurrentView, division, setDivision, adminAuth, clearAdminAuth, sidebarCollapsed, toggleSidebarCollapsed, playerAuth, clearPlayerAuth } = useAppStore();
  const dt = useShellTheme();

  const { data: leagueSummary } = useQuery<{ seasonNumber: number; status: string; completedWeeks: number; totalWeeks: number; percentage: number }>({
    queryKey: ['league-summary'],
    queryFn: () => fetch('/api/league').then(r => r.json()).then(d => {
      const sn = d.tarkamChampion?.seasonNumber || d.season?.number || 1;
      const tw = d.stats?.totalWeeks || 0;
      const cw = d.stats?.playedWeeks || 0;
      return {
        seasonNumber: sn,
        status: d.tarkamChampion ? 'completed' : d.preSeason ? 'pre-season' : d.hasData ? 'active' : 'upcoming',
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
          <div className="min-w-0 flex-1">
            <h1 className="text-gradient-fury text-base font-bold leading-tight truncate">Tarkam IDM</h1>
            <p className="text-[10px] text-muted-foreground">Fan Made Edition</p>
          </div>
        )}
        {/* Toggle — compact, inline with logo */}
        <button
          onClick={toggleSidebarCollapsed}
          className={`group relative p-1 rounded-lg transition-all duration-200 ${collapsed ? '' : 'shrink-0'}`}
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          <span className="relative z-10 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted/60 rounded-md transition-colors">
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <PanelLeftClose className="w-3.5 h-3.5" />
            }
          </span>
        </button>
      </div>

      {/* ═══ Season Context — Visual Anchor, right after branding ═══ */}
      {!collapsed && leagueSummary && (
        <div className={`mx-4 mt-1 mb-2 p-2.5 rounded-xl ${dt.cardPremium} border border-border/40`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className={`w-3.5 h-3.5 ${dt.text}`} />
              <span className={`text-[11px] font-bold ${dt.text} tracking-wide`}>IDM TARKAM Season {leagueSummary.seasonNumber}</span>
            </div>
            <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
              leagueSummary.status === 'active' ? 'bg-green-500/15 text-green-400' :
              leagueSummary.status === 'completed' ? 'bg-idm-gold/15 text-idm-gold' :
              'bg-muted text-muted-foreground'
            }`}>
              {leagueSummary.status === 'active' ? 'AKTIF' : leagueSummary.status === 'completed' ? 'SELESAI' : 'UPCOMING'}
            </span>
          </div>
          {/* Week progress bar */}
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${currentView === 'community' ? 'from-idm-gold-warm to-idm-amber' : division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} transition-all duration-700`}
              style={{ width: `${leagueSummary.percentage || 0}%` }}
            />
          </div>
          {/* Week dots indicator */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: leagueSummary.totalWeeks || 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < (leagueSummary.completedWeeks || 0)
                    ? division === 'male' ? 'bg-idm-male' : 'bg-idm-female'
                    : 'bg-muted'
                }`
                }
              />
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
            Week {leagueSummary.completedWeeks}/{leagueSummary.totalWeeks || '?'} • {leagueSummary.percentage}%
          </p>
        </div>
      )}

      {/* Collapsed: mini season indicator */}
      {collapsed && leagueSummary && (
        <div className="px-2 py-1 flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-lg ${dt.cardPremium} border border-border/40 flex flex-col items-center justify-center`}
            title={`IDM TARKAM Season ${leagueSummary.seasonNumber} — Week ${leagueSummary.completedWeeks}/${leagueSummary.totalWeeks}`}>
            <span className={`text-[8px] font-bold ${dt.text}`}>S{leagueSummary.seasonNumber}</span>
            <span className="text-[6px] text-muted-foreground">{leagueSummary.completedWeeks}/{leagueSummary.totalWeeks || '?'}</span>
          </div>
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
          navActive={dt.navActive}
          onClick={() => setCurrentView('landing')}
        />

        {!collapsed && (
          <div className="px-3 py-1.5">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Arena</p>
          </div>
        )}

        {collapsed && <div className="my-1 mx-auto w-6 h-px bg-border/40" />}

        {/* Community + Division Nav Items */}
        {communityNavItems.map((item) => {
          const isActive = item.division
            ? currentView === item.id && division === item.division
            : currentView === item.id;

          // Division-specific icon backgrounds and accent colors
          let iconBg = '';
          if (isActive) {
            if (item.division === 'male') iconBg = 'bg-idm-male/15';
            else if (item.division === 'female') iconBg = 'bg-idm-female/15';
            else iconBg = dt.iconBg;
          }

          return (
            <NavButton
              key={`nav-${item.label}`}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              isActive={isActive}
              iconBg={iconBg}
              activeGlow={isActive}
              division={item.division || division}
              navActive={dt.navActive}
              isCommunity={!item.division}
              onClick={() => {
                if (item.division) setDivision(item.division);
                setCurrentView(item.id);
              }}
            />
          );
        })}

        {/* ═══ Division Sub-menu — Tour Saya, Match Day, League ═══ */}
        {(['dashboard', 'mytournament', 'matchday', 'league'] as AppView[]).includes(currentView) && (
          <>
            {collapsed && <div className="my-1 mx-auto w-6 h-px bg-border/40" />}
            {!collapsed && (
              <div className="px-3 py-1.5 flex items-center gap-1.5">
                <div className={`h-px flex-1 bg-border/40`} />
                <span className={`text-[9px] font-semibold uppercase tracking-widest ${division === 'male' ? 'text-idm-male/60' : 'text-idm-female/60'}`}>
                  {division === 'male' ? '🕺 Male' : '💃 Female'}
                </span>
                <div className={`h-px flex-1 bg-border/40`} />
              </div>
            )}
            {divisionSubItems.map((item) => (
              <NavButton
                key={`sub-${item.id}`}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                isActive={currentView === item.id}
                iconBg={currentView === item.id ? (division === 'male' ? 'bg-idm-male/15' : 'bg-idm-female/15') : ''}
                activeGlow={currentView === item.id}
                division={division}
                isSubItem={!collapsed}
                navActive={dt.navActive}
                onClick={() => setCurrentView(item.id)}
              />
            ))}
          </>
        )}

        {collapsed && <div className="my-1 mx-auto w-6 h-px bg-border/40" />}

        {!collapsed && (
          <div className="px-3 py-1.5">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Lainnya</p>
          </div>
        )}

        {/* Bantuan */}
        <NavButton
          icon={HelpCircle} label="Bantuan" collapsed={collapsed}
          isActive={false}
          iconBg=""
          activeGlow={false}
          division={division}
          navActive={dt.navActive}
          onClick={() => toast.info('Hubungi admin di Discord untuk bantuan')}
        />

        {/* Notifikasi */}
        <NavButton
          icon={Bell} label="Notifikasi" collapsed={collapsed}
          isActive={false}
          iconBg=""
          activeGlow={false}
          division={division}
          navActive={dt.navActive}
          onClick={() => toast.info('Belum ada notifikasi baru')}
        />

        {/* Admin — open unified modal if not authenticated */}
        <NavButton
          icon={Shield} label="Admin" collapsed={collapsed}
          isActive={currentView === 'admin'}
          iconBg={currentView === 'admin' ? dt.iconBg : ''}
          activeGlow={currentView === 'admin'}
          division={division}
          navActive={dt.navActive}
          onClick={() => adminAuth.isAuthenticated ? setCurrentView('admin') : onOpenAdminModal()}
        />
      </nav>

      {/* ═══ Bottom Section — Unified Identity ═══ */}
      {!collapsed && (
        <>
          {/* Authenticated: Player + Admin merged into one compact row */}
          {(playerAuth.isAuthenticated || adminAuth.isAuthenticated) ? (
            <div className="mx-4 mb-3 p-2.5 rounded-xl bg-card/60 border border-border/50">
              {/* Player row */}
              {playerAuth.isAuthenticated && playerAuth.account && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${currentView === 'community' ? 'bg-idm-gold-warm/15' : division === 'male' ? 'bg-idm-male/15' : 'bg-idm-female/15'}`}>
                    <UserCircle className={`w-3.5 h-3.5 ${currentView === 'community' ? 'text-idm-gold-warm' : division === 'male' ? 'text-idm-male' : 'text-idm-female'}`} />
                  </div>
                  <span className="text-[11px] text-foreground font-medium truncate flex-1">{playerAuth.account.player.gamertag}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      onClick={onOpenAccountModal} title="Akun Saya">
                      <UserCircle className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={async () => { try { await fetch('/api/account/logout', { method: 'POST' }); } catch {} clearPlayerAuth(); toast.success('Berhasil logout'); }} title="Logout">
                      <LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              {/* Divider if both auth */}
              {playerAuth.isAuthenticated && adminAuth.isAuthenticated && (
                <div className="h-px bg-border/40 my-1.5" />
              )}
              {/* Admin row */}
              {adminAuth.isAuthenticated && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-idm-gold/15">
                    <Shield className="w-3.5 h-3.5 text-idm-gold" />
                  </div>
                  <span className="text-[11px] text-foreground font-medium truncate flex-1">{adminAuth.admin?.username}</span>
                  {adminAuth.admin && (
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-idm-gold/15 text-idm-gold uppercase tracking-wider shrink-0">
                      {adminAuth.admin.role === 'super_admin' ? 'SA' : 'ADM'}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-idm-gold hover:bg-idm-gold/10"
                      onClick={() => setCurrentView('admin')} title="Admin Panel">
                      <KeyRound className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={handleLogout} title="Logout">
                      <LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in — compact login prompt */
            <div className="mx-4 mb-3">
              <button
                onClick={onOpenAccountModal}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/40">
                  <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">Masuk Akun</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Collapsed: mini identity indicator */}
      {collapsed && (
        <div className="px-2 pb-2 flex flex-col items-center gap-1">
          {adminAuth.isAuthenticated && (
            <div className="w-8 h-8 rounded-lg bg-idm-gold/10 border border-idm-gold/20 flex items-center justify-center"
              title={`${adminAuth.admin?.username} (${adminAuth.admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'})`}>
              <Shield className="w-3.5 h-3.5 text-idm-gold" />
            </div>
          )}
          {playerAuth.isAuthenticated && !adminAuth.isAuthenticated && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentView === 'community' ? 'bg-idm-gold-warm/10 border border-idm-gold-warm/20' : division === 'male' ? 'bg-idm-male/10 border border-idm-male/20' : 'bg-idm-female/10 border border-idm-female/20'}`}
              title={playerAuth.account?.player.gamertag}>
              <UserCircle className={`w-3.5 h-3.5 ${currentView === 'community' ? 'text-idm-gold-warm' : division === 'male' ? 'text-idm-male' : 'text-idm-female'}`} />
            </div>
          )}
          {!playerAuth.isAuthenticated && !adminAuth.isAuthenticated && (
            <button
              onClick={onOpenAccountModal}
              className="w-8 h-8 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Masuk Akun"
            >
              <UserCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

/* ─── Nav Button — shared between collapsed & expanded ─── */
function NavButton({ icon: Icon, label, collapsed, isActive, iconBg, activeGlow, division, isSubItem, navActive, isCommunity, onClick }: {
  icon: typeof Home; label: string; collapsed: boolean;
  isActive: boolean; iconBg: string; activeGlow: boolean; division: string;
  isSubItem?: boolean; navActive: string; isCommunity?: boolean;
  onClick: () => void;
}) {
  // Resolve accent color: community=gold, male=cyan, female=purple
  const accentBar = isCommunity ? 'bg-idm-gold-warm' : division === 'male' ? 'bg-idm-male' : 'bg-idm-female';
  const accentBorder = isCommunity ? 'border-l-idm-gold-warm' : division === 'male' ? 'border-l-idm-male' : 'border-l-idm-female';
  const accentDot = accentBar;

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        title={label}
        className={`w-full flex items-center justify-center py-2.5 rounded-lg transition-all duration-200 relative ${
          isActive
            ? navActive
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`}
      >
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        {isActive && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${accentBar}`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-sm font-medium transition-all duration-200 rounded-lg ${
        isSubItem ? 'pl-10' : ''
      } ${
        isActive
          ? `${navActive} border-l-2 ${accentBorder}`
          : isSubItem
            ? 'text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      <div className={`flex items-center justify-center ${isSubItem ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg ${iconBg} shrink-0`}>
        <Icon className={`${isSubItem ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      </div>
      <span className={`py-2.5 ${isSubItem ? 'text-xs' : ''}`}>{label}</span>
      {isActive && (
        <div className={`ml-auto w-1.5 h-1.5 rounded-full ${accentDot}`} />
      )}
    </button>
  );
}

export function AppShell() {
  const { currentView, donationPopup, hideDonationPopup, division, setDivision, adminAuth, setAdminAuth, setCurrentView, playerAuth, setPlayerAuth } = useAppStore();
  const dt = useShellTheme();
  const { hapticTap } = useHaptic();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { canInstall: _canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('pwa-install-dismissed');
  });
  const canInstall = _canInstall && !dismissed;
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalDefaultTab, setAccountModalDefaultTab] = useState<'peserta' | 'admin'>('peserta');

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
      case 'community': return <CommunityDashboard />;
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
          <span className="text-gradient-fury text-sm font-bold">Tarkam IDM</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={() => toast.info('Belum ada notifikasi baru')}
            title="Notifikasi"
          >
            <Bell className="w-4.5 h-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 ${playerAuth.isAuthenticated ? (currentView === 'community' ? 'text-idm-gold-warm' : division === 'male' ? 'text-idm-male' : 'text-idm-female') : adminAuth.isAuthenticated ? 'text-idm-gold-warm' : 'text-muted-foreground'}`}
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
          <p className="text-[11px] flex-1">Install Tarkam IDM di HP-mu untuk akses cepat!</p>
          <button
            onClick={() => { promptInstall(); }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black shrink-0"
          >
            Install
          </button>
          <button
            onClick={() => { setDismissed(true); localStorage.setItem('pwa-install-dismissed', '1'); }}
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
          {(() => {
            const contentClass = `pt-6 px-3 pb-28 sm:pt-6 sm:px-4 sm:pb-28 lg:p-8 lg:pb-8 ${currentView === 'admin' ? 'max-w-[2200px]' : currentView === 'dashboard' || currentView === 'mytournament' || currentView === 'community' ? '' : 'max-w-[1600px]'} mx-auto`;
            const content = <div key={currentView} className={contentClass}>{renderView()}</div>;
            return isMobile
              ? <PullToRefresh onRefresh={async () => { queryClient.invalidateQueries(); }}>{content}</PullToRefresh>
              : content;
          })()}
        </main>
      </div>

      {/* ═══ Mobile Bottom Nav — 4 items: Home, Komunitas, Male, Female ═══ */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${dt.glassStrong} border-t border-border safe-area-bottom`}>
        {/* Division sub-nav — appears when in division view */}
        {(['dashboard', 'mytournament', 'matchday', 'league'] as AppView[]).includes(currentView) && (
          <div className="flex items-center justify-around px-2 py-1 border-b border-border/40">
            {divisionSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={`mobile-sub-${item.id}`}
                  onClick={() => { hapticTap(); setCurrentView(item.id); }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium transition-colors duration-200 ${
                    isActive
                      ? `${division === 'male' ? 'bg-idm-male/10 text-idm-male' : 'bg-idm-female/10 text-idm-female'}`
                      : 'text-muted-foreground/60 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
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
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-idm-gold-warm" />
            )}
          </button>

          {/* Community + Division Nav Items */}
          {communityNavItems.map((navItem) => {
            const Icon = navItem.icon;
            const isActive = navItem.division
              ? currentView === navItem.id && division === navItem.division
              : currentView === navItem.id;
            // Division-specific active color
            const activeColor = navItem.division === 'male'
              ? 'text-idm-male'
              : navItem.division === 'female'
                ? 'text-idm-female'
                : dt.text;
            const activeBarColor = navItem.division === 'male'
              ? 'bg-idm-male'
              : navItem.division === 'female'
                ? 'bg-idm-female'
                : 'bg-idm-gold-warm';
            return (
              <button
                key={`mobile-nav-${navItem.label}`}
                onClick={() => {
                  hapticTap();
                  if (navItem.division) setDivision(navItem.division);
                  setCurrentView(navItem.id);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-h-[44px] rounded-lg transition-colors duration-200 relative ${
                  isActive ? activeColor : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">{navItem.label}</span>
                {isActive && (
                  <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${activeBarColor}`} />
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

      {/* Footer — desktop only, sits at bottom of flex column */}
      <footer className="shrink-0 py-3 text-center text-[11px] text-muted-foreground/60 border-t border-border/40 hidden lg:block">
        <span className="text-gradient-fury font-semibold">Tarkam IDM</span> — Fan Made Edition © 2026
      </footer>
    </div>
  );
}
