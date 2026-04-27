'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  resolveSkinColors,
  parseBadgeColors,
  buildGradient,
  parseColorStops,
  getDonorBadgeConfig,
} from '@/lib/skin-utils';
import type { SkinColors } from '@/lib/skin-utils';

// ============================================
// PROP TYPES
// ============================================

interface SkinBadgeProps {
  skin: {
    type: string;
    icon: string;
    displayName: string;
    colorClass: string;
    donorBadgeCount?: number;
  };
  size?: 'sm' | 'md' | 'lg';
}

interface SkinBadgesRowProps {
  skins: Array<{
    type: string;
    icon: string;
    displayName: string;
    colorClass: string;
    priority: number;
    donorBadgeCount?: number;
  }>;
}

interface SkinAvatarFrameProps {
  skin: { type: string; colorClass: string } | null;
  children: React.ReactNode;
}

interface SkinNameProps {
  skin: { type: string; colorClass: string } | null;
  children: React.ReactNode;
}

interface SkinCardBorderProps {
  skin: { type: string; colorClass: string } | null;
  children: React.ReactNode;
}

// ============================================
// DonorHeartBadge — Permanent heart badge for donors
// 1-4 donations: small heart
// 5+ donations: bigger heart with pulse glow
// ============================================

function DonorHeartBadge({ donorBadgeCount }: { donorBadgeCount: number }) {
  const config = getDonorBadgeConfig(donorBadgeCount);
  if (!config) return null;

  const isBigHeart = config.size === 'lg';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        isBigHeart
          ? 'w-7 h-7 text-sm donor-heart-pulse'
          : 'w-5 h-5 text-[11px]'
      )}
      style={{
        backgroundColor: 'rgba(244,63,94,0.2)',
        ...(isBigHeart ? {
          boxShadow: '0 0 8px rgba(244,63,94,0.4), 0 0 16px rgba(244,63,94,0.2)',
        } : {}),
      }}
      title={`${donorBadgeCount}x donasi${isBigHeart ? ' ★' : ''}`}
      role="img"
      aria-label={`Heart Badge: ${donorBadgeCount} donations`}
    >
      ❤️
    </span>
  );
}

// ============================================
// SkinBadge — Small badge showing skin icon + optional label
// ============================================

export function SkinBadge({ skin, size = 'sm' }: SkinBadgeProps) {
  const colors = resolveSkinColors(skin);

  // sm: just the emoji icon
  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center justify-center leading-none"
        style={{ fontSize: '14px' }}
        title={skin.displayName}
        role="img"
        aria-label={skin.displayName}
      >
        {skin.icon}
      </span>
    );
  }

  // md: icon + short label (first word)
  if (size === 'md') {
    const badgeColors = colors ? parseBadgeColors(colors.badge) : null;
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: badgeColors?.bg ?? 'rgba(255,255,255,0.1)',
          color: badgeColors?.text ?? 'rgba(255,255,255,0.7)',
        }}
        title={skin.displayName}
      >
        <span style={{ fontSize: '12px' }}>{skin.icon}</span>
        <span className="truncate max-w-[48px]">{skin.displayName.split(' ')[0]}</span>
      </span>
    );
  }

  // lg: icon + full displayName
  const badgeColors = colors ? parseBadgeColors(colors.badge) : null;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-semibold"
      style={{
        backgroundColor: badgeColors?.bg ?? 'rgba(255,255,255,0.1)',
        color: badgeColors?.text ?? 'rgba(255,255,255,0.7)',
      }}
      title={skin.displayName}
    >
      <span style={{ fontSize: '14px' }}>{skin.icon}</span>
      <span className="truncate">{skin.displayName}</span>
    </span>
  );
}

// ============================================
// SkinBadgesRow — All owned skins as small badges in a row, sorted by priority
// Includes permanent donor heart badge support
// ============================================

export function SkinBadgesRow({ skins }: SkinBadgesRowProps) {
  const sorted = [...skins].sort((a, b) => b.priority - a.priority);

  if (sorted.length === 0) return null;

  // Extract donorBadgeCount from either the donor skin or donor_badge entry
  let donorBadgeCount = 0;
  for (const skin of sorted) {
    if (skin.type === 'donor' && skin.donorBadgeCount) {
      donorBadgeCount = skin.donorBadgeCount;
    }
    if (skin.type === 'donor_badge' && skin.donorBadgeCount) {
      donorBadgeCount = skin.donorBadgeCount;
    }
  }

  // Filter out the virtual donor_badge entry (we render the heart badge separately)
  const displaySkins = sorted.filter(s => s.type !== 'donor_badge');

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label="Player skins">
      {displaySkins.map((skin) => {
        const colors = resolveSkinColors(skin);
        const badgeColors = colors ? parseBadgeColors(colors.badge) : null;
        return (
          <span
            key={skin.type}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px]"
            style={{
              backgroundColor: badgeColors?.bg ?? 'rgba(255,255,255,0.1)',
            }}
            title={skin.displayName}
          >
            {skin.icon}
          </span>
        );
      })}
      {/* Permanent donor heart badge — always visible if donorBadgeCount > 0 */}
      {donorBadgeCount > 0 && <DonorHeartBadge donorBadgeCount={donorBadgeCount} />}
    </div>
  );
}

// ============================================
// SkinAvatarFrame — Wraps avatar with skin ring + glow
// ============================================

export function SkinAvatarFrame({ skin, children }: SkinAvatarFrameProps) {
  if (!skin) {
    return <>{children}</>;
  }

  const colors = resolveSkinColors(skin);
  if (!colors) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow layer behind avatar */}
      <div
        className="absolute inset-[-2px] rounded-full skin-glow-animate"
        style={{
          boxShadow: `0 0 12px ${colors.glow}, 0 0 24px ${colors.glow}`,
        }}
        aria-hidden="true"
      />
      {/* Avatar with ring */}
      <div
        className="relative rounded-full ring-2"
        style={{
          boxShadow: `0 0 0 2px ${colors.frame}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================
// SkinName — Wraps player name with skin gradient
// ============================================

export function SkinName({ skin, children }: SkinNameProps) {
  if (!skin) {
    return <>{children}</>;
  }

  const colors = resolveSkinColors(skin);
  if (!colors) {
    return <>{children}</>;
  }

  const gradientStops = parseColorStops(colors.name);
  const gradientValue = gradientStops.length > 1
    ? `linear-gradient(135deg, ${gradientStops.join(', ')})`
    : gradientStops[0] ?? colors.glow;

  return (
    <span
      className="font-bold skin-name-animate inline-block"
      style={{
        backgroundImage: gradientValue,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
}

// ============================================
// SkinCardBorder — Wraps a card with skin border effect
// ============================================

export function SkinCardBorder({ skin, children }: SkinCardBorderProps) {
  if (!skin) {
    return <>{children}</>;
  }

  const colors = resolveSkinColors(skin);
  if (!colors) {
    return <>{children}</>;
  }

  const borderGradient = buildGradient(colors.border, '135deg');

  return (
    <div className="relative rounded-xl overflow-hidden isolate">
      {/* Gradient border — using mask trick for border-only effect */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: '2px',
          background: borderGradient,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          backgroundSize: '200% 100%',
          animation: 'skin-border-shimmer 3s linear infinite',
        }}
        aria-hidden="true"
      />
      {/* Glow shadow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
          opacity: 0.25,
        }}
        aria-hidden="true"
      />
      {/* Content */}
      {children}
    </div>
  );
}
