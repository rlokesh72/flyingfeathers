/**
 * Championship Groups — unit tests
 *
 * Run with:  npx jest src/lib/championship/tests/championship.test.ts --testEnvironment node
 */

import { validateChampionshipConfig, calculateGroupCount, calculateKnockoutRounds, isPowerOfTwo } from '../utils';
import { generateGroups, generateGroupMatches } from '../generateGroups';
import { generateChampionshipBrackets } from '../generateBrackets';
import { advanceKnockoutWinner } from '../generateBrackets';
import { determineQualifiers } from '../qualifiers';
import { inferGroupCategory, resolveQualificationRules, championshipForRank, WOMEN_QUALIFICATION_RULES } from '../qualification';
import {
  generateMensOpeningStage,
  generateMensNextStage,
  inspectMensNextStages,
  rankMensTeams,
  splitQualifiersByCategory,
} from '../mensFormat';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Team ${i + 1}`,
    players: [`Player ${i + 1}A`, `Player ${i + 1}B`],
  }));
}

function buildMockQualifiers(
  groups: { name: string; sequence: number; teamIndices: number[] }[],
  qualificationRules: { gold: number[]; silver: number[]; bronze: number[] }
) {
  // Build dummy qualifiers without real match data (no completed matches → random order)
  const qs: any[] = [];
  groups.forEach((g) => {
    g.teamIndices.forEach((ti, rankIdx) => {
      const rank = rankIdx + 1;
      let championship: 'gold' | 'silver' | 'bronze' | null = null;
      if (qualificationRules.gold.includes(rank)) championship = 'gold';
      else if (qualificationRules.silver.includes(rank)) championship = 'silver';
      else if (qualificationRules.bronze.includes(rank)) championship = 'bronze';
      if (championship) {
        qs.push({ groupId: g.name, groupName: g.name, rank, teamIndex: ti, teamName: `Team ${ti + 1}`, championship });
      }
    });
  });
  return qs;
}

// ---------------------------------------------------------------------------
// Test runner helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ ${label}\n     ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label?: string) {
  if (actual !== expected) {
    throw new Error(`${label ? label + ': ' : ''}Expected ${expected}, got ${actual}`);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const MAX_TEAMS = 32;
const TEAMS_PER_GROUP = 4;
const QUAL_RULES = { gold: [1], silver: [2, 3], bronze: [4] };

const teamIndices = Array.from({ length: MAX_TEAMS }, (_, i) => i);
const teams = makeTeams(MAX_TEAMS);

console.log('\n══════════════ Championship Group Tests ══════════════\n');

// 1. 32 teams + 4 per group = 8 groups
test('32 teams ÷ 4 per group = 8 groups', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  assertEqual(groups.length, 8, 'group count');
});

// 2. Each group has 6 intra-group matches (C(4,2)=6)
test('Each group generates C(4,2)=6 matches', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const matches = generateGroupMatches(groups, 0);
  for (const g of groups) {
    const groupMatches = matches.filter((m) => m.groupIndex === g.sequence);
    assertEqual(groupMatches.length, 6, `group ${g.name} match count`);
  }
});

// 3. Total group matches = 8 groups × 6 = 48
test('Total group matches = 48', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const matches = generateGroupMatches(groups, 0);
  assertEqual(matches.length, 48, 'total group match count');
});

// 4. Gold qualifiers = 8 (1 per group)
test('Gold qualifiers count = 8', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const gold = qs.filter((q) => q.championship === 'gold');
  assertEqual(gold.length, 8, 'gold count');
});

// 5. Silver qualifiers = 16 (2nd+3rd from each group)
test('Silver qualifiers count = 16', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const silver = qs.filter((q) => q.championship === 'silver');
  assertEqual(silver.length, 16, 'silver count');
});

// 6. Bronze qualifiers = 8 (4th from each group)
test('Bronze qualifiers count = 8', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const bronze = qs.filter((q) => q.championship === 'bronze');
  assertEqual(bronze.length, 8, 'bronze count');
});

// 7. No duplicate qualifiers across Gold/Silver/Bronze
test('No duplicate team across Gold/Silver/Bronze', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const seen = new Set<number>();
  for (const q of qs) {
    assert(!seen.has(q.teamIndex), `Team ${q.teamIndex} appears more than once`);
    seen.add(q.teamIndex);
  }
});

// 8. Gold bracket = 8 teams → QF→SF→Final (3 rounds, 7 matches)
test('Gold bracket: 8 teams → 3 rounds, 7 matches', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const { bracketMatches } = generateChampionshipBrackets(qs, teams, 48);
  const goldMatches = bracketMatches.filter((bm) => bm.championship === 'gold');
  assertEqual(goldMatches.length, 7, 'gold bracket match count');
  const rounds = new Set(goldMatches.map((bm) => bm.round));
  assert(rounds.has('quarter_final'), 'QF present');
  assert(rounds.has('semi_final'), 'SF present');
  assert(rounds.has('final'), 'Final present');
});

// 9. Silver bracket = 16 teams → R16→QF→SF→Final (4 rounds, 15 matches)
test('Silver bracket: 16 teams → 4 rounds, 15 matches', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const { bracketMatches } = generateChampionshipBrackets(qs, teams, 48);
  const silverMatches = bracketMatches.filter((bm) => bm.championship === 'silver');
  assertEqual(silverMatches.length, 15, 'silver bracket match count');
  const rounds = new Set(silverMatches.map((bm) => bm.round));
  assert(rounds.has('round_of_16'), 'R16 present');
  assert(rounds.has('quarter_final'), 'QF present');
  assert(rounds.has('semi_final'), 'SF present');
  assert(rounds.has('final'), 'Final present');
});

// 10. Bronze bracket = 8 teams → QF→SF→Final (3 rounds, 7 matches)
test('Bronze bracket: 8 teams → 3 rounds, 7 matches', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const { bracketMatches } = generateChampionshipBrackets(qs, teams, 48);
  const bronzeMatches = bracketMatches.filter((bm) => bm.championship === 'bronze');
  assertEqual(bronzeMatches.length, 7, 'bronze bracket match count');
});

// 11. Knockout winner advances correctly
test('advanceKnockoutWinner sets correct slot in next match', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const { bracketMatches } = generateChampionshipBrackets(qs, teams, 48);

  const goldQFs = bracketMatches.filter(
    (bm) => bm.championship === 'gold' && bm.round === 'quarter_final'
  );
  const firstQF = goldQFs[0];

  const winnerIndex = firstQF.team1Index ?? 0;
  const updated = advanceKnockoutWinner(
    bracketMatches as any[],
    firstQF._id.toString(),
    winnerIndex
  );

  const nextMatch = updated.find((m) => m._id.toString() === firstQF.nextMatchId?.toString());
  assert(nextMatch !== undefined, 'next match found');
  const slotValue = firstQF.nextSlot === 1 ? nextMatch.team1Index : nextMatch.team2Index;
  assertEqual(slotValue, winnerIndex, 'winner placed in correct slot');
});

// 12. Same bracket match scored twice is idempotent
test('advanceKnockoutWinner ignores a winner who did not play the match', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const { bracketMatches } = generateChampionshipBrackets(qs, teams, 48);
  const goldQFs = bracketMatches.filter(
    (bm) => bm.championship === 'gold' && bm.round === 'quarter_final'
  );
  const firstQF = goldQFs[0];
  const nextBefore = bracketMatches.find((m) => m._id.toString() === firstQF.nextMatchId?.toString());
  const updated = advanceKnockoutWinner(bracketMatches as any[], firstQF._id.toString(), 999);
  const nextAfter = updated.find((m) => m._id.toString() === firstQF.nextMatchId?.toString());
  assertEqual(nextAfter?.team1Index, nextBefore?.team1Index, 'slot 1 unchanged');
  assertEqual(nextAfter?.team2Index, nextBefore?.team2Index, 'slot 2 unchanged');
});

test('advanceKnockoutWinner is idempotent on double-call', () => {
  const groups = generateGroups(teamIndices, TEAMS_PER_GROUP);
  const qs = buildMockQualifiers(groups, QUAL_RULES);
  const { bracketMatches } = generateChampionshipBrackets(qs, teams, 48);

  const goldQFs = bracketMatches.filter(
    (bm) => bm.championship === 'gold' && bm.round === 'quarter_final'
  );
  const firstQF = goldQFs[0];
  const winnerIndex = firstQF.team1Index ?? 0;

  const once = advanceKnockoutWinner(bracketMatches as any[], firstQF._id.toString(), winnerIndex);
  const twice = advanceKnockoutWinner(once, firstQF._id.toString(), winnerIndex);

  const nextOnce = once.find((m) => m._id.toString() === firstQF.nextMatchId?.toString());
  const nextTwice = twice.find((m) => m._id.toString() === firstQF.nextMatchId?.toString());

  const slotOnce = firstQF.nextSlot === 1 ? nextOnce?.team1Index : nextOnce?.team2Index;
  const slotTwice = firstQF.nextSlot === 1 ? nextTwice?.team1Index : nextTwice?.team2Index;

  assertEqual(slotOnce, slotTwice, 'idempotent advancement');
});

// 13. Invalid config → overlapping ranks
test('validateChampionshipConfig rejects duplicate qualification ranks', () => {
  const result = validateChampionshipConfig({
    maxTeams: 34,
    teamsPerGroup: 6,
    qualificationRules: { gold: [1], silver: [2, 3, 4], bronze: [5, 6] },
  });
  assert(result.valid, 'flexible group sizes and ranks 1-6 should be valid');

  const invalid = validateChampionshipConfig({
    maxTeams: 34,
    teamsPerGroup: 6,
    qualificationRules: { gold: [1], silver: [1, 2], bronze: [5] },
  });
  assert(!invalid.valid, 'should be invalid due to rank 1 in gold and silver');
  assert(invalid.errors.some((e) => e.includes('duplicate')), 'error mentions duplicate ranks');
});

// 15. Women's groups: 1st+2nd Gold, 3rd+4th Silver, 5th+6th Bronze
test('Women qualification: 1–2 gold, 3–4 silver, 5–6 bronze', () => {
  assertEqual(inferGroupCategory({ name: 'Group E' }), 'women', 'Group E defaults to women');
  assertEqual(inferGroupCategory({ name: 'Group F' }), 'women', 'Group F defaults to women');
  assertEqual(inferGroupCategory({ name: 'Group A' }), 'men', 'Group A defaults to men');
  assertEqual(inferGroupCategory({ name: 'Group E', category: 'men' }), 'men', 'explicit category wins');

  const womenRules = resolveQualificationRules({ name: 'Group E', category: 'women' });
  assertEqual(championshipForRank(1, womenRules), 'gold', 'women 1st gold');
  assertEqual(championshipForRank(2, womenRules), 'gold', 'women 2nd gold');
  assertEqual(championshipForRank(3, womenRules), 'silver', 'women 3rd silver');
  assertEqual(championshipForRank(4, womenRules), 'silver', 'women 4th silver');
  assertEqual(championshipForRank(5, womenRules), 'bronze', 'women 5th bronze');
  assertEqual(championshipForRank(6, womenRules), 'bronze', 'women 6th bronze');

  const menRules = resolveQualificationRules({ name: 'Group A', category: 'men' });
  assertEqual(championshipForRank(1, menRules), 'gold', 'men 1st gold');
  assertEqual(championshipForRank(2, menRules), 'silver', 'men 2nd silver');
  assertEqual(WOMEN_QUALIFICATION_RULES.gold.join(','), '1,2', 'women gold ranks');
});

// 14. Incomplete group stage → validation would block championship generation
test('Incomplete group stage detected when checking match completions', () => {
  const groups = generateGroups(Array.from({ length: 8 }, (_, i) => i), 4);
  const matches = generateGroupMatches(groups, 0);
  const allCompleted = (matches as any[]).every((m) => (m.status as string) === 'completed');
  // Fresh matches are all 'scheduled', so not all completed
  assert(!allCompleted, 'New matches should not be completed');
});

test('Men opening stage: Gold RR + Silver R1 + Bronze R1 pairings', () => {
  const qs = [
    { groupName: 'Group A', rank: 1, teamIndex: 0, championship: 'gold' },
    { groupName: 'Group B', rank: 1, teamIndex: 1, championship: 'gold' },
    { groupName: 'Group C', rank: 1, teamIndex: 2, championship: 'gold' },
    { groupName: 'Group D', rank: 1, teamIndex: 3, championship: 'gold' },
    { groupName: 'Group A', rank: 2, teamIndex: 4, championship: 'silver' },
    { groupName: 'Group A', rank: 3, teamIndex: 5, championship: 'silver' },
    { groupName: 'Group A', rank: 4, teamIndex: 6, championship: 'silver' },
    { groupName: 'Group B', rank: 2, teamIndex: 7, championship: 'silver' },
    { groupName: 'Group B', rank: 3, teamIndex: 8, championship: 'silver' },
    { groupName: 'Group B', rank: 4, teamIndex: 9, championship: 'silver' },
    { groupName: 'Group C', rank: 2, teamIndex: 10, championship: 'silver' },
    { groupName: 'Group C', rank: 3, teamIndex: 11, championship: 'silver' },
    { groupName: 'Group C', rank: 4, teamIndex: 12, championship: 'silver' },
    { groupName: 'Group D', rank: 2, teamIndex: 13, championship: 'silver' },
    { groupName: 'Group D', rank: 3, teamIndex: 14, championship: 'silver' },
    { groupName: 'Group D', rank: 4, teamIndex: 15, championship: 'silver' },
    { groupName: 'Group A', rank: 5, teamIndex: 16, championship: 'bronze' },
    { groupName: 'Group B', rank: 5, teamIndex: 17, championship: 'bronze' },
    { groupName: 'Group C', rank: 5, teamIndex: 18, championship: 'bronze' },
    { groupName: 'Group C', rank: 6, teamIndex: 19, championship: 'bronze' },
    { groupName: 'Group D', rank: 5, teamIndex: 20, championship: 'bronze' },
    { groupName: 'Group D', rank: 6, teamIndex: 21, championship: 'bronze' },
  ] as any[];

  const { bracketMatches } = generateMensOpeningStage(qs, 0, 4, 1);
  const gold = bracketMatches.filter((m) => m.round === 'round_robin');
  const silver = bracketMatches.filter((m) => m.championship === 'silver');
  const bronze = bracketMatches.filter((m) => m.championship === 'bronze');

  assertEqual(gold.length, 6, 'gold RR match count');
  assertEqual(silver.length, 6, 'silver R1 match count');
  assertEqual(bronze.length, 3, 'bronze R1 match count');

  const a2b4 = silver.find((m) => m.sequence === 0);
  assertEqual(a2b4?.team1Index, 4, 'A2');
  assertEqual(a2b4?.team2Index, 9, 'B4');
  const c5d6 = bronze.find((m) => m.sequence === 1);
  assertEqual(c5d6?.team1Index, 18, 'C5');
  assertEqual(c5d6?.team2Index, 21, 'D6');
  assertEqual(inspectMensNextStages(bracketMatches).length, 0, 'no next stage until R1 complete');

  const { men, women } = splitQualifiersByCategory(
    [...qs, { groupName: 'Group E', rank: 1, teamIndex: 30, championship: 'gold' } as any],
    [{ name: 'Group E', category: 'women' }]
  );
  assertEqual(women.length, 1, 'women split out');
  assert(men.length > 0, 'men remain');
});

test('Men ranking: wins then PD then PF', () => {
  const ranked = rankMensTeams(
    [1, 2, 3],
    [
      { team1Index: 1, team2Index: 9, team1Score: 21, team2Score: 10, status: 'completed' },
      { team1Index: 2, team2Index: 8, team1Score: 21, team2Score: 18, status: 'completed' },
      { team1Index: 3, team2Index: 7, team1Score: 15, team2Score: 21, status: 'completed' },
    ],
    [{}, { name: 'One' }, { name: 'Two' }, { name: 'Three' }]
  );
  assertEqual(ranked[0].teamIndex, 1, 'best PD among winners first');
  assertEqual(ranked[1].teamIndex, 2, 'other winner second');
  assertEqual(ranked[2].teamIndex, 3, 'loser last');
});

test('Silver R2 pairs AB winners vs CD winners by R1 PD', () => {
  const r1 = [
    { championship: 'silver', round: 'crossover_r1', category: 'men', sequence: 0, team1Index: 4, team2Index: 9, team1Score: 21, team2Score: 10, winnerIndex: 4, status: 'completed' },
    { championship: 'silver', round: 'crossover_r1', category: 'men', sequence: 1, team1Index: 5, team2Index: 8, team1Score: 21, team2Score: 19, winnerIndex: 5, status: 'completed' },
    { championship: 'silver', round: 'crossover_r1', category: 'men', sequence: 2, team1Index: 6, team2Index: 7, team1Score: 21, team2Score: 15, winnerIndex: 6, status: 'completed' },
    { championship: 'silver', round: 'crossover_r1', category: 'men', sequence: 3, team1Index: 10, team2Index: 15, team1Score: 21, team2Score: 8, winnerIndex: 10, status: 'completed' },
    { championship: 'silver', round: 'crossover_r1', category: 'men', sequence: 4, team1Index: 11, team2Index: 14, team1Score: 21, team2Score: 18, winnerIndex: 11, status: 'completed' },
    { championship: 'silver', round: 'crossover_r1', category: 'men', sequence: 5, team1Index: 12, team2Index: 13, team1Score: 21, team2Score: 16, winnerIndex: 12, status: 'completed' },
  ];
  assert(inspectMensNextStages(r1).includes('silver_r2'), 'R2 ready after R1');
  const { bracketMatches } = generateMensNextStage('silver_r2', r1, [], 0, 1, 1);
  assertEqual(bracketMatches.length, 3, 'three R2 matches');
  assertEqual(bracketMatches[0].team1Index, 4, 'best AB vs weakest CD');
  assertEqual(bracketMatches[0].team2Index, 11, 'CD ranked 3rd by PD');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════════════\n`);

if (failed > 0) process.exit(1);
