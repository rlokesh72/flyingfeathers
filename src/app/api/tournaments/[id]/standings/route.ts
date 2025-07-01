import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament, { ITeam, ITeamStats } from '@/models/Tournament';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    // For public access, don't require authentication
    if (!isPublic) {
      const user = verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id } = await params;
    await connectDB();
    
    // Ensure User model is registered (fix for MissingSchemaError)
    User;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // For public access, only allow viewing standings for confirmed, in-progress, or completed tournaments
    if (isPublic && !['confirmed', 'in-progress', 'completed'].includes(tournament.status)) {
      return NextResponse.json(
        { error: 'Tournament not available for public viewing' },
        { status: 403 }
      );
    }

    // Calculate current team statistics
    const teamStats: ITeamStats[] = tournament.teams.map((team: ITeam, index: number) => ({
      teamIndex: index,
      teamName: team.name,
      players: team.players,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
      matchesPlayed: 0,
    }));

    // Process completed matches
    tournament.matches.forEach((match: any) => {
      if (match.status === 'completed' && match.team1Score !== undefined && match.team2Score !== undefined) {
        const team1Stats = teamStats[match.team1Index];
        const team2Stats = teamStats[match.team2Index];

        // Update points
        team1Stats.pointsFor += match.team1Score;
        team1Stats.pointsAgainst += match.team2Score;
        team2Stats.pointsFor += match.team2Score;
        team2Stats.pointsAgainst += match.team1Score;

        // Update matches played
        team1Stats.matchesPlayed++;
        team2Stats.matchesPlayed++;

        // Determine winner and update wins/losses
        if (match.team1Score > match.team2Score) {
          team1Stats.wins++;
          team2Stats.losses++;
        } else if (match.team2Score > match.team1Score) {
          team2Stats.wins++;
          team1Stats.losses++;
        }
      }
    });

    // Calculate point differences
    teamStats.forEach(team => {
      team.pointDifference = team.pointsFor - team.pointsAgainst;
    });

    // Sort teams by: 1) Wins (descending), 2) Point difference (descending), 3) Points for (descending)
    const standings = teamStats.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
      return b.pointsFor - a.pointsFor;
    });

    return NextResponse.json({
      standings,
      totalMatches: tournament.matches.length,
      completedMatches: tournament.matches.filter((m: any) => m.status === 'completed').length,
    });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 