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

// PATCH — update registration status (auth required)
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

    const { status, notes } = await request.json();
    const allowedStatuses = ['accepted', 'rejected', 'waitlisted', 'withdrawn'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }

    const reg = (tournament.registrations ?? []).find(
      (r: any) => r._id.toString() === regId
    );
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    // Enforce maxTeams cap when accepting
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

    await tournament.save();
    return NextResponse.json({ message: 'Registration updated', registration: reg });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
