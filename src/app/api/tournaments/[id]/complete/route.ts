import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tournament, { ITeam, ITeamStats } from '@/models/Tournament';

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

    if (tournament.status !== 'in-progress') {
      return NextResponse.json(
        { error: 'Tournament must be in progress to complete' },
        { status: 400 }
      );
    }

    // Calculate team statistics
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
        // Note: Ties don't count as wins or losses, but points still count
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

    // Update tournament status and save standings
    tournament.status = 'completed';
    tournament.standings = standings;
    await tournament.save();

    return NextResponse.json({
      message: 'Tournament completed successfully',
      tournament,
      standings,
    });
  } catch (error) {
    console.error('Error completing tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 