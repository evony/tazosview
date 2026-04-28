// ─── Database Client ───
// Dual-database support: SQLite (local/sandbox) and PostgreSQL/Neon (production).
// Detects the provider based on DATABASE_URL:
//   - file: → SQLite mode (no keep-alive, simpler config)
//   - postgresql:// or postgres:// → PostgreSQL/Neon mode (keep-alive ping, etc.)

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  keepAliveInterval: ReturnType<typeof setInterval> | undefined
}

/** Detect database provider from DATABASE_URL */
function getDbProvider(): 'sqlite' | 'postgresql' {
  const url = process.env.DATABASE_URL || ''
  if (url.startsWith('file:')) return 'sqlite'
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) return 'postgresql'
  // Default to postgresql for unknown URLs (backward compat)
  return 'postgresql'
}

const dbProvider = getDbProvider()

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db

  // Keep-alive ping ONLY for PostgreSQL/Neon — prevents cold starts during active dev.
  // Neon sleeps after 5 min of inactivity; we ping every 4 minutes.
  // SQLite is a local file — no connection to keep alive.
  if (dbProvider === 'postgresql' && !globalForPrisma.keepAliveInterval) {
    globalForPrisma.keepAliveInterval = setInterval(async () => {
      try {
        await db.$queryRaw`SELECT 1`
      } catch {
        // Silent fail — next request will reconnect
      }
    }, 4 * 60 * 1000)
  }
}

/** Export provider info so other modules (e.g., db-resilience) can adapt behavior */
export const isPostgreSQL = dbProvider === 'postgresql'
export const isSQLite = dbProvider === 'sqlite'
