import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const checks = {
      mongoUri: !!process.env.MONGODB_URI,
      jwtSecret: !!(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET),
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      status: 'ok',
      checks,
      message: 'Health check passed'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 