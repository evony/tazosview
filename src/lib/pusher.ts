import Pusher from 'pusher';

// Server-side Pusher instance — used in API routes to trigger real-time events
let _pusher: Pusher | null = null;

export function getPusher(): Pusher | null {
  if (_pusher) return _pusher;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.warn('[Pusher] Missing environment variables — real-time updates disabled');
    return null;
  }

  _pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return _pusher;
}

// Channel and event constants
export const PUSHER_CHANNELS = {
  FEED: 'idm-feed',
} as const;

export const PUSHER_EVENTS = {
  DONATION_APPROVED: 'donation-approved',
  DONATION_REJECTED: 'donation-rejected',
  FEED_UPDATED: 'feed-updated',
} as const;
