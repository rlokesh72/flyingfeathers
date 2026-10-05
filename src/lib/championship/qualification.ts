export type ChampionshipPath = 'gold' | 'silver' | 'bronze';
export type GroupCategory = 'men' | 'women';
export type QualificationRules = {
  gold: number[];
  silver: number[];
  bronze: number[];
};

export const MEN_QUALIFICATION_RULES: QualificationRules = {
  gold: [1],
  silver: [2, 3, 4],
  bronze: [5, 6],
};

export const WOMEN_QUALIFICATION_RULES: QualificationRules = {
  gold: [1, 2],
  silver: [3, 4],
  bronze: [5, 6],
};

const WOMEN_GROUP_LETTERS = new Set(['E', 'F']);

export function inferGroupCategory(group: { name?: string; category?: string }): GroupCategory {
  if (group.category === 'women' || group.category === 'men') return group.category;
  const letter = group.name?.trim().match(/^group\s+([a-z]{1,2})$/i)?.[1]?.toUpperCase();
  if (letter && WOMEN_GROUP_LETTERS.has(letter)) return 'women';
  return 'men';
}

export function normalizeGroupCategory(value: unknown, fallbackName?: string): GroupCategory {
  if (value === 'women' || value === 'men') return value;
  return inferGroupCategory({ name: fallbackName });
}

export function resolveQualificationRules(
  group: { name?: string; category?: string },
  menRules?: QualificationRules | null,
  womenRules?: QualificationRules | null
): QualificationRules {
  return inferGroupCategory(group) === 'women'
    ? (womenRules ?? WOMEN_QUALIFICATION_RULES)
    : (menRules ?? MEN_QUALIFICATION_RULES);
}

export function championshipForRank(
  rank: number,
  rules: QualificationRules
): ChampionshipPath | null {
  if (rules.gold.includes(rank)) return 'gold';
  if (rules.silver.includes(rank)) return 'silver';
  if (rules.bronze.includes(rank)) return 'bronze';
  return null;
}
