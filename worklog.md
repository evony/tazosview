---
Task ID: 1
Agent: Main
Task: Implement per-season point tracking and Tutup Season system

Work Log:
- Explored full codebase: Prisma schema, Season model, PlayerPoint, scoring APIs, finalize route, leaderboard APIs, stats API, admin season panel, landing champion section
- Updated Prisma schema: added `seasonId` (String?, nullable) to `PlayerPoint` model with relation to `Season`, added `championPlayerPoints` (Int?, nullable) to `Season` model for snapshot
- Added reverse relation `pointRecords PlayerPoint[]` on Season model
- Added indexes: seasonId, playerId+seasonId, seasonId+reason
- Pushed schema changes successfully with `bun run db:push`
- Updated scoring API (`score/route.ts`): Added `seasonId: match.tournament.seasonId` to all 4 `playerPoint.create` calls (participation, match_win for winner; participation for loser; match_draw for draw)
- Removed unused `awardPoints` import from score/route.ts
- Updated `points.ts`: Added `seasonId?: string` parameter to `awardPoints` function, passes it as `seasonId: seasonId || null` to playerPoint.create
- Updated finalize route: Added `seasonId: tournament.seasonId` to both awardPoints calls (MVP prize and team prize), changed auto-close champion determination from `Player.points` to per-season `PlayerPoint.groupBy` aggregation, added `championPlayerPoints` snapshot
- Created new API endpoint: `POST /api/seasons/[id]/close` - Tutup Season API that: validates season is active, warns about incomplete tournaments, auto-determines champion from per-season PlayerPoint aggregation, sets championPlayerPoints snapshot, sets status to completed, does NOT create next season
- Updated leaderboard API (`/api/leaderboard`): Added per-season mode when `seasonId` query param provided, uses `PlayerPoint.groupBy` for aggregation, returns both seasonPoints and lifetimePoints
- Updated players leaderboard API (`/api/players/leaderboard`): Same per-season support
- Updated clubs leaderboard API (`/api/clubs/leaderboard`): Tarkam mode now uses per-season points instead of lifetime Player.points
- Updated stats API (`/api/stats`): topPlayers now computed from per-season PlayerPoint aggregation instead of lifetime Player.points, season champion display uses `championPlayerPoints` snapshot when available
- Updated admin season panel: Added `Lock` icon import, added `closeSeason` mutation (calls POST /api/seasons/[id]/close), added "Tutup Season" button with orange styling, confirmation dialog, only shows for active seasons
- Updated reset API: Added `championPlayerPoints: null` to season reset
- Updated seasons PUT API: Added `championPlayerPoints` to destructured body and updateData
- Lint passes, dev server compiles successfully

Stage Summary:
- Per-season point tracking fully implemented: PlayerPoint now records seasonId, leaderboard uses per-season aggregation
- Tutup Season system: Admin can close active seasons, champion auto-determined from per-season points
- Season champion snapshot: championPlayerPoints stored at closure time for accurate landing page display
- No automatic next season creation: Admin creates new seasons manually as agreed
- All APIs backward-compatible: seasonId is nullable, lifetime points still tracked via Player.points

---
Task ID: 1
Agent: main
Task: Implement per-season point tracking and season champion snapshot system

Work Log:
- Reviewed existing codebase: Prisma schema, scoring API, leaderboard API, stats API, admin season panel, landing champion section
- Discovered that per-season point tracking was ALREADY mostly implemented: PlayerPoint.seasonId exists, scoring API records seasonId, leaderboard aggregates by seasonId, close season API determines champion from per-season points
- Identified the critical gap: champion data for completed seasons was reading from LIVE player data, meaning when Season 2 runs, Season 1 champion display would show Season 2 stats instead of the snapshot from when Season 1 closed
- Added `championPlayerSnapshot` and `championClubSnapshot` JSON fields to Season model in Prisma schema
- Ran `db:push` to apply schema changes
- Updated `/api/seasons/[id]/close/route.ts` to write full champion snapshots (gamertag, avatar, tier, points, totalWins, totalMvp, streak, maxStreak, matches, club, division) when closing a season
- Updated `/api/tournaments/[id]/finalize/route.ts` auto-close logic to also write full snapshots
- Updated `/api/stats/route.ts` to read from snapshots for completed seasons (with fallback to live data for active seasons or corrupted snapshots)
- Updated `/api/seasons/[id]/route.ts` GET to parse JSON snapshot strings for SQLite compatibility
- Updated `/api/seasons/[id]/route.ts` PUT to write snapshots when admin manually sets champion + completes season, and clear snapshots when removing champion
- All lint checks pass clean

Stage Summary:
- Per-season point tracking was already implemented from before
- Added champion snapshot system to preserve historical champion data when new seasons run
- Key insight: existing system only stored `championPlayerPoints` (integer), now stores full JSON snapshot
- The flow is: Season ACTIVE → points recorded with seasonId → "Tutup Season" → champion determined from per-season PlayerPoint aggregation → full stats snapshot written → Season COMPLETED → new season can be created → old champion display uses snapshot data
- Files changed: prisma/schema.prisma, src/app/api/seasons/[id]/close/route.ts, src/app/api/seasons/[id]/route.ts, src/app/api/tournaments/[id]/finalize/route.ts, src/app/api/stats/route.ts

---
Task ID: 2
Agent: main
Task: Audit and fix remaining bugs in per-season point tracking system

Work Log:
- Ran comprehensive audit of all per-season point tracking components (10 areas checked)
- Found 3 bugs that needed fixing:
  - BUG #1: Achievement PlayerPoint.create was missing seasonId — achievement reward points weren't attributed to any season
  - BUG #2: Reset API was missing championPlayerSnapshot/championClubSnapshot resets — orphaned snapshot data after reset
  - BUG #3: Season PUT manual champion setting fell back to lifetime Player.points instead of per-season PlayerPoint.groupBy aggregation
- Fixed BUG #1: Updated src/lib/achievements.ts to look up tournament.seasonId before calling awardPoints; updated src/app/api/players/achievements/route.ts to look up seasonId and include it in playerPoint.create
- Fixed BUG #2: Added championPlayerSnapshot: null and championClubSnapshot: null to season reset in src/app/api/reset/route.ts
- Fixed BUG #3: Replaced `championPlayerPoints || player.points` fallback with db.playerPoint.groupBy query in src/app/api/seasons/[id]/route.ts
- All lint checks pass clean
- Dev server compiles and runs successfully

Stage Summary:
- All 3 audit bugs fixed, per-season point tracking is now complete and consistent
- Every PlayerPoint.create call now includes seasonId (scoring, finalize, achievements)
- Reset API properly cleans all snapshot fields
- Manual champion setting uses per-season aggregation instead of lifetime points
- System is production-ready for per-season point tracking
