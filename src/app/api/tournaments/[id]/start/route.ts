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

// Generate round-robin matches with maximum court utilization using advanced scheduling
function generateRoundRobinMatches(numberOfTeams: number, numberOfCourts: number) {
  // First, generate all possible pairs (round-robin)
  const allMatches = [];
  for (let i = 0; i < numberOfTeams; i++) {
    for (let j = i + 1; j < numberOfTeams; j++) {
      allMatches.push({
        team1Index: i,
        team2Index: j,
        status: 'scheduled' as const
      });
    }
  }

  // Calculate theoretical minimum time slots
  const theoreticalMinimumSlots = Math.ceil(allMatches.length / numberOfCourts);

  // Enhanced scheduling algorithm using maximum independent set approach
  const scheduledMatches = [];
  const unscheduledMatches = [...allMatches];
  let currentTimeSlot = 1;

  while (unscheduledMatches.length > 0) {
    const matchesThisSlot = [];
    const teamsUsedThisSlot = new Set<number>();
    
    // Use multiple passes to maximize matches per time slot
    let continueSearching = true;
    while (continueSearching && matchesThisSlot.length < numberOfCourts) {
      continueSearching = false;
      
      // Find all available matches for this time slot
      const availableMatches = unscheduledMatches.filter(match => 
        !teamsUsedThisSlot.has(match.team1Index) && !teamsUsedThisSlot.has(match.team2Index)
      );
      
      if (availableMatches.length === 0) break;
      
      // Sort by priority: matches involving teams with the most remaining matches
      // This helps balance the schedule
      availableMatches.sort((a, b) => {
        const aRemainingMatches = unscheduledMatches.filter(m => 
          m.team1Index === a.team1Index || m.team2Index === a.team1Index ||
          m.team1Index === a.team2Index || m.team2Index === a.team2Index
        ).length;
        const bRemainingMatches = unscheduledMatches.filter(m => 
          m.team1Index === b.team1Index || m.team2Index === b.team1Index ||
          m.team1Index === b.team2Index || m.team2Index === b.team2Index
        ).length;
        
        // Try teams with MORE remaining matches first to spread the load
        return bRemainingMatches - aRemainingMatches;
      });
      
      // Select the first available match
      const selectedMatch = availableMatches[0];
      if (selectedMatch) {
        matchesThisSlot.push({
          ...selectedMatch,
          court: matchesThisSlot.length + 1,
          timeSlot: currentTimeSlot
        });
        
        teamsUsedThisSlot.add(selectedMatch.team1Index);
        teamsUsedThisSlot.add(selectedMatch.team2Index);
        
        // Remove from unscheduled matches
        const index = unscheduledMatches.findIndex(m => 
          m.team1Index === selectedMatch.team1Index && m.team2Index === selectedMatch.team2Index
        );
        if (index !== -1) {
          unscheduledMatches.splice(index, 1);
          continueSearching = true; // Continue looking for more matches
        }
      }
    }

    // Add all matches from this time slot to the final schedule
    scheduledMatches.push(...matchesThisSlot);
    
    currentTimeSlot++;
    
    // Safety check to prevent infinite loops
    if (currentTimeSlot > 50) {
      break;
    }
  }

  return scheduledMatches;
}

// POST - Start tournament and generate matches
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { id: tournamentId } = await params;
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'confirmed') {
      return NextResponse.json({ error: 'Tournament must be confirmed before starting' }, { status: 400 });
    }

    // Check if all teams have players
    const incompleteTeams = tournament.teams.filter((team: any) => 
      team.players.length < 2 || team.players.some((player: string) => !player.trim())
    );

    if (incompleteTeams.length > 0) {
      return NextResponse.json({ 
        error: 'All teams must have exactly 2 players before starting the tournament' 
      }, { status: 400 });
    }

    // Generate matches with proper scheduling
    const matches = generateRoundRobinMatches(tournament.numberOfTeams, tournament.numberOfCourts);
    
    // Calculate total time slots
    const maxTimeSlot = Math.max(...matches.map(match => match.timeSlot));
    
    // Update tournament
    tournament.matches = matches;
    tournament.status = 'in-progress';
    await tournament.save();

    await tournament.populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Tournament started successfully',
      tournament,
      totalMatches: matches.length,
      totalTimeSlots: maxTimeSlot
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 