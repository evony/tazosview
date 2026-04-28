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
