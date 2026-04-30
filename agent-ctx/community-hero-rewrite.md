# Task: Rewrite Community Hero Banner (Challonge-style)

## Summary
Rewrote `/home/z/my-project/src/components/idm/community-dashboard/community-hero.tsx` from a branding-driven hero with particles and background imagery to a **Challonge-style tournament-centric banner** that is information-dense and action-driven.

## Key Changes

### Removed
1. **Particles system** — `useParticles` hook and floating particle elements removed entirely
2. **Fixed aspect ratio spacers** — content now defines its own height naturally
3. **Heavy background image overlay** — reduced from `opacity-45` to `opacity-15`, with stronger dark scrim
4. **Decorative top accent** (Zap icon + "IDM TARKAM" pill) — replaced by contextual status header
5. **"KOMUNITAS" title** — replaced by season name in gradient text
6. **Animated underline** — replaced by gradient dividers
7. **`useMemo` import** — no longer needed (was for particles)

### Added
1. **StatusBadge component** — Challonge-style colored badges: LIVE (red pulse), REGISTRATION (amber), COMPLETED (green), OFFSEASON (gray)
2. **SeasonProgressBar component** — Visual progress bar showing Week X/Y with percentage
3. **StatPill component** — Compact stat cards in pill/badge style (Prize, Male, Female, Clubs, Matches)
4. **DivisionCard component** — Per-division tournament status cards with:
   - Division label with accent color (cyan for male, purple for female)
   - StatusBadge per division
   - Tournament name + week number
   - Mini stats (players, prize pool)
   - Context-aware CTA button (Daftar Sekarang / Lihat Match / Lihat Hasil / Daftar Tarkam)
   - Glow effect when live
5. **Top row** — Status Badge · Season Name · Week X/Y · Live Matches count
6. **Two-column layout** — Left: Division cards (2-col grid), Right: Stat pills (vertical on lg, horizontal on mobile)
7. **Context-aware CTA row** — Bottom buttons change based on overall tournament status
8. **Live match count** — Shows X Live Match(es) with ping animation when matches are live

### Preserved
- `'use client'` directive
- Same component name `CommunityHero` and same props interface `CommunityHeroProps`
- `AnimatedNumber` component (unchanged)
- Same imports: lucide-react, useAppStore, useBackgroundImages, getOptimizedCloudinaryUrl, StatsData
- Store actions: `setCurrentView`, `setDivision`, `setInitialDashboardTab`
- Premium dark aesthetic with gold accents, subtle glows
- Background image from CMS used subtly
- Responsive design (mobile stacked, desktop side-by-side)

### Fixed
- Replaced dynamic Tailwind class interpolation (`bg-${accentColor}-500/20`) with explicit static class strings to ensure JIT compilation works correctly

## Verification
- `bun run lint` — passes with no errors
- Dev server compiles successfully
- No TypeScript errors
