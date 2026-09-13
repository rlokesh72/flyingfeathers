import { calculateGroupStandings } from './standings';

export interface IQualificationEntry {
  groupId: string;
  groupName: string;
  rank: number;      // 1-indexed rank within the group
  teamIndex: number; // index into tournament.teams[]
  teamName: string;
  championship: 'gold' | 'silver' | 'bronze';
}

/**
 * Determine which teams qualify for each championship bracket.
 * Iterates groups, ranks teams, and assigns championship paths
 * based on qualificationRules.
 */
export function determineQualifiers(
  groups: any[],
  teams: any[],
  allMatches: any[],
  qualificationRules: { gold: number[]; silver: number[]; bronze: number[] }
): IQualificationEntry[] {
  const qualifiers: IQualificationEntry[] = [];
  const seenTeamIndices = new Set<number>();

  for (const group of groups) {
    const standings = calculateGroupStandings(group, teams, allMatches);

    standings.forEach((teamStat, rankIndex) => {
      const rank = rankIndex + 1; // 1-indexed

      let championship: 'gold' | 'silver' | 'bronze' | null = null;
      if (qualificationRules.gold.includes(rank)) championship = 'gold';
      else if (qualificationRules.silver.includes(rank)) championship = 'silver';
      else if (qualificationRules.bronze.includes(rank)) championship = 'bronze';

      if (championship !== null) {
        if (seenTeamIndices.has(teamStat.teamIndex)) {
          throw new Error(
            `Team index ${teamStat.teamIndex} (${teamStat.teamName}) appears in multiple groups — data integrity error`
          );
        }
        seenTeamIndices.add(teamStat.teamIndex);

        qualifiers.push({
          groupId: group._id?.toString() ?? group.name,
          groupName: group.name,
          rank,
          teamIndex: teamStat.teamIndex,
          teamName: teamStat.teamName,
          championship,
        });
      }
    });
  }

  return qualifiers;
}
