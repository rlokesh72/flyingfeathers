import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    // Check environment configuration
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'configured' : 'missing',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'not set'
    };
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: envStatus
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 