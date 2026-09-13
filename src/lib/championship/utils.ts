/**
 * Championship Groups utility functions
 */

export function isPowerOfTwo(n: number): boolean {
  if (n < 1) return false;
  return (n & (n - 1)) === 0;
}

export function calculateGroupCount(maxTeams: number, teamsPerGroup: number): number {
  return Math.floor(maxTeams / teamsPerGroup);
}

export const ROUND_ORDER = [
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'final',
] as const;

export type RoundName = typeof ROUND_ORDER[number];

export function getFirstRound(teamCount: number): string {
  if (teamCount <= 2) return 'final';
  if (teamCount <= 4) return 'semi_final';
  if (teamCount <= 8) return 'quarter_final';
  if (teamCount <= 16) return 'round_of_16';
  return 'round_of_32';
}

export function calculateKnockoutRounds(teamCount: number): string[] {
  const firstRound = getFirstRound(teamCount);
  const firstRoundIndex = ROUND_ORDER.indexOf(firstRound as RoundName);
  return Array.from(ROUND_ORDER).slice(firstRoundIndex);
}

export function validateChampionshipConfig(config: {
  maxTeams: number;
  teamsPerGroup: number;
  qualificationRules: { gold: number[]; silver: number[]; bronze: number[] };
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { maxTeams, teamsPerGroup, qualificationRules } = config;

  if (!maxTeams || maxTeams < 4) {
    errors.push('maxTeams must be at least 4');
  }
  if (!teamsPerGroup || teamsPerGroup < 2) {
    errors.push('teamsPerGroup must be at least 2');
  }
  if (maxTeams > 0 && teamsPerGroup > 0 && maxTeams % teamsPerGroup !== 0) {
    errors.push(
      `maxTeams (${maxTeams}) must be exactly divisible by teamsPerGroup (${teamsPerGroup})`
    );
  }

  if (maxTeams >= 4 && teamsPerGroup >= 2 && maxTeams % teamsPerGroup === 0) {
    // Check all ranks cover 1..teamsPerGroup exactly with no duplicates/overlaps
    const allRanks = [
      ...qualificationRules.gold,
      ...qualificationRules.silver,
      ...qualificationRules.bronze,
    ];
    const sorted = [...allRanks].sort((a, b) => a - b);

    const hasDuplicates = sorted.some((r, i) => i > 0 && r === sorted[i - 1]);
    if (hasDuplicates) {
      errors.push('Qualification rules contain duplicate ranks');
    }

    const noExtraRanks = allRanks.every((r) => r >= 1 && r <= teamsPerGroup);
    const coversAll = Array.from({ length: teamsPerGroup }, (_, i) => i + 1).every((r) =>
      allRanks.includes(r)
    );

    if (!coversAll || !noExtraRanks) {
      errors.push(
        `Qualification rules must cover exactly ranks 1 to ${teamsPerGroup} with no extras`
      );
    }

    if (!hasDuplicates && coversAll && noExtraRanks) {
      const numberOfGroups = maxTeams / teamsPerGroup;
      const goldCount = qualificationRules.gold.length * numberOfGroups;
      const silverCount = qualificationRules.silver.length * numberOfGroups;
      const bronzeCount = qualificationRules.bronze.length * numberOfGroups;

      if (!isPowerOfTwo(goldCount)) {
        errors.push(
          `Gold qualifier count (${goldCount}) must be a power of 2. ` +
            `${qualificationRules.gold.length} rank(s) × ${numberOfGroups} groups = ${goldCount}`
        );
      }
      if (!isPowerOfTwo(silverCount)) {
        errors.push(
          `Silver qualifier count (${silverCount}) must be a power of 2. ` +
            `${qualificationRules.silver.length} rank(s) × ${numberOfGroups} groups = ${silverCount}`
        );
      }
      if (!isPowerOfTwo(bronzeCount)) {
        errors.push(
          `Bronze qualifier count (${bronzeCount}) must be a power of 2. ` +
            `${qualificationRules.bronze.length} rank(s) × ${numberOfGroups} groups = ${bronzeCount}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
