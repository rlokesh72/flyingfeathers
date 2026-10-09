import mongoose from 'mongoose';
import { inferGroupCategory } from './qualification';
import type { IQualificationEntry } from './qualifiers';
import type { IBracketMatchCreate, IMatchCreate } from './generateBrackets';

export type MensStageAction = 'silver_qf' | 'silver_sf' | 'bronze_sf';

const PHASE: Record<'gold' | 'silver' | 'bronze', IMatchCreate['phase']> = {
  gold: 'gold_knockout',
  silver: 'silver_knockout',
  bronze: 'bronze_knockout',
};

const SILVER_R1: Array<{ a: [string, number]; b: [string, number]; sequence: number }> = [
  { a: ['A', 2], b: ['B', 4], sequence: 0 },
  { a: ['A', 3], b: ['B', 3], sequence: 1 },
  { a: ['A', 4], b: ['B', 2], sequence: 2 },
  { a: ['C', 2], b: ['D', 4], sequence: 3 },
  { a: ['C', 3], b: ['D', 3], sequence: 4 },
  { a: ['C', 4], b: ['D', 2], sequence: 5 },
];

const BRONZE_R1: Array<{ a: [string, number]; b: [string, number]; sequence: number }> = [
  { a: ['A', 5], b: ['B', 5], sequence: 0 },
  { a: ['C', 5], b: ['D', 6], sequence: 1 },
  { a: ['C', 6], b: ['D', 5], sequence: 2 },
];

export function groupLetter(name?: string): string | null {
  return name?.trim().match(/^group\s+([a-z]{1,2})$/i)?.[1]?.toUpperCase() ?? null;
}

export function splitQualifiersByCategory(
  qualifiers: IQualificationEntry[],
  groups: { name?: string; category?: string }[] = []
) {
  const men: IQualificationEntry[] = [];
  const women: IQualificationEntry[] = [];
  for (const q of qualifiers) {
    const group = groups.find((g) => g.name === q.groupName) ?? { name: q.groupName };
    if (inferGroupCategory(group) === 'women') women.push(q);
    else men.push(q);
  }
  return { men, women };
}

function findTeam(qs: IQualificationEntry[], letter: string, rank: number): number | undefined {
  return qs.find((q) => groupLetter(q.groupName) === letter && q.rank === rank)?.teamIndex;
}

function makeMatch(partial: Omit<IBracketMatchCreate, '_id' | 'status'> & { status?: 'scheduled' }): IBracketMatchCreate {
  return {
    _id: new mongoose.Types.ObjectId(),
    status: 'scheduled',
    category: 'men',
    ...partial,
  };
}

function scheduleMatches(
  matches: IBracketMatchCreate[],
  numCourts: number,
  startSlot: number,
  existingMatchCount: number
) {
  matches.forEach((match, i) => {
    match.matchIndex = existingMatchCount + i;
    match.court = (i % Math.max(1, numCourts)) + 1;
    match.timeSlot = startSlot + Math.floor(i / Math.max(1, numCourts));
  });
}

function toGlobal(bm: IBracketMatchCreate): IMatchCreate {
  return {
    team1Index: bm.team1Index ?? -1,
    team2Index: bm.team2Index ?? -1,
    timeSlot: bm.timeSlot ?? 1,
    court: bm.court ?? 1,
    status: 'scheduled',
    phase: PHASE[bm.championship],
    round: bm.round,
    bracketMatchId: bm._id.toString(),
  };
}

function pairMatches(
  qs: IQualificationEntry[],
  pairs: Array<{ a: [string, number]; b: [string, number]; sequence: number }>,
  championship: 'silver' | 'bronze',
  round: 'crossover_r1' | 'crossover_r2'
) {
  const out: IBracketMatchCreate[] = [];
  for (const pair of pairs) {
    const t1 = findTeam(qs, pair.a[0], pair.a[1]);
    const t2 = findTeam(qs, pair.b[0], pair.b[1]);
    if (t1 === undefined || t2 === undefined) continue;
    out.push(makeMatch({
      championship,
      round,
      sequence: pair.sequence,
      team1Index: t1,
      team2Index: t2,
    }));
  }
  return out;
}

