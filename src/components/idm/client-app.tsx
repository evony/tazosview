'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AppShell } from '@/components/idm/app-shell';

/* ─── Brief non-blocking splash overlay ─── */
function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 1500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500">
      <div className="w-16 h-16 rounded-xl overflow-hidden mb-4">
        <Image
          src="/logo.webp"
          alt="IDM"
          width={64}
          height={64}
          className="object-cover"
          priority
        />
      </div>
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground mt-3">Loading...</p>
    </div>
  );
}

export function ClientApp() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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

  const [splashDone, setSplashDone] = useState(false);

  // ★ Non-blocking: seed & init run in background, don't block render
  useEffect(() => {
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

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* ★ Content renders IMMEDIATELY — SSR HTML is sent to browser */}
      {/* Splash is just a brief overlay, doesn't block LCP */}
      {!splashDone && <SplashOverlay onFinish={handleSplashFinish} />}
      <AppShell />
    </QueryClientProvider>
  );
}
