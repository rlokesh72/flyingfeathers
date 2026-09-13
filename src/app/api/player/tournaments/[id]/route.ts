import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

// GET — public tournament detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    User;

    const t = await Tournament.findById(id).select(
      'name description scheduledDate maxTeams teamsPerGroup numberOfGroups championshipStatus qualificationRules registrations groups createdAt'
    );
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const regs = t.registrations ?? [];
    return NextResponse.json({
      tournament: {
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
      },
    });
  } catch (error) {
    console.error('GET /api/player/tournaments/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
