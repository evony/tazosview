---
Task ID: 1
Agent: Main Agent
Task: Replace all Liga data and Liga season usage with Tarkam data and Tarkam season, except Liga navigation menu

Work Log:
- Audited all files referencing `ligaChampion` and Liga-specific data across the codebase
- Modified `/api/league/route.ts` to compute club points from Tarkam mode (sum of member player.points) instead of Liga mode (from seasonEntries match results)
- Added `tarkamChampion` field (top club by Tarkam points) and `tarkamPlayerChampion` field to API response
- Added `malePoints`, `femalePoints`, `maleMemberCount`, `femaleMemberCount` to each club in API response
- Replaced all `ligaChampion` references with `tarkamChampion` in: marquee-ticker.tsx, experiences-section.tsx, clubs-section.tsx, landing-page.tsx, app-shell.tsx, league-view.tsx, dream-section.tsx
- Updated `club-power-rankings.tsx` with new Tarkam-based power score formula: Total Tarkam Points + Balance Bonus + (Members × 5)
- Updated display in club-power-rankings from W/L/GD to Male Points / Female Points breakdown
- Updated clubs-section.tsx with new Tarkam fields (maleMemberCount, femaleMemberCount) and added Tarkam points display on club cards
- Updated community-dashboard/index.tsx with new leagueData type including tarkamChampion and Tarkam club fields
- Updated league-view.tsx champion labels from "Liga IDM" to "Tarkam IDM"
- Fixed ESLint error (missing Trophy import in clubs-section.tsx)
- Verified API response returns correct Tarkam data structure

