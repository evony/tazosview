// ============================================
// IDM LEAGUE - SKIN AUTO-AWARD UTILITY
// Automatically awards skins when tournaments are finalized
// - Champion skin: awarded to all 3 members of the winning team (1 week duration)
// - MVP skin: awarded to the MVP player (1 week duration)
// ============================================

import { db } from '@/lib/db';

interface AutoAwardResult {
  playerId: string;
  gamertag: string;
  skinType: string;
  displayName: string;
  action: 'awarded' | 'extended' | 'skipped_no_account' | 'skipped_already_active';
}

/**
 * Auto-award skins after tournament finalization.
 *
 * @param tournamentId - The tournament that was just finalized
 * @param rank1TeamId - The winning team ID
 * @param mvpPlayerId - The MVP player ID (optional, may not have one)
 * @param adminId - The admin who finalized (for awardedBy field)
 * @returns Array of results for each player processed
 */
export async function autoAwardTournamentSkins(
  tournamentId: string,
  rank1TeamId: string | null,
  mvpPlayerId: string | null,
  adminId: string
): Promise<AutoAwardResult[]> {
  const results: AutoAwardResult[] = [];

  // Get tournament info for the reason text
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, weekNumber: true },
  });

  const reasonPrefix = tournament
    ? `Juara 1 ${tournament.name}`
    : `Juara 1 Tournament`;

  // 1 week from now for expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // ===== AWARD CHAMPION SKIN TO WINNING TEAM MEMBERS =====
  if (rank1TeamId) {
    const team = await db.team.findUnique({
      where: { id: rank1TeamId },
      include: {
        teamPlayers: {
          include: {
            player: {
              select: {
                id: true,
                gamertag: true,
                account: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (team) {
      const championSkin = await db.skin.findUnique({
        where: { type: 'champion' },
      });

      if (championSkin) {
        for (const tp of team.teamPlayers) {
          const player = tp.player;
          const accountId = player.account?.id;

          if (!accountId) {
            results.push({
              playerId: player.id,
              gamertag: player.gamertag,
              skinType: 'champion',
              displayName: championSkin.displayName,
              action: 'skipped_no_account',
            });
            continue;
          }

          const result = await awardOrExtendSkin({
            accountId,
            skinId: championSkin.id,
            skinType: 'champion',
            displayName: championSkin.displayName,
            gamertag: player.gamertag,
            playerId: player.id,
            reason: reasonPrefix,
            expiresAt,
            awardedBy: adminId,
          });

          results.push(result);
        }
      }
    }
  }

  // ===== AWARD MVP SKIN =====
  if (mvpPlayerId) {
    const mvpSkin = await db.skin.findUnique({
      where: { type: 'mvp' },
    });

    if (mvpSkin) {
      const player = await db.player.findUnique({
        where: { id: mvpPlayerId },
        select: {
          id: true,
          gamertag: true,
          account: { select: { id: true } },
        },
      });

      if (player) {
        const accountId = player.account?.id;

        if (!accountId) {
          results.push({
            playerId: player.id,
            gamertag: player.gamertag,
            skinType: 'mvp',
            displayName: mvpSkin.displayName,
            action: 'skipped_no_account',
          });
        } else {
          const mvpReason = tournament
            ? `MVP ${tournament.name}`
            : 'MVP Tournament';

          const result = await awardOrExtendSkin({
            accountId,
            skinId: mvpSkin.id,
            skinType: 'mvp',
            displayName: mvpSkin.displayName,
            gamertag: player.gamertag,
            playerId: player.id,
            reason: mvpReason,
            expiresAt,
            awardedBy: adminId,
          });

          results.push(result);
        }
      }
    }
  }

  return results;
}

/**
 * Award a new skin or extend the expiry if the player already has an active one.
 * - If no existing record → create new PlayerSkin
 * - If existing but expired → re-award (update expiry, reason)
 * - If existing and still active → extend expiry by 7 days from now
 */
async function awardOrExtendSkin(params: {
  accountId: string;
  skinId: string;
  skinType: string;
  displayName: string;
  gamertag: string;
  playerId: string;
  reason: string;
  expiresAt: Date;
  awardedBy: string;
}): Promise<AutoAwardResult> {
  const { accountId, skinId, skinType, displayName, gamertag, playerId, reason, expiresAt, awardedBy } = params;

  const existing = await db.playerSkin.findUnique({
    where: { accountId_skinId: { accountId, skinId } },
  });

  if (!existing) {
    // No record — create new
    await db.playerSkin.create({
      data: {
        accountId,
        skinId,
        awardedBy,
        reason,
        expiresAt,
      },
    });

    return {
      playerId,
      gamertag,
      skinType,
      displayName,
      action: 'awarded',
    };
  }

  const isExpired = existing.expiresAt && new Date(existing.expiresAt) < new Date();

  if (isExpired) {
    // Expired — re-award
    await db.playerSkin.update({
      where: { id: existing.id },
      data: {
        awardedBy,
        reason,
        expiresAt,
        createdAt: new Date(),
      },
    });

    return {
      playerId,
      gamertag,
      skinType,
      displayName,
      action: 'awarded',
    };
  }

  // Still active — extend expiry by 7 days from now
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 7);

  await db.playerSkin.update({
    where: { id: existing.id },
    data: {
      expiresAt: newExpiry,
      reason, // Update reason to latest win
      awardedBy,
    },
  });

  return {
    playerId,
    gamertag,
    skinType,
    displayName,
    action: 'extended',
  };
}
