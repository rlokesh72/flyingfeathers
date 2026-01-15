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

// Generate court-based round-robin matches with maximum court utilization
function generateCourtBasedMatches(numberOfTeams: number, numberOfCourts: number) {
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
      availableMatches.sort((a, b) => {
        const aRemainingMatches = unscheduledMatches.filter(m => 
          m.team1Index === a.team1Index || m.team2Index === a.team1Index ||
          m.team1Index === a.team2Index || m.team2Index === a.team2Index
        ).length;
        const bRemainingMatches = unscheduledMatches.filter(m => 
          m.team1Index === b.team1Index || m.team2Index === b.team1Index ||
          m.team1Index === b.team2Index || m.team2Index === b.team2Index
        ).length;
        
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
          continueSearching = true;
        }
      }
    }

    scheduledMatches.push(...matchesThisSlot);
    currentTimeSlot++;
    
    // Safety check
    if (currentTimeSlot > 50) {
      break;
    }
  }

  return scheduledMatches;
}

// Generate multi-round robin matches ensuring no consecutive same opponents
function generateMultiRoundRobinMatches(numberOfTeams: number, roundsPerOpponent: number) {
  // Generate all possible pairs
  const basePairs = [];
  for (let i = 0; i < numberOfTeams; i++) {
    for (let j = i + 1; j < numberOfTeams; j++) {
      basePairs.push({ team1Index: i, team2Index: j });
    }
  }

  // Create all matches (all pairs × rounds)
  const allMatches = [];
  for (let round = 0; round < roundsPerOpponent; round++) {
    for (const pair of basePairs) {
      allMatches.push({
        ...pair,
        round,
        status: 'scheduled' as const
      });
    }
  }

  // Schedule matches ensuring no team plays same opponent consecutively
  const scheduledMatches = [];
  const unscheduledMatches = [...allMatches];
  let currentTimeSlot = 1;
  const lastOpponent: { [teamIndex: number]: number | null } = {};

  // Initialize last opponent tracking
  for (let i = 0; i < numberOfTeams; i++) {
    lastOpponent[i] = null;
  }

  while (unscheduledMatches.length > 0) {
    // Find a match where neither team played their current opponent in the previous time slot
    let selectedMatch = null;
    
    for (const match of unscheduledMatches) {
      const { team1Index, team2Index } = match;
      
      // Check if this pair can play now (not the same opponent as last time slot)
      if (lastOpponent[team1Index] !== team2Index && lastOpponent[team2Index] !== team1Index) {
        selectedMatch = match;
        break;
      }
    }

    // If no valid match found with the constraint, relax it and take any available match
    if (!selectedMatch && unscheduledMatches.length > 0) {
      selectedMatch = unscheduledMatches[0];
    }

    if (selectedMatch) {
      scheduledMatches.push({
        ...selectedMatch,
        timeSlot: currentTimeSlot
      });

      // Update last opponent for both teams
      lastOpponent[selectedMatch.team1Index] = selectedMatch.team2Index;
      lastOpponent[selectedMatch.team2Index] = selectedMatch.team1Index;

      // Remove from unscheduled
      const index = unscheduledMatches.findIndex(m => 
        m.team1Index === selectedMatch.team1Index && 
        m.team2Index === selectedMatch.team2Index &&
        m.round === selectedMatch.round
      );
      if (index !== -1) {
        unscheduledMatches.splice(index, 1);
      }

      currentTimeSlot++;
    } else {
      break; // Safety break
    }

    // Safety check
    if (currentTimeSlot > 500) {
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

    // Generate matches based on tournament format
    let matches;
    if (tournament.tournamentFormat === 'court-based') {
      matches = generateCourtBasedMatches(tournament.numberOfTeams, tournament.numberOfCourts);
    } else if (tournament.tournamentFormat === 'round-robin') {
      matches = generateMultiRoundRobinMatches(tournament.numberOfTeams, tournament.roundsPerOpponent || 1);
    } else {
      return NextResponse.json({ 
        error: 'Invalid tournament format' 
      }, { status: 400 });
    }
    
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