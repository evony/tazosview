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
