import { rankMensTeams, type MensTeamStat } from './mensFormat';

export type ChampionshipTier = 'gold' | 'silver' | 'bronze';

export interface OverallRow extends MensTeamStat {
  place: number;
  label: string;
}

export type CategoryStandings = Record<ChampionshipTier, OverallRow[]>;

export interface OverallStandings {
  men: CategoryStandings;
  women: CategoryStandings;
}

function isWomen(m: { category?: string }) {
  return m.category === 'women';
}

function ofCategory(matches: any[], category: 'men' | 'women', championship: ChampionshipTier) {
  return matches.filter((m) => {
    const women = isWomen(m);
    return (category === 'women' ? women : !women) && m.championship === championship;
  });
}

const OPENING_ROUND_ORDER = [
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'crossover_r1',
  'round_robin',
  'semi_final',
  'crossover_r2',
  'final',
];

function ofRound(matches: any[], round: string) {
  return matches.filter((m) => m.round === round);
}

function openingRoundName(matches: any[]) {
  return OPENING_ROUND_ORDER.find((round) => matches.some((m) => m.round === round));
}

function openingRoster(matches: any[]) {
  const opening = openingRoundName(matches);
  return opening ? teamIndicesIn(ofRound(matches, opening)) : teamIndicesIn(matches);
}

function matchesAmong(matches: any[], roster: number[]) {
  const allowed = new Set(roster);
  return matches.filter((m) => {
    const t1 = m.team1Index;
    const t2 = m.team2Index;
    const t1Ok = t1 === undefined || t1 < 0 || allowed.has(t1);
    const t2Ok = t2 === undefined || t2 < 0 || allowed.has(t2);
    return t1Ok && t2Ok;
  });
}

function allComplete(matches: any[]) {
  return matches.length > 0 && matches.every((m) => m.status === 'completed');
}

function playedIn(match: any, idx: number | undefined) {
  return idx !== undefined && idx >= 0 && (idx === match.team1Index || idx === match.team2Index);
}

function winnerOf(match: any): number | undefined {
  if (playedIn(match, match.winnerIndex)) return match.winnerIndex;
  if (match.status !== 'completed' || match.team1Score == null || match.team2Score == null) return undefined;
  const fromScore = match.team1Score >= match.team2Score ? match.team1Index : match.team2Index;
  return playedIn(match, fromScore) ? fromScore : undefined;
}

function loserOf(match: any): number | undefined {
  const w = winnerOf(match);
  if (w === undefined) return undefined;
  if (match.team1Index >= 0 && match.team1Index !== w) return match.team1Index;
  if (match.team2Index >= 0 && match.team2Index !== w) return match.team2Index;
  return undefined;
}

function sidePd(match: any, teamIndex: number) {
  if (match.team1Score == null || match.team2Score == null) return 0;
  return teamIndex === match.team1Index
    ? match.team1Score - match.team2Score
    : match.team2Score - match.team1Score;
}

function teamIndicesIn(matches: any[]) {
  return Array.from(new Set(
    matches.flatMap((m) => [m.team1Index, m.team2Index]).filter((idx: number) => idx !== undefined && idx >= 0)
  ));
}

function placeLabel(place: number) {
  if (place === 1) return 'Champion';
  if (place === 2) return 'Runner-Up';
  if (place === 3) return '3rd Place';
  if (place === 4) return '4th Place';
  const mod10 = place % 10;
  const mod100 = place % 100;
  const suffix = mod10 === 1 && mod100 !== 11 ? 'st' : mod10 === 2 && mod100 !== 12 ? 'nd' : mod10 === 3 && mod100 !== 13 ? 'rd' : 'th';
  return `${place}${suffix} Place`;
}

function withPlaces(stats: MensTeamStat[], locked = false): OverallRow[] {
  return stats.map((s, i) => ({
    ...s,
    place: i + 1,
    label: locked ? placeLabel(i + 1) : '',
  }));
}

