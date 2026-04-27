import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { awardPoints } from '@/lib/points';
import { getSafeErrorMessage } from '@/lib/api-error';
import { NextResponse } from 'next/server';

// ===== Helper: Parse groupLabel position (e.g., "U2-3" → round=2, pos=3, "L1-2" → round=1, pos=2) =====
function parseLabel(label: string | null): { prefix: string; round: number; pos: number } | null {
  if (!label) return null;
  const match = label.match(/^([UL])(\d+)-(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], round: parseInt(match[2]), pos: parseInt(match[3]) };
}

// ===== Helper: Update club stats for a player's club =====
// IMPORTANT: Must be called OUTSIDE of $transaction to avoid SQLite deadlocks/timeout
async function updateClubStatsForPlayer(
  playerId: string,
  tournamentDivision: string,
  seasonId: string,
  type: 'win' | 'loss' | 'draw',
  gameDiff: number
) {
  try {
    // Find the player's club season entry in the same division and season
    const membership = await db.clubMember.findFirst({
      where: {
        playerId,
        leftAt: null,
        profile: {
          seasonEntries: {
            some: { division: tournamentDivision, seasonId },
          },
        },
      },
      include: { profile: { include: { seasonEntries: { where: { division: tournamentDivision, seasonId } } } } },
    });

    if (!membership) return;

    // Get the Club season entry to update stats
    const clubEntry = membership.profile.seasonEntries[0];
    if (!clubEntry) return;

    if (type === 'win') {
      await db.club.update({
        where: { id: clubEntry.id },
        data: {
          wins: { increment: 1 },
          points: { increment: 2 },
          gameDiff: { increment: gameDiff },
        },
      });
    } else if (type === 'loss') {
      const lossPoints = gameDiff > -Math.abs(gameDiff) ? 1 : 0; // +1 point if they won at least 1 game
      await db.club.update({
        where: { id: clubEntry.id },
        data: {
          losses: { increment: 1 },
          points: { increment: Math.max(0, lossPoints) },
          gameDiff: { increment: gameDiff },
        },
      });
    } else if (type === 'draw') {
      await db.club.update({
        where: { id: clubEntry.id },
        data: {
          points: { increment: 1 },
        },
      });
    }
  } catch (error) {
    // Club stats are non-critical — log but don't fail the score submission
    console.error('Club stats update failed (non-critical):', error);
  }
}

