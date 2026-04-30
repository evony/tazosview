'use client';

import Image from 'next/image';
import { getClubLogoUrl, isClubLogoPlaceholder } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

interface ClubLogoImageProps {
  clubName: string;
  dbLogo?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Club logo image component that auto-handles unoptimized for data URI placeholders.
 * Next.js Image optimizer can't process SVG data URIs, so we skip optimization for those.
 *
 * Broken image fallback: If a Cloudinary URL returns 404, we first retry with
 * `unoptimized` (bypassing Next.js image optimization). If that also fails,
 * we render a styled placeholder div with the club's first letter.
 *
 * Cache busting: When dbLogo changes (new Cloudinary URL), React re-renders with a new src.
 * Cloudinary URLs are unique per public_id + version, so stale cache is not an issue.
 */
export function ClubLogoImage({
  clubName,
  dbLogo,
  alt,
  width,
  height,
  fill,
  sizes,
  className,
  style,
}: ClubLogoImageProps) {
  const src = getClubLogoUrl(clubName, dbLogo);
  const isPlaceholder = isClubLogoPlaceholder(src);

  // Error stage: 0 = normal, 1 = retry with unoptimized, 2 = show fallback div
  const [errorStage, setErrorStage] = useState(0);

  // Reset error state when src changes (e.g., new logo uploaded)
  useEffect(() => {
    setTimeout(() => setErrorStage(0), 0);
  }, [src]);

  const handleError = () => {
    setErrorStage((prev) => Math.min(prev + 1, 2));
  };

  // Fallback: styled div with the first letter of the club name
  if (errorStage === 2) {
    const letter = clubName.charAt(0).toUpperCase();
    const size = fill ? undefined : (width || 32);
    const containerStyle: CSSProperties = fill
      ? { ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }
      : { ...style, width: size, height: size || width || 32, display: 'flex', alignItems: 'center', justifyContent: 'center' };

    return (
      <div
        className={className}
        style={containerStyle}
        role="img"
        aria-label={alt || clubName}
      >
        <span className="text-idm-gold-warm font-bold select-none" style={{ fontSize: fill ? '1.25rem' : `${(size || 32) * 0.5}px` }}>
          {letter}
        </span>
      </div>
    );
  }

  // Always use unoptimized for external URLs (Cloudinary, etc.) to avoid
  // server-side 404 errors from Next.js image optimization proxy.
  // Data URI placeholders also can't be optimized by Next.js.
  const isExternalUrl = src.startsWith('http');
  const shouldUnoptimize = isPlaceholder || isExternalUrl || errorStage >= 1;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt || clubName}
        fill
        sizes={sizes}
        className={className}
        style={style}
        unoptimized={shouldUnoptimize}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt || clubName}
      width={width || 32}
      height={height || 32}
      className={className}
      style={style}
      unoptimized={shouldUnoptimize}
      onError={handleError}
    />
  );
}
