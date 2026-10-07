'use client';

import ChampionshipBracket, { type BracketMatch, type Team } from './ChampionshipBracket';

export interface MensTeamStat {
  teamIndex: number;
  teamName: string;
  players: string[];
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  matchesPlayed: number;
}

interface Props {
  championship: 'gold' | 'silver' | 'bronze';
  matches: BracketMatch[];
  teams: Team[];
  standings: MensTeamStat[];
  onScoreMatch?: (matchIndex: number, match: BracketMatch, score1: number, score2: number) => void;
}

const COLORS = {
  gold: 'text-yellow-400',
  silver: 'text-slate-300',
  bronze: 'text-orange-400',
};

function isWomen(m: BracketMatch) {
  return (m as any).category === 'women';
}

function StandingsTable({
  title,
  standings,
  accent,
  highlightTop,
}: {
  title: string;
  standings: MensTeamStat[];
  accent: string;
  highlightTop?: number;
}) {
  if (!standings.length) return null;
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50">
      <div className="px-4 py-2 border-b border-slate-700">
        <p className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>{title}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-cyan-400">
            {['#', 'Team', 'MP', 'W', 'L', '+/−', 'PF'].map((h) => (
              <th key={h} className="text-left py-2 px-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.teamIndex} className={`border-b border-slate-700/40 ${highlightTop && i < highlightTop ? 'bg-white/4' : ''}`}>
              <td className="py-2 px-2 text-slate-500">{i + 1}</td>
              <td className="py-2 px-2">
                <p className="text-white font-medium">{row.teamName}</p>
                <p className="text-[11px] text-slate-500">{row.players.join(' & ')}</p>
                {highlightTop && i < highlightTop && (
                  <p className="text-[10px] text-cyan-400">
                    {highlightTop === 2 ? (i === 0 ? 'Champion' : 'Runner-Up') : '→ Semi-final'}
                  </p>
                )}
              </td>
              <td className="py-2 px-2 text-slate-400">{row.matchesPlayed}</td>
              <td className="py-2 px-2 text-green-400">{row.wins}</td>
              <td className="py-2 px-2 text-red-400">{row.losses}</td>
              <td className={`py-2 px-2 font-semibold ${row.pointDifference > 0 ? 'text-green-400' : row.pointDifference < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {row.pointDifference > 0 ? '+' : ''}{row.pointDifference}
              </td>
              <td className="py-2 px-2 text-slate-400">{row.pointsFor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MensChampionshipPanel({ championship, matches, teams, standings, onScoreMatch }: Props) {
  const men = matches.filter((m) => !isWomen(m));
  const women = matches.filter(isWomen);
  const rrMatches = men.filter((m) => m.round === 'round_robin');
  const goldComplete = championship === 'gold' && rrMatches.length > 0 && rrMatches.every((m) => m.status === 'completed') && standings.length > 0;
  const goldChampion = goldComplete ? standings[0] : null;
  const goldRunner = goldComplete ? standings[1] : null;

  if (!men.length && !women.length) {
    return <div className="text-slate-400 text-center py-8">No {championship} matches yet.</div>;
  }

  return (
    <div className="space-y-5">
      {men.length > 0 && (
        <div className="space-y-4">
          {championship === 'gold' && goldChampion && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-900/20 p-4">
                <p className="text-xs uppercase tracking-widest text-yellow-400 mb-1">Gold Champion</p>
                <p className="text-lg font-bold text-yellow-300">{goldChampion.teamName}</p>
                <p className="text-xs text-slate-400">{goldChampion.players.join(' & ')}</p>
                <p className="text-xs text-slate-500 mt-1">{goldChampion.wins}W · {goldChampion.pointDifference > 0 ? '+' : ''}{goldChampion.pointDifference} PD</p>
              </div>
              {goldRunner && (
                <div className="rounded-xl border border-slate-500/40 bg-slate-800/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-300 mb-1">Gold Runner-Up</p>
                  <p className="text-lg font-bold text-white">{goldRunner.teamName}</p>
                  <p className="text-xs text-slate-400">{goldRunner.players.join(' & ')}</p>
                  <p className="text-xs text-slate-500 mt-1">{goldRunner.wins}W · {goldRunner.pointDifference > 0 ? '+' : ''}{goldRunner.pointDifference} PD</p>
                </div>
              )}
            </div>
          )}
          {championship === 'gold' && (
            <StandingsTable
              title="Men’s Gold leaderboard"
              standings={standings}
              accent={COLORS.gold}
              highlightTop={goldComplete ? 2 : undefined}
            />
          )}
          {championship === 'silver' && (
            <StandingsTable title="Men’s Silver leaderboard (6 winners)" standings={standings} accent={COLORS.silver} highlightTop={4} />
          )}
          {championship === 'bronze' && (
            <StandingsTable title="Men’s Bronze leaderboard" standings={standings} accent={COLORS.bronze} highlightTop={4} />
          )}
          <ChampionshipBracket championship={championship} matches={men} teams={teams} onScoreMatch={onScoreMatch} />
        </div>
      )}

      {women.length > 0 && (
        <div className={men.length ? 'pt-4 border-t border-white/8' : ''}>
          <p className="text-xs uppercase tracking-widest text-pink-300 mb-2">Women’s {championship} (existing knockout until women’s format is set)</p>
          <ChampionshipBracket championship={championship} matches={women} teams={teams} onScoreMatch={onScoreMatch} />
        </div>
      )}
    </div>
  );
}
