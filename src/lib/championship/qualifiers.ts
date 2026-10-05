import { calculateGroupStandings } from './standings';
import {
  championshipForRank,
  resolveQualificationRules,
  type QualificationRules,
} from './qualification';

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
 * Men's groups use qualificationRules (1st Gold, 2–4 Silver, 5–6 Bronze).
 * Women's groups use womenQualificationRules (1–2 Gold, 3–4 Silver, 5–6 Bronze).
 */
export function determineQualifiers(
  groups: any[],
  teams: any[],
  allMatches: any[],
  qualificationRules: QualificationRules,
  womenQualificationRules?: QualificationRules
): IQualificationEntry[] {
  const qualifiers: IQualificationEntry[] = [];
  const seenTeamIndices = new Set<number>();

  for (const group of groups) {
    const standings = calculateGroupStandings(group, teams, allMatches);
    const rules = resolveQualificationRules(group, qualificationRules, womenQualificationRules);

    standings.forEach((teamStat, rankIndex) => {
      const rank = rankIndex + 1; // 1-indexed
      const championship = championshipForRank(rank, rules);

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
