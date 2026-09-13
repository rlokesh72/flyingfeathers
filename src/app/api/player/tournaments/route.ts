import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

// GET — list Championship Groups tournaments open for registration (public)
export async function GET() {
  try {
    await connectDB();
    User;

    const tournaments = await Tournament.find({
      tournamentFormat: 'championship-groups',
      championshipStatus: { $in: ['registration_open', 'registration_closed', 'groups_generated', 'group_stage_active', 'group_stage_completed', 'knockouts_generated', 'knockouts_active', 'completed'] },
    })
      .select('name description scheduledDate maxTeams teamsPerGroup numberOfGroups championshipStatus qualificationRules registrations createdAt')
      .sort({ scheduledDate: 1 });

    // Attach accepted/pending counts (don't expose all registration details publicly)
    const result = tournaments.map((t) => {
      const regs = t.registrations ?? [];
      return {
        _id: t._id,
        name: t.name,
        description: t.description,
        scheduledDate: t.scheduledDate,
        maxTeams: t.maxTeams,
        teamsPerGroup: t.teamsPerGroup,
        numberOfGroups: t.numberOfGroups,
        championshipStatus: t.championshipStatus,
        qualificationRules: t.qualificationRules,
        registrationOpen: t.championshipStatus === 'registration_open',
        acceptedCount: regs.filter((r) => r.status === 'accepted').length,
        pendingCount: regs.filter((r) => r.status === 'pending').length,
        totalRegistrations: regs.length,
      };
    });

    return NextResponse.json({ tournaments: result });
  } catch (error) {
    console.error('GET /api/player/tournaments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
