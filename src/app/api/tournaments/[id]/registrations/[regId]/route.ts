import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-jwt-secret-here-change-this-in-production';

function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

function findRegistration(tournament: any, regId: string) {
  return (tournament.registrations ?? []).find(
    (r: any) => r._id.toString() === regId
  );
}

function groupsAlreadyDrawn(tournament: any) {
  return Array.isArray(tournament.groups) && tournament.groups.length > 0;
}

// PATCH — update registration status and/or team name (auth required)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, regId } = await params;
    await connectDB();
    User;

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (tournament.tournamentFormat !== 'championship-groups') {
      return NextResponse.json({ error: 'Not a championship-groups tournament' }, { status: 400 });
    }

    const { status, notes, teamName, category } = await request.json();
    const allowedStatuses = ['accepted', 'rejected', 'waitlisted', 'withdrawn'];
    const allowedCategories = ['men', 'women'];

    const reg = findRegistration(tournament, regId);
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }
    if (category !== undefined && category !== null && !allowedCategories.includes(category)) {
      return NextResponse.json({ error: 'category must be men or women' }, { status: 400 });
    }
    if (status === undefined && teamName === undefined && category === undefined) {
      return NextResponse.json({ error: 'Provide status, teamName, and/or category' }, { status: 400 });
    }

    if (typeof teamName === 'string') {
      const trimmed = teamName.trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'Team name cannot be empty' }, { status: 400 });
      }
      const oldName = reg.teamName;
      reg.teamName = trimmed;
      // Keep teams[] in sync if registration has already been copied over
      (tournament.teams ?? []).forEach((team: any) => {
        if (team.name === oldName) team.name = trimmed;
      });
    }

    if (category !== undefined) {
      reg.category = category || undefined;
      (tournament.teams ?? []).forEach((team: any) => {
        if (team.name === reg.teamName) team.category = category || undefined;
      });
    }

    if (status) {
      if (status === 'accepted') {
        const currentAccepted = (tournament.registrations ?? []).filter(
          (r: any) => r.status === 'accepted' && r._id.toString() !== regId
        ).length;
        if (tournament.maxTeams && currentAccepted >= tournament.maxTeams) {
          return NextResponse.json(
            { error: `Cannot accept more than ${tournament.maxTeams} teams` },
            { status: 400 }
          );
        }
      }

      reg.status = status;
      reg.reviewedAt = new Date();
      if (notes) reg.notes = notes;
    }

    await tournament.save();
    return NextResponse.json({ message: 'Registration updated', registration: reg });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — remove an accepted or rejected registration (auth required)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, regId } = await params;
    await connectDB();
    User;

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (tournament.tournamentFormat !== 'championship-groups') {
      return NextResponse.json({ error: 'Not a championship-groups tournament' }, { status: 400 });
    }

    const regs = tournament.registrations ?? [];
    const index = regs.findIndex((r: any) => r._id.toString() === regId);
    if (index === -1) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const reg = regs[index];
    if (!['accepted', 'rejected'].includes(reg.status)) {
      return NextResponse.json(
        { error: 'Only accepted or rejected teams can be deleted' },
        { status: 400 }
      );
    }

    if (reg.status === 'accepted' && groupsAlreadyDrawn(tournament)) {
      return NextResponse.json(
        { error: 'Cannot delete an accepted team after groups have been generated' },
        { status: 400 }
      );
    }

    const removedName = reg.teamName;
    regs.splice(index, 1);
    tournament.registrations = regs;

    if (reg.status === 'accepted') {
      tournament.teams = (tournament.teams ?? []).filter((team: any) => team.name !== removedName);
      tournament.numberOfTeams = tournament.teams.length;
    }

    await tournament.save();
    return NextResponse.json({ message: 'Registration deleted' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