function goldRoundRobin(qs: IQualificationEntry[]) {
  const teams = (['A', 'B', 'C', 'D'] as const)
    .map((letter) => findTeam(qs, letter, 1))
    .filter((idx): idx is number => idx !== undefined);
  const matches: IBracketMatchCreate[] = [];
  let sequence = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push(makeMatch({
        championship: 'gold',
        round: 'round_robin',
        sequence: sequence++,
        team1Index: teams[i],
        team2Index: teams[j],
      }));
    }
  }
  return matches;
}

export function generateMensOpeningStage(
  qualifiers: IQualificationEntry[],
  existingMatchCount: number,
  numCourts = 1,
  startTimeSlot = 1
): { bracketMatches: IBracketMatchCreate[]; globalMatches: IMatchCreate[] } {
  const bracketMatches = [
    ...goldRoundRobin(qualifiers),
    ...pairMatches(qualifiers, SILVER_R1, 'silver', 'crossover_r1'),
    ...pairMatches(qualifiers, BRONZE_R1, 'bronze', 'crossover_r1'),
  ];
  scheduleMatches(bracketMatches, numCourts, startTimeSlot, existingMatchCount);
  return {
    bracketMatches,
    globalMatches: bracketMatches.map(toGlobal),
  };
}

function isMens(m: any) {
  return (m.category ?? 'men') !== 'women';
}

function ofRound(matches: any[], championship: string, round: string) {
  return matches.filter((m) => isMens(m) && m.championship === championship && m.round === round);
}

function silverSecondRound(matches: any[]) {
  return [
    ...ofRound(matches, 'silver', 'quarter_final'),
    ...ofRound(matches, 'silver', 'crossover_r2'),
  ];
}

function allComplete(matches: any[]) {
  return matches.length > 0 && matches.every((m) => m.status === 'completed');
}

export function inspectMensNextStages(bracketMatches: any[]): MensStageAction[] {
  const actions: MensStageAction[] = [];
  const silverR1 = ofRound(bracketMatches, 'silver', 'crossover_r1');
  const silverQf = silverSecondRound(bracketMatches);
  const silverSf = ofRound(bracketMatches, 'silver', 'semi_final');
  const bronzeR1 = ofRound(bracketMatches, 'bronze', 'crossover_r1');
  const bronzeSf = ofRound(bracketMatches, 'bronze', 'semi_final');

  if (allComplete(silverR1) && silverQf.length === 0) actions.push('silver_qf');
  if (allComplete(silverQf) && silverSf.length === 0) actions.push('silver_sf');
  if (allComplete(bronzeR1) && bronzeSf.length === 0) actions.push('bronze_sf');
  return actions;
}

function winnerIndex(match: any): number | undefined {
  if (match.winnerIndex !== undefined && match.winnerIndex !== null && match.winnerIndex >= 0) {
    return match.winnerIndex;
  }
  if (match.status !== 'completed' || match.team1Score == null || match.team2Score == null) return undefined;
  return match.team1Score >= match.team2Score ? match.team1Index : match.team2Index;
}

function winnerPointDiff(match: any): number {
  const w = winnerIndex(match);
  if (w === undefined || match.team1Score == null || match.team2Score == null) return 0;
  return w === match.team1Index
    ? match.team1Score - match.team2Score
    : match.team2Score - match.team1Score;
}

function loserIndex(match: any): number | undefined {
  const w = winnerIndex(match);
  if (w === undefined) return undefined;
  if (match.team1Index >= 0 && match.team1Index !== w) return match.team1Index;
  if (match.team2Index >= 0 && match.team2Index !== w) return match.team2Index;
  return undefined;
}

function pointsFor(match: any, teamIndex: number): number {
  if (match.team1Score == null || match.team2Score == null) return 0;
  return teamIndex === match.team1Index ? match.team1Score : match.team2Score;
}

function compareByPdThenPf(a: { pd: number; pf: number }, b: { pd: number; pf: number }) {
  if (b.pd !== a.pd) return b.pd - a.pd;
  return b.pf - a.pf;
}

