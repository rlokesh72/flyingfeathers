import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tournament, { ITeam } from '@/models/Tournament';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Tournament must be in scheduled status to confirm' },
        { status: 400 }
      );
    }

    // Check if all teams have exactly 2 players
    const incompleteTeams = tournament.teams.filter((team: ITeam) => team.players.length !== 2);
    if (incompleteTeams.length > 0) {
      return NextResponse.json(
        { error: 'All teams must have exactly 2 players before confirming' },
        { status: 400 }
      );
    }

    tournament.status = 'confirmed';
    await tournament.save();

    return NextResponse.json({ message: 'Tournament confirmed successfully' });
  } catch (error) {
    console.error('Error confirming tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 