'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Shield,
  Heart,
  Crown,
  Swords,
  Clock,
  ChevronRight,
  Users,
  Medal,
  Target,
  Zap
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  seed: number;
  wins: number;
  losses: number;
  tierScore: number;
  members: { name: string; tier: string }[];
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number;
  awayScore: number;
  winnerId: string | null;
  status: 'PENDING' | 'LIVE' | 'COMPLETED' | 'BYE';
  scheduledAt?: Date;
}

interface TournamentBracketProps {
  tournamentId: string;
  tournamentName: string;
  division: 'MALE' | 'FEMALE';
  prizePool: number;
  status: string;
}

// Mock data for bracket visualization
const mockTeams: Team[] = [
  { id: '1', name: 'Team Alpha', seed: 1, wins: 3, losses: 0, tierScore: 8, members: [{ name: 'Player 1', tier: 'S' }, { name: 'Player 2', tier: 'A' }, { name: 'Player 3', tier: 'B' }] },
  { id: '2', name: 'Team Beta', seed: 2, wins: 2, losses: 1, tierScore: 7, members: [{ name: 'Player 4', tier: 'A' }, { name: 'Player 5', tier: 'A' }, { name: 'Player 6', tier: 'B' }] },
  { id: '3', name: 'Team Gamma', seed: 3, wins: 2, losses: 1, tierScore: 7, members: [{ name: 'Player 7', tier: 'S' }, { name: 'Player 8', tier: 'B' }, { name: 'Player 9', tier: 'B' }] },
  { id: '4', name: 'Team Delta', seed: 4, wins: 1, losses: 2, tierScore: 6, members: [{ name: 'Player 10', tier: 'A' }, { name: 'Player 11', tier: 'B' }, { name: 'Player 12', tier: 'B' }] },
  { id: '5', name: 'Team Epsilon', seed: 5, wins: 1, losses: 2, tierScore: 6, members: [{ name: 'Player 13', tier: 'B' }, { name: 'Player 14', tier: 'B' }, { name: 'Player 15', tier: 'B' }] },
  { id: '6', name: 'Team Zeta', seed: 6, wins: 0, losses: 3, tierScore: 5, members: [{ name: 'Player 16', tier: 'B' }, { name: 'Player 17', tier: 'B' }, { name: 'Player 18', tier: 'B' }] },
  { id: '7', name: 'Team Eta', seed: 7, wins: 0, losses: 3, tierScore: 5, members: [{ name: 'Player 19', tier: 'B' }, { name: 'Player 20', tier: 'B' }, { name: 'Player 21', tier: 'B' }] },
  { id: '8', name: 'Team Theta', seed: 8, wins: 0, losses: 3, tierScore: 5, members: [{ name: 'Player 22', tier: 'B' }, { name: 'Player 23', tier: 'B' }, { name: 'Player 24', tier: 'B' }] },
];

const mockMatches: Match[] = [
  // Quarter Finals
  { id: 'm1', round: 1, matchNumber: 1, homeTeam: mockTeams[0], awayTeam: mockTeams[7], homeScore: 2, awayScore: 0, winnerId: '1', status: 'COMPLETED' },
  { id: 'm2', round: 1, matchNumber: 2, homeTeam: mockTeams[3], awayTeam: mockTeams[4], homeScore: 1, awayScore: 2, winnerId: '5', status: 'COMPLETED' },
  { id: 'm3', round: 1, matchNumber: 3, homeTeam: mockTeams[1], awayTeam: mockTeams[6], homeScore: 2, awayScore: 0, winnerId: '2', status: 'COMPLETED' },
  { id: 'm4', round: 1, matchNumber: 4, homeTeam: mockTeams[2], awayTeam: mockTeams[5], homeScore: 2, awayScore: 1, winnerId: '3', status: 'COMPLETED' },
  // Semi Finals
  { id: 'm5', round: 2, matchNumber: 1, homeTeam: mockTeams[0], awayTeam: mockTeams[4], homeScore: 2, awayScore: 1, winnerId: '1', status: 'COMPLETED' },
  { id: 'm6', round: 2, matchNumber: 2, homeTeam: mockTeams[1], awayTeam: mockTeams[2], homeScore: 1, awayScore: 2, winnerId: '3', status: 'COMPLETED' },
  // Final
  { id: 'm7', round: 3, matchNumber: 1, homeTeam: mockTeams[0], awayTeam: mockTeams[2], homeScore: 0, awayScore: 0, winnerId: null, status: 'LIVE' },
];

