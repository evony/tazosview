'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to subscribe to a Pusher channel and bind to events.
 * Automatically cleans up on unmount.
 *
 * @param channelName - Pusher channel name (e.g. 'idm-feed')
 * @param events - Map of event names to callbacks
 * @param enabled - Whether to subscribe (default: true)
 */
export function usePusherChannel(
  channelName: string,
  events: Record<string, (data: any) => void>,
  enabled = true
) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!enabled) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) return;

    let pusher: any;
    let channel: any;

    import('pusher-js').then(({ default: PusherJS }) => {
      pusher = new PusherJS(pusherKey, { cluster: pusherCluster });
      channel = pusher.subscribe(channelName);

      for (const [event] of Object.entries(eventsRef.current)) {
        channel.bind(event, (data: any) => {
          eventsRef.current[event]?.(data);
        });
      }
    }).catch(() => {
      // Pusher not available — graceful fallback
    });

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusher) pusher.disconnect();
    };
  }, [channelName, enabled]);
}

/**
 * Subscribe to all Pusher channels and invalidate React Query keys on events.
 * This is a simplified approach: subscribe to all channels in a single effect
 * and invalidate queries based on event data.
 */
export function usePusherRealtime() {
  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) return;

    let pusher: any;
    const channels: any[] = [];

    import('pusher-js').then(({ default: PusherJS }) => {
      pusher = new PusherJS(pusherKey, { cluster: pusherCluster });

      const channelNames = ['idm-feed', 'idm-leaderboard', 'idm-tournament', 'idm-league'];
      for (const name of channelNames) {
        const ch = pusher.subscribe(name);

        // Feed events
        ch.bind('feed-updated', () => {
          qcRef.current.invalidateQueries({ queryKey: ['feed'] });
          qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        });

        // Leaderboard events
        ch.bind('leaderboard-updated', (data: { division?: string; seasonId?: string }) => {
          qcRef.current.invalidateQueries({ queryKey: ['leaderboard'] });
          qcRef.current.invalidateQueries({ queryKey: ['rankings'] });
          qcRef.current.invalidateQueries({ queryKey: ['stats'] });
          qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
          qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
        });

        // Tournament events
        ch.bind('tournament-scored', () => {
          qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        });

        ch.bind('tournament-finalized', () => {
          qcRef.current.invalidateQueries({ queryKey: ['stats'] });
          qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        });

        // League events
        ch.bind('league-match-scored', () => {
          qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
          qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
          qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        });

        ch.bind('season-closed', () => {
          qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
          qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
          qcRef.current.invalidateQueries({ queryKey: ['stats'] });
          qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        });

        channels.push(ch);
      }
    }).catch(() => {
      // Pusher not available — graceful fallback
    });

    return () => {
      for (const ch of channels) {
        ch.unbind_all();
        ch.unsubscribe();
      }
      if (pusher) pusher.disconnect();
    };
  }, []);
}
