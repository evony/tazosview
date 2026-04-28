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