export function TournamentBracket({ tournamentId, tournamentName, division, prizePool, status }: TournamentBracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [bracketView, setBracketView] = useState<'bracket' | 'list'>('bracket');

  const isMale = division === 'MALE';

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi Final';
    if (round === totalRounds - 2) return 'Quarter Final';
    return `Round ${round}`;
  };

  const totalRounds = Math.max(...mockMatches.map(m => m.round));

  // Group matches by round
  const matchesByRound = mockMatches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const MatchCard = ({ match, isCompact = false }: { match: Match; isCompact?: boolean }) => {
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';

    return (
      <div
        onClick={() => setSelectedMatch(match)}
        className={cn(
          "relative p-3 rounded-xl cursor-pointer transition-all",
          "border bg-black/30 hover:bg-black/50",
          isLive && "border-red-500 animate-pulse",
          isMale ? "border-red-500/30 hover:border-red-500/50" : "border-cyan-500/30 hover:border-cyan-500/50",
          selectedMatch?.id === match.id && (isMale ? "border-red-500 bg-red-500/10" : "border-cyan-500 bg-cyan-500/10")
        )}
      >
        {/* Match Status */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={cn(
            "text-[10px]",
            isLive && "bg-red-500/20 text-red-400 border-red-500/30",
            isCompleted && "bg-green-500/20 text-green-400 border-green-500/30",
            !isLive && !isCompleted && "bg-gray-500/20 text-gray-400 border-gray-500/30"
          )}>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1 animate-pulse" />}
            {match.status}
          </Badge>
          {match.scheduledAt && (
            <span className="text-[10px] text-gray-500">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(match.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-2">
          {/* Home Team */}
          <div className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            match.winnerId === match.homeTeam?.id && "bg-green-500/10 border border-green-500/30",
            !match.homeTeam && "opacity-50"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-5 h-5 rounded text-xs flex items-center justify-center font-bold",
                isMale ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
              )}>
                {match.homeTeam?.seed || '?'}
              </span>
              <span className="font-medium text-sm">{match.homeTeam?.name || 'TBD'}</span>
            </div>
            <span className={cn(
              "font-bold text-lg",
              match.winnerId === match.homeTeam?.id && "text-green-400"
            )}>
              {match.status !== 'PENDING' ? match.homeScore : '-'}
            </span>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className={cn(
              "w-8 h-px",
              isMale ? "bg-red-500/30" : "bg-cyan-500/30"
            )} />
            <span className="px-2 text-xs text-gray-500">VS</span>
            <div className={cn(
              "w-8 h-px",
              isMale ? "bg-red-500/30" : "bg-cyan-500/30"
            )} />
          </div>

          {/* Away Team */}
          <div className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            match.winnerId === match.awayTeam?.id && "bg-green-500/10 border border-green-500/30",
            !match.awayTeam && "opacity-50"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-5 h-5 rounded text-xs flex items-center justify-center font-bold",
                isMale ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
              )}>
                {match.awayTeam?.seed || '?'}
              </span>
              <span className="font-medium text-sm">{match.awayTeam?.name || 'TBD'}</span>
            </div>
            <span className={cn(
              "font-bold text-lg",
              match.winnerId === match.awayTeam?.id && "text-green-400"
            )}>
              {match.status !== 'PENDING' ? match.awayScore : '-'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            {isMale ? (
              <Shield className="w-6 h-6 text-red-400" />
            ) : (
              <Heart className="w-6 h-6 text-cyan-400" />
            )}
            <span className={isMale ? "text-gradient-red" : "text-gradient-cyan"}>
              {tournamentName}
            </span>
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Prize Pool: <span className="text-yellow-400 font-semibold">{formatCurrency(prizePool)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={bracketView === 'bracket' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBracketView('bracket')}
            className={cn(
              bracketView === 'bracket' && (isMale 
                ? "bg-gradient-to-r from-red-600 to-red-800 text-white" 
                : "bg-gradient-to-r from-cyan-400 to-pink-400 text-black")
            )}
          >
            <Target className="w-4 h-4 mr-1" />
            Bracket
          </Button>
          <Button
            variant={bracketView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBracketView('list')}
            className={cn(
              bracketView === 'list' && (isMale 
                ? "bg-gradient-to-r from-red-600 to-red-800 text-white" 
                : "bg-gradient-to-r from-cyan-400 to-pink-400 text-black")
            )}
          >
            <Users className="w-4 h-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {/* Bracket View */}
      {bracketView === 'bracket' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {Object.entries(matchesByRound).map(([round, matches]) => (
              <div key={round} className="flex flex-col gap-4">
                {/* Round Header */}
                <div className={cn(
                  "text-center py-2 px-4 rounded-lg font-semibold",
                  isMale ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
                )}>
                  {getRoundName(parseInt(round), totalRounds)}
                </div>

                {/* Matches */}
                <div className="flex flex-col gap-4 justify-around h-full">
                  {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}

            {/* Champion */}
            <div className="flex flex-col gap-4">
              <div className="text-center py-2 px-4 rounded-lg font-semibold bg-yellow-400/10 text-yellow-400">
                <Crown className="w-4 h-4 inline mr-1" />
                Champion
              </div>
              <div className={cn(
                "p-6 rounded-xl text-center",
                "border-2 border-dashed",
                isMale ? "border-red-500/30 bg-red-500/5" : "border-cyan-500/30 bg-cyan-500/5"
              )}>
                <Trophy className={cn(
                  "w-12 h-12 mx-auto mb-2",
                  "opacity-50"
                )} />
                <p className="text-gray-500 text-sm">To be determined</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {bracketView === 'list' && (
        <div className="space-y-4">
          {Object.entries(matchesByRound).map(([round, matches]) => (
            <div key={round}>
              <h4 className={cn(
                "text-lg font-semibold mb-3",
                isMale ? "text-red-400" : "text-cyan-400"
              )}>
                {getRoundName(parseInt(round), totalRounds)}
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team List */}
      <Card className={isMale ? "card-male" : "card-female"}>
        <CardHeader>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMale ? "text-red-400" : "text-cyan-400"
          )}>
            <Users className="w-5 h-5" />
            Tim Peserta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {mockTeams.map((team) => (
              <div
                key={team.id}
                className={cn(
                  "p-4 rounded-xl transition-all cursor-pointer",
                  "border bg-black/30 hover:bg-black/50",
                  isMale ? "border-red-500/20 hover:border-red-500/40" : "border-cyan-500/20 hover:border-cyan-500/40"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "w-6 h-6 rounded text-xs flex items-center justify-center font-bold",
                    isMale ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
                  )}>
                    {team.seed}
                  </span>
                  <Badge className={cn(
                    "text-[10px]",
                    team.wins > team.losses && "bg-green-500/10 text-green-400 border-green-500/30",
                    team.wins < team.losses && "bg-red-500/10 text-red-400 border-red-500/30",
                    team.wins === team.losses && "bg-gray-500/10 text-gray-400 border-gray-500/30"
                  )}>
                    {team.wins}W - {team.losses}L
                  </Badge>
                </div>
                <h4 className="font-semibold mb-2">{team.name}</h4>
                <div className="flex flex-wrap gap-1">
                  {team.members.map((member, i) => (
                    <Badge
                      key={i}
                      className={cn(
                        "text-[10px]",
                        member.tier === 'S' && "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
                        member.tier === 'A' && "bg-purple-400/10 text-purple-400 border-purple-400/30",
                        member.tier === 'B' && "bg-cyan-400/10 text-cyan-400 border-cyan-400/30"
                      )}
                    >
                      {member.tier}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Match Details */}
      {selectedMatch && (
        <Card className={cn(
          isMale ? "card-male" : "card-female"
        )}>
          <CardHeader>
            <CardTitle className={cn(
              "flex items-center gap-2",
              isMale ? "text-red-400" : "text-cyan-400"
            )}>
              <Swords className="w-5 h-5" />
              Detail Pertandingan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Home Team */}
              <div className={cn(
                "text-center p-6 rounded-xl",
                selectedMatch.winnerId === selectedMatch.homeTeam?.id && "bg-green-500/10 border border-green-500/30",
                "bg-black/30"
              )}>
                <span className={cn(
                  "w-10 h-10 rounded-lg text-lg flex items-center justify-center font-bold mx-auto mb-3",
                  isMale ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
                )}>
                  {selectedMatch.homeTeam?.seed}
                </span>
                <h4 className="text-xl font-bold mb-2">{selectedMatch.homeTeam?.name}</h4>
                <p className="text-3xl font-bold text-yellow-400">{selectedMatch.homeScore}</p>
                {selectedMatch.winnerId === selectedMatch.homeTeam?.id && (
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                    <Trophy className="w-3 h-3 mr-1" />
                    Winner
                  </Badge>
                )}
              </div>

              {/* VS */}
              <div className="flex flex-col items-center justify-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                  selectedMatch.status === 'LIVE' ? "bg-red-500/20 animate-pulse" : "bg-gray-800"
                )}>
                  {selectedMatch.status === 'LIVE' ? (
                    <Zap className="w-8 h-8 text-red-400" />
                  ) : (
                    <Swords className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <Badge className={cn(
                  selectedMatch.status === 'LIVE' && "bg-red-500/20 text-red-400 border-red-500/30",
                  selectedMatch.status === 'COMPLETED' && "bg-green-500/20 text-green-400 border-green-500/30",
                  selectedMatch.status === 'PENDING' && "bg-gray-500/20 text-gray-400 border-gray-500/30"
                )}>
                  {selectedMatch.status}
                </Badge>
              </div>

              {/* Away Team */}
              <div className={cn(
                "text-center p-6 rounded-xl",
                selectedMatch.winnerId === selectedMatch.awayTeam?.id && "bg-green-500/10 border border-green-500/30",
                "bg-black/30"
              )}>
                <span className={cn(
                  "w-10 h-10 rounded-lg text-lg flex items-center justify-center font-bold mx-auto mb-3",
                  isMale ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
                )}>
                  {selectedMatch.awayTeam?.seed}
                </span>
                <h4 className="text-xl font-bold mb-2">{selectedMatch.awayTeam?.name}</h4>
                <p className="text-3xl font-bold text-yellow-400">{selectedMatch.awayScore}</p>
                {selectedMatch.winnerId === selectedMatch.awayTeam?.id && (
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                    <Trophy className="w-3 h-3 mr-1" />
                    Winner
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