// ===== Helper: DE Lower bracket advancement =====
// Maps UR round to the LR round where its loser drops
function getDropRound(upperRound: number): number {
  if (upperRound === 1) return 1;
  return 2 * (upperRound - 1);
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ===== SCORE SUBMISSION =====
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { matchId, score1, score2 } = body;

  if (!matchId || score1 === undefined || score2 === undefined) {
    return NextResponse.json({ error: 'matchId, score1, score2 required' }, { status: 400 });
  }

  try {
    // Collect club stats updates to apply AFTER the transaction
    // (calling db.club.update inside $transaction causes SQLite deadlock/timeout)
    const clubStatsQueue: { playerId: string; type: 'win' | 'loss' | 'draw'; gameDiff: number }[] = [];
    let tournamentDivision = '';
    let tournamentSeasonId = '';

    // Use transaction for data integrity (Bug #3 fix)
    const result = await db.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: true,
          team1: { include: { teamPlayers: { include: { player: true } } } },
          team2: { include: { teamPlayers: { include: { player: true } } } },
        },
      });

      if (!match) throw new Error('Match not found');
      if (match.tournamentId !== id) throw new Error('Match does not belong to this tournament');

      // Bug #8 fix: Optimistic locking - check status within transaction
      if (match.status === 'completed') throw new Error('Match already completed');
      if (!match.team1Id || !match.team2Id) throw new Error('Both teams must be set before scoring');

      const isGroupMatch = match.bracket === 'group';
      const isDraw = score1 === score2;

      // Determine winner and loser
      const winnerId = score1 > score2 ? match.team1Id : score2 > score1 ? match.team2Id : null;
      const loserId = score1 > score2 ? match.team2Id : score2 > score1 ? match.team1Id : null;

      // Only allow draws in group stage
      if (isDraw && !isGroupMatch) {
        throw new Error('Draws are not allowed in elimination brackets');
      }

      tournamentDivision = match.tournament.division;
      tournamentSeasonId = match.tournament.seasonId;
      const gameDiff = Math.abs((score1 || 0) - (score2 || 0));

      if (isDraw && isGroupMatch) {
        // Handle draw in group stage
        const updatedMatch = await tx.match.update({
          where: { id: matchId },
          data: { score1, score2, status: 'completed', completedAt: new Date() },
        });

        // Award participation + draw points to both teams
        for (const team of [match.team1!, match.team2!]) {
          for (const tp of team.teamPlayers) {
            const participation = await tx.participation.findUnique({
              where: { playerId_tournamentId: { playerId: tp.playerId, tournamentId: id } },
            });
            if (participation) {
              const participationPtGiven = participation.pointsEarned >= 1;
              const participationPts = participationPtGiven ? 0 : 1;
              const drawPts = 1;

              await tx.participation.update({
                where: { id: participation.id },
                data: { pointsEarned: participation.pointsEarned + participationPts + drawPts },
              });

              if (!participationPtGiven) {
                await tx.playerPoint.create({
                  data: {
                    playerId: tp.playerId, amount: 1, reason: 'participation',
                    description: `Partisipasi tournament - ${match.tournament.name}`, tournamentId: id, matchId,
                  },
                });
              }

              await tx.playerPoint.create({
                data: {
                  playerId: tp.playerId, amount: drawPts, reason: 'match_draw',
                  description: `Seri match R${match.round}M${match.matchNumber}`, tournamentId: id, matchId,
                },
              });

              await tx.player.update({
                where: { id: tp.playerId },
                data: { matches: tp.player.matches + 1, points: tp.player.points + participationPts + drawPts },
              });

              // Queue club stats update (outside transaction to avoid SQLite deadlock)
              clubStatsQueue.push({ playerId: tp.playerId, type: 'draw', gameDiff: 0 });
            }
          }
        }

        return { updatedMatch, draw: true };
      }

      // Non-draw match — there is a winner
      if (!winnerId) throw new Error('No winner determined');

      const winningTeam = match.team1Id === winnerId ? match.team1! : match.team2!;
      const losingTeam = match.team1Id === loserId ? match.team1! : match.team2!;
      const matchLabel = `R${match.round}M${match.matchNumber} ${winningTeam.name} vs ${losingTeam.name}`;

      // Update the match
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          score1, score2, status: 'completed',
          winnerId, loserId, completedAt: new Date(),
        },
      });

      // ===== AWARD MATCH POINTS WITH AUDIT TRAIL =====
      // Winner: 1 participation point (once) + 2 points per match win
      for (const tp of winningTeam.teamPlayers) {
        const participation = await tx.participation.findUnique({
          where: { playerId_tournamentId: { playerId: tp.playerId, tournamentId: id } },
        });

        if (participation) {
          const participationPtGiven = participation.pointsEarned >= 1;
          const participationPts = participationPtGiven ? 0 : 1;
          const winPts = 2;
          const totalPts = participationPts + winPts;

          await tx.participation.update({
            where: { id: participation.id },
            data: { pointsEarned: participation.pointsEarned + totalPts },
          });

          if (!participationPtGiven) {
            await tx.playerPoint.create({
              data: {
                playerId: tp.playerId, amount: 1, reason: 'participation',
                description: `Partisipasi tournament - ${match.tournament.name}`, tournamentId: id, matchId,
              },
            });
          }

          await tx.playerPoint.create({
            data: {
              playerId: tp.playerId, amount: winPts, reason: 'match_win',
              description: `Menang match ${matchLabel}`, tournamentId: id, matchId,
            },
          });

          const player = tp.player;
          const newStreak = player.streak + 1;
          await tx.player.update({
            where: { id: tp.playerId },
            data: {
              totalWins: player.totalWins + 1,
              matches: player.matches + 1,
              streak: newStreak,
              maxStreak: Math.max(newStreak, player.maxStreak),
              points: player.points + totalPts,
            },
          });

          // Queue club stats update (outside transaction to avoid SQLite deadlock)
          clubStatsQueue.push({ playerId: tp.playerId, type: 'win', gameDiff });
        }
      }

      // Losing team: 1 participation point (once)
      for (const tp of losingTeam.teamPlayers) {
        const participation = await tx.participation.findUnique({
          where: { playerId_tournamentId: { playerId: tp.playerId, tournamentId: id } },
        });

        if (participation) {
          const participationPtGiven = participation.pointsEarned >= 1;
          const participationPts = participationPtGiven ? 0 : 1;

          await tx.participation.update({
            where: { id: participation.id },
            data: { pointsEarned: participation.pointsEarned + participationPts },
          });

          if (!participationPtGiven) {
            await tx.playerPoint.create({
              data: {
                playerId: tp.playerId, amount: 1, reason: 'participation',
                description: `Partisipasi tournament - ${match.tournament.name}`, tournamentId: id, matchId,
              },
            });
          }

          await tx.player.update({
            where: { id: tp.playerId },
            data: {
              matches: tp.player.matches + 1,
              streak: 0,
              points: tp.player.points + participationPts,
            },
          });

          // Queue club stats update (outside transaction to avoid SQLite deadlock)
          clubStatsQueue.push({ playerId: tp.playerId, type: 'loss', gameDiff: -gameDiff });
        }
      }

      return { updatedMatch, draw: false, winnerId, loserId };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    // ===== CLUB STATS UPDATE (outside transaction to avoid SQLite deadlock/timeout) =====
    // These are non-critical updates — failure should not block score submission
    if (clubStatsQueue.length > 0 && tournamentDivision && tournamentSeasonId) {
      // Process sequentially to avoid overwhelming SQLite
      for (const { playerId, type, gameDiff } of clubStatsQueue) {
        await updateClubStatsForPlayer(playerId, tournamentDivision, tournamentSeasonId, type, gameDiff);
      }
    }

    // ===== BRACKET ADVANCEMENT (outside transaction for complex queries) =====
    const tournament2 = await db.tournament.findUnique({ where: { id } });
    if (!tournament2) return NextResponse.json(result.updatedMatch);

    const format = tournament2.format;
    const match2 = await db.match.findUnique({ where: { id: matchId } });
    if (!match2) return NextResponse.json(result.updatedMatch);

    const currentRound = match2.round;
    const bracket = match2.bracket;
    const winnerId = result.winnerId ?? null;
    const loserId = result.loserId ?? null;

    // Group match — check if group stage is done
    if (bracket === 'group' && format === 'group_stage') {
      await checkAndSeedPlayoffs(id);
      await checkAllMatchesComplete(id);
      return NextResponse.json(result.updatedMatch);
    }

    // Playoff match advancement for group_stage format
    if (format === 'group_stage' && (bracket === 'upper' || bracket === 'lower') && match2.round >= 2) {
      await advanceGroupStagePlayoff(id, match2, winnerId, loserId);
      await checkAllMatchesComplete(id);
      return NextResponse.json(result.updatedMatch);
    }

    // Single/Double elimination upper bracket advancement
    if (bracket === 'upper' && format !== 'group_stage') {
      const label = parseLabel(match2.groupLabel);
      const currentPos = label?.pos || 1;

      // Winner advances to next upper round
      const nextRound = currentRound + 1;
      const nextPos = Math.ceil(currentPos / 2);
      const nextMatch = await db.match.findFirst({
        where: { tournamentId: id, round: nextRound, bracket: 'upper', groupLabel: `U${nextRound}-${nextPos}` },
      });

      if (nextMatch && winnerId) {
        const isOdd = currentPos % 2 === 1;
        await db.match.update({
          where: { id: nextMatch.id },
          data: isOdd ? { team1Id: winnerId } : { team2Id: winnerId },
        });
        const updated = await db.match.findUnique({ where: { id: nextMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: nextMatch.id }, data: { status: 'ready' } });
        }
      }

      // For DE: loser drops to lower bracket (Bug #1 fix - proper position-based routing)
      if (format === 'double_elimination' && loserId) {
        const dropRound = getDropRound(currentRound);
        const teamCount = (await db.team.findMany({ where: { tournamentId: id } })).length;
        const totalLowerRounds = 2 * (Math.ceil(Math.log2(nextPowerOf2(teamCount))) - 1);

        if (dropRound <= totalLowerRounds) {
          if (currentRound === 1) {
            // UR1 losers → LR1: pair up by position (1vs2 → L1-1, 3vs4 → L1-2, etc.)
            const lrPos = Math.ceil(currentPos / 2);
            const lrMatch = await db.match.findFirst({
              where: { tournamentId: id, round: dropRound, bracket: 'lower', groupLabel: `L${dropRound}-${lrPos}` },
            });

            if (lrMatch) {
              const isOddPos = currentPos % 2 === 1;
              const slotData = isOddPos ? { team1Id: loserId } : { team2Id: loserId };
              await db.match.update({ where: { id: lrMatch.id }, data: slotData });
              const updated = await db.match.findUnique({ where: { id: lrMatch.id } });
              if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
                await db.match.update({ where: { id: lrMatch.id }, data: { status: 'ready' } });
              }
            }
          } else {
            // UR2+ losers drop to even LR rounds (mixed rounds)
            // UR2 loser at pos P → LR2 match at pos P (team2 slot)
            // UR3 loser at pos P → LR4 match at pos P (team2 slot)
            // etc.
            const lrPos = currentPos;
            const lrMatch = await db.match.findFirst({
              where: { tournamentId: id, round: dropRound, bracket: 'lower', groupLabel: `L${dropRound}-${lrPos}` },
            });

            if (lrMatch) {
              // Losers from upper bracket always take team2 slot in mixed rounds
              await db.match.update({ where: { id: lrMatch.id }, data: { team2Id: loserId } });
              const updated = await db.match.findUnique({ where: { id: lrMatch.id } });
              if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
                await db.match.update({ where: { id: lrMatch.id }, data: { status: 'ready' } });
              }
            }
          }
        }
      }
    }

    // Lower bracket winner advancement (Bug #1 fix - proper position-based routing)
    if (bracket === 'lower' && format === 'double_elimination') {
      const label = parseLabel(match2.groupLabel);
      const currentPos = label?.pos || 1;
      const currentLRRound = currentRound;
      const teamCount2 = (await db.team.findMany({ where: { tournamentId: id } })).length;
      const totalLowerRounds = 2 * (Math.ceil(Math.log2(nextPowerOf2(teamCount2))) - 1);

      const nextLRRound = currentLRRound + 1;

      if (nextLRRound <= totalLowerRounds) {
        // Determine next round match position
        let nextPos: number;
        let slot: 'team1Id' | 'team2Id';

        if (currentLRRound % 2 === 1) {
          // Odd LR round → next is even (mixed) round
          // LR winner at pos P → next LR match at pos P (team1 slot)
          nextPos = currentPos;
          slot = 'team1Id';
        } else {
          // Even LR round → next is odd (continuation) round
          // LR winner at pos P → next LR match at ceil(P/2), slot based on odd/even
          nextPos = Math.ceil(currentPos / 2);
          slot = currentPos % 2 === 1 ? 'team1Id' : 'team2Id';
        }

        const nextLRMatch = await db.match.findFirst({
          where: { tournamentId: id, round: nextLRRound, bracket: 'lower', groupLabel: `L${nextLRRound}-${nextPos}` },
        });

        if (nextLRMatch && winnerId) {
          await db.match.update({
            where: { id: nextLRMatch.id },
            data: { [slot]: winnerId },
          });
          const updated = await db.match.findUnique({ where: { id: nextLRMatch.id } });
          if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
            await db.match.update({ where: { id: nextLRMatch.id }, data: { status: 'ready' } });
          }
        }
      } else {
        // No more lower rounds → winner goes to grand final
        const gf = await db.match.findFirst({ where: { tournamentId: id, bracket: 'grand_final' } });
        if (gf && winnerId) {
          await db.match.update({ where: { id: gf.id }, data: { team2Id: winnerId } });
          const updated = await db.match.findUnique({ where: { id: gf.id } });
          if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
            await db.match.update({ where: { id: gf.id }, data: { status: 'ready' } });
          }
        }
      }
    }

    // Grand final winner → upper bracket champion
    if (bracket === 'grand_final' && format === 'double_elimination') {
      // No further advancement needed, just mark tournament for finalization
    }

    await checkAllMatchesComplete(id);
    return NextResponse.json(result.updatedMatch);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Match already completed') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === 'Match not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error('Score submission error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

// ===== Helper: Advance group stage playoff matches =====
async function advanceGroupStagePlayoff(
  tournamentId: string,
  match: { id: string; round: number; matchNumber: number; bracket: string; groupLabel: string | null },
  winnerId: string | null,
  loserId: string | null
) {
  const label = match.groupLabel;
  if (!label) return;

  // Count groups to determine playoff structure
  const groupMatches = await db.match.findMany({
    where: { tournamentId, bracket: 'group' },
  });
  const numGroups = new Set(groupMatches.map(m => m.groupLabel)).size;

  if (numGroups <= 2) {
    // Standard 2-group or 1-group: SF1, SF2, Final, 3rd
    if (label === 'SF1') {
      const finalMatch = await db.match.findFirst({ where: { tournamentId, round: 3, bracket: 'upper', groupLabel: 'Final' } });
      const thirdMatch = await db.match.findFirst({ where: { tournamentId, round: 3, bracket: 'lower', groupLabel: '3rd' } });

      if (finalMatch && winnerId) {
        await db.match.update({ where: { id: finalMatch.id }, data: { team1Id: winnerId } });
        const updated = await db.match.findUnique({ where: { id: finalMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: finalMatch.id }, data: { status: 'ready' } });
        }
      }
      if (thirdMatch && loserId) {
        await db.match.update({ where: { id: thirdMatch.id }, data: { team1Id: loserId } });
        const updated = await db.match.findUnique({ where: { id: thirdMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: thirdMatch.id }, data: { status: 'ready' } });
        }
      }
    } else if (label === 'SF2') {
      const finalMatch = await db.match.findFirst({ where: { tournamentId, round: 3, bracket: 'upper', groupLabel: 'Final' } });
      const thirdMatch = await db.match.findFirst({ where: { tournamentId, round: 3, bracket: 'lower', groupLabel: '3rd' } });

      if (finalMatch && winnerId) {
        await db.match.update({ where: { id: finalMatch.id }, data: { team2Id: winnerId } });
        const updated = await db.match.findUnique({ where: { id: finalMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: finalMatch.id }, data: { status: 'ready' } });
        }
      }
      if (thirdMatch && loserId) {
        await db.match.update({ where: { id: thirdMatch.id }, data: { team2Id: loserId } });
        const updated = await db.match.findUnique({ where: { id: thirdMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: thirdMatch.id }, data: { status: 'ready' } });
        }
      }
    }
  } else if (numGroups === 3) {
    // 3 groups: SF1, SF2, Final, 3rd (same labels, different seeding)
    if (label === 'SF1') {
      const finalMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: 'Final' } });
      const thirdMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: '3rd' } });
      if (finalMatch && winnerId) {
        await db.match.update({ where: { id: finalMatch.id }, data: { team1Id: winnerId } });
        const updated = await db.match.findUnique({ where: { id: finalMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: finalMatch.id }, data: { status: 'ready' } });
        }
      }
      if (thirdMatch && loserId) {
        await db.match.update({ where: { id: thirdMatch.id }, data: { team1Id: loserId } });
        const updated = await db.match.findUnique({ where: { id: thirdMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: thirdMatch.id }, data: { status: 'ready' } });
        }
      }
    } else if (label === 'SF2') {
      const finalMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: 'Final' } });
      const thirdMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: '3rd' } });
      if (finalMatch && winnerId) {
        await db.match.update({ where: { id: finalMatch.id }, data: { team2Id: winnerId } });
        const updated = await db.match.findUnique({ where: { id: finalMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: finalMatch.id }, data: { status: 'ready' } });
        }
      }
      if (thirdMatch && loserId) {
        await db.match.update({ where: { id: thirdMatch.id }, data: { team2Id: loserId } });
        const updated = await db.match.findUnique({ where: { id: thirdMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: thirdMatch.id }, data: { status: 'ready' } });
        }
      }
    }
  } else if (numGroups === 4) {
    // 4 groups: QF1-QF4, SF1-SF2, Final, 3rd
    if (label?.startsWith('QF')) {
      // QF winner → SF, QF loser eliminated
      if (label === 'QF1' || label === 'QF2') {
        const sf1 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF1' } });
        if (sf1 && winnerId) {
          const slot = label === 'QF1' ? 'team1Id' : 'team2Id';
          await db.match.update({ where: { id: sf1.id }, data: { [slot]: winnerId } });
          const updated = await db.match.findUnique({ where: { id: sf1.id } });
          if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
            await db.match.update({ where: { id: sf1.id }, data: { status: 'ready' } });
          }
        }
      } else if (label === 'QF3' || label === 'QF4') {
        const sf2 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF2' } });
        if (sf2 && winnerId) {
          const slot = label === 'QF3' ? 'team1Id' : 'team2Id';
          await db.match.update({ where: { id: sf2.id }, data: { [slot]: winnerId } });
          const updated = await db.match.findUnique({ where: { id: sf2.id } });
          if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
            await db.match.update({ where: { id: sf2.id }, data: { status: 'ready' } });
          }
        }
      }
    } else if (label === 'SF1') {
      const finalMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: 'Final' } });
      const thirdMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: '3rd' } });
      if (finalMatch && winnerId) {
        await db.match.update({ where: { id: finalMatch.id }, data: { team1Id: winnerId } });
        const updated = await db.match.findUnique({ where: { id: finalMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: finalMatch.id }, data: { status: 'ready' } });
        }
      }
      if (thirdMatch && loserId) {
        await db.match.update({ where: { id: thirdMatch.id }, data: { team1Id: loserId } });
        const updated = await db.match.findUnique({ where: { id: thirdMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: thirdMatch.id }, data: { status: 'ready' } });
        }
      }
    } else if (label === 'SF2') {
      const finalMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: 'Final' } });
      const thirdMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: '3rd' } });
      if (finalMatch && winnerId) {
        await db.match.update({ where: { id: finalMatch.id }, data: { team2Id: winnerId } });
        const updated = await db.match.findUnique({ where: { id: finalMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: finalMatch.id }, data: { status: 'ready' } });
        }
      }
      if (thirdMatch && loserId) {
        await db.match.update({ where: { id: thirdMatch.id }, data: { team2Id: loserId } });
        const updated = await db.match.findUnique({ where: { id: thirdMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: thirdMatch.id }, data: { status: 'ready' } });
        }
      }
    }
  } else {
    // 5+ groups: Generic playoff bracket advancement using position-based labels
    // Labels are in format "R{round}-{position}" for early rounds, "Final"/"3rd" for last rounds
    if (label === 'Final' || label === '3rd') {
      // No further advancement
      return;
    }

    const labelMatch = label.match(/^R(\d+)-(\d+)$/);
    if (labelMatch) {
      const round = parseInt(labelMatch[1]);
      const pos = parseInt(labelMatch[2]);
      const nextRound = round + 1;
      const nextPos = Math.ceil(pos / 2);

      // Find next round match
      let nextLabel: string;
      const nextRoundMatchCount = await db.match.count({
        where: { tournamentId, round: nextRound, bracket: 'upper' },
      });

      if (nextRoundMatchCount === 1) {
        nextLabel = pos === 1 ? 'Final' : '3rd';
      } else {
        nextLabel = `R${nextRound}-${nextPos}`;
      }

      const nextMatch = await db.match.findFirst({
        where: { tournamentId, round: nextRound, groupLabel: nextLabel },
      });

      if (nextMatch && winnerId) {
        const isOdd = pos % 2 === 1;
        await db.match.update({
          where: { id: nextMatch.id },
          data: isOdd ? { team1Id: winnerId } : { team2Id: winnerId },
        });
        const updated = await db.match.findUnique({ where: { id: nextMatch.id } });
        if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
          await db.match.update({ where: { id: nextMatch.id }, data: { status: 'ready' } });
        }
      }

      // For 3rd place: losers from the semi-final round go to 3rd place match
      const thirdMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: '3rd' } });
      if (thirdMatch && loserId) {
        // Only advance losers from the round before the final
        const finalMatch = await db.match.findFirst({ where: { tournamentId, groupLabel: 'Final' } });
        if (finalMatch) {
          const finalRound = (await db.match.findFirst({ where: { tournamentId, groupLabel: 'Final' } }))?.round || 0;
          if (round === finalRound - 1) {
            const isOdd = pos % 2 === 1;
            await db.match.update({
              where: { id: thirdMatch.id },
              data: isOdd ? { team1Id: loserId } : { team2Id: loserId },
            });
            const updated = await db.match.findUnique({ where: { id: thirdMatch.id } });
            if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
              await db.match.update({ where: { id: thirdMatch.id }, data: { status: 'ready' } });
            }
          }
        }
      }
    }
  }
}

