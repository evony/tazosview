---
Task ID: 2
Agent: Main Agent
Task: Tie marketplace seller identity to player gamertag account (verified sellers)

Work Log:
- Added `playerId` field to MarketplaceItem schema (FK → Player, nullable for admin-created)
- Added `marketplaceItems` relation to Player model
- Updated POST /api/marketplace/submit — now requires player login via `requirePlayer()`, auto-fills sellerName from gamertag and sellerAvatar from player avatar
- Rate limiting changed from per-sellerName to per-playerId (max 5/day)
- Updated SubmitMarketplaceModal — shows "Login Diperlukan" if not logged in, auto-fills WhatsApp from player phone, shows verified seller badge with gamertag + tier
- Updated CommunityMarketplace card — shows green ShieldCheck badge for verified sellers (items with playerId)
- Updated CMS MarketplaceManager — shows ✓ indicator for verified sellers
- Pushed schema changes and regenerated Prisma Client
- Lint passes cleanly

Stage Summary:
- Marketplace submissions now require player login (gamertag account)
- Seller name auto-fills from gamertag — no impersonation possible
- Verified sellers get green shield badge in marketplace cards
- Admin-created items have playerId=null (shown without verified badge)
- Buyer trust increased — can verify seller identity through their gamertag account

---
Task ID: 5
Agent: Main Agent
Task: Refactor season-champion-section.tsx — "Bintang Minggu Ini" when no champion, Champion when exists

Work Log:
- Added `WeeklyPerformer` and `TrendingUp` to imports from `@/types/stats` and `lucide-react`
- Removed unused `Medal` import (was never used in the component)
- Created `BintangMingguIniDuo` component — full duo display (Male left, Female right) with fire/orange accent theme replacing the empty state when no champion exists
  - Male accent: #eab308 (yellow), Female accent: #f97316 (orange)
  - Uses Flame icon instead of Crown for badge and center divider ornament
  - Shows avatar, gamertag, weeklyPointsGained, streak, and compositeScore for each performer
  - Includes subtitle: "Performa terbaik minggu berjalan — menuju Season Champion"
  - Includes SeasonProgressBar below the duo display
- Created `BintangMingguIniMini` component — compact row showing current week's top performers below the champion card when champion exists
  - Only renders if weekly performer data is available
  - Shows mini avatar, gamertag, +weeklyPointsGained pts, and streak
  - Uses fire accent colors matching the Bintang theme
