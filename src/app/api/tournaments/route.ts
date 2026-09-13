import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { validateChampionshipConfig } from '@/lib/championship/utils';

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

// GET - List all tournaments
export async function GET(request: NextRequest) {
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

    await connectDB();
    
    // Ensure User model is registered (fix for MissingSchemaError)
    User;
    
    let query = {};
    
    // For public access, only show confirmed, in-progress, or completed tournaments
    if (isPublic) {
      query = {
        status: { $in: ['confirmed', 'in-progress', 'completed'] }
      };
    }
    
    const tournaments = await Tournament.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const {
      name,
      description,
      numberOfTeams,
      tournamentFormat,
      numberOfCourts,
      roundsPerOpponent,
      scheduledDate,
      // Championship-groups specific
      maxTeams,
      teamsPerGroup,
      qualificationRules,
    } = body;

    if (!name || !tournamentFormat || !scheduledDate) {
      return NextResponse.json(
        { error: 'Name, tournament format, and scheduled date are required' },
        { status: 400 }
      );
    }

    let tournamentData: any;

    if (tournamentFormat === 'court-based') {
      // ── existing court-based flow ─────────────────────────────────────
      if (!numberOfTeams) {
        return NextResponse.json(
          { error: 'Number of teams is required for court-based tournaments' },
          { status: 400 }
        );
      }
      if (!numberOfCourts) {
        return NextResponse.json(
          { error: 'Number of courts is required for court-based tournaments' },
          { status: 400 }
        );
      }
      const teams = Array.from({ length: numberOfTeams }, (_, index) => ({
        name: `Team ${index + 1}`,
        players: ['', ''],
      }));
      tournamentData = {
        name,
        description,
        numberOfTeams: Number(numberOfTeams),
        tournamentFormat,
        numberOfCourts: Number(numberOfCourts),
        teams,
        matches: [],
        scheduledDate: new Date(scheduledDate),
        status: 'scheduled',
        createdBy: user.userId,
      };

    } else if (tournamentFormat === 'round-robin') {
      // ── existing round-robin flow ─────────────────────────────────────
      if (!numberOfTeams) {
        return NextResponse.json(
          { error: 'Number of teams is required for round-robin tournaments' },
          { status: 400 }
        );
      }
      if (!roundsPerOpponent) {
        return NextResponse.json(
          { error: 'Rounds per opponent is required for round-robin tournaments' },
          { status: 400 }
        );
      }
      const teams = Array.from({ length: numberOfTeams }, (_, index) => ({
        name: `Team ${index + 1}`,
        players: ['', ''],
      }));
      tournamentData = {
        name,
        description,
        numberOfTeams: Number(numberOfTeams),
        tournamentFormat,
        roundsPerOpponent: Number(roundsPerOpponent),
        teams,
        matches: [],
        scheduledDate: new Date(scheduledDate),
        status: 'scheduled',
        createdBy: user.userId,
      };

    } else if (tournamentFormat === 'championship-groups') {
      // ── new championship-groups flow ──────────────────────────────────
      if (!maxTeams || !teamsPerGroup) {
        return NextResponse.json(
          { error: 'maxTeams and teamsPerGroup are required for championship-groups tournaments' },
          { status: 400 }
        );
      }

      const rules = qualificationRules ?? { gold: [1], silver: [2, 3], bronze: [4] };

      const validation = validateChampionshipConfig({
        maxTeams: Number(maxTeams),
        teamsPerGroup: Number(teamsPerGroup),
        qualificationRules: rules,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid championship configuration', details: validation.errors },
          { status: 400 }
        );
      }

      const numberOfGroups = Number(maxTeams) / Number(teamsPerGroup);

      tournamentData = {
        name,
        description,
        numberOfTeams: 0,           // starts at 0, grows as teams are accepted
        tournamentFormat,
        maxTeams: Number(maxTeams),
        teamsPerGroup: Number(teamsPerGroup),
        numberOfGroups,
        qualificationRules: rules,
        championshipStatus: 'draft',
        teams: [],
        matches: [],
        registrations: [],
        scheduledDate: new Date(scheduledDate),
        status: 'confirmed',        // no separate confirm step for championship-groups
        createdBy: user.userId,
      };

    } else {
      return NextResponse.json({ error: 'Invalid tournament format' }, { status: 400 });
    }

    const tournament = await Tournament.create(tournamentData);
    await tournament.populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Tournament created successfully',
      tournament,
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 