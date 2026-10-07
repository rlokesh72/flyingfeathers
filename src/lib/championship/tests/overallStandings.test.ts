/**
 * Run with: npx tsx src/lib/championship/tests/overallStandings.test.ts
 */

import { buildOverallStandings } from '../overallStandings';

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

function assertEqual<T>(actual: T, expected: T, label?: string) {
  if (actual !== expected) {
    throw new Error(`${label ? label + ': ' : ''}Expected ${expected}, got ${actual}`);
  }
}

const teams = Array.from({ length: 32 }, (_, i) => ({
  name: `Team ${i}`,
  players: [`P${i}A`, `P${i}B`],
}));

test('Men gold RR ranks all four teams with full stats and locks labels when complete', () => {
  const matches = [
    { championship: 'gold', category: 'men', round: 'round_robin', team1Index: 0, team2Index: 1, team1Score: 21, team2Score: 10, winnerIndex: 0, status: 'completed' },
    { championship: 'gold', category: 'men', round: 'round_robin', team1Index: 0, team2Index: 2, team1Score: 21, team2Score: 18, winnerIndex: 0, status: 'completed' },
    { championship: 'gold', category: 'men', round: 'round_robin', team1Index: 0, team2Index: 3, team1Score: 21, team2Score: 15, winnerIndex: 0, status: 'completed' },
    { championship: 'gold', category: 'men', round: 'round_robin', team1Index: 1, team2Index: 2, team1Score: 21, team2Score: 19, winnerIndex: 1, status: 'completed' },
    { championship: 'gold', category: 'men', round: 'round_robin', team1Index: 1, team2Index: 3, team1Score: 18, team2Score: 21, winnerIndex: 3, status: 'completed' },
    { championship: 'gold', category: 'men', round: 'round_robin', team1Index: 2, team2Index: 3, team1Score: 21, team2Score: 14, winnerIndex: 2, status: 'completed' },
  ];
  const { men, women } = buildOverallStandings(matches, teams);
  assertEqual(men.gold.length, 4, 'gold teams');
  assertEqual(men.gold[0].teamIndex, 0, 'champion');
  assertEqual(men.gold[0].wins, 3, 'champion wins');
  assertEqual(men.gold[0].matchesPlayed, 3, 'champion MP');
  assertEqual(men.gold[0].label, 'Champion', 'champion label');
  assertEqual(men.gold[1].label, 'Runner-Up', 'runner-up label');
  assertEqual(women.gold.length, 0, 'no women leakage');
});

test('Men and women gold stay in separate tables', () => {
  const matches = [
    { championship: 'gold', category: 'men', round: 'round_robin', team1Index: 0, team2Index: 1, team1Score: 21, team2Score: 8, winnerIndex: 0, status: 'completed' },
    { championship: 'gold', category: 'women', round: 'final', team1Index: 8, team2Index: 9, team1Score: 21, team2Score: 19, winnerIndex: 8, status: 'completed' },
    { championship: 'gold', category: 'women', round: 'semi_final', team1Index: 8, team2Index: 10, team1Score: 21, team2Score: 12, winnerIndex: 8, status: 'completed' },
    { championship: 'gold', category: 'women', round: 'semi_final', team1Index: 9, team2Index: 11, team1Score: 21, team2Score: 16, winnerIndex: 9, status: 'completed' },
  ];
  const { men, women } = buildOverallStandings(matches, teams);
  assertEqual(men.gold.some((r) => r.teamIndex === 8), false, 'women not in men gold');
  assertEqual(women.gold[0].teamIndex, 8, 'women champion');
  assertEqual(women.gold[0].label, 'Champion', 'women champion label');
  assertEqual(women.gold[1].teamIndex, 9, 'women runner-up');
  assertEqual(women.gold[1].wins, 1, 'runner-up wins');
  assertEqual(women.gold.find((r) => r.teamIndex === 11)?.label, '3rd Place', 'closer SF loss is 3rd');
  assertEqual(women.gold.find((r) => r.teamIndex === 10)?.label, '4th Place', 'heavier SF loss is 4th');
});

test('Women bronze ignores a leaked gold team that was written into the final', () => {
  const matches = [
    { championship: 'bronze', category: 'women', round: 'semi_final', team1Index: 3, team2Index: 27, team1Score: 8, team2Score: 21, winnerIndex: 27, status: 'completed' },
    { championship: 'bronze', category: 'women', round: 'semi_final', team1Index: 22, team2Index: 28, team1Score: 21, team2Score: 12, winnerIndex: 22, status: 'completed' },
    { championship: 'bronze', category: 'women', round: 'final', team1Index: 19, team2Index: 22, team1Score: 12, team2Score: 21, winnerIndex: 22, status: 'completed' },
    { championship: 'gold', category: 'women', round: 'semi_final', team1Index: 19, team2Index: 13, team1Score: 21, team2Score: 20, winnerIndex: 19, status: 'completed' },
    { championship: 'gold', category: 'women', round: 'final', team1Index: 17, team2Index: 19, team1Score: 21, team2Score: 18, winnerIndex: 17, status: 'completed' },
  ];
  const { women } = buildOverallStandings(matches, teams);
  assertEqual(women.gold.some((r) => r.teamIndex === 19), true, 'Team 35 stays in gold');
  assertEqual(women.bronze.some((r) => r.teamIndex === 19), false, 'Team 35 not in bronze');
  assertEqual(women.bronze.length, 4, 'bronze roster is the four SF teams');
});

test('Men silver lists six winners then R1 exits with their own stats', () => {
  const r1 = [
    { championship: 'silver', category: 'men', round: 'crossover_r1', team1Index: 0, team2Index: 1, team1Score: 21, team2Score: 10, winnerIndex: 0, status: 'completed' },
    { championship: 'silver', category: 'men', round: 'crossover_r1', team1Index: 2, team2Index: 3, team1Score: 21, team2Score: 19, winnerIndex: 2, status: 'completed' },
    { championship: 'silver', category: 'men', round: 'crossover_r1', team1Index: 4, team2Index: 5, team1Score: 21, team2Score: 15, winnerIndex: 4, status: 'completed' },
    { championship: 'silver', category: 'men', round: 'crossover_r1', team1Index: 6, team2Index: 7, team1Score: 21, team2Score: 8, winnerIndex: 6, status: 'completed' },
    { championship: 'silver', category: 'men', round: 'crossover_r1', team1Index: 8, team2Index: 9, team1Score: 21, team2Score: 18, winnerIndex: 8, status: 'completed' },
    { championship: 'silver', category: 'men', round: 'crossover_r1', team1Index: 10, team2Index: 11, team1Score: 21, team2Score: 16, winnerIndex: 10, status: 'completed' },
  ];
  const { men } = buildOverallStandings(r1, teams);
  assertEqual(men.silver.length, 12, 'all silver participants');
  assertEqual(men.silver.filter((r) => r.label === 'R1 exit').length, 6, 'six exits');
  assertEqual(men.silver[0].wins, 1, 'winner has the R1 win');
  assertEqual(men.silver[6].wins, 0, 'first exit has 0 wins');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
