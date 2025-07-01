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
    
    const { name, description, numberOfTeams, numberOfCourts, scheduledDate } = await request.json();

    if (!name || !numberOfTeams || !numberOfCourts || !scheduledDate) {
      return NextResponse.json(
        { error: 'Name, number of teams, number of courts, and scheduled date are required' },
        { status: 400 }
      );
    }

    // Create tournament with teams having exactly 2 empty player slots
    const teams = Array.from({ length: numberOfTeams }, (_, index) => ({
      name: `Team ${index + 1}`,
      players: ['', ''], // Exactly 2 players per team
    }));

    const tournamentData = {
      name,
      description,
      numberOfTeams: Number(numberOfTeams),
      numberOfCourts: Number(numberOfCourts),
      teams,
      matches: [], // Initially empty, will be populated when tournament starts
      scheduledDate: new Date(scheduledDate),
      status: 'scheduled', // Explicitly set status
      createdBy: user.userId,
    };

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