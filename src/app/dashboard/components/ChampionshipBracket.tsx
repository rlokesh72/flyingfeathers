'use client';

import React, { useState } from 'react';

export interface BracketMatch {
  _id: string;
  championship: 'gold' | 'silver' | 'bronze';
  round: string;
  sequence: number;
  team1Index?: number;
  team2Index?: number;
  team1Score?: number;
  team2Score?: number;
  winnerIndex?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  nextMatchId?: string;
  nextSlot?: 1 | 2;
  matchIndex?: number;
  // Resolved team objects (from championships GET endpoint)
  team1?: { index: number; name: string; players: string[] } | null;
  team2?: { index: number; name: string; players: string[] } | null;
  winner?: { index: number; name: string; players: string[] } | null;
}

export interface Team {
  name: string;
  players: string[];
}

interface ChampionshipBracketProps {
  championship: 'gold' | 'silver' | 'bronze';
  matches: BracketMatch[];
  teams: Team[];
  onScoreMatch?: (matchIndex: number, match: BracketMatch, score1: number, score2: number) => void;
}

const ROUND_LABELS: Record<string, string> = {
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter Final',
  semi_final: 'Semi Final',
  final: 'Final',
};

const ROUND_ORDER = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'];

const CHAMPIONSHIP_COLORS: Record<'gold' | 'silver' | 'bronze', {
  accent: string; border: string; bg: string; badge: string; btn: string;
}> = {
  gold:   { accent: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-900/20',  badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-500/40',  btn: 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' },
  silver: { accent: 'text-slate-300',  border: 'border-slate-500/40',  bg: 'bg-slate-800/40',   badge: 'bg-slate-700/40 text-slate-200 border-slate-500/40',     btn: 'border-slate-400/50 text-slate-300 hover:bg-slate-500/10'   },
  bronze: { accent: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-900/20',  badge: 'bg-orange-900/40 text-orange-300 border-orange-500/40',  btn: 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10' },
};

function MatchCard({
  match, championship, teams, onScoreMatch,
}: {
  match: BracketMatch;
  championship: 'gold' | 'silver' | 'bronze';
  teams: Team[];
  onScoreMatch?: (matchIndex: number, match: BracketMatch, s1: number, s2: number) => void;
}) {
  const colors = CHAMPIONSHIP_COLORS[championship];
  const [editing, setEditing]   = useState(false);
  const [s1, setS1]             = useState(match.team1Score ?? 0);
  const [s2, setS2]             = useState(match.team2Score ?? 0);

  const team1Name = match.team1?.name
    ?? (match.team1Index !== undefined && match.team1Index >= 0 ? teams[match.team1Index]?.name : undefined)
    ?? 'TBD';
  const team2Name = match.team2?.name
    ?? (match.team2Index !== undefined && match.team2Index >= 0 ? teams[match.team2Index]?.name : undefined)
    ?? 'TBD';
  const team1Players = match.team1?.players ?? (match.team1Index !== undefined && match.team1Index >= 0 ? teams[match.team1Index]?.players : undefined) ?? [];
  const team2Players = match.team2?.players ?? (match.team2Index !== undefined && match.team2Index >= 0 ? teams[match.team2Index]?.players : undefined) ?? [];

  const team1Won = match.status === 'completed' && match.winnerIndex !== undefined && match.winnerIndex === match.team1Index;
  const team2Won = match.status === 'completed' && match.winnerIndex !== undefined && match.winnerIndex === match.team2Index;
  const isTBD    = match.team1Index === undefined || match.team1Index === -1 || match.team2Index === undefined || match.team2Index === -1;
  const canScore = !isTBD && match.matchIndex !== undefined && onScoreMatch;

  const clamp = (v: string) => Math.min(30, Math.max(0, parseInt(v.replace(/\D/g, '') || '0', 10)));

  const handleSave = () => {
    if (!canScore) return;
    onScoreMatch!(match.matchIndex!, match, s1, s2);
    setEditing(false);
  };

  const handleEditStart = () => {
    setS1(match.team1Score ?? 0);
    setS2(match.team2Score ?? 0);
    setEditing(true);
  };

  return (
    <div className={`
      border rounded-xl p-2.5 min-w-[160px] max-w-[180px] transition-all
      ${colors.border} ${colors.bg}
      ${editing ? 'ring-2 ring-cyan-500/50' : ''}
      ${isTBD ? 'opacity-40' : ''}
    `}>
      {/* Team 1 row */}
      <div className={`
        flex items-center justify-between py-1 px-1.5 rounded text-xs gap-1
        ${team1Won ? 'bg-green-900/30 text-green-300 font-semibold' : 'text-slate-300'}
      `}>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{team1Name}</p>
          {team1Players.length > 0 && (
            <p className="truncate text-slate-500 text-[10px]">{team1Players.join(' & ')}</p>
          )}
        </div>
        {editing ? (
          <input
            type="number" min={0} max={30}
            value={s1}
            onChange={e => setS1(clamp(e.target.value))}
            className="w-10 text-center text-sm font-bold bg-slate-700 border border-cyan-500 rounded px-1 py-0.5 text-white focus:outline-none shrink-0"
          />
        ) : (
          <span className={`ml-1 font-mono font-bold shrink-0 ${team1Won ? 'text-green-400' : 'text-slate-400'}`}>
            {match.status === 'completed' ? (match.team1Score ?? '-') : '-'}
          </span>
        )}
      </div>

      <div className={`my-1 border-t ${colors.border}`} />

      {/* Team 2 row */}
      <div className={`
        flex items-center justify-between py-1 px-1.5 rounded text-xs gap-1
        ${team2Won ? 'bg-green-900/30 text-green-300 font-semibold' : 'text-slate-300'}
      `}>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{team2Name}</p>
          {team2Players.length > 0 && (
            <p className="truncate text-slate-500 text-[10px]">{team2Players.join(' & ')}</p>
          )}
        </div>
        {editing ? (
          <input
            type="number" min={0} max={30}
            value={s2}
            onChange={e => setS2(clamp(e.target.value))}
            className="w-10 text-center text-sm font-bold bg-slate-700 border border-cyan-500 rounded px-1 py-0.5 text-white focus:outline-none shrink-0"
          />
        ) : (
          <span className={`ml-1 font-mono font-bold shrink-0 ${team2Won ? 'text-green-400' : 'text-slate-400'}`}>
            {match.status === 'completed' ? (match.team2Score ?? '-') : '-'}
          </span>
        )}
      </div>

      {/* Actions */}
      {editing ? (
        <div className="flex gap-1 mt-2">
          <button
            onClick={handleSave}
            className="flex-1 text-xs py-1 rounded bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
          >
            ✓ Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 text-xs py-1 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : canScore ? (
        <button
          onClick={handleEditStart}
          className={`mt-2 w-full text-xs py-1 rounded border ${colors.btn} transition-colors`}
        >
          {match.status === 'completed' ? '✓ Edit Score' : 'Log Score'}
        </button>
      ) : null}
    </div>
  );
}

/* ── Helper: derive placements from a single-elim bracket ── */
function derivePlacements(matches: BracketMatch[], teams: Team[]) {
  const resolve = (idx?: number, obj?: { name: string; players: string[] } | null) =>
    obj ?? (idx !== undefined && idx >= 0 ? teams[idx] ?? null : null);

  const finalMatch   = matches.find(m => m.round === 'final');
  const semiMatches  = matches.filter(m => m.round === 'semi_final');
  const quarterMatches = matches.filter(m => m.round === 'quarter_final');

  const placements: { place: number; team: { name: string; players: string[] } | null; label: string }[] = [];

  if (finalMatch?.status === 'completed') {
    const winner = resolve(finalMatch.winnerIndex, finalMatch.winner);
    const loserIdx = finalMatch.winnerIndex === finalMatch.team1Index ? finalMatch.team2Index : finalMatch.team1Index;
    const loserObj = finalMatch.winnerIndex === finalMatch.team1Index ? finalMatch.team2 : finalMatch.team1;
    const loser  = resolve(loserIdx, loserObj);
    if (winner) placements.push({ place: 1, team: winner, label: 'Champion' });
    if (loser)  placements.push({ place: 2, team: loser,  label: 'Runner-Up' });
  }

  // 3rd/4th: losers of semis
  semiMatches.forEach(m => {
    if (m.status !== 'completed') return;
    const loserIdx = m.winnerIndex === m.team1Index ? m.team2Index : m.team1Index;
    const loserObj = m.winnerIndex === m.team1Index ? m.team2 : m.team1;
    const loser = resolve(loserIdx, loserObj);
    if (loser) placements.push({ place: 3, team: loser, label: '3rd Place' });
  });

  // 5th–8th: losers of quarters
  quarterMatches.forEach(m => {
    if (m.status !== 'completed') return;
    const loserIdx = m.winnerIndex === m.team1Index ? m.team2Index : m.team1Index;
    const loserObj = m.winnerIndex === m.team1Index ? m.team2 : m.team1;
    const loser = resolve(loserIdx, loserObj);
    if (loser) placements.push({ place: 5, team: loser, label: '5th Place' });
  });

  return placements.sort((a, b) => a.place - b.place || (a.team?.name ?? '').localeCompare(b.team?.name ?? ''));
}

/* ── Visual Podium ── */
function Podium({ placements, colors }: {
  placements: ReturnType<typeof derivePlacements>;
  colors: typeof CHAMPIONSHIP_COLORS['gold'];
}) {
  const first  = placements.find(p => p.place === 1);
  const second = placements.find(p => p.place === 2);
  const thirds = placements.filter(p => p.place === 3);

  if (!first && !second && thirds.length === 0) {
    return <p className="text-slate-500 text-sm text-center py-4">No results yet — log the final matches to see placements.</p>;
  }

  return (
    <div className="flex items-end justify-center gap-3 py-4">
      {/* 2nd */}
      {second?.team ? (
        <div className="flex flex-col items-center gap-2 w-28">
          <div className="w-14 h-14 rounded-full bg-slate-600/40 border-2 border-slate-500/60 flex items-center justify-center text-xl font-bold text-slate-300">
            {second.team.name[0].toUpperCase()}
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-semibold text-sm truncate max-w-[7rem]">{second.team.name}</p>
            <p className="text-slate-500 text-[10px] truncate max-w-[7rem]">{second.team.players?.join(' & ')}</p>
          </div>
          <div className="w-full bg-slate-600/40 border border-slate-500/40 rounded-t-lg h-12 flex items-center justify-center">
            <span className="text-slate-300 font-bold text-lg">🥈</span>
          </div>
        </div>
      ) : <div className="w-28" />}

      {/* 1st */}
      {first?.team ? (
        <div className="flex flex-col items-center gap-2 w-32">
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl font-bold ${colors.badge} ${colors.border}`}>
            {first.team.name[0].toUpperCase()}
          </div>
          <div className="text-center">
            <p className={`font-bold text-sm truncate max-w-[8rem] ${colors.accent}`}>{first.team.name}</p>
            <p className="text-slate-500 text-[10px] truncate max-w-[8rem]">{first.team.players?.join(' & ')}</p>
          </div>
          <div className={`w-full border rounded-t-lg h-20 flex items-center justify-center ${colors.bg} ${colors.border}`}>
            <span className="text-2xl">🏆</span>
          </div>
        </div>
      ) : <div className="w-32" />}

      {/* 3rd */}
      {thirds[0]?.team ? (
        <div className="flex flex-col items-center gap-2 w-28">
          <div className="w-14 h-14 rounded-full bg-orange-900/30 border-2 border-orange-500/40 flex items-center justify-center text-xl font-bold text-orange-300">
            {thirds[0].team.name[0].toUpperCase()}
          </div>
          <div className="text-center">
            <p className="text-orange-300 font-semibold text-sm truncate max-w-[7rem]">{thirds[0].team.name}</p>
            <p className="text-slate-500 text-[10px] truncate max-w-[7rem]">{thirds[0].team.players?.join(' & ')}</p>
          </div>
          <div className="w-full bg-orange-900/20 border border-orange-500/30 rounded-t-lg h-8 flex items-center justify-center">
            <span className="text-orange-300 font-bold text-lg">🥉</span>
          </div>
        </div>
      ) : <div className="w-28" />}
    </div>
  );
}

/* ── Championship Standings panel ── */
function ChampionshipStandings({
  championship, matches, teams,
}: { championship: 'gold' | 'silver' | 'bronze'; matches: BracketMatch[]; teams: Team[] }) {
  const colors = CHAMPIONSHIP_COLORS[championship];
  const placements = derivePlacements(matches, teams);

  const completed = matches.filter(m => m.status === 'completed').length;
  const total     = matches.length;
  const rounds    = ROUND_ORDER.filter(r => matches.some(m => m.round === r));

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${championship === 'gold' ? 'bg-yellow-500' : championship === 'silver' ? 'bg-slate-400' : 'bg-orange-500'}`}
            style={{ width: total ? `${(completed / total) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0">{completed}/{total} played</span>
      </div>

      {/* Podium */}
      <div className={`border rounded-xl p-4 ${colors.border} bg-slate-900/60`}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${colors.accent}`}>🏅 Placements</p>
        <Podium placements={placements} colors={colors} />

        {/* 3rd/4th joint when both semis done */}
        {placements.filter(p => p.place === 3).length > 1 && (
          <div className="mt-2 flex justify-center gap-2 flex-wrap">
            {placements.filter(p => p.place === 3).map(p => (
              <span key={p.team?.name} className="text-xs text-orange-400 bg-orange-900/20 border border-orange-500/30 rounded-full px-2 py-0.5">
                🥉 {p.team?.name} (joint 3rd)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Round-by-round results */}
      <div className={`border rounded-xl p-4 ${colors.border} bg-slate-900/60`}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${colors.accent}`}>📋 Match Results</p>
        <div className="space-y-3">
          {rounds.map(round => {
            const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.sequence - b.sequence);
            return (
              <div key={round}>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5 font-medium">{ROUND_LABELS[round] ?? round}</p>
                <div className="space-y-1">
                  {roundMatches.map(m => {
                    const t1 = m.team1?.name ?? (m.team1Index !== undefined && m.team1Index >= 0 ? teams[m.team1Index]?.name : null) ?? 'TBD';
                    const t2 = m.team2?.name ?? (m.team2Index !== undefined && m.team2Index >= 0 ? teams[m.team2Index]?.name : null) ?? 'TBD';
                    const winnerName = m.winner?.name ?? (m.winnerIndex !== undefined && m.winnerIndex >= 0 ? teams[m.winnerIndex]?.name : null);
                    const t1Won = m.status === 'completed' && !!winnerName && winnerName === t1;
                    const t2Won = m.status === 'completed' && !!winnerName && winnerName === t2;
                    return (
                      <div key={m._id} className="flex items-center gap-2 text-xs bg-slate-800/60 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className={`truncate font-medium ${t1Won ? 'text-green-400' : 'text-slate-300'}`}>{t1}</p>
                          {m.team1?.players && <p className="text-[10px] text-slate-600 truncate">{m.team1.players.join(' & ')}</p>}
                        </div>
                        <span className="text-slate-600 shrink-0 font-mono text-center w-14">
                          {m.status === 'completed' ? `${m.team1Score} – ${m.team2Score}` : 'vs'}
                        </span>
                        <div className="flex-1 min-w-0 text-right">
                          <p className={`truncate font-medium ${t2Won ? 'text-green-400' : 'text-slate-300'}`}>{t2}</p>
                          {m.team2?.players && <p className="text-[10px] text-slate-600 truncate">{m.team2.players.join(' & ')}</p>}
                        </div>
                        {m.status !== 'completed' && <span className="text-slate-700 shrink-0">⏳</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChampionshipBracket({
  championship, matches, teams, onScoreMatch,
}: ChampionshipBracketProps) {
  const colors = CHAMPIONSHIP_COLORS[championship];
  const rounds = ROUND_ORDER.filter(r => matches.some(m => m.round === r));

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No matches yet for the {championship} championship.
      </div>
    );
  }

  const titles: Record<'gold' | 'silver' | 'bronze', string> = {
    gold:   '🥇 Gold Championship',
    silver: '🥈 Silver Championship',
    bronze: '🥉 Bronze Championship',
  };

  return (
    <div className="space-y-6">
      <h3 className={`text-lg font-bold ${colors.accent}`}>{titles[championship]}</h3>

      {/* ── Bracket (horizontal rounds) ── */}
      <div className="overflow-x-auto pb-2">
        <div className="hidden md:flex gap-6 min-w-max">
          {rounds.map(round => {
            const roundMatches = matches.filter(m => m.round === round).sort((a,b) => a.sequence - b.sequence);
            return (
              <div key={round} className="flex flex-col">
                <div className={`text-xs font-semibold mb-3 text-center ${colors.accent} uppercase tracking-wide`}>
                  {ROUND_LABELS[round] ?? round}
                </div>
                <div className="flex flex-col gap-4" style={{ justifyContent: 'space-around', minHeight: `${roundMatches.length * 90}px` }}>
                  {roundMatches.map(match => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      championship={championship}
                      teams={teams}
                      onScoreMatch={onScoreMatch}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical list */}
        <div className="md:hidden space-y-6">
          {rounds.map(round => {
            const roundMatches = matches.filter(m => m.round === round).sort((a,b) => a.sequence - b.sequence);
            return (
              <div key={round}>
                <div className={`text-sm font-semibold mb-2 ${colors.accent} uppercase tracking-wide`}>
                  {ROUND_LABELS[round] ?? round}
                </div>
                <div className="space-y-3">
                  {roundMatches.map(match => (
                    <MatchCard key={match._id} match={match} championship={championship} teams={teams} onScoreMatch={onScoreMatch} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live standings panel ── */}
      <ChampionshipStandings championship={championship} matches={matches} teams={teams} />
    </div>
  );
}
