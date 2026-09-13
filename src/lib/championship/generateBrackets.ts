/**
 * Championship Groups – bracket generation + court/session scheduling
 *
 * Scheduling model (same as generateGroups.ts)
 * ─────────────────────────────────────────────
 * • timeSlot  = session number.  Matches with the same timeSlot run
 *               simultaneously on different courts.
 * • court     = 1-based court number within a session.
 *
 * All three brackets (Gold, Silver, Bronze) share the same courts.
 * Matches in the same knockout round across all brackets are scheduled
 * together, so courts are never idle while matches are waiting.
 * Teams in different brackets can never conflict (each team qualifies
 * into exactly one bracket).
 */

import mongoose from 'mongoose';
import { getFirstRound, calculateKnockoutRounds } from './utils';
import { IQualificationEntry } from './qualifiers';

export interface IBracketMatchCreate {
  _id: mongoose.Types.ObjectId;
  championship: 'gold' | 'silver' | 'bronze';
  round: string;
  sequence: number;
  team1Index?: number;
  team2Index?: number;
  team1Score?: number;
  team2Score?: number;
  winnerIndex?: number;
  status: 'scheduled';
  nextMatchId?: mongoose.Types.ObjectId;
  nextSlot?: 1 | 2;
  court?: number;
  timeSlot?: number;
  matchIndex?: number;
}

export interface IMatchCreate {
  team1Index: number;
  team2Index: number;
  timeSlot: number;
  court: number;
  status: 'scheduled';
  phase: 'gold_knockout' | 'silver_knockout' | 'bronze_knockout';
  round: string;
  bracketMatchId: string;
}

/* ─── Internal bracket builder (no scheduling yet) ──────────────────── */

function buildBracketStructure(
  teams: number[],
  championship: 'gold' | 'silver' | 'bronze'
): IBracketMatchCreate[][] {
  /** Returns rounds in order (round-of-32 first, final last). */
  const count = teams.length;
  const rounds = calculateKnockoutRounds(count);

  const matchesPerRound: IBracketMatchCreate[][] = [];

  for (let r = 0; r < rounds.length; r++) {
    const matchesInRound = count / Math.pow(2, r + 1);
    const roundMatches: IBracketMatchCreate[] = [];
    for (let s = 0; s < matchesInRound; s++) {
      roundMatches.push({
        _id: new mongoose.Types.ObjectId(),
        championship,
        round: rounds[r],
        sequence: s,
        status: 'scheduled',
      });
    }
    matchesPerRound.push(roundMatches);
  }

  // Seed first round
  const firstRound = matchesPerRound[0];
  for (let i = 0; i < firstRound.length; i++) {
    if (teams[i * 2] !== undefined) firstRound[i].team1Index = teams[i * 2];
    if (teams[i * 2 + 1] !== undefined) firstRound[i].team2Index = teams[i * 2 + 1];
  }

  // Link to next round
  for (let r = 0; r < rounds.length - 1; r++) {
    const cur = matchesPerRound[r];
    const nxt = matchesPerRound[r + 1];
    for (let i = 0; i < cur.length; i++) {
      cur[i].nextMatchId = nxt[Math.floor(i / 2)]._id;
      cur[i].nextSlot = ((i % 2) + 1) as 1 | 2;
    }
  }

  return matchesPerRound; // index 0 = first round, last = final
}

/* ─── Cross-bracket scheduler ──────────────────────────────────────── */

/**
 * Assign matchIndex, timeSlot and court to all bracket matches across all
 * three championships, interleaving matches of the same knockout round so
 * courts are shared.
 *
 * @param allRounds   allRounds[bracketIdx][roundIdx] = array of BracketMatch
 * @param numCourts   Available simultaneous courts.
 * @param startSlot   First session number (= maxGroupTimeSlot + 1).
 * @param existingMatchCount  Length of tournament.matches[] before we add ours.
 */
function scheduleAllRounds(
  allRounds: IBracketMatchCreate[][][],
  numCourts: number,
  startSlot: number,
  existingMatchCount: number
): void {
  const maxRoundDepth = Math.max(...allRounds.map((b) => b.length));
  let currentSlot = startSlot;
  let globalMatchIndex = existingMatchCount;

  for (let roundDepth = 0; roundDepth < maxRoundDepth; roundDepth++) {
    // Collect all matches across brackets for this round depth
    const roundMatches: IBracketMatchCreate[] = [];
    for (const bracketRounds of allRounds) {
      if (roundDepth < bracketRounds.length) {
        roundMatches.push(...bracketRounds[roundDepth]);
      }
    }

    // Distribute across numCourts, simple round-robin (no team conflicts since
    // brackets are disjoint; later rounds have TBD teams anyway)
    const slotsNeeded = Math.ceil(roundMatches.length / numCourts);
    roundMatches.forEach((match, i) => {
      match.matchIndex = globalMatchIndex++;
      match.court = (i % numCourts) + 1;
      match.timeSlot = currentSlot + Math.floor(i / numCourts);
    });

    currentSlot += slotsNeeded;
  }
}

