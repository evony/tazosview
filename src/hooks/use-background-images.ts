'use client';

import { useQuery } from '@tanstack/react-query';

interface BackgroundImages {
  bgMale: string;
  bgFemale: string;
  bgSection: string;
}

const DEFAULTS: BackgroundImages = {
  bgMale: '/bg-male.jpg',
  bgFemale: '/bg-female.jpg',
  bgSection: '/bg-section.jpg',
};

/**
 * Lightweight hook that fetches background image URLs from CMS settings.
 * Falls back to default static paths (/bg-male.jpg, /bg-female.jpg, /bg-section.jpg)
 * if settings haven't been configured yet.
 *
 * Uses React Query with 60s staleTime — cached across all components,
 * only one network request per minute max.
 */
export function useBackgroundImages(): BackgroundImages & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/settings');
      if (!res.ok) return DEFAULTS;
      const json = await res.json();
      return (json.map || {}) as Record<string, string>;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const map = data || {};
  return {
    bgMale: map.bg_male || DEFAULTS.bgMale,
    bgFemale: map.bg_female || DEFAULTS.bgFemale,
    bgSection: map.bg_section || DEFAULTS.bgSection,
    isLoading,
  };
}

/**
 * Get background image for a specific division.
 * Convenience wrapper around useBackgroundImages().
 */
export function useDivisionBackground(division: 'male' | 'female'): string & { isLoading: boolean } {
  const { bgMale, bgFemale, isLoading } = useBackgroundImages();
  const url = division === 'male' ? bgMale : bgFemale;
  return Object.assign(url, { isLoading });
}

/**
 * Server-side helper: get background image URL from a CMS settings map.
 * For use in components that already have cmsSettings loaded.
 */
export function getBackgroundFromSettings(
  settingsMap: Record<string, string>,
  key: 'bg_male' | 'bg_female' | 'bg_section',
): string {
  return settingsMap[key] || DEFAULTS[key === 'bg_male' ? 'bgMale' : key === 'bg_female' ? 'bgFemale' : 'bgSection'];
}