export function silverQuarterFinalists(r1: any[]): { winners: number[]; luckyLosers: number[] } {
  const winners = r1.map((m) => {
    const teamIndex = winnerIndex(m);
    if (teamIndex === undefined) return null;
    return { teamIndex, pd: winnerPointDiff(m), pf: pointsFor(m, teamIndex) };
  }).filter((x): x is { teamIndex: number; pd: number; pf: number } => !!x)
    .sort(compareByPdThenPf);

  const losers = r1.map((m) => {
    const teamIndex = loserIndex(m);
    if (teamIndex === undefined) return null;
    const pd = m.team1Score == null || m.team2Score == null
      ? 0
      : teamIndex === m.team1Index
        ? m.team1Score - m.team2Score
        : m.team2Score - m.team1Score;
    return { teamIndex, pd, pf: pointsFor(m, teamIndex) };
  }).filter((x): x is { teamIndex: number; pd: number; pf: number } => !!x)
    .sort(compareByPdThenPf);

  return {
    winners: winners.map((x) => x.teamIndex),
    luckyLosers: losers.slice(0, 2).map((x) => x.teamIndex),
  };
}

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

export function rankMensTeams(
  teamIndices: number[],
  matches: any[],
  teams: { name?: string; players?: string[] }[] = []
): MensTeamStat[] {
  const stats = teamIndices.map((idx) => ({
    teamIndex: idx,
    teamName: teams[idx]?.name ?? `Team ${idx}`,
    players: teams[idx]?.players ?? [],
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDifference: 0,
    matchesPlayed: 0,
  }));
  const byIndex = new Map(stats.map((s) => [s.teamIndex, s]));

  for (const match of matches) {
    if (match.status !== 'completed' || match.team1Score == null || match.team2Score == null) continue;
    const s1 = byIndex.get(match.team1Index);
    const s2 = byIndex.get(match.team2Index);
    if (!s1 && !s2) continue;

    if (s1) {
      s1.pointsFor += match.team1Score;
      s1.pointsAgainst += match.team2Score;
      s1.matchesPlayed++;
      if (match.team1Score > match.team2Score) s1.wins++;
      else if (match.team2Score > match.team1Score) s1.losses++;
    }
    if (s2) {
      s2.pointsFor += match.team2Score;
      s2.pointsAgainst += match.team1Score;
      s2.matchesPlayed++;
      if (match.team2Score > match.team1Score) s2.wins++;
      else if (match.team1Score > match.team2Score) s2.losses++;
    }
  }

  for (const s of stats) s.pointDifference = s.pointsFor - s.pointsAgainst;

  return stats.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
    return b.pointsFor - a.pointsFor;
  });
}

function createSemiAndFinal(
  championship: 'silver' | 'bronze',
  ranked: MensTeamStat[]
): IBracketMatchCreate[] {
  const top4 = ranked.slice(0, 4);
  if (top4.length < 4) return [];

  const finalMatch = makeMatch({
    championship,
    round: 'final',
    sequence: 0,
  });
  const sf1 = makeMatch({
    championship,
    round: 'semi_final',
    sequence: 0,
    team1Index: top4[0].teamIndex,
    team2Index: top4[3].teamIndex,
    nextMatchId: finalMatch._id,
    nextSlot: 1,
  });
  const sf2 = makeMatch({
    championship,
    round: 'semi_final',
    sequence: 1,
    team1Index: top4[1].teamIndex,
    team2Index: top4[2].teamIndex,
    nextMatchId: finalMatch._id,
    nextSlot: 2,
  });
  return [sf1, sf2, finalMatch];
}

function silverQuarterFinalMatches(bracketMatches: any[]): IBracketMatchCreate[] {
  const r1 = ofRound(bracketMatches, 'silver', 'crossover_r1');
  const { winners, luckyLosers } = silverQuarterFinalists(r1);
  if (winners.length < 6 || luckyLosers.length < 2) return [];

  const seeds = [...winners, ...luckyLosers];
  const pairs: Array<[number, number]> = [
    [seeds[0], seeds[7]],
    [seeds[3], seeds[4]],
    [seeds[1], seeds[6]],
    [seeds[2], seeds[5]],
  ];

  return pairs.map(([t1, t2], sequence) => makeMatch({
    championship: 'silver',
    round: 'quarter_final',
    sequence,
    team1Index: t1,
    team2Index: t2,
  }));
}

