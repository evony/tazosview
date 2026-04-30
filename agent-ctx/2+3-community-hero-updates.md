# Task 2+3: Community Hero — Prize Pool + Sawer CTA

## Summary
Modified `/home/z/my-project/src/components/idm/community-dashboard/community-hero.tsx` to add two critical elements.

## Changes Made

### A. Prize Pool Display
- Added `combinedPrizePool` computed value: `(maleData?.totalPrizePool || 0) + (femaleData?.totalPrizePool || 0)`
- Inserted Prize Pool as the **first and most prominent** stat in the quick stats row
- Uses `text-idm-gold-warm` with a glow effect via `textShadow` (`0 0 20px rgba(212,168,83,0.4), 0 0 40px rgba(212,168,83,0.15)`)
- Larger text size (`text-xl sm:text-2xl`) compared to other stats (`text-lg sm:text-xl`)
- Larger icon container (`w-9 h-9` vs `w-8 h-8`) with `Trophy` icon
- AnimatedNumber with `duration={1800}` for dramatic count-up effect
- Label uses `text-idm-gold-warm/70` for cohesive gold theming
- Conditionally rendered only when `combinedPrizePool > 0`
- Followed by a divider (`w-px h-8 bg-border/30`) before the Male Players stat

### B. Sawer CTA Button
- Added `onSawer?: () => void` prop to `CommunityHeroProps` interface
- Added `onSawer` to destructured props in the component function signature
- Added `Gift` to the `lucide-react` import
- Inserted Sawer button in the CTA buttons area (after Lihat Bracket, before the fallback info)
- Button styling matches the specification: golden gradient (`from-idm-gold-warm to-[#e8d5a3]`), black text, hover glow, scale transitions
- Conditionally rendered when `onSawer` is provided (so parent can control visibility)
- **Note**: Parent `community-dashboard/index.tsx` was NOT modified per instructions — parent needs to pass `onSawer` callback separately

## Lint
- `bun run lint` passes with no errors
