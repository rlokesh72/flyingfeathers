'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Feather, ArrowLeft, Trophy, Users, CalendarDays, ChevronRight, Swords, BarChart2, Medal } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────── */
interface TeamStat { teamIndex: number; teamName: string; players: string[]; wins: number; losses: number; pointsFor: number; pointsAgainst: number; pointDifference: number; matchesPlayed: number; }
interface Group { _id: string; name: string; sequence: number; teamIndices: number[]; standings?: TeamStat[]; }
interface BracketMatch { _id: string; championship: 'gold'|'silver'|'bronze'; round: string; sequence: number; team1Index?: number; team2Index?: number; team1Score?: number; team2Score?: number; winnerIndex?: number; status: string; team1?: {name:string;players:string[]}|null; team2?: {name:string;players:string[]}|null; winner?: {name:string;players:string[]}|null; }
interface Match { team1Index: number; team2Index: number; court?: number; timeSlot?: number; team1Score?: number; team2Score?: number; status: string; phase?: string; groupIndex?: number; round?: string; }
interface QEntry { groupName: string; rank: number; teamIndex: number; teamName: string; championship: 'gold'|'silver'|'bronze'; }
interface Tournament { _id: string; name: string; description?: string; numberOfTeams: number; numberOfCourts?: number; tournamentFormat?: string; teamsPerGroup?: number; numberOfGroups?: number; maxTeams?: number; championshipStatus?: string; groups?: Group[]; qualificationSnapshot?: QEntry[]; bracketMatches?: BracketMatch[]; teams: {name:string;players:string[]}[]; matches: Match[]; scheduledDate: string; status: string; createdBy?: {name:string;email:string}; createdAt: string; }

/* ─── Constants ─────────────────────────────────────────────── */
const ROUND_ORDER = ['round_of_32','round_of_16','quarter_final','semi_final','final'];
const ROUND_LABELS: Record<string,string> = { round_of_32:'R32', round_of_16:'R16', quarter_final:'QF', semi_final:'SF', final:'Final' };
const C_COLORS: Record<string,{accent:string;border:string;bg:string;pill:string}> = {
  gold:   { accent:'text-yellow-400', border:'border-yellow-500/30', bg:'bg-yellow-900/20',  pill:'bg-yellow-900/40 text-yellow-300 border border-yellow-600/40' },
  silver: { accent:'text-slate-300',  border:'border-slate-500/30',  bg:'bg-slate-800/40',   pill:'bg-slate-700/50 text-slate-200 border border-slate-500/40' },
  bronze: { accent:'text-orange-400', border:'border-orange-500/30', bg:'bg-orange-900/20',  pill:'bg-orange-900/40 text-orange-300 border border-orange-600/40' },
};