- Created `SeasonProgressBar` component — horizontal progress bar with week markers
  - Shows "Week X / 10" label with percentage
  - Gradient fill from yellow (#eab308) to orange (#f97316)
  - Individual week marker dots with completed/active/pending states
  - Subtle shimmer animation on the filled portion
- Updated `DuoChampionCard` to accept `maleWeeklyPerformer`, `femaleWeeklyPerformer`, and `seasonProgress` props
  - When no champion: renders `BintangMingguIniDuo` instead of the old empty state
  - When champion exists: shows gold champion display + `BintangMingguIniMini` + `SeasonProgressBar` below
  - All existing champion display logic kept intact
- Updated `SeasonChampionSection` with dynamic subtitle and section header
  - No champion: icon=Flame, label="BINTANG MINGGU INI", subtitle="Belum ada juara musim ini — Bintang Minggu Ini: performa terbaik minggu berjalan"
  - Has champion: icon=Crown, label="SEASON CHAMPION", subtitle="Juara season Tarkam IDM — pemain peringkat #1 saat season ditutup"
- Extracted weekly performers from `maleData.weeklyTopPerformers[0]` and `femaleData.weeklyTopPerformers[0]`
- Passes `seasonProgress` from `maleData.seasonProgress` to sub-components
- Lint passes cleanly, no compilation errors in dev.log

Stage Summary:
- Empty state replaced with dynamic "Bintang Minggu Ini" duo display (fire/orange theme)
- Champion state enhanced with mini Bintang section and season progress bar below
- Section header dynamically switches between Flame/Bintang and Crown/Champion based on state
- Season progress bar shows week progression with visual week markers
- All existing champion display logic preserved unchanged

---
Task ID: 3+4
Agent: Main Agent
Task: Refactor highlights-section.tsx to 5 tabs with new order and add "Performa Terbaik" tab

Work Log:
- Updated file header comment from 4 to 5 categories with new order (rank1, performance, rank1-club, mvp, streak)
- Added `WeeklyPerformer` to type imports from `@/types/stats`
- Updated `DuoPlayer` interface: added optional `weeklyPointsGained?: number` field
- Updated `HighlightItem` interface:
  - Added `'performance'` to the type union: `type: 'rank1' | 'performance' | 'rank1-club' | 'streak' | 'mvp'`
  - Added optional `weekNumber?: number` field (for performance tab week display)
  - Added optional `weeklyPointsGained?: number` field (for performance stats display)
- Added "Performa Terbaik" item in `buildHighlights` function as item #2 (between rank1 and rank1-club):
  - Data sourced from `maleData.weeklyTopPerformers[0]` and `femaleData.weeklyTopPerformers[0]`
  - Accent colors: maleAccent='#eab308' (yellow/gold), femaleAccent='#f97316' (orange)
  - accentColor: '#eab308', accentLight: '#facc15'
  - badge: 'BINTANG MINGGU INI', thumbLabel: 'Performa'
  - subtitle: 'Performa Terbaik Minggu Ini'
  - Description includes weekly points gained, tier, and composite score
  - Metadata: Composite Score, Weekly Pts ♂/♀, Streak ♂/♀
  - isDuo: true, weekNumber from performers
- Reordered highlights: rank1 → performance → rank1-club → mvp → streak (streak moved from #3 to #5, mvp from #4 to #4)
- Updated `getBadgeIcon` function: added 'performance' case returning `<TrendingUp>` icon
- Updated `getWatermarkText` function: added 'performance' case returning 'BINTANG'
- Updated `DuoAvatarHalf` empty state: added 'performance' case with `<TrendingUp>` icon
- Updated `DuoAvatarHalf` bottom info: for performance type, shows `{points}pts (+{weeklyPointsGained}W)` format
- Updated `ThumbnailCard`: added star/sparkle overlay for performance type thumbnails (Star icon with yellow glow)
- Updated featured card left badge overlay: added performance type with TrendingUp icon and 'PERFORMA TERBAIK' label
- Updated featured card bottom info bar icon: added performance case with TrendingUp icon
- Updated detail panel empty state: added performance case with TrendingUp icon
- Updated detail panel duo stats: added "Weekly Pts" row for performance type (both male and female columns)
- Lint passes cleanly, no compilation errors in dev.log

Stage Summary:
- Highlights section now has 5 tabs in order: #1 Tarkam, Performa Terbaik, Klub Terkuat, MVP Terbaru, Streak Terpanjang
- "Performa Terbaik" tab displays weekly top performers from both divisions using WeeklyPerformer data
- Performance tab uses yellow/gold (#eab308) and orange (#f97316) accent colors with "BINTANG MINGGU INI" badge
- All existing functionality preserved (3D tilt, auto-rotation, touch/swipe, shimmer, etc.)
- Consistent styling with other tabs maintained throughout
---
Task ID: 1+2+2b
Agent: Main Agent
Task: Backend — Add WeeklyPerformer type, API computation for "Bintang Minggu Ini" composite score with tier tie-break

Work Log:
- Added `WeeklyPerformer` interface to `src/types/stats.ts` with fields: id, gamertag, avatar, tier, points, weeklyPointsGained, weeklyWins, weeklyMatches, weeklyWinRate, streak, compositeScore, division, weekNumber, club
- Added `weeklyTopPerformers: WeeklyPerformer[]` field to `StatsData` interface
- Updated `/api/stats/route.ts` to compute weekly top performers:
  - Finds latest tournament for the active season
  - Queries PlayerPoint grouped by playerId for that tournament (points gained this week)
  - Queries Participation for that tournament (wins, MVP)
  - Merges with player data from topPlayers map
  - Calculates composite score: Points gained (40%) + Win rate (25%) + Streak (15%) + Winner bonus (10%) + Tier underdog bonus (10%)
  - Tier tie-break: B=1 (wins tie), A=2, S=3 (loses tie) — lower tier wins on equal composite score
  - Returns top 5 performers per division
- Added `weeklyTopPerformers: []` to empty data response when no season exists
- Lint passes cleanly

Stage Summary:
- New WeeklyPerformer type available across the app
- /api/stats now returns weeklyTopPerformers per division with composite scores
- Tier tie-breaker implemented: lower tier wins when scores are equal (B > A > S)
- Composite score formula: 40% points + 25% win rate + 15% streak + 10% winner bonus + 10% underdog bonus