/** When the final is done, lock 1–4 from the knockout and keep remaining teams in stats order. */
function applyKnockoutFinish(stats: MensTeamStat[], matches: any[]): OverallRow[] {
  const finalM = ofRound(matches, 'final').find((m) => m.status === 'completed');
  if (!finalM) return withPlaces(stats, false);

  const locked = new Map<number, number>();
  const w = winnerOf(finalM);
  const l = loserOf(finalM);
  if (w !== undefined) locked.set(w, 1);
  if (l !== undefined) locked.set(l, 2);

  const sfLosers = ofRound(matches, 'semi_final')
    .filter((m) => m.status === 'completed')
    .map((m) => {
      const idx = loserOf(m);
      return idx === undefined ? null : { idx, pd: sidePd(m, idx) };
    })
    .filter((x): x is { idx: number; pd: number } => !!x)
    .sort((a, b) => b.pd - a.pd);

  sfLosers.forEach((row, i) => {
    if (!locked.has(row.idx)) locked.set(row.idx, 3 + i);
  });

  const qfLosers = ofRound(matches, 'quarter_final')
    .filter((m) => m.status === 'completed')
    .map((m) => loserOf(m))
    .filter((idx): idx is number => idx !== undefined);
  qfLosers.forEach((idx, i) => {
    if (!locked.has(idx)) locked.set(idx, 5 + i);
  });

  const used = new Set(locked.values());
  let next = 1;
  const rows = stats.map((s) => {
    let place = locked.get(s.teamIndex);
    if (place === undefined) {
      while (used.has(next)) next++;
      place = next;
      used.add(place);
      next++;
    }
    return { ...s, place, label: placeLabel(place) };
  });
  return rows.sort((a, b) => a.place - b.place);
}

function mensGold(matches: any[], teams: { name?: string; players?: string[] }[]): OverallRow[] {
  const rr = ofRound(matches, 'round_robin');
  const indices = teamIndicesIn(rr);
  if (!indices.length) return [];
  return withPlaces(rankMensTeams(indices, rr, teams), allComplete(rr));
}

function mensSilver(matches: any[], teams: { name?: string; players?: string[] }[]): OverallRow[] {
  const r1 = ofRound(matches, 'crossover_r1');
  if (!r1.length) return [];

  const pool = [...r1, ...ofRound(matches, 'crossover_r2')];
  const knockout = [...ofRound(matches, 'semi_final'), ...ofRound(matches, 'final')];

  if (!allComplete(r1)) {
    return withPlaces(rankMensTeams(teamIndicesIn(r1), r1, teams), false);
  }

  const winners = r1.map(winnerOf).filter((idx): idx is number => idx !== undefined);
  const losers = r1.map(loserOf).filter((idx): idx is number => idx !== undefined);
  const winnerRows = applyKnockoutFinish(
    rankMensTeams(winners, [...pool, ...knockout], teams),
    knockout
  );
  const loserRows = withPlaces(rankMensTeams(losers, r1, teams), allComplete(r1)).map((row, i) => ({
    ...row,
    place: winnerRows.length + i + 1,
    label: 'R1 exit',
  }));
  return [...winnerRows, ...loserRows];
}

function mensBronze(matches: any[], teams: { name?: string; players?: string[] }[]): OverallRow[] {
  const r1 = ofRound(matches, 'crossover_r1');
  const indices = teamIndicesIn(r1);
  if (!indices.length) return [];
  const all = [...r1, ...ofRound(matches, 'semi_final'), ...ofRound(matches, 'final')];
  return applyKnockoutFinish(rankMensTeams(indices, all, teams), all);
}

function knockoutCategory(matches: any[], teams: { name?: string; players?: string[] }[]): OverallRow[] {
  const indices = openingRoster(matches);
  if (!indices.length) return [];
  const clean = matchesAmong(matches, indices);
  return applyKnockoutFinish(rankMensTeams(indices, clean, teams), clean);
}

export function buildOverallStandings(
  matches: any[],
  teams: { name?: string; players?: string[] }[] = []
): OverallStandings {
  const menGold = ofCategory(matches, 'men', 'gold');
  const menSilver = ofCategory(matches, 'men', 'silver');
  const menBronze = ofCategory(matches, 'men', 'bronze');
  const womenGold = ofCategory(matches, 'women', 'gold');
  const womenSilver = ofCategory(matches, 'women', 'silver');
  const womenBronze = ofCategory(matches, 'women', 'bronze');

  return {
    men: {
      gold: mensGold(menGold, teams),
      silver: mensSilver(menSilver, teams),
      bronze: mensBronze(menBronze, teams),
    },
    women: {
      gold: knockoutCategory(womenGold, teams),
      silver: knockoutCategory(womenSilver, teams),
      bronze: knockoutCategory(womenBronze, teams),
    },
  };
}
