'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — non-critical
      });
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setIsInstalled(true), 0);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  return { canInstall: !!installPrompt && !isInstalled, isInstalled, promptInstall };
}
