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
