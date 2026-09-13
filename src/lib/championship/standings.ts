import { ITeamStats } from '@/models/Tournament';

/**
 * Calculate standings for a set of teams given completed matches.
 * Extracted from standings/route.ts to be a shared pure function.
 */
export function calculateStandings(
  teams: { name: string; players: string[] }[],
  matches: {
    team1Index: number;
    team2Index: number;
    team1Score?: number;
    team2Score?: number;
    status: string;
  }[]
): ITeamStats[] {
  const teamStats: ITeamStats[] = teams.map((team, index) => ({
    teamIndex: index,
    teamName: team.name,
    players: team.players,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDifference: 0,
    matchesPlayed: 0,
  }));

  matches.forEach((match) => {
    if (
      match.status === 'completed' &&
      match.team1Score !== undefined &&
      match.team2Score !== undefined
    ) {
      const team1Stats = teamStats[match.team1Index];
      const team2Stats = teamStats[match.team2Index];

      if (!team1Stats || !team2Stats) return;

      team1Stats.pointsFor += match.team1Score;
      team1Stats.pointsAgainst += match.team2Score;
      team2Stats.pointsFor += match.team2Score;
      team2Stats.pointsAgainst += match.team1Score;

      team1Stats.matchesPlayed++;
      team2Stats.matchesPlayed++;

      if (match.team1Score > match.team2Score) {
        team1Stats.wins++;
        team2Stats.losses++;
      } else if (match.team2Score > match.team1Score) {
        team2Stats.wins++;
        team1Stats.losses++;
      }
    }
  });

  teamStats.forEach((team) => {
    team.pointDifference = team.pointsFor - team.pointsAgainst;
  });

  // Sort: wins desc → pointDifference desc → pointsFor desc
  return teamStats.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
    return b.pointsFor - a.pointsFor;
  });
}

/**
 * Calculate standings for a specific group, considering only intra-group matches.
 */
export function calculateGroupStandings(
  group: { teamIndices: number[] },
  teams: any[],
  allMatches: any[]
): ITeamStats[] {
  const groupTeamSet = new Set(group.teamIndices);

  // Only matches where BOTH teams are in this group
  const groupMatches = allMatches.filter(
    (m) =>
      groupTeamSet.has(m.team1Index) && groupTeamSet.has(m.team2Index)
  );

  // Build stats indexed by original team index
  const statsByIndex: { [key: number]: ITeamStats } = {};
  group.teamIndices.forEach((idx) => {
    statsByIndex[idx] = {
      teamIndex: idx,
      teamName: teams[idx]?.name ?? `Team ${idx}`,
      players: teams[idx]?.players ?? [],
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
      matchesPlayed: 0,
    };
  });

  groupMatches.forEach((match: any) => {
    if (
      match.status === 'completed' &&
      match.team1Score !== undefined &&
      match.team2Score !== undefined
    ) {
      const s1 = statsByIndex[match.team1Index];
      const s2 = statsByIndex[match.team2Index];
      if (!s1 || !s2) return;

      s1.pointsFor += match.team1Score;
      s1.pointsAgainst += match.team2Score;
      s2.pointsFor += match.team2Score;
      s2.pointsAgainst += match.team1Score;
      s1.matchesPlayed++;
      s2.matchesPlayed++;

      if (match.team1Score > match.team2Score) {
        s1.wins++;
        s2.losses++;
      } else if (match.team2Score > match.team1Score) {
        s2.wins++;
        s1.losses++;
      }
    }
  });

  const standings = Object.values(statsByIndex);
  standings.forEach((s) => {
    s.pointDifference = s.pointsFor - s.pointsAgainst;
  });

  return resolveGroupRanking(standings, groupMatches);
}

/**
 * Sort group standings with tie-break:
 * wins → head-to-head result → pointDifference → pointsFor
 */
export function resolveGroupRanking(
  standings: ITeamStats[],
  matches: any[]
): ITeamStats[] {
  return [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;

    // Head-to-head tiebreaker
    const h2h = matches.find(
      (m: any) =>
        (m.team1Index === a.teamIndex && m.team2Index === b.teamIndex) ||
        (m.team1Index === b.teamIndex && m.team2Index === a.teamIndex)
    );
    if (h2h && h2h.status === 'completed') {
      const aWon =
        (h2h.team1Index === a.teamIndex && h2h.team1Score > h2h.team2Score) ||
        (h2h.team2Index === a.teamIndex && h2h.team2Score > h2h.team1Score);
      const bWon =
        (h2h.team1Index === b.teamIndex && h2h.team1Score > h2h.team2Score) ||
        (h2h.team2Index === b.teamIndex && h2h.team2Score > h2h.team1Score);
      if (aWon && !bWon) return -1;
      if (bWon && !aWon) return 1;
    }

    if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
    return b.pointsFor - a.pointsFor;
  });
}
