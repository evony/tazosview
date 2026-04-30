# Task 6 — Transform Match Day Center into Arena Live

## Summary
Replaced Prediksi (prediction) and H2H (head-to-head) tabs with Bracket and Antrian (queue) tabs in `src/components/idm/match-day-center.tsx`.

## Changes Made
1. **Default tab**: `prediction` → `bracket`
2. **Tab definitions**: Replaced Prediksi/ThumbsUp and H2H/Users with Bracket/Trophy and Antrian/Radio
3. **Bracket tab**: New `TabsContent value="bracket"` with tournament bracket visualization grouped by round (final/semifinal/quarterfinal labels), live pulse indicators, winner highlighting, MVP Crown badges, and "Posisi Saya" login-required section
4. **Antrian tab**: New `TabsContent value="queue"` with match queue in priority order (Sedang Berlangsung → Berikutnya → Selesai), tournament status summary (Live/Menunggu/Selesai counts)
5. **Removed code**: PredictionState interface, PredictionBar component, H2HStatRow component, predictions state/effects/callbacks, predState variable, team1Stats/team2Stats computations
6. **Cleaned imports**: Removed Vote, BarChart3, Eye, MessageSquare, ThumbsUp, Users, TrendingUp, ChevronRight, ArrowRight, Circle, XCircle, Button, Progress, useCallback, useEffect
7. **Preserved**: Hero banner, Timeline tab, Results tab, SectionCard, TimelineEvent, LivePulse, MatchEvent interface

## Verification
- ESLint passes with no errors
- Dev server compiles and runs successfully
- File reduced from ~1162 lines to ~750 lines
