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

// 13. Invalid config → validation error
test('validateChampionshipConfig rejects non-power-of-2 qualifier totals', () => {
  // 10 teams, 5 per group = 2 groups; gold=[1]→2 gold (power of 2 ✓)
  // silver=[2,3]→4 (power of 2 ✓); bronze=[4,5]→4 (power of 2 ✓)
  // 3 teams, 3 per group = 1 group → gold=[1]→1(power of 2 ✓), but maxTeams<4 → error
  const result = validateChampionshipConfig({
    maxTeams: 6,        // 6/3=2 groups; gold=[1]→2 ✓ silver=[2]→2 ✓ bronze=[3]→2 ✓
    teamsPerGroup: 3,
    qualificationRules: { gold: [1], silver: [2], bronze: [3] },
  });
  // 6/3=2 groups → gold=2, silver=2, bronze=2 — all powers of 2 → valid
  assert(result.valid, 'config should be valid');

  // Now try a non-power-of-2 scenario: 12 teams, 4/group = 3 groups → gold=3 (not PoT)
  const invalid = validateChampionshipConfig({
    maxTeams: 12,
    teamsPerGroup: 4,
    qualificationRules: { gold: [1], silver: [2, 3], bronze: [4] },
  });
  // gold=1×3=3 → NOT power of 2
  assert(!invalid.valid, 'should be invalid due to gold=3');
  assert(invalid.errors.some((e) => e.includes('Gold')), 'error mentions Gold');
});

// 14. Incomplete group stage → validation would block championship generation
test('Incomplete group stage detected when checking match completions', () => {
  const groups = generateGroups(Array.from({ length: 8 }, (_, i) => i), 4);
  const matches = generateGroupMatches(groups, 0);
  const allCompleted = (matches as any[]).every((m) => (m.status as string) === 'completed');
  // Fresh matches are all 'scheduled', so not all completed
  assert(!allCompleted, 'New matches should not be completed');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════════════\n`);

if (failed > 0) process.exit(1);
