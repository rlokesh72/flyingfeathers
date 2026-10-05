import { generateGroupMatches } from './generateGroups';
import {
  inferGroupCategory,
  MEN_QUALIFICATION_RULES,
  WOMEN_QUALIFICATION_RULES,
} from './qualification';

function plain(doc: any) {
  return typeof doc?.toObject === 'function' ? doc.toObject() : { ...doc };
}

function cloneRegistration(reg: any) {
  const r = plain(reg);
  const rejected = r.status === 'rejected' || r.status === 'withdrawn';
  return {
    teamName: r.teamName,
    players: r.players ?? [r.player1Name, r.player2Name].filter(Boolean),
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone,
    status: rejected ? r.status : 'accepted',
    appliedAt: r.appliedAt ?? new Date(),
    reviewedAt: new Date(),
    notes: r.notes,
    player1SupabaseId: r.player1SupabaseId,
    player1Name: r.player1Name,
    player1Email: r.player1Email,
    player2SupabaseId: r.player2SupabaseId,
    player2Name: r.player2Name,
    player2Email: r.player2Email,
    partnerStatus: rejected ? r.partnerStatus : (r.player2Name ? 'confirmed' : r.partnerStatus ?? 'none'),
    category: r.category,
  };
}

export function buildSimulationDocument(source: any, createdBy: string) {
  const registrations = (source.registrations ?? []).map(cloneRegistration);
  const acceptedRegs = registrations.filter((r: any) => r.status === 'accepted');

  const teams = (source.teams?.length ? source.teams : acceptedRegs).map((t: any) => ({
    name: t.name ?? t.teamName,
    players: t.players ?? [t.player1Name, t.player2Name].filter(Boolean),
    category: t.category,
  }));

  if (teams.length < 2) {
    throw new Error('Need at least 2 teams to create a simulation');
  }

  const groups = (source.groups ?? []).map((g: any, i: number) => ({
    name: g.name,
    sequence: g.sequence ?? i,
    teamIndices: [...(g.teamIndices ?? [])],
    category: inferGroupCategory(g),
  }));

  const canGenerateMatches = groups.length > 0 && groups.every((g) => g.teamIndices.length >= 2);
  const matches = canGenerateMatches
    ? generateGroupMatches(groups, source.numberOfCourts ?? 1, 1)
    : [];

  const stamp = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const liveName = String(source.name || 'Tournament').replace(/^\[TEST\]\s*/, '');

  return {
    name: `[TEST] ${liveName} — ${stamp}`,
    description: `Simulation of ${liveName}. Same players and groups, empty scores. Logging here does not affect the live tournament.`,
    numberOfTeams: teams.length,
    tournamentFormat: 'championship-groups' as const,
    numberOfCourts: source.numberOfCourts,
    maxTeams: source.maxTeams,
    teamsPerGroup: source.teamsPerGroup,
    numberOfGroups: groups.length || source.numberOfGroups,
    qualificationRules: source.qualificationRules ?? MEN_QUALIFICATION_RULES,
    womenQualificationRules: source.womenQualificationRules ?? WOMEN_QUALIFICATION_RULES,
    championshipStatus: matches.length ? 'group_stage_active' : 'registration_closed',
    registrations,
    groups: groups.length ? groups : undefined,
    teams,
    matches,
    scheduledDate: source.scheduledDate,
    status: matches.length ? 'in-progress' : 'confirmed',
    createdBy,
    isSimulation: true,
    simulatedFrom: source._id,
  };
}
