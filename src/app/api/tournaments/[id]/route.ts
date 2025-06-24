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

// DELETE - Delete tournament
export async function DELETE(
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

    // Optional: Check if user is the creator or has admin rights
    // if (tournament.createdBy.toString() !== user.userId) {
    //   return NextResponse.json({ error: 'Not authorized to delete this tournament' }, { status: 403 });
    // }

    await Tournament.findByIdAndDelete(tournamentId);

    return NextResponse.json({
      message: 'Tournament deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 