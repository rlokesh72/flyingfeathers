'use client';

import { buildOverallStandings, type ChampionshipTier, type OverallRow } from '@/lib/championship/overallStandings';

interface MatchLike {
  championship: ChampionshipTier;
  category?: string;
  round: string;
  team1Index?: number;
  team2Index?: number;
  team1Score?: number;
  team2Score?: number;
  winnerIndex?: number;
  status: string;
}

interface Team {
  name: string;
  players: string[];
}

const TIER: Record<ChampionshipTier, { title: string; accent: string; border: string }> = {
  gold: { title: 'Gold', accent: 'text-yellow-400', border: 'border-yellow-500/30' },
  silver: { title: 'Silver', accent: 'text-slate-300', border: 'border-slate-500/30' },
  bronze: { title: 'Bronze', accent: 'text-orange-400', border: 'border-orange-500/30' },
};

function pdClass(pd: number) {
  if (pd > 0) return 'text-green-400';
  if (pd < 0) return 'text-red-400';
  return 'text-slate-400';
}

function CategoryTable({
  tier,
  rows,
}: {
  tier: ChampionshipTier;
  rows: OverallRow[];
}) {
  const meta = TIER[tier];
  if (!rows.length) return null;
  return (
    <div className={`border rounded-xl overflow-hidden bg-slate-900/50 ${meta.border}`}>
      <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-widest ${meta.accent}`}>{meta.title}</p>
        <p className="text-[11px] text-slate-500">{rows.length} teams</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-cyan-400">
              {['#', 'Team', 'MP', 'W', 'L', '+/−', 'PF', 'PA', 'Result'].map((h) => (
                <th key={h} className="text-left py-2 px-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.teamIndex} className="border-b border-slate-700/40 last:border-0">
                <td className="py-2 px-2 text-slate-500">{row.place}</td>
                <td className="py-2 px-2">
                  <p className="text-white font-medium">{row.teamName}</p>
                  <p className="text-[11px] text-slate-500">{row.players.join(' & ')}</p>
                </td>
                <td className="py-2 px-2 text-slate-400">{row.matchesPlayed}</td>
                <td className="py-2 px-2 text-green-400">{row.wins}</td>
                <td className="py-2 px-2 text-red-400">{row.losses}</td>
                <td className={`py-2 px-2 font-semibold ${pdClass(row.pointDifference)}`}>
                  {row.pointDifference > 0 ? '+' : ''}{row.pointDifference}
                </td>
                <td className="py-2 px-2 text-slate-400">{row.pointsFor}</td>
                <td className="py-2 px-2 text-slate-400">{row.pointsAgainst}</td>
                <td className={`py-2 px-2 text-xs ${row.label ? meta.accent : 'text-slate-600'}`}>
                  {row.label || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GenderBlock({
  title,
  accent,
  standings,
}: {
  title: string;
  accent: string;
  standings: Record<ChampionshipTier, OverallRow[]>;
}) {
  const hasAny = standings.gold.length + standings.silver.length + standings.bronze.length > 0;
  if (!hasAny) return null;
  return (
    <div className="space-y-3">
      <p className={`text-sm font-semibold uppercase tracking-widest ${accent}`}>{title}</p>
      <CategoryTable tier="gold" rows={standings.gold} />
      <CategoryTable tier="silver" rows={standings.silver} />
      <CategoryTable tier="bronze" rows={standings.bronze} />
    </div>
  );
}

export default function OverallStandings({
  matches,
  teams,
  category,
}: {
  matches: MatchLike[];
  teams: Team[];
  category?: 'men' | 'women';
}) {
  const { men, women } = buildOverallStandings(matches, teams);
  const showMen = category !== 'women';
  const showWomen = category !== 'men';
  const empty =
    (showMen ? men.gold.length + men.silver.length + men.bronze.length : 0) +
    (showWomen ? women.gold.length + women.silver.length + women.bronze.length : 0) === 0;

  return (
    <div className="space-y-8">
      <div className="text-slate-400 text-sm font-semibold">📊 Overall standings</div>
      {empty ? (
        <div className="text-slate-500 text-sm text-center py-8">
          Championship results will appear here once matches are played.
        </div>
      ) : (
        <>
          {showMen && <GenderBlock title="Men" accent="text-blue-300" standings={men} />}
          {showWomen && <GenderBlock title="Women" accent="text-pink-300" standings={women} />}
        </>
      )}
    </div>
  );
}
