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

  const allRanks = [
    ...qualificationRules.gold,
    ...qualificationRules.silver,
    ...qualificationRules.bronze,
  ];
  if (allRanks.some((r) => !Number.isInteger(r) || r < 1)) {
    errors.push('Qualification ranks must be positive integers');
  }
  const sorted = [...allRanks].sort((a, b) => a - b);
  if (sorted.some((r, i) => i > 0 && r === sorted[i - 1])) {
    errors.push('Qualification rules contain duplicate ranks');
  }

  return { valid: errors.length === 0, errors };
}
