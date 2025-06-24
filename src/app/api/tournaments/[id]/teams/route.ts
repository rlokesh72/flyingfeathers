import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-jwt-secret-here-change-this-in-production';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

// PUT - Update team players
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { teamIndex, teamName, players } = await request.json();
    const { id: tournamentId } = await params;

    if (teamIndex === undefined || !Array.isArray(players)) {
      return NextResponse.json(
        { error: 'Team index and players array are required' },
        { status: 400 }
      );
    }

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (teamIndex < 0 || teamIndex >= tournament.teams.length) {
      return NextResponse.json({ error: 'Invalid team index' }, { status: 400 });
    }

    // Update the team
    tournament.teams[teamIndex].name = teamName || tournament.teams[teamIndex].name;
    tournament.teams[teamIndex].players = players.filter(p => p.trim() !== '');

    await tournament.save();

    return NextResponse.json({
      message: 'Team updated successfully',
      tournament,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 