// ===== Helper: Check if all group matches done and seed playoffs =====
async function checkAndSeedPlayoffs(tournamentId: string) {
  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.format !== 'group_stage') return;

  // Check if group matches are all completed
  const groupMatches = await db.match.findMany({
    where: { tournamentId, bracket: 'group' },
  });

  const allGroupDone = groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed');
  if (!allGroupDone) return;

  // Check if playoffs already seeded
  const sf1 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF1' } });
  if (sf1?.team1Id) return; // Already seeded

  // Compute group standings
  const groupLabels = [...new Set(groupMatches.map(m => m.groupLabel))].sort() as string[];

  const standingsByGroup: Record<string, { teamId: string; wins: number; draws: number; losses: number; points: number; gameWins: number; gameLosses: number }[]> = {};

  for (const label of groupLabels) {
    const groupLabelMatches = groupMatches.filter(m => m.groupLabel === label);
    const teamMap = new Map<string, { teamId: string; wins: number; draws: number; losses: number; points: number; gameWins: number; gameLosses: number }>();

    for (const m of groupLabelMatches) {
      if (!m.team1Id || !m.team2Id) continue;
      const s1 = m.score1 ?? 0;
      const s2 = m.score2 ?? 0;

      if (!teamMap.has(m.team1Id)) teamMap.set(m.team1Id, { teamId: m.team1Id, wins: 0, draws: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 });
      if (!teamMap.has(m.team2Id)) teamMap.set(m.team2Id, { teamId: m.team2Id, wins: 0, draws: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 });

      const t1 = teamMap.get(m.team1Id)!;
      const t2 = teamMap.get(m.team2Id)!;

      t1.gameWins += s1; t1.gameLosses += s2;
      t2.gameWins += s2; t2.gameLosses += s1;

      if (s1 > s2) { t1.wins++; t1.points += 3; t2.losses++; }
      else if (s2 > s1) { t2.wins++; t2.points += 3; t1.losses++; }
      else { t1.draws++; t2.draws++; t1.points++; t2.points++; }
    }

    const sorted = Array.from(teamMap.values()).sort((a, b) =>
      b.points - a.points || b.wins - a.wins || (b.gameWins - b.gameLosses) - (a.gameWins - a.gameLosses)
    );
    standingsByGroup[label] = sorted;
  }

  const numGroups = groupLabels.length;

  if (numGroups === 1) {
    // Single group: 1st vs 4th (SF1), 2nd vs 3rd (SF2)
    const group = standingsByGroup[groupLabels[0]];
    if (group && group.length >= 4) {
      const sf1 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF1' } });
      if (sf1) {
        await db.match.update({ where: { id: sf1.id }, data: { team1Id: group[0].teamId, team2Id: group[3].teamId, status: 'ready' } });
      }
      const sf2 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF2' } });
      if (sf2) {
        await db.match.update({ where: { id: sf2.id }, data: { team1Id: group[1].teamId, team2Id: group[2].teamId, status: 'ready' } });
      }
    }
  } else if (numGroups === 2) {
    // 2 groups: A1 vs B2 (SF1), B1 vs A2 (SF2)
    const groupA = standingsByGroup['A'];
    const groupB = standingsByGroup['B'];

    if (groupA && groupB && groupA.length >= 2 && groupB.length >= 2) {
      const A1 = groupA[0].teamId;
      const A2 = groupA[1].teamId;
      const B1 = groupB[0].teamId;
      const B2 = groupB[1].teamId;

      const sf1 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF1' } });
      if (sf1) {
        await db.match.update({ where: { id: sf1.id }, data: { team1Id: A1, team2Id: B2, status: 'ready' } });
      }
      const sf2 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF2' } });
      if (sf2) {
        await db.match.update({ where: { id: sf2.id }, data: { team1Id: B1, team2Id: A2, status: 'ready' } });
      }
    }
  } else if (numGroups === 3) {
    // Bug #4 fix: 3 groups — Top of each group + best 2nd place
    // Rank all 2nd place teams to find the best one
    const secondPlaceTeams = groupLabels
      .map(label => standingsByGroup[label]?.[1])
      .filter(Boolean)
      .sort((a, b) => (b?.points || 0) - (a?.points || 0) || (b?.wins || 0) - (a?.wins || 0));

    const best2nd = secondPlaceTeams[0];
    if (!best2nd) return;

    // Get the 3 group winners, excluding the group that has the best 2nd place
    const groupWinners = groupLabels
      .map(label => ({ label, team: standingsByGroup[label]?.[0] }))
      .filter(Boolean);

    // Sort group winners by points for seeding
    groupWinners.sort((a, b) => (b.team?.points || 0) - (a.team?.points || 0));

    // SF1: Best group winner vs Best 2nd place
    // SF2: 2nd best group winner vs 3rd best group winner
    if (groupWinners.length >= 3 && best2nd) {
      const sf1 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF1' } });
      if (sf1 && groupWinners[0].team) {
        await db.match.update({ where: { id: sf1.id }, data: { team1Id: groupWinners[0].team.teamId, team2Id: best2nd.teamId, status: 'ready' } });
      }
      const sf2 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'SF2' } });
      if (sf2 && groupWinners[1].team && groupWinners[2].team) {
        await db.match.update({ where: { id: sf2.id }, data: { team1Id: groupWinners[1].team.teamId, team2Id: groupWinners[2].team.teamId, status: 'ready' } });
      }
    }
  } else if (numGroups === 4) {
    // Bug #4 fix: 4 groups — Quarter-finals with cross-bracket
    // QF1: A1 vs D2, QF2: B1 vs C2, QF3: C1 vs B2, QF4: D1 vs A2
    const groupA = standingsByGroup['A'];
    const groupB = standingsByGroup['B'];
    const groupC = standingsByGroup['C'];
    const groupD = standingsByGroup['D'];

    if (groupA?.[0] && groupD?.[1]) {
      const qf1 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'QF1' } });
      if (qf1) await db.match.update({ where: { id: qf1.id }, data: { team1Id: groupA[0].teamId, team2Id: groupD[1].teamId, status: 'ready' } });
    }
    if (groupB?.[0] && groupC?.[1]) {
      const qf2 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'QF2' } });
      if (qf2) await db.match.update({ where: { id: qf2.id }, data: { team1Id: groupB[0].teamId, team2Id: groupC[1].teamId, status: 'ready' } });
    }
    if (groupC?.[0] && groupB?.[1]) {
      const qf3 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'QF3' } });
      if (qf3) await db.match.update({ where: { id: qf3.id }, data: { team1Id: groupC[0].teamId, team2Id: groupB[1].teamId, status: 'ready' } });
    }
    if (groupD?.[0] && groupA?.[1]) {
      const qf4 = await db.match.findFirst({ where: { tournamentId, groupLabel: 'QF4' } });
      if (qf4) await db.match.update({ where: { id: qf4.id }, data: { team1Id: groupD[0].teamId, team2Id: groupA[1].teamId, status: 'ready' } });
    }
  } else {
    // Bug #4 fix: 5+ groups — Generic playoff seeding
    // Top of each group + best 2nd places to fill bracket
    const playoffSize = Math.pow(2, Math.ceil(Math.log2(numGroups)));
    const wildcardsNeeded = playoffSize - numGroups;

    // Collect all group winners (seeded by points)
    const groupWinners = groupLabels
      .map(label => ({ label, standing: standingsByGroup[label]?.[0] }))
      .filter(g => g.standing)
      .sort((a, b) => (b.standing?.points || 0) - (a.standing?.points || 0));

    // Collect all 2nd place teams for wildcards (sorted by points)
    const secondPlaceTeams = groupLabels
      .map(label => ({ label, standing: standingsByGroup[label]?.[1] }))
      .filter(g => g.standing)
      .sort((a, b) => (b.standing?.points || 0) - (a.standing?.points || 0));

    // Combine: group winners first, then best 2nd places
    const playoffTeams = [
      ...groupWinners.map(g => g.standing!.teamId),
      ...secondPlaceTeams.slice(0, wildcardsNeeded).map(g => g.standing!.teamId),
    ];

    // Seed into first playoff round matches using position labels
    const firstPlayoffRound = 2;
    const firstRoundMatches = await db.match.findMany({
      where: { tournamentId, round: firstPlayoffRound, bracket: 'upper' },
      orderBy: { matchNumber: 'asc' },
    });

    for (let i = 0; i < firstRoundMatches.length; i++) {
      const team1Id = playoffTeams[i * 2] || null;
      const team2Id = playoffTeams[i * 2 + 1] || null;

      if (team1Id && team2Id) {
        await db.match.update({
          where: { id: firstRoundMatches[i].id },
          data: { team1Id, team2Id, status: 'ready' },
        });
      } else if (team1Id) {
        await db.match.update({
          where: { id: firstRoundMatches[i].id },
          data: { team1Id, status: 'pending' },
        });
      }
    }
  }
}

