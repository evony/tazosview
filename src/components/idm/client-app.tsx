'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/idm/app-shell';
import { ErrorBoundary } from '@/components/idm/error-boundary';

export function ClientApp() {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000, // 1 minute cache
          refetchOnWindowFocus: false,
          refetchOnMount: false, // Use cache if available
          refetchOnReconnect: true,
          retry: 1,
        },
      },
    })
  );

  // ★ Non-blocking: seed & init deferred until after page render
  useEffect(() => {
    const deferInit = () => {
      // Seed check — fire and forget
      fetch('/api/stats?division=male')
        .then((r) => r.json())
        .then((data) => {
          if (!data.hasData) {
            fetch('/api/seed', { method: 'POST' }).catch(() => {});
          }
        })
        .catch(() => {});

      // Init admin — fire and forget
      fetch('/api/init-admin', { method: 'POST' }).catch(() => {});
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(deferInit);
    } else {
      setTimeout(deferInit, 2000);
    }
  }, []);

  // ★ Version check — less aggressive polling (every 2 min)
  useEffect(() => {
    let lastVersion: string | null = null;

    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (lastVersion !== null && data.version !== lastVersion) {
          queryClient.invalidateQueries();
        }
        lastVersion = data.version;
      } catch {
        // Silent fail
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 120_000);
    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