/* ─── Silver seeding ───────────────────────────────────────────────── */

function arrangeSilverBracket(silverQualifiers: IQualificationEntry[]): number[] {
  const byGroup = new Map<string, IQualificationEntry[]>();
  silverQualifiers.forEach((q) => {
    const arr = byGroup.get(q.groupName) ?? [];
    arr.push(q);
    byGroup.set(q.groupName, arr);
  });

  const groups = Array.from(byGroup.values());
  const result: number[] = [];
  const maxLen = Math.max(...groups.map((g) => g.length));

  for (let i = 0; i < maxLen; i++) {
    for (const grp of groups) {
      if (i < grp.length) result.push(grp[i].teamIndex);
    }
  }
  return result;
}

/* ─── Public API ─────────────────────────────────────────────────────── */

/**
 * Generate bracket matches for all three championship brackets and the
 * corresponding entries in the global matches[] array.
 *
 * @param qualifiers          Qualification snapshot from the group stage.
 * @param teams               tournament.teams[].
 * @param existingMatchCount  Current length of tournament.matches[] (offset).
 * @param numCourts           Available simultaneous courts (default 1).
 * @param startTimeSlot       First session number for championships (default 1).
 */
export function generateChampionshipBrackets(
  qualifiers: IQualificationEntry[],
  teams: any[],
  existingMatchCount: number,
  numCourts = 1,
  startTimeSlot = 1
): {
  bracketMatches: IBracketMatchCreate[];
  globalMatches: IMatchCreate[];
} {
  const goldQs   = qualifiers.filter((q) => q.championship === 'gold');
  const silverQs = qualifiers.filter((q) => q.championship === 'silver');
  const bronzeQs = qualifiers.filter((q) => q.championship === 'bronze');

  const phaseMap: Record<
    'gold' | 'silver' | 'bronze',
    'gold_knockout' | 'silver_knockout' | 'bronze_knockout'
  > = {
    gold:   'gold_knockout',
    silver: 'silver_knockout',
    bronze: 'bronze_knockout',
  };

  // Build bracket structures (without scheduling yet)
  const goldRounds   = goldQs.length   ? buildBracketStructure(goldQs.map((q) => q.teamIndex), 'gold')   : [];
  const silverRounds = silverQs.length ? buildBracketStructure(arrangeSilverBracket(silverQs), 'silver') : [];
  const bronzeRounds = bronzeQs.length ? buildBracketStructure(bronzeQs.map((q) => q.teamIndex), 'bronze') : [];

  // Schedule all rounds across courts, interleaving all three brackets
  scheduleAllRounds(
    [goldRounds, silverRounds, bronzeRounds],
    numCourts,
    startTimeSlot,
    existingMatchCount
  );

  // Flatten bracket matches
  const allBracket: IBracketMatchCreate[] = [
    ...goldRounds.flat(),
    ...silverRounds.flat(),
    ...bronzeRounds.flat(),
  ];

  // Build global matches (for the existing score-logging API)
  const allGlobal: IMatchCreate[] = allBracket.map((bm) => ({
    team1Index:    bm.team1Index ?? -1,
    team2Index:    bm.team2Index ?? -1,
    timeSlot:      bm.timeSlot!,
    court:         bm.court ?? 1,
    status:        'scheduled',
    phase:         phaseMap[bm.championship],
    round:         bm.round,
    bracketMatchId: bm._id.toString(),
  }));

  return { bracketMatches: allBracket, globalMatches: allGlobal };
}

/* ─── Winner advancement (unchanged) ──────────────────────────────── */

export function advanceKnockoutWinner(
  bracketMatches: any[],
  completedBracketMatchId: string,
  winnerTeamIndex: number
): any[] {
  const updated = bracketMatches.map((m: any) => ({ ...m }));

  const completed = updated.find(
    (m: any) => m._id.toString() === completedBracketMatchId
  );
  if (!completed || !completed.nextMatchId) return updated;

  const nextId = completed.nextMatchId.toString();
  const nextMatch = updated.find((m: any) => m._id.toString() === nextId);
  if (!nextMatch) return updated;

  if (completed.nextSlot === 1) {
    if (nextMatch.team1Index === winnerTeamIndex) return updated;
    nextMatch.team1Index = winnerTeamIndex;
  } else if (completed.nextSlot === 2) {
    if (nextMatch.team2Index === winnerTeamIndex) return updated;
    nextMatch.team2Index = winnerTeamIndex;
  }

  return updated;
}
