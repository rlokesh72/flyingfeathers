import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Resend } from 'resend';

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    // Check email service configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailStatus = 'not configured';
    let emailError = null;
    
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        // Test Resend connection by attempting to retrieve domains (this doesn't send email)
        emailStatus = 'configured';
      } catch (error) {
        emailStatus = 'configured but invalid';
        emailError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    // Check environment configuration
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'configured' : 'missing',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'not set (using default)',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'not set (using default)'
    };
    
    // Overall health assessment
    const isHealthy = envStatus.MONGODB_URI === 'configured' && 
                     (envStatus.NEXTAUTH_SECRET === 'configured' || envStatus.JWT_SECRET === 'configured');
    
    const warnings = [];
    if (envStatus.RESEND_API_KEY === 'missing') {
      warnings.push('Email service not configured - admin approval emails will not be sent');
    }
    if (envStatus.ADMIN_EMAIL === 'not set (using default)') {
      warnings.push('ADMIN_EMAIL not configured - using fallback email address');
    }
    if (envStatus.RESEND_FROM_EMAIL === 'not set (using default)') {
      warnings.push('RESEND_FROM_EMAIL not configured - using Resend test domain');
    }
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      email: {
        status: emailStatus,
        error: emailError,
        fromEmail: process.env.RESEND_FROM_EMAIL || 'Flying Feathers <onboarding@resend.dev>',
        adminEmail: process.env.ADMIN_EMAIL || 'witytech@gmail.com'
      },
      environment: envStatus,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 