// ===== Helper: Check if all matches complete → auto advance =====
async function checkAllMatchesComplete(tournamentId: string) {
  // Only count matches that have both teams assigned as "incomplete"
  // Matches with null teams are unfilled bracket slots and shouldn't block progression
  const playableIncomplete = await db.match.count({
    where: {
      tournamentId,
      status: { in: ['pending', 'ready', 'live'] },
      team1Id: { not: null },
      team2Id: { not: null },
    },
  });

  // Also check if there are any completed matches at all
  const completedCount = await db.match.count({
    where: { tournamentId, status: 'completed' },
  });

  if (playableIncomplete === 0 && completedCount > 0) {
    await db.tournament.update({ where: { id: tournamentId }, data: { status: 'finalization' } });
  } else {
    const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
    if (tournament?.status === 'bracket_generation') {
      await db.tournament.update({ where: { id: tournamentId }, data: { status: 'main_event' } });
    }
  }
}

// ===== UNDO SCORE (Bug #7 fix) =====
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { matchId } = body;

  if (!matchId) {
    return NextResponse.json({ error: 'matchId required' }, { status: 400 });
  }

  try {
    // Collect club stats reversals to apply AFTER the transaction
    const clubStatsQueue: { playerId: string; type: 'win' | 'loss' | 'draw'; gameDiff: number }[] = [];
    let tournamentDivision = '';
    let tournamentSeasonId = '';

    const result = await db.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: { select: { id: true, division: true, seasonId: true, format: true, name: true } },
          team1: { include: { teamPlayers: { include: { player: true } } } },
          team2: { include: { teamPlayers: { include: { player: true } } } },
          winner: true,
          loser: true,
        },
      });

      if (!match) throw new Error('Match not found');
      if (match.tournamentId !== id) throw new Error('Match does not belong to this tournament');
      if (match.status !== 'completed') throw new Error('Match is not completed');

      tournamentDivision = match.tournament.division;
      tournamentSeasonId = match.tournament.seasonId;

      const gameDiff = Math.abs((match.score1 || 0) - (match.score2 || 0));

      // Reverse club stats BEFORE resetting match (within transaction for consistency)
      if (match.winnerId && match.loserId) {
        const winningTeam = match.team1Id === match.winnerId ? match.team1! : match.team2!;
        const losingTeam = match.team1Id === match.loserId ? match.team1! : match.team2!;

        for (const tp of winningTeam.teamPlayers) {
          clubStatsQueue.push({ playerId: tp.playerId, type: 'win', gameDiff: -gameDiff });
        }
        for (const tp of losingTeam.teamPlayers) {
          clubStatsQueue.push({ playerId: tp.playerId, type: 'loss', gameDiff: gameDiff });
        }
      } else if (match.score1 === match.score2) {
        // Draw reversal
        for (const team of [match.team1!, match.team2!]) {
          for (const tp of team.teamPlayers) {
            clubStatsQueue.push({ playerId: tp.playerId, type: 'draw', gameDiff: 0 });
          }
        }
      }

      // Reverse points from PlayerPoint records
      const pointRecords = await tx.playerPoint.findMany({
        where: { matchId, tournamentId: id },
      });

      const pointsByPlayer = new Map<string, number>();
      for (const pr of pointRecords) {
        pointsByPlayer.set(pr.playerId, (pointsByPlayer.get(pr.playerId) || 0) + pr.amount);
      }

      for (const [playerId, totalPts] of pointsByPlayer) {
        await tx.player.updateMany({
          where: { id: playerId },
          data: { points: { decrement: totalPts } },
        });
      }

      // Reverse player stats
      if (match.winnerId && match.team1 && match.team2) {
        const winningTeam = match.team1Id === match.winnerId ? match.team1 : match.team2;
        const losingTeam = match.team1Id === match.loserId ? match.team1 : match.team2;

        for (const tp of winningTeam.teamPlayers) {
          await tx.player.update({
            where: { id: tp.playerId },
            data: {
              totalWins: { decrement: 1 },
              matches: { decrement: 1 },
              streak: 0,
            },
          });
        }
        if (losingTeam) {
          for (const tp of losingTeam.teamPlayers) {
            await tx.player.update({
              where: { id: tp.playerId },
              data: {
                matches: { decrement: 1 },
                streak: 0,
              },
            });
          }
        }
      }

      // Delete PlayerPoint records
      await tx.playerPoint.deleteMany({ where: { matchId, tournamentId: id } });

      // Reverse participation points
      const participations = await tx.participation.findMany({
        where: { tournamentId: id },
      });

      for (const p of participations) {
        const pts = pointsByPlayer.get(p.playerId) || 0;
        if (pts > 0) {
          await tx.participation.update({
            where: { id: p.id },
            data: { pointsEarned: Math.max(0, p.pointsEarned - pts) },
          });
        }
      }

      // Reset match
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          score1: null,
          score2: null,
          status: 'ready',
          winnerId: null,
          loserId: null,
          completedAt: null,
        },
      });

      // Clear the advanced team from next round matches
      // Find matches in later rounds that might have this team
      const laterMatches = await tx.match.findMany({
        where: {
          tournamentId: id,
          status: { in: ['pending', 'ready'] },
          bracket: { in: ['upper', 'lower', 'grand_final'] },
        },
      });

      for (const lm of laterMatches) {
        const updates: Record<string, unknown> = {};
        if (lm.team1Id && (lm.team1Id === match.winnerId || lm.team1Id === match.loserId)) {
          updates.team1Id = null;
        }
        if (lm.team2Id && (lm.team2Id === match.winnerId || lm.team2Id === match.loserId)) {
          updates.team2Id = null;
        }
        if (Object.keys(updates).length > 0) {
          await tx.match.update({
            where: { id: lm.id },
            data: { ...updates, status: 'pending' },
          });
        }
      }

      return { updatedMatch, match };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    // ===== CLUB STATS REVERSAL (outside transaction to avoid SQLite deadlock) =====
    if (clubStatsQueue.length > 0 && tournamentDivision && tournamentSeasonId) {
      for (const { playerId, type, gameDiff } of clubStatsQueue) {
        // Reverse the club stats by applying the opposite
        if (type === 'win') {
          // Undo win: decrement wins and points
          await updateClubStatsForPlayer(playerId, tournamentDivision, tournamentSeasonId, 'loss', gameDiff);
        } else if (type === 'loss') {
          // Undo loss: decrement losses (add a win with negative diff to effectively reverse)
          await updateClubStatsForPlayer(playerId, tournamentDivision, tournamentSeasonId, 'win', gameDiff);
        } else {
          // Undo draw: decrement points
          try {
            const membership = await db.clubMember.findFirst({
              where: {
                playerId,
                leftAt: null,
                profile: { seasonEntries: { some: { division: tournamentDivision, seasonId: tournamentSeasonId } } },
              },
              include: { profile: { include: { seasonEntries: { where: { division: tournamentDivision, seasonId: tournamentSeasonId } } } } },
            });
            if (membership?.profile.seasonEntries[0]) {
              await db.club.update({
                where: { id: membership.profile.seasonEntries[0].id },
                data: { points: { decrement: 1 } },
              });
            }
          } catch (e) {
            console.error('Club stats draw reversal failed (non-critical):', e);
          }
        }
      }
    }

    // Check if tournament should revert from finalization
    const tournament = await db.tournament.findUnique({ where: { id } });
    if (tournament?.status === 'finalization') {
      const playableIncomplete = await db.match.count({
        where: {
          tournamentId: id,
          status: { in: ['pending', 'ready', 'live'] },
          team1Id: { not: null },
          team2Id: { not: null },
        },
      });
      if (playableIncomplete > 0) {
        await db.tournament.update({ where: { id }, data: { status: 'main_event' } });
      }
    }

    return NextResponse.json(result.updatedMatch);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Undo score error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
