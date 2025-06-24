import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-this-in-production';

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

// PUT - Update match score
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchIndex: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { team1Score, team2Score, status } = await request.json();
    const { id: tournamentId, matchIndex: matchIndexStr } = await params;
    const matchIndex = parseInt(matchIndexStr);

    if (isNaN(matchIndex) || team1Score < 0 || team2Score < 0) {
      return NextResponse.json(
        { error: 'Invalid match index or scores' },
        { status: 400 }
      );
    }

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (!tournament.matches || matchIndex >= tournament.matches.length) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Update the match
    tournament.matches[matchIndex].team1Score = team1Score;
    tournament.matches[matchIndex].team2Score = team2Score;
    tournament.matches[matchIndex].status = status || 'completed';

    await tournament.save();

    return NextResponse.json({
      message: 'Match score updated successfully',
      match: tournament.matches[matchIndex],
    });
  } catch (error) {
    console.error('Error updating match score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 