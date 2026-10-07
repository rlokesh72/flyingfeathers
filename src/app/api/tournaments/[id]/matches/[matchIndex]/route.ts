import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { advanceKnockoutWinner } from '@/lib/championship/generateBrackets';

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

    if (isNaN(matchIndex) || team1Score < 0 || team2Score < 0 || team1Score > 30 || team2Score > 30) {
      return NextResponse.json(
        { error: 'Invalid match index or scores. Scores must be between 0 and 30.' },
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

    // Update the match score
    tournament.matches[matchIndex].team1Score = team1Score;
    tournament.matches[matchIndex].team2Score = team2Score;
    tournament.matches[matchIndex].status = status || 'completed';

    // ── Championship-groups: auto-advance knockout winner ─────────────────
    const match = tournament.matches[matchIndex];
    if (
      match.bracketMatchId &&
      tournament.tournamentFormat === 'championship-groups' &&
      tournament.bracketMatches?.length &&
      (status === 'completed' || (!status && team1Score !== team2Score))
    ) {
      const bracketMatchId = match.bracketMatchId;
      const bracketMatch = tournament.bracketMatches.find(
        (bm: any) => bm._id.toString() === bracketMatchId
      );

      if (bracketMatch) {
        const t1 = bracketMatch.team1Index ?? match.team1Index;
        const t2 = bracketMatch.team2Index ?? match.team2Index;
        const winnerTeamIndex = team1Score >= team2Score ? t1 : t2;

        bracketMatch.team1Score = team1Score;
        bracketMatch.team2Score = team2Score;
        bracketMatch.status = 'completed';

        // Skip advancement for TBD teams or a winner who did not play this match
        if (winnerTeamIndex >= 0 && (winnerTeamIndex === t1 || winnerTeamIndex === t2)) {
          if (bracketMatch.winnerIndex !== winnerTeamIndex) {
            bracketMatch.winnerIndex = winnerTeamIndex;

            // Advance winner to next match
            const updatedBrackets = advanceKnockoutWinner(
              (tournament.bracketMatches ?? []).map((bm: any) => bm.toObject ? bm.toObject() : bm),
              bracketMatchId,
              winnerTeamIndex
            );

            // Sync updated bracket matches back and update global matches[] for TBD slots
            updatedBrackets.forEach((updated: any, idx: number) => {
              const bm = (tournament.bracketMatches ?? [])[idx];
              if (!bm) return;

              const global = (tournament.matches ?? []).find(
                (m: any) => m.bracketMatchId && m.bracketMatchId === (updated._id?.toString?.() ?? String(updated._id))
              );

              if (updated.team1Index !== undefined && bm.team1Index !== updated.team1Index) {
                bm.team1Index = updated.team1Index;
                if (global) global.team1Index = updated.team1Index;
              }
              if (updated.team2Index !== undefined && bm.team2Index !== updated.team2Index) {
                bm.team2Index = updated.team2Index;
                if (global) global.team2Index = updated.team2Index;
              }
              if (updated.winnerIndex !== undefined) bm.winnerIndex = updated.winnerIndex;
              if (updated.status) bm.status = updated.status;
            });
          }
        }
      }
    }

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