/* ─── Small shared components ───────────────────────────────── */
function StatBadge({ label, value, color='text-cyan-400' }: { label:string; value:string|number; color?:string }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string,string> = {
    registration_open:      'bg-green-900/30 text-green-400 border-green-600/40',
    registration_closed:    'bg-yellow-900/30 text-yellow-400 border-yellow-600/40',
    group_stage_active:     'bg-cyan-900/30 text-cyan-400 border-cyan-600/40',
    group_stage_completed:  'bg-purple-900/30 text-purple-400 border-purple-600/40',
    championships_active:   'bg-pink-900/30 text-pink-400 border-pink-600/40',
    completed:              'bg-slate-700/50 text-slate-300 border-slate-600/40',
    'in-progress':          'bg-cyan-900/30 text-cyan-400 border-cyan-600/40',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${map[status] ?? 'bg-slate-800 text-slate-400 border-slate-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/* ─── Tab: Groups & Standings ───────────────────────────────── */
function GroupsTab({ tournament }: { tournament: Tournament }) {
  const isChamp = tournament.tournamentFormat === 'championship-groups';
  const groups = tournament.groups ?? [];

  // ── Non-championship: show flat tournament.standings ──────────
  if (!isChamp) {
    const rows: any[] = (tournament as any).standings ?? [];
    if (!rows.length) {
      return <EmptyState icon="📊" title="No standings yet" sub="Standings will appear once the tournament is underway." />;
    }
    return (
      <div className="bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-800/60 border-b border-white/6">
          <span className="text-amber-400 font-bold text-sm">Overall Standings</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/6 text-[11px] text-slate-500 uppercase tracking-wider">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-3 py-2">MP</th>
              <th className="text-center px-3 py-2">W</th>
              <th className="text-center px-3 py-2">L</th>
              <th className="text-center px-3 py-2">+/-</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((stat: any, rank: number) => (
              <tr key={rank} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 text-slate-500 font-medium">{rank + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{stat.teamName ?? tournament.teams[stat.teamIndex]?.name}</p>
                  <p className="text-xs text-slate-500">{(stat.players ?? []).join(' & ')}</p>
                </td>
                <td className="text-center px-3 py-3 text-slate-400">{stat.matchesPlayed}</td>
                <td className="text-center px-3 py-3 text-green-400 font-semibold">{stat.wins}</td>
                <td className="text-center px-3 py-3 text-red-400 font-semibold">{stat.losses}</td>
                <td className={`text-center px-3 py-3 font-bold ${stat.pointDifference > 0 ? 'text-green-400' : stat.pointDifference < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {stat.pointDifference > 0 ? '+' : ''}{stat.pointDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Championship-groups: show group tables ────────────────────
  if (!groups.length) {
    return <EmptyState icon="🏸" title="Groups not drawn yet" sub="Check back once the admin generates the group draw." />;
  }
  return (
    <div className="space-y-6">
      {groups.map(group => {
        const rows = group.standings ?? group.teamIndices.map((ti) => ({
          teamIndex: ti, teamName: tournament.teams[ti]?.name ?? `Team ${ti}`,
          players: tournament.teams[ti]?.players ?? [],
          wins:0, losses:0, matchesPlayed:0, pointDifference:0, pointsFor:0, pointsAgainst:0,
        }));
        return (
          <div key={group._id} className="bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-800/60 border-b border-white/6 flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">{group.name}</span>
              <span className="text-slate-600 text-xs">{group.teamIndices.length} teams</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6 text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Team</th>
                  <th className="text-center px-3 py-2">MP</th>
                  <th className="text-center px-3 py-2">W</th>
                  <th className="text-center px-3 py-2">L</th>
                  <th className="text-center px-3 py-2">+/-</th>
                  <th className="text-center px-3 py-2 hidden sm:table-cell">Qual</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((stat: any, rank: number) => {
                  const qe = tournament.qualificationSnapshot?.find(q => q.teamIndex === stat.teamIndex);
                  const projected = !qe
                    ? tournament.qualificationSnapshot === undefined
                      ? (tournament as any).qualificationRules?.gold?.includes(rank+1) ? 'gold'
                        : (tournament as any).qualificationRules?.silver?.includes(rank+1) ? 'silver'
                        : (tournament as any).qualificationRules?.bronze?.includes(rank+1) ? 'bronze' : null
                      : null
                    : null;
                  const qual = qe?.championship ?? projected;
                  return (
                    <tr key={rank} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-medium">{rank+1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{stat.teamName ?? tournament.teams[stat.teamIndex]?.name}</p>
                        <p className="text-xs text-slate-500">{(stat.players ?? tournament.teams[stat.teamIndex]?.players ?? []).join(' & ')}</p>
                      </td>
                      <td className="text-center px-3 py-3 text-slate-400">{stat.matchesPlayed}</td>
                      <td className="text-center px-3 py-3 text-green-400 font-semibold">{stat.wins}</td>
                      <td className="text-center px-3 py-3 text-red-400 font-semibold">{stat.losses}</td>
                      <td className={`text-center px-3 py-3 font-bold ${stat.pointDifference > 0 ? 'text-green-400' : stat.pointDifference < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {stat.pointDifference > 0 ? '+' : ''}{stat.pointDifference}
                      </td>
                      <td className="text-center px-3 py-3 hidden sm:table-cell">
                        {qual ? (
                          <span className={`text-xs ${qual === 'gold' ? 'text-yellow-400' : qual === 'silver' ? 'text-slate-300' : 'text-orange-400'}`}>
                            {qual === 'gold' ? '🥇' : qual === 'silver' ? '🥈' : '🥉'}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tab: Group Matches ────────────────────────────────────── */
function MatchesTab({ tournament }: { tournament: Tournament }) {
  const isChamp = tournament.tournamentFormat === 'championship-groups';

  // Championship-groups: only group-phase matches. Others: all matches.
  const groupMatches = tournament.matches
    .map((m, i) => ({ ...m, index: i }))
    .filter(m => !isChamp || m.phase === 'group');

  if (!groupMatches.length) {
    return <EmptyState icon="📋" title="No matches yet" sub="Matches will appear once the tournament begins." />;
  }

  const groups = tournament.groups ?? [];

  // For non-champ tournaments group all matches under a single "bucket" (groupIndex 0)
  // For champ tournaments, bucket by groupIndex
  const byGroup: Record<number, typeof groupMatches> = {};
  groupMatches.forEach(m => {
    const g = isChamp ? (m.groupIndex ?? 0) : 0;
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(m);
  });

  const done  = groupMatches.filter(m => m.status === 'completed').length;
  const total = groupMatches.length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">{isChamp ? 'Group stage progress' : 'Match progress'}</span>
          <span className="text-white font-semibold">{done}/{total} played</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all" style={{ width: total ? `${(done/total)*100}%` : '0%' }} />
        </div>
      </div>

      {Object.entries(byGroup).map(([gIdx, matches]) => {
        const group = isChamp ? groups.find(g => g.sequence === Number(gIdx)) : null;
        return (
          <div key={gIdx}>
            {isChamp && <p className="text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wide">{group?.name ?? `Group ${Number(gIdx)+1}`}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {matches.map(match => {
                const t1 = tournament.teams[match.team1Index];
                const t2 = tournament.teams[match.team2Index];
                const done = match.status === 'completed';
                const t1Wins = done && (match.team1Score ?? 0) > (match.team2Score ?? 0);
                const t2Wins = done && (match.team2Score ?? 0) > (match.team1Score ?? 0);
                return (
                  <div key={match.index} className={`rounded-2xl border p-4 ${done ? 'bg-slate-900/60 border-white/8' : 'bg-slate-900/40 border-white/5'}`}>
                    <div className="flex items-center gap-2">
                      {/* Team 1 */}
                      <div className={`flex-1 min-w-0 ${t1Wins ? 'opacity-100' : done ? 'opacity-50' : 'opacity-80'}`}>
                        <p className={`font-semibold text-sm truncate ${t1Wins ? 'text-white' : 'text-slate-300'}`}>{t1?.name ?? 'TBD'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{t1?.players?.join(' & ')}</p>
                      </div>
                      {/* Score */}
                      <div className="text-center shrink-0 px-2">
                        {done ? (
                          <p className="text-lg font-bold text-white tabular-nums">{match.team1Score} <span className="text-slate-500">–</span> {match.team2Score}</p>
                        ) : (
                          <p className="text-xs text-slate-600 font-medium">vs</p>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${done ? 'text-green-400 bg-green-900/20' : 'text-slate-600'}`}>
                          {done ? '✓ Done' : '⏳'}
                        </span>
                      </div>
                      {/* Team 2 */}
                      <div className={`flex-1 min-w-0 text-right ${t2Wins ? 'opacity-100' : done ? 'opacity-50' : 'opacity-80'}`}>
                        <p className={`font-semibold text-sm truncate ${t2Wins ? 'text-white' : 'text-slate-300'}`}>{t2?.name ?? 'TBD'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{t2?.players?.join(' & ')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tab: Championships ────────────────────────────────────── */
function ChampionshipsTab({ tournament }: { tournament: Tournament }) {
  const [sub, setSub] = useState<'gold'|'silver'|'bronze'|'overall'>('gold');
  const bms = tournament.bracketMatches ?? [];

  if (!bms.length) {
    const cs = tournament.championshipStatus ?? '';
    return <EmptyState icon="🏆" title={cs === 'group_stage_completed' ? 'Brackets generating soon' : 'Championships not started'} sub="Knockout brackets will appear here once the group stage is confirmed." />;
  }

  const byChamp = {
    gold:   bms.filter(m => m.championship === 'gold'),
    silver: bms.filter(m => m.championship === 'silver'),
    bronze: bms.filter(m => m.championship === 'bronze'),
  };

  function derivePlacements(matches: BracketMatch[]) {
    const resolve = (idx?: number, obj?: {name:string;players:string[]}|null) =>
      obj ?? (idx !== undefined && idx >= 0 ? tournament.teams[idx] ?? null : null);
    const placements: {place:number;team:{name:string;players:string[]}|null;label:string}[] = [];
    const finalM = matches.find(m => m.round === 'final');
    const semiMs = matches.filter(m => m.round === 'semi_final');
    if (finalM?.status === 'completed') {
      const winner = resolve(finalM.winnerIndex, finalM.winner);
      const loserIdx = finalM.winnerIndex === finalM.team1Index ? finalM.team2Index : finalM.team1Index;
      const loserObj = finalM.winnerIndex === finalM.team1Index ? finalM.team2 : finalM.team1;
      if (winner) placements.push({ place:1, team: winner, label:'Champion' });
      if (resolve(loserIdx, loserObj)) placements.push({ place:2, team: resolve(loserIdx, loserObj), label:'Runner-Up' });
    }
    semiMs.forEach(m => {
      if (m.status !== 'completed') return;
      const loserIdx = m.winnerIndex === m.team1Index ? m.team2Index : m.team1Index;
      const loserObj = m.winnerIndex === m.team1Index ? m.team2 : m.team1;
      const loser = resolve(loserIdx, loserObj);
      if (loser) placements.push({ place:3, team: loser, label:'3rd Place' });
    });
    return placements;
  }

  function BracketView({ championship }: { championship: 'gold'|'silver'|'bronze' }) {
    const matches = byChamp[championship];
    const cc = C_COLORS[championship];
    const rounds = ROUND_ORDER.filter(r => matches.some(m => m.round === r));
    const placements = derivePlacements(matches);
    const champion = placements.find(p => p.place === 1);
    const runnerUp = placements.find(p => p.place === 2);
    const thirds   = placements.filter(p => p.place === 3);

    return (
      <div className="space-y-5">
        {/* Champion banner */}
        {champion?.team && (
          <div className={`rounded-2xl border p-4 text-center ${cc.border} ${cc.bg}`}>
            <p className="text-2xl mb-1">🏆</p>
            <p className={`font-bold text-lg ${cc.accent}`}>{champion.team.name}</p>
            <p className="text-xs text-slate-500">{champion.team.players?.join(' & ')}</p>
            <p className={`text-xs mt-1 ${cc.accent} opacity-70`}>{championship.charAt(0).toUpperCase() + championship.slice(1)} Champion</p>
          </div>
        )}

        {/* Podium row */}
        {(runnerUp?.team || thirds.length > 0) && (
          <div className="flex gap-3">
            {runnerUp?.team && (
              <div className="flex-1 bg-slate-900/60 border border-slate-600/30 rounded-2xl p-3 text-center">
                <p className="text-slate-300 text-sm mb-0.5">🥈 Runner-Up</p>
                <p className="font-semibold text-white text-sm">{runnerUp.team.name}</p>
                <p className="text-[11px] text-slate-500">{runnerUp.team.players?.join(' & ')}</p>
              </div>
            )}
            {thirds[0]?.team && (
              <div className="flex-1 bg-slate-900/60 border border-orange-600/20 rounded-2xl p-3 text-center">
                <p className="text-orange-400 text-sm mb-0.5">🥉 3rd Place</p>
                <p className="font-semibold text-white text-sm">{thirds[0].team.name}</p>
                <p className="text-[11px] text-slate-500">{thirds[0].team.players?.join(' & ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Bracket */}
        <div className={`rounded-2xl border overflow-hidden ${cc.border}`}>
          <div className={`px-4 py-2.5 border-b ${cc.border} ${cc.bg}`}>
            <p className={`text-sm font-semibold ${cc.accent}`}>
              {championship === 'gold' ? '🥇' : championship === 'silver' ? '🥈' : '🥉'} {championship.charAt(0).toUpperCase() + championship.slice(1)} Bracket
            </p>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-4 p-4 min-w-max">
              {rounds.map(round => (
                <div key={round} className="flex flex-col gap-3 min-w-[160px]">
                  <p className={`text-[11px] font-bold uppercase tracking-widest text-center ${cc.accent}`}>{ROUND_LABELS[round]}</p>
                  {matches.filter(m => m.round === round).sort((a,b) => a.sequence - b.sequence).map(bm => {
                    const t1 = bm.team1?.name ?? (bm.team1Index !== undefined && bm.team1Index >= 0 ? tournament.teams[bm.team1Index]?.name : null) ?? 'TBD';
                    const t2 = bm.team2?.name ?? (bm.team2Index !== undefined && bm.team2Index >= 0 ? tournament.teams[bm.team2Index]?.name : null) ?? 'TBD';
                    const p1 = bm.team1?.players ?? (bm.team1Index !== undefined && bm.team1Index >= 0 ? tournament.teams[bm.team1Index]?.players : null) ?? [];
                    const p2 = bm.team2?.players ?? (bm.team2Index !== undefined && bm.team2Index >= 0 ? tournament.teams[bm.team2Index]?.players : null) ?? [];
                    const winnerName = bm.winner?.name ?? (bm.winnerIndex !== undefined && bm.winnerIndex >= 0 ? tournament.teams[bm.winnerIndex]?.name : null);
                    const t1Wins = bm.status === 'completed' && !!winnerName && winnerName === t1;
                    const t2Wins = bm.status === 'completed' && !!winnerName && winnerName === t2;
                    const isTBD = t1 === 'TBD' && t2 === 'TBD';
                    return (
                      <div key={bm._id} className={`rounded-xl border p-2.5 ${isTBD ? 'opacity-30' : ''} ${bm.status === 'completed' ? `${cc.border} ${cc.bg}` : 'border-white/8 bg-slate-900/60'}`}>
                        {/* Team 1 */}
                        <div className={`flex items-center justify-between gap-1 py-1 px-1 rounded text-xs ${t1Wins ? 'text-green-400 font-semibold' : 'text-slate-300'}`}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{t1}</p>
                            {p1.length > 0 && <p className="text-[10px] text-slate-600 truncate">{p1.join(' & ')}</p>}
                          </div>
                          {bm.status === 'completed' && <span className={`font-mono ml-1 shrink-0 ${t1Wins ? 'text-green-400' : 'text-slate-500'}`}>{bm.team1Score}</span>}
                        </div>
                        <div className="my-1 border-t border-white/6" />
                        {/* Team 2 */}
                        <div className={`flex items-center justify-between gap-1 py-1 px-1 rounded text-xs ${t2Wins ? 'text-green-400 font-semibold' : 'text-slate-300'}`}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{t2}</p>
                            {p2.length > 0 && <p className="text-[10px] text-slate-600 truncate">{p2.join(' & ')}</p>}
                          </div>
                          {bm.status === 'completed' && <span className={`font-mono ml-1 shrink-0 ${t2Wins ? 'text-green-400' : 'text-slate-500'}`}>{bm.team2Score}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function OverallView() {
    type P = { place:number; tier:string; team:string; players:string; badge:string };
    const all: P[] = [];
    const basePlaces: Record<string,number> = { gold:1, silver:5, bronze:9 };
    (['gold','silver','bronze'] as const).forEach(tier => {
      const ps = derivePlacements(byChamp[tier]);
      ps.forEach(p => {
        if (!p.team) return;
        const absPlace = (basePlaces[tier] ?? 1) + p.place - 1;
        all.push({ place: absPlace, tier, team: p.team.name, players: p.team.players?.join(' & ') ?? '', badge: p.place === 1 ? '🏆' : p.place === 2 ? '🎖️' : '' });
      });
    });
    all.sort((a,b) => a.place - b.place);
    if (!all.length) return <EmptyState icon="📊" title="No results yet" sub="Log championship matches to see the overall standings." />;
    return (
      <div className="space-y-2">
        {all.map((p, i) => (
          <div key={i} className={`flex items-center gap-4 rounded-2xl px-4 py-3 border ${C_COLORS[p.tier as 'gold'|'silver'|'bronze'].border} ${C_COLORS[p.tier as 'gold'|'silver'|'bronze'].bg}`}>
            <div className="flex items-center gap-1.5 w-8 shrink-0">
              <span className="text-slate-500 text-sm font-bold">{p.place}</span>
              {p.badge && <span>{p.badge}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{p.team}</p>
              <p className="text-xs text-slate-500 truncate">{p.players}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${C_COLORS[p.tier as 'gold'|'silver'|'bronze'].pill}`}>{p.tier}</span>
          </div>
        ))}
      </div>
    );
  }

  const tabs: {id:'gold'|'silver'|'bronze'|'overall'; label:string; icon:string}[] = [
    { id:'gold',    label:'Gold',    icon:'🥇' },
    { id:'silver',  label:'Silver',  icon:'🥈' },
    { id:'bronze',  label:'Bronze',  icon:'🥉' },
    { id:'overall', label:'Overall', icon:'📊' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => {
          const hasBm = t.id !== 'overall' && byChamp[t.id as 'gold'|'silver'|'bronze'].length > 0;
          const show  = t.id === 'overall' || hasBm;
          if (!show) return null;
          return (
            <button key={t.id} onClick={() => setSub(t.id)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150
                ${sub === t.id
                  ? t.id === 'gold' ? 'bg-yellow-700 text-white' : t.id === 'silver' ? 'bg-slate-500 text-white' : t.id === 'bronze' ? 'bg-orange-700 text-white' : 'bg-cyan-700 text-white'
                  : 'bg-slate-800/60 border border-white/8 text-slate-400 hover:text-white hover:border-white/20'}`}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>
      {sub === 'overall' ? <OverallView /> : <BracketView championship={sub} />}
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────── */
function EmptyState({ icon, title, sub }: { icon:string; title:string; sub:string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-white font-semibold mb-1">{title}</p>
      <p className="text-slate-500 text-sm">{sub}</p>
    </div>
  );
}

/* ─── Tournament detail view ────────────────────────────────── */
function TournamentView({ tournament, onBack }: { tournament: Tournament; onBack: () => void }) {
  type TabId = 'groups' | 'matches' | 'championships';
  const isChamp    = tournament.tournamentFormat === 'championship-groups';
  const groupCount = isChamp
    ? tournament.matches.filter(m => m.phase === 'group').length
    : tournament.matches.length;
  const bmCount    = tournament.bracketMatches?.length ?? 0;
  const doneCount  = tournament.matches.filter(m => m.status === 'completed').length;
  const cs         = tournament.championshipStatus ?? tournament.status ?? '';

  const [tab, setTab] = useState<TabId>(() => {
    if (!isChamp) return 'matches'; // non-champ → show matches first
    const cst = tournament.championshipStatus ?? '';
    if (cst.includes('championship') || (tournament.bracketMatches?.length ?? 0) > 0) return 'championships';
    if (cst.includes('group_stage')) return 'matches';
    return 'groups';
  });

  const TABS: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = isChamp ? [
    { id: 'groups',        label: 'Groups',        icon: Users,    count: tournament.groups?.length },
    { id: 'matches',       label: 'Group Matches', icon: Swords,   count: groupCount },
    { id: 'championships', label: 'Championships', icon: Trophy,   count: bmCount },
  ] : [
    { id: 'matches',       label: 'Matches',       icon: Swords,   count: tournament.matches.length },
    { id: 'groups',        label: 'Standings',     icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-white/6">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 h-14">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{tournament.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{new Date(tournament.scheduledDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>
            </div>
            <StatusPill status={cs} />
          </div>

          {/* Tab bar */}
          <div className="flex gap-0.5 -mb-px">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors
                  ${tab === t.id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <t.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="border-b border-white/5 bg-slate-900/50">
        <div className="container mx-auto px-4 max-w-4xl py-3">
          {isChamp ? (
            <div className="flex gap-6 overflow-x-auto">
              <StatBadge label="Teams"   value={tournament.numberOfTeams} color="text-amber-400" />
              <StatBadge label="Groups"  value={tournament.numberOfGroups ?? '—'} color="text-purple-400" />
              <StatBadge label="G.Matches" value={groupCount} color="text-cyan-400" />
              <StatBadge label="Done"    value={doneCount} color="text-green-400" />
              {bmCount > 0 && <StatBadge label="Knockouts" value={bmCount} color="text-yellow-400" />}
            </div>
          ) : (
            <div className="flex gap-6">
              <StatBadge label="Teams"   value={tournament.numberOfTeams} />
              <StatBadge label="Matches" value={tournament.matches.length} />
              <StatBadge label="Done"    value={doneCount} color="text-green-400" />
            </div>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-4 max-w-4xl py-6">
        {tab === 'groups'        && <GroupsTab tournament={tournament} />}
        {tab === 'matches'       && <MatchesTab tournament={tournament} />}
        {tab === 'championships' && <ChampionshipsTab tournament={tournament} />}
      </div>
    </div>
  );
}

/* ─── Tournament list card ──────────────────────────────────── */
function TournamentCard({ t, onSelect }: { t: Tournament; onSelect: () => void }) {
  const isChamp = t.tournamentFormat === 'championship-groups';
  const cs = t.championshipStatus ?? t.status;
  const groupDone  = t.matches.filter(m => m.status === 'completed').length;
  const groupTotal = t.matches.length;
  const pct = groupTotal ? Math.round((groupDone / groupTotal) * 100) : 0;

  return (
    <button onClick={onSelect}
      className="w-full text-left bg-slate-900/60 hover:bg-slate-900/90 border border-white/8 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {isChamp && <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">🏆 Championship Groups</p>}
          <p className="font-bold text-white text-base truncate">{t.name}</p>
          {t.description && <p className="text-slate-500 text-xs mt-0.5 truncate">{t.description}</p>}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(t.scheduledDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.numberOfTeams} teams</span>
        {isChamp && t.numberOfGroups && <span>{t.numberOfGroups} groups · {t.teamsPerGroup}/group</span>}
      </div>

      {/* Progress bar */}
      {groupTotal > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>{groupDone}/{groupTotal} matches played</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <StatusPill status={cs} />
    </button>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function SchedulesPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected]       = useState<Tournament | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch('/api/tournaments?public=true')
      .then(r => r.ok ? r.json() : { tournaments: [] })
      .then(d => setTournaments(d.tournaments ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Load full detail (groups + brackets) when a tournament is selected
  const selectTournament = async (t: Tournament) => {
    const [gRes, bRes] = await Promise.all([
      fetch(`/api/tournaments/${t._id}/groups?public=true`),
      fetch(`/api/tournaments/${t._id}/championships?public=true`),
    ]);

    const gData = gRes.ok ? await gRes.json() : null;
    const bData = bRes.ok ? await bRes.json() : null;

    setSelected({
      ...t,
      ...(gData ? { groups: gData.groups } : {}),
      ...(bData ? { bracketMatches: [...(bData.gold ?? []), ...(bData.silver ?? []), ...(bData.bronze ?? [])] } : {}),
    });
  };

  if (selected) return <TournamentView tournament={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-500/4 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/6 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-4xl h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src="/flying-feathers-logo.png" alt="FF" className="w-7 h-7 object-contain rounded-lg" />
          <div>
            <p className="font-bold text-sm text-white leading-none">Tournaments</p>
            <p className="text-[10px] text-slate-500">Flying Feathers Badminton Club</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Live Tournaments</h1>
          <p className="text-slate-500 text-sm">Select a tournament to see groups, matches and live standings</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <EmptyState icon="🏸" title="No tournaments yet" sub="Check back soon for upcoming tournaments." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map(t => (
              <TournamentCard key={t._id} t={t} onSelect={() => selectTournament(t)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
