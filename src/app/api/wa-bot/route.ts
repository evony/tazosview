/**
 * WA Bot Status API
 * GET /api/wa-bot?XTransformPort=3004
 * 
 * Proxies status info from the WA bot mini-service (port 3004)
 * Falls back to "not running" if bot is offline
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('http://localhost:3004/status', {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      service: 'idm-wa-bot',
      waStatus: 'offline',
      message: 'WA Bot service is not running. Start it with: cd mini-services/wa-bot && npm start',
      commands: [
        { cmd: '/daftar', desc: 'Daftar peserta baru', usage: '/daftar Nama|M/F|Kota|Club' },
        { cmd: '/ranking', desc: 'Top 10 ranking', usage: '/ranking [M/F]' },
        { cmd: '/profil', desc: 'Lihat profil', usage: '/profil [@nama]' },
        { cmd: '/jadwal', desc: 'Jadwal pertandingan', usage: '/jadwal' },
        { cmd: '/streak', desc: 'Streak terpanjang', usage: '/streak' },
        { cmd: '/help', desc: 'Bantuan', usage: '/help' },
        { cmd: '/approve', desc: 'Admin: Approve', usage: '/approve KODE TIER' },
        { cmd: '/reject', desc: 'Admin: Tolak', usage: '/reject KODE' },
        { cmd: '/pending', desc: 'Admin: List pending', usage: '/pending' },
        { cmd: '/ban', desc: 'Admin: Ban', usage: '/ban NOMOR_WA' },
        { cmd: '/unban', desc: 'Admin: Unban', usage: '/unban NOMOR_WA' },
        { cmd: '/announce', desc: 'Admin: Broadcast', usage: '/announce PESAN' },
      ],
    }, { status: 503 })
  }
}