Stage Summary:
- All Liga data has been replaced with Tarkam data across the entire codebase
- Liga navigation menu remains unchanged (still accessible via "League" sub-menu in sidebar)
- Club rankings now use Tarkam points (sum of member player.points) instead of Liga match results
- Champion is now determined by Tarkam ranking (#1 club by total member points) instead of Season.championClubId
- API `/api/league` now returns `tarkamChampion` instead of `ligaChampion`
- All 12 files updated, ESLint passes, dev server running successfully

---
Task ID: 2
Agent: Main Agent
Task: Fix auto-close season logic to use championPlayerId for Tarkam seasons

Work Log:
- Read `/api/tournaments/[id]/finalize/route.ts` — found auto-close season always sets `championClubId` regardless of season type
- Read `prisma/schema.prisma` — confirmed Season has both `championClubId` (Liga) and `championPlayerId` (Tarkam) fields
- Read Player model — confirmed `points`, `totalWins`, `division`, `isActive` fields exist for Tarkam champion lookup
- Modified finalize route auto-close logic to branch on `season.division`:
  - `division === 'liga'` → sets `championClubId` (top Club by points, gameDiff)
  - `division !== 'liga'` (Tarkam male/female) → sets `championPlayerId` (top Player by points, totalWins in that division)
- Verified ESLint passes with no errors
- Verified dev server running normally

Stage Summary:
- Auto-close season now correctly differentiates Liga vs Tarkam season types
- Liga seasons auto-close with `championClubId` (top club)
- Tarkam seasons auto-close with `championPlayerId` (top player by points in that division)
- This fix is non-breaking — wrapped in try/catch as before, admin can still manually override via Season Panel

---
Task ID: 3
Agent: Main Agent
Task: Replace "IDM League Season 1" display with "IDM TARKAM Season x" in admin panel dashboard and other Tarkam views

Work Log:
- Added `formatTarkamSeasonName()` utility function to `src/lib/utils.ts` — transforms "IDM League Season 1 - Male" → "IDM TARKAM Season 1"
- Updated `admin-panel.tsx` Season Info Indicator to use `formatTarkamSeasonName(stats.season.name, stats.season.number)` instead of raw `stats.season.name`
- Updated `dashboard/dashboard.tsx` season name badge to use `formatTarkamSeasonName(data.season.name, data.season.number)`
- Updated `community-dashboard/season-comparison.tsx` to use shared `formatTarkamSeasonName` instead of its own inline `formatSeasonName`
- Kept `league-view.tsx` unchanged — it's for Liga seasons (division='liga'), so raw name stays as-is
- Kept `admin-season-panel.tsx` unchanged — it manages season CRUD, admin needs to see actual database names
- Verified ESLint passes with no errors
- Verified dev server running normally

Stage Summary:
- Admin panel dashboard now shows "IDM TARKAM Season x" instead of "IDM League Season 1 - Male"
- Player dashboard also shows "IDM TARKAM Season x"
- Season comparison uses shared formatter function
- Liga views (league-view.tsx, admin-season-panel.tsx) keep raw season names as those are Liga-specific
- Centralized formatter in utils.ts for consistent display across all Tarkam views

---
Task ID: 4
Agent: Main Agent
Task: Redesign sidebar UX — move Season context to top as visual anchor, merge Account+Admin into compact bottom element

Work Log:
- Read `app-shell.tsx` DesktopSidebar component — identified 3 separate bottom cards (Player Account, Admin Status, Season Progress) creating visual clutter
- Moved Season context UP — right after Logo+Toggle, before navigation
  - Expanded: Full season card with "IDM TARKAM Season X" title, AKTIF/SELESAI status badge, gradient progress bar, week dot indicators, centered summary text
  - Collapsed: Mini S{n} / {completed}/{total} indicator
- Merged Player Account + Admin into one compact card at bottom
  - Single card with two rows (player + admin) separated by subtle divider
  - Player row: avatar icon + gamertag + account/logout buttons
  - Admin row: shield icon + username + SA/ADM badge + admin panel/logout buttons
  - Not logged in: single compact "Masuk Akun" button with avatar icon
- Collapsed sidebar: smart identity indicator (admin shield, player avatar, or login button)
- Moved toggle button inline with logo (removed separate toggle row)
- Added Calendar icon import for season context
- Added formatTarkamSeasonName import from utils
- Verified ESLint passes with no errors
- Verified dev server running normally

Stage Summary:
- Sidebar now follows F-pattern: Context (Season) → Navigation → Identity (Account+Admin)
- Season progress is the visual anchor — first thing seen after branding
- Account + Admin merged from 2-3 separate cards into 1 compact card
- Reduced visual clutter from 3 bottom elements to 1 compact element + 1 prominent top element
- Collapsed sidebar also improved with mini season indicator and smart identity icons

---
Task ID: 5
Agent: Main Agent
Task: Filter /api/league route to only return Tarkam seasons

Work Log:
- Read `/api/league/route.ts` — found season query at line ~22-23 with no division filter, fetching ALL seasons including Liga
- Updated comment from `// Get all seasons (active + completed)` to `// Get all Tarkam seasons (active + completed) — exclude Liga seasons`
- Added `division: { in: ['male', 'female'] }` filter to the `db.season.findMany` where clause to exclude Liga seasons (division: 'liga')
- No other logic changed — the rest of the route already calculates Tarkam points correctly
- Verified ESLint passes with no errors

Stage Summary:
- `/api/league` now only fetches Tarkam seasons (division: 'male' or 'female'), excluding Liga seasons
- This prevents Liga season data from being mixed into Tarkam-specific views
- Minimal change — only the season query filter was updated, all downstream logic unchanged

---
Task ID: 1 (current session)
Agent: Main Agent
Task: Merge Champions + MVP sections into a single "Hall of Fame" section

Work Log:
- Read existing `champions-section.tsx` and `mvp-section.tsx` to understand card logic and section structure
- Created `/home/z/my-project/src/components/idm/landing/hall-of-fame-section.tsx` combining both sections:
  - Copied `CompactChampionCard` and `CompactMVPCard` components directly into the new file (as specified)
  - Added tab interface with "Champion" | "MVP" tabs using `useState`
  - Styled tab bar with gold accents (border-idm-gold-warm/20, bg-idm-gold-warm/15 for active)
  - Added `AnimatePresence` + `motion.div` from framer-motion for smooth tab transitions
  - Used `layoutId="hof-tab-indicator"` for animated tab underline indicator
  - Section ID set to `hall-of-fame` for navigation scroll
  - Section label: "Hall of Fame" with Crown icon
  - Section title: "Hall of Fame"
  - Section subtitle: "Juara season dan pemain terbaik Tarkam IDM"
  - Background: same as original champions section (bg-[#0a0a14] with gold grid overlay and radial glows)
  - Both male/female cards side by side in grid (same as current)
  - All existing card logic preserved (player click handlers, empty states, etc.)
- Updated `landing-page.tsx`:
  - Replaced `ChampionsSection` and `MvpSection` imports with single `HallOfFameSection`
  - Replaced two separate section blocks with one `HallOfFameSection` (removed one `SectionDivider` since sections merged)
  - Updated desktop nav: merged 'champions' + 'mvp' into single 'hall-of-fame' item (label: "Hall of Fame", mdLabel: "HOF")
  - Updated mobile bottom nav: merged 'champions' + 'mvp' into single 'hall-of-fame' item (label: "HOF", icon: Crown, special: true)
  - Simplified `isActive` logic in mobile nav (removed complex cross-section check)
  - Updated section observer IDs: ['kompetisi', 'highlights', 'experiences', 'hall-of-fame', 'clubs', 'how-it-works']
  - Removed unused `Sparkles` and `Play` imports from lucide-react
- ESLint passes with no errors
- Dev server compiles and runs successfully

Stage Summary:
- Champions + MVP sections merged into single "Hall of Fame" section with tab interface
- Reduces visual fatigue from two nearly identical sections
- Navigation updated across desktop nav, mobile bottom nav, and section observer
- All card logic, click handlers, empty states preserved exactly as-is
- One `SectionDivider` removed (was between Champions and MVP)
---
Task ID: 1
Agent: Main Agent
Task: Merge Champions + MVP sections into single Hall of Fame section with tabs, reorder landing page, filter API for Tarkam seasons, replace remaining Liga text

Work Log:
- Created `/home/z/my-project/src/components/idm/landing/hall-of-fame-section.tsx` — merged CompactChampionCard + CompactMVPCard into one section with Champion|MVP tabs
- Updated `/home/z/my-project/src/components/idm/landing-page.tsx` — replaced ChampionsSection + MvpSection with HallOfFameSection, reordered sections (Hall of Fame before Experiences), updated desktop+mobile nav, updated section observer IDs
- Updated `/home/z/my-project/src/app/api/league/route.ts` — added `division: { in: ['male', 'female'] }` filter to season query to exclude Liga seasons
- Updated `/home/z/my-project/src/components/idm/gallery-section.tsx` — replaced "IDM League Arena" → "IDM Tarkam Arena", "Juara League!" → "Juara Tarkam!", "IDM League" → "IDM Tarkam" in all display text
- Updated `/home/z/my-project/src/components/idm/landing/experiences-section.tsx` — updated comment from "LIGA IDM" to "TARKAM IDM"
- Updated `/home/z/my-project/src/components/idm/match-day-center.tsx` — changed "Hasil League" → "Hasil Tarkam"
- ESLint passes cleanly, dev server running without errors

Stage Summary:
- Champions + MVP merged into Hall of Fame section with tab interface (AnimatePresence transitions, gold-styled tab bar)
- Landing page section order now: Hero → Kompetisi → Highlights → Hall of Fame → Experiences → Clubs → How It Works → CTA
- /api/league now only returns Tarkam seasons (division: male/female), excluding Liga seasons
- All display-facing "League/Liga" text replaced with "Tarkam" across gallery, experiences, match-day-center
- Liga navigation menu in app-shell.tsx kept as-is (per user requirement)
- Admin components kept as-is (need Liga references for admin purposes)

---
Task ID: 2
Agent: Main Agent
Task: Restructure landing page from 3 sections (Highlights + HallOfFame + MVP) to 2 sections (Puncak Prestasi with MVP + Season Champion dedicated section)

Work Log:
- Modified `highlights-section.tsx` (Puncak Prestasi):
  - Removed all season champion items (juara-season-male, juara-season-female, juara-empty) from `buildHighlights()`
  - Added MVP items (mvp-male, mvp-female) using `mvpHallOfFame` data from StatsData
  - Updated `HighlightItem` type to replace juara types with MVP types, added `mvpWeek` and `mvpCount` fields
  - Updated helper functions: `getBadgeIcon()` now shows Award icon for MVP, `getWatermarkText()` returns 'MVP' for MVP types
  - Updated `ThumbnailCard` to render Award icon for MVP types instead of Crown/Trophy for juara types
  - Updated featured card overlays: replaced juara trophy overlay with MVP Award overlay
  - Updated subtitle: "Peringkat #1 tarkam, streak terpanjang, dan MVP terbaru di Tarkam IDM"
  - Added `Award` import from lucide-react
  - MVP accent colors: Male = green (#22c55e), Female = pink (#ec4899)
- Created new `season-champion-section.tsx` component:
  - Dedicated section showing ONLY completed season champions (NOT weekly champions)
  - Uses `allSeasons.filter(s => s.status === 'completed' && s.championPlayer)` to get season champions
  - Male/Female champion cards side-by-side with gold accent styling
  - Most recent season champion shown as full-bleed avatar card
  - Previous season champions shown as compact list items below
  - Section only renders if there are completed seasons with champion data
  - Section ID: `season-champion`, label: "Season Champion", subtitle: "Juara season Tarkam IDM — pemain peringkat #1 saat season ditutup"
  - Clickable cards open player profile via `setSelectedPlayer`
- Updated `landing-page.tsx`:
  - Replaced `HallOfFameSection` import with `SeasonChampionSection` import
  - Replaced HallOfFameSection usage with SeasonChampionSection (removed cmsSections prop, not needed)
  - Updated section observer IDs: replaced 'hall-of-fame' with 'season-champion'
  - Updated desktop nav: replaced 'Hall of Fame' with 'Champion'
  - Updated mobile bottom nav: replaced 'HOF' with 'Champion' (still Crown icon, still special:true)
- ESLint passes with no errors
- Dev server compiles and runs successfully

Stage Summary:
- Landing page now has exactly 2 focused sections instead of 3 redundant ones:
  1. Puncak Prestasi — #1 players, #1 club, streak leaders, MVP terbaru (male + female)
  2. Season Champion — only completed season champions (male + female), only shows when data exists
- MVP data comes from mvpHallOfFame (weekly MVP data), showing latest per division
- Season Champion data comes from allSeasons with championPlayer (set during season auto-close)
- Weekly champions NO LONGER shown on landing page (were shown in old HallOfFame Champion tab)
- Navigation updated across desktop and mobile navs

---
Task ID: 3
Agent: Main Agent
Task: Fix SeasonChampionSection disappearing from landing page when no completed seasons exist

Work Log:
- Diagnosed root cause: SeasonChampionSection returned `null` when no completed seasons had championPlayer data (`if (!hasAnyChampion && !isDataLoading) return null;`)
- Also ChampionCard returned `null` when `champions.length === 0`, meaning both cards disappeared even if the section rendered during loading
- Created `EmptyChampionCard` component that shows an attractive placeholder state:
  - Division header (Male/Female) with accent color and "Berlangsung" badge instead of season number badge
  - Crown icon with float animation
  - "Belum Ada Champion" text with explanation "Juara {division} akan dinobatkan setelah season berakhir"
  - Decorative trophy line at bottom
- Modified `ChampionCard` to render `EmptyChampionCard` when `champions.length === 0` instead of returning `null`
- Removed the `if (!hasAnyChampion && !isDataLoading) return null;` guard from `SeasonChampionSection` — section now ALWAYS renders
- Both male and female cards always show (either with champion data or empty state)
- Navigation links (#season-champion) now always work instead of pointing to a missing section
- ESLint passes, dev server running without errors

Stage Summary:
- SeasonChampionSection now always renders on the landing page
- Shows attractive empty state ("Belum Ada Champion") when no seasons are completed yet
- Shows champion data when seasons are completed with championPlayer
- Navigation (#season-champion) no longer breaks when there are no completed seasons
- No other sections or navigation were changed

---
Task ID: 4
Agent: Main Agent
Task: Fix MVP not showing in Puncak Prestasi section — add fallback when mvpHallOfFame is empty

Work Log:
- Diagnosed root cause: `buildHighlights()` only reads MVP from `mvpHallOfFame` which is empty when no tournaments are completed yet
- MVP data exists on players (male: 3 players with totalMvp>0, female: 5 players with totalMvp>0) but was not being used
- Added fallback logic to both male and female MVP sections in `highlights-section.tsx`:
  - Primary: use latest MVP from `mvpHallOfFame` (when tournaments are completed)
  - Fallback: use player with highest `totalMvp` from `topPlayers` (when no completed tournaments yet)
- Fallback displays differently:
  - Subtitle: "MVP Terbanyak" instead of "MVP Terbaru"
  - Badge: "{totalMvp}x MVP" instead of "MVP W{weekNumber}"
  - Description: focuses on total MVP count and points instead of weekly achievement
  - mvpWeek: undefined for fallback (no week number available)
- Both primary and fallback use the same visual card style with Award icon
- ESLint passes, dev server running without errors
- Verified: 3 MVP players in male division, 5 in female division — MVP items will now appear

Stage Summary:
- MVP now shows in Puncak Prestasi even when no tournaments are completed yet
- Uses `topPlayers` sorted by `totalMvp` as fallback data source
- When tournaments ARE completed, still uses the more specific `mvpHallOfFame` data with week numbers
- Two display modes: "MVP Terbaru" (with week) and "MVP Terbanyak" (total count only)

---
Task ID: 5
Agent: Main Agent + Sub-agent
Task: Add auto-rotation, progress dots, and swipe support to highlights section

Work Log:
- Implemented auto-rotation with 5-second interval using setTimeout-based approach
- Auto-rotation pauses when user hovers over the section (mouseEnter → 'paused')
- Auto-rotation resumes after 3-second grace period when mouse leaves (mouseLeave → 'resuming' → 'running')
- Manual thumbnail click or swipe also triggers pause + delayed resume
- Auto-rotation only runs when there are 2+ highlights
- Added progress dots indicator below thumbnail strip
  - Active dot: w-2.5 h-2.5, filled with item's accentColor, with glow effect
  - Inactive dots: w-1.5 h-1.5, muted color, hover effect to grow larger
  - All dots are clickable (same as clicking a thumbnail)
  - Smooth transitions on size/color changes
- Added touch/swipe support on the featured card for mobile
  - Swipe left → next highlight (wraps around)
  - Swipe right → previous highlight (wraps around)
  - Minimum 50px horizontal distance to trigger, ignores vertical swipes
- Fixed TypeScript error: type alias inside component function body → inlined union type
- ESLint passes, dev server running without errors

Stage Summary:
- Highlights section now auto-rotates every 5 seconds with smart pause/resume
- Progress dots give visual feedback on current position and total items
- Mobile users can swipe the featured card to navigate between highlights
- All existing functionality preserved — only additive changes

---
Task ID: 6
Agent: Main Agent
Task: Transform "Match Day Center" into "Arena Live" — replace Prediksi tab with Bracket tab, replace H2H tab with Antrian tab

Work Log:
- Read `/home/z/my-project/worklog.md` for context
- Read full `match-day-center.tsx` (1162 lines) to understand structure
- Removed `PredictionState` interface (was lines 31-36)
- Removed `PredictionBar` function component (was lines 60-157)
- Removed `H2HStatRow` function component (was lines 160-182)
- Removed `predictions` state, `predictionsLoaded` state, localStorage load/save effects, `handleVote` callback, prediction initialization effect from MatchDayCenter
- Removed `predState` variable (was `predictions.get(selectedMatch.id)`)
- Removed `team1Stats` and `team2Stats` computed variables (were for H2H tab)
- Changed `<Tabs defaultValue="prediction">` → `<Tabs defaultValue="bracket">`
- Changed tab definitions from `[Prediksi/ThumbsUp, H2H/Users, Lini Masa/Activity, Hasil/Trophy]` → `[Bracket/Trophy, Antrian/Radio, Lini Masa/Activity, Hasil/Trophy]`
- Replaced entire `<TabsContent value="prediction">` block with new `<TabsContent value="bracket">` containing:
  - "Bracket Turnamen" SectionCard with round-grouped tournament bracket visualization (final/semifinal/quarterfinal labels, live/completed/upcoming styling, winner indicators with Trophy icon, MVP Crown)
  - "Posisi Saya" SectionCard with login-required placeholder
- Replaced entire `<TabsContent value="h2h">` block with new `<TabsContent value="queue">` containing:
  - "Antrian Pertandingan" SectionCard with live/upcoming/completed match queue (red pulse for live, amber for upcoming, green for completed, MVP badges)
  - "Status Turnamen" SectionCard with 3-column grid summary (Live/Menunggu/Selesai counts)
- Cleaned up imports: removed `Vote, BarChart3, Eye, MessageSquare, ThumbsUp, Users, TrendingUp, ChevronRight, ArrowRight, Circle, XCircle`
- Kept imports used in new code: `Trophy, Crown, Radio, Clock, Flame, Zap, Star, Activity, CheckCircle2, Timer`
- Also removed unused imports: `Button, Progress` (no longer referenced after removing prediction/h2h code)
- Changed `useCallback` import removed (was only for handleVote), `useEffect` import removed (was only for prediction persistence)
- ESLint passes with no errors
- Dev server compiles and runs successfully

Stage Summary:
- "Match Day Center" transformed into "Arena Live" with Bracket + Antrian tabs replacing Prediksi + H2H
- Component simplified from ~1162 lines to ~750 lines by removing prediction state management, H2H stats computation, and their UI components
- Bracket tab shows tournament bracket grouped by round with live/completed styling
- Antrian tab shows match queue in priority order (live → upcoming → completed) with tournament status summary
- Timeline and Results tabs preserved exactly as-is
- Hero banner preserved as-is
- No broken references — all removed code and its dependents fully cleaned up

---
Task ID: 2 (current session)
Agent: Main Agent
Task: Transform League View into Peraturan (Rules & Format) page

Work Log:
- Read `/home/z/my-project/worklog.md` for context on previous changes
- Read full `league-view.tsx` (~1100+ lines) — contained LeagueData/LeagueClub/LeagueMatchData/PlayoffData interfaces, useQuery fetching from /api/league, standings/schedule/stats/playoff tabs, pre-season state, no-season state, champion card, club roster expansion
- Completely replaced file content with new Peraturan (Rules & Format) view
- Removed all league-related code: interfaces (LeagueData, LeagueClub, LeagueMatchData, PlayoffData, ClubMember), useQuery hook, /api/league fetch, standings tab, schedule tab, stats tab, playoff tab, pre-season state, no-season state, tarkamChampion card, ClubProfile modal
- New file is self-contained with only Peraturan content:
  - `FaqItem` — expandable FAQ item with open/close toggle, uses useDivisionTheme()
  - `RuleCard` — styled card with icon header and label/value item rows, uses useDivisionTheme()
  - `LeagueView` — main component with 7 sections:
    1. Hero Banner — "Peraturan & Format" title with BookOpen icon, division label, description
    2. Sistem Poin Tarkam — scoring rules (win +3, lose +1, walkout 0, MVP +2, streak +1)
    3. Format Turnamen — tournament format (weekly, 2-4h, single elimination, 1v1, parallel matches)
    4. Peraturan Pertandingan — match rules (attendance, penalties, judging, MVP selection)
    5. Peraturan Season — season rules (reset, champion, hall of fame)
    6. Divisi Info — division-specific info (Male: Sabtu, Female: Minggu)
    7. FAQ — 8 expandable questions about registration, scoring, schedule, duration, MVP, champion, resets, lateness
- Uses useDivisionTheme() for consistent styling across all cards
- Uses useAppStore() for division context (male/female) to customize division info and FAQ answers
- No API calls — all content is static/rules-based
- ESLint passes with no errors
- Dev server compiles and runs successfully

Stage Summary:
- League View completely transformed from data-driven standings/schedule/playoff view to static Peraturan (Rules & Format) page
- All league data fetching and rendering removed — no more /api/league dependency in this component
- 7 well-structured sections covering tournament rules, scoring, format, and FAQ
- Division-aware: shows different match day and FAQ answers based on male/female division
- Self-contained component with no external data dependencies

---
Task ID: 3 (current session)
Agent: Main Agent
Task: Replace Dashboard "Peserta" tab with "Turnamen Aktif", "Statistik" tab with "Pencapaian"; Replace Community Dashboard "Rivalitas" with "Jadwal Tournament", "Galeri" with "Rules & Format"

Work Log:
- Read `/home/z/my-project/worklog.md` for context
- Read `src/components/idm/dashboard/index.tsx` and `src/components/idm/community-dashboard/index.tsx`

**Change 1: Dashboard "Peserta" → "Turnamen Aktif"**
- Changed tab definition: `{ value: 'participants', label: 'Peserta', icon: Users }` → `{ value: 'participants', label: 'Turnamen Aktif', icon: Zap }`
- Replaced `<TabsContent value="participants">` content: removed `<ParticipantGrid>`, replaced with active tournament status card showing:
  - Live tournament status badge (LIVE/SELESAI/MENDATANG)
  - Tournament name, schedule info
  - Stats grid (Total Match, Selesai, Live)
  - Prize pool display when available
  - Recent match results with MVP badges
  - Empty state when no tournament is active
- Removed `ParticipantGrid` import
- Removed `Users` from lucide-react imports, added `Zap`

**Change 2: Dashboard "Statistik" → "Pencapaian"**
- Changed tab definition: `{ value: 'stats', label: 'Statistik', icon: BarChart3 }` → `{ value: 'stats', label: 'Pencapaian', icon: Award }`
- Replaced `<TabsContent value="stats">` content: removed `<StatsTab />`, replaced with:
  - "Pencapaian Saya" card with login-required placeholder
  - "Milestone Tersedia" card with 6 milestone items (10 Kemenangan, MVP Pertama, Streak 3+, Season Champion, 5x MVP, 50 Kemenangan) each with Lock icon
- Removed `StatsTab` import
- Removed `BarChart3` from lucide-react imports
- Added `Award`, `Lock`, `Crown`, `Star` to lucide-react imports
- Added `Card, CardContent` imports from `@/components/ui/card`

**Change 3: Community Dashboard "Rivalitas Puncak" → "Jadwal Tournament"**
- Replaced section 8 content: removed `<CommunityRivalry>`, replaced with tournament schedule view:
  - Male Division schedule card (cyan accent, Setiap Sabtu) with active tournament status badge
  - Female Division schedule card (purple accent, Setiap Minggu) with active tournament status badge
  - Info card linking to Arena Live
- Removed `CommunityRivalry` import
- Added `Zap` to lucide-react imports
- Added `Badge` import from `@/components/ui/badge`

**Change 4: Community Dashboard "Galeri Komunitas" → "Rules & Format"**
- Replaced section 12 content: removed `<CommunityGallery>`, replaced with rules & format view:
  - Sistem Poin card (win +3, lose +1, walkout 0, MVP +2, streak +1)
  - Format Turnamen card (2x2 grid: Jadwal, Durasi, Format, Paralel)
  - CTA card linking to Peraturan page
- Removed `CommunityGallery` import
- Added `BookOpen` to lucide-react imports

**Change 5: Cleanup**
- Removed `CommunitySection` internal component (dead code that referenced `CommunityGallery`)
- All unused imports cleaned up: `Users`, `BarChart3`, `ParticipantGrid`, `StatsTab`, `CommunityRivalry`, `CommunityGallery`
- All new imports added correctly: `Zap`, `Award`, `Lock`, `Crown`, `Star`, `Card`, `CardContent`, `Badge`, `BookOpen`
- ESLint passes with no errors
- Dev server compiles and runs successfully

Stage Summary:
- Dashboard "Peserta" tab now shows "Turnamen Aktif" with live tournament status, match results, and prize pool
- Dashboard "Statistik" tab now shows "Pencapaian" with achievement milestones and locked milestone items
- Community Dashboard "Rivalitas Puncak" section replaced with "Jadwal Tournament" showing male/female division schedules
- Community Dashboard "Galeri Komunitas" section replaced with "Rules & Format" showing scoring system and tournament format
- 2-col Donasi + Pencapaian layout preserved as-is (CommunityAchievements import retained)
- All imports cleaned, no broken references, ESLint passes