export function generateMensNextStage(
  action: MensStageAction,
  bracketMatches: any[],
  teams: { name?: string; players?: string[] }[],
  existingMatchCount: number,
  numCourts = 1,
  startTimeSlot = 1
): { bracketMatches: IBracketMatchCreate[]; globalMatches: IMatchCreate[] } {
  let created: IBracketMatchCreate[] = [];

  if (action === 'silver_qf') {
    created = silverQuarterFinalMatches(bracketMatches);
  }

  if (action === 'silver_sf') {
    const r1 = ofRound(bracketMatches, 'silver', 'crossover_r1');
    const qf = silverSecondRound(bracketMatches);
    const four = qf.map(winnerIndex).filter((idx): idx is number => idx !== undefined);
    const ranked = rankMensTeams(four, [...r1, ...qf], teams);
    created = createSemiAndFinal('silver', ranked);
  }

  if (action === 'bronze_sf') {
    const r1 = ofRound(bracketMatches, 'bronze', 'crossover_r1');
    const six = Array.from(new Set(r1.flatMap((m) => [m.team1Index, m.team2Index]).filter((idx: number) => idx >= 0)));
    const ranked = rankMensTeams(six, r1, teams);
    created = createSemiAndFinal('bronze', ranked);
  }

  scheduleMatches(created, numCourts, startTimeSlot, existingMatchCount);
  return {
    bracketMatches: created,
    globalMatches: created.map(toGlobal),
  };
}

export function generateAllReadyMensStages(
  bracketMatches: any[],
  teams: { name?: string; players?: string[] }[],
  existingMatchCount: number,
  numCourts = 1,
  startTimeSlot = 1
) {
  const created: IBracketMatchCreate[] = [];
  const global: IMatchCreate[] = [];
  let count = existingMatchCount;
  let slot = startTimeSlot;
  let working = [...bracketMatches];

  for (const action of inspectMensNextStages(working)) {
    const next = generateMensNextStage(action, working, teams, count, numCourts, slot);
    created.push(...next.bracketMatches);
    global.push(...next.globalMatches);
    working = [...working, ...next.bracketMatches];
    count += next.bracketMatches.length;
    const maxSlot = next.bracketMatches.reduce((m, bm) => Math.max(m, bm.timeSlot ?? 0), slot - 1);
    slot = maxSlot + 1;
  }

  return { bracketMatches: created, globalMatches: global, actions: inspectMensNextStages(bracketMatches) };
}

export function mensGoldStandings(bracketMatches: any[], teams: { name?: string; players?: string[] }[]) {
  const rr = ofRound(bracketMatches, 'gold', 'round_robin');
  const indices = Array.from(new Set(rr.flatMap((m) => [m.team1Index, m.team2Index]).filter((idx: number) => idx >= 0)));
  return rankMensTeams(indices, rr, teams);
}

export function mensSilverSixStandings(bracketMatches: any[], teams: { name?: string; players?: string[] }[]) {
  const r1 = ofRound(bracketMatches, 'silver', 'crossover_r1');
  const qf = silverSecondRound(bracketMatches);
  if (!allComplete(r1)) return [];
  const { winners, luckyLosers } = silverQuarterFinalists(r1);
  return rankMensTeams([...winners, ...luckyLosers], [...r1, ...qf], teams);
}

export function mensBronzeSixStandings(bracketMatches: any[], teams: { name?: string; players?: string[] }[]) {
  const r1 = ofRound(bracketMatches, 'bronze', 'crossover_r1');
  if (r1.length === 0) return [];
  const six = Array.from(new Set(r1.flatMap((m) => [m.team1Index, m.team2Index]).filter((idx: number) => idx >= 0)));
  return rankMensTeams(six, r1, teams);
}

export function isMensFormat(bracketMatches: any[]) {
  return bracketMatches.some((m) =>
    isMens(m) && (m.round === 'round_robin' || m.round === 'crossover_r1' || m.round === 'crossover_r2' || m.round === 'quarter_final')
  );
}
