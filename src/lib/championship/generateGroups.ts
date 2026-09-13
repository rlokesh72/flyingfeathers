/**
 * Championship Groups – group generation + match scheduling
 *
 * Scheduling model
 * ────────────────
 * • timeSlot  = "session number" (1, 2, 3…).  All matches with the same
 *               timeSlot happen simultaneously on different courts.
 * • court     = physical court number (1-based) within a session.
 *
 * Within each group we use the standard circle (round-robin) algorithm so
 * each team rests one round between matches.  Rounds from different groups
 * are interleaved before being packed onto courts, maximising court usage
 * and minimising total session count.
 */

export interface MatchToCreate {
  team1Index: number;
  team2Index: number;
  timeSlot: number;
  court: number;
  status: 'scheduled';
  phase: 'group';
  groupIndex: number;
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Convert a 0-based group index to a label: 0→A, 1→B, … 25→Z, 26→AA, …
 */
function getGroupName(index: number): string {
  if (index < 26) return `Group ${String.fromCharCode(65 + index)}`;
  const firstLetter = String.fromCharCode(65 + Math.floor((index - 26) / 26));
  const secondLetter = String.fromCharCode(65 + ((index - 26) % 26));
  return `Group ${firstLetter}${secondLetter}`;
}

/** Fisher-Yates shuffle (returns a new array). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Standard "circle method" round-robin schedule for a group.
 * Returns an array of rounds; each round is an array of [team1, team2] pairs.
 * With N teams (even) we get N-1 rounds, each with N/2 matches.
 * With N teams (odd) a dummy "bye" entry (-1) is added internally.
 */
function generateRoundRobinRounds(teamIndices: number[]): [number, number][][] {
  const teams =
    teamIndices.length % 2 === 0 ? [...teamIndices] : [...teamIndices, -1];
  const N = teams.length;
  const fixed = teams[0];
  let rotating = teams.slice(1);
  const rounds: [number, number][][] = [];

  for (let r = 0; r < N - 1; r++) {
    const circle = [fixed, ...rotating];
    const round: [number, number][] = [];
    for (let i = 0; i < N / 2; i++) {
      const t1 = circle[i];
      const t2 = circle[N - 1 - i];
      if (t1 >= 0 && t2 >= 0) round.push([t1, t2]);
    }
    if (round.length) rounds.push(round);
    // Rotate the tail: move last element to front
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }
  return rounds;
}

interface RawMatch {
  team1Index: number;
  team2Index: number;
  groupIndex: number;
}

/**
 * Greedy court/session scheduler.
 *
 * For each match (in the supplied order) we find the earliest session where:
 *   1. A court is still free  (courtsUsed < numCourts), and
 *   2. Neither team is already playing in that session.
 *
 * @param matches     Ordered list of matches to schedule.
 * @param numCourts   Number of simultaneous courts available (≥1).
 * @param startSlot   First session number to use (default 1).
 * @returns           Parallel array of { court, timeSlot } assignments.
 */
function assignCourtsAndSlots(
  matches: RawMatch[],
  numCourts: number,
  startSlot = 1
): { court: number; timeSlot: number }[] {
  const result: { court: number; timeSlot: number }[] = [];
  const slotUsage = new Map<
    number,
    { courtsUsed: number; teamsPlaying: Set<number> }
  >();

  for (const match of matches) {
    for (let slot = startSlot; ; slot++) {
      if (!slotUsage.has(slot))
        slotUsage.set(slot, { courtsUsed: 0, teamsPlaying: new Set() });
      const u = slotUsage.get(slot)!;
      if (
        u.courtsUsed < numCourts &&
        !u.teamsPlaying.has(match.team1Index) &&
        !u.teamsPlaying.has(match.team2Index)
      ) {
        result.push({ court: u.courtsUsed + 1, timeSlot: slot });
        u.courtsUsed++;
        u.teamsPlaying.add(match.team1Index);
        u.teamsPlaying.add(match.team2Index);
        break;
      }
    }
  }
  return result;
}

/* ─── Public API ───────────────────────────────────────────────────────── */

/**
 * Generate groups from accepted team indices.
 * @param acceptedTeamIndices  Indices into tournament.teams[]
 * @param teamsPerGroup        Number of teams per group
 * @param method               'random' (default)
 */
export function generateGroups(
  acceptedTeamIndices: number[],
  teamsPerGroup: number,
  method: 'random' | 'sequential' = 'random'
): { name: string; sequence: number; teamIndices: number[] }[] {
  const arranged =
    method === 'random' ? shuffle(acceptedTeamIndices) : [...acceptedTeamIndices];
  const numGroups = Math.floor(arranged.length / teamsPerGroup);

  return Array.from({ length: numGroups }, (_, i) => ({
    name: getGroupName(i),
    sequence: i,
    teamIndices: arranged.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup),
  }));
}

/**
 * Generate all intra-group matches with court and session assignments.
 *
 * Strategy:
 *   1. Use the circle method to build per-group round-robin rounds.
 *   2. Interleave rounds across all groups (round 1 of every group first,
 *      then round 2, etc.) so courts fill from different groups in parallel.
 *   3. Apply the greedy scheduler to assign (court, timeSlot).
 *
 * @param groups              Groups returned from generateGroups().
 * @param numCourts           Number of simultaneous courts (default 1).
 * @param startSlot           First session number (default 1).
 */
export function generateGroupMatches(
  groups: { name: string; sequence: number; teamIndices: number[] }[],
  numCourts = 1,
  startSlot = 1
): MatchToCreate[] {
  // 1. Generate round-robin rounds for every group
  const allGroupRounds = groups.map((g) =>
    generateRoundRobinRounds(g.teamIndices).map((round) =>
      round.map(([t1, t2]) => ({ team1Index: t1, team2Index: t2, groupIndex: g.sequence }))
    )
  );

  const maxRounds = Math.max(...allGroupRounds.map((r) => r.length), 0);

  // 2. Interleave: all groups' round 0, then all groups' round 1, …
  const orderedMatches: RawMatch[] = [];
  for (let r = 0; r < maxRounds; r++) {
    for (const groupRounds of allGroupRounds) {
      if (r < groupRounds.length) {
        orderedMatches.push(...groupRounds[r]);
      }
    }
  }

  // 3. Assign courts and sessions
  const schedule = assignCourtsAndSlots(orderedMatches, numCourts, startSlot);

  // 4. Build final match objects
  return orderedMatches.map((m, i) => ({
    team1Index: m.team1Index,
    team2Index: m.team2Index,
    timeSlot: schedule[i].timeSlot,
    court: schedule[i].court,
    status: 'scheduled' as const,
    phase: 'group' as const,
    groupIndex: m.groupIndex,
  }));
}

/**
 * Return the highest timeSlot used in a list of matches (0 if empty).
 * Use this to know where the championship schedule should start.
 */
export function maxTimeSlot(matches: { timeSlot?: number }[]): number {
  return matches.reduce((max, m) => Math.max(max, m.timeSlot ?? 0), 0);
}
