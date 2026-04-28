'use client';

import { useAppStore } from '@/lib/store';
import { useDivisionTheme, type DivisionTheme } from './use-division-theme';
import { useCommunityTheme } from './use-community-theme';

/**
 * Shell theme — returns Community theme (gold/amber) when currentView is 'community',
 * otherwise returns the division theme (male=cyan, female=purple).
 * Used by app-shell for sidebar, header, mobile nav, and background mesh.
 */
export function useShellTheme(): DivisionTheme {
  const currentView = useAppStore((s) => s.currentView);
  const dt = useDivisionTheme();
  const ct = useCommunityTheme();

  if (currentView === 'community') return ct;
  return dt;
}
