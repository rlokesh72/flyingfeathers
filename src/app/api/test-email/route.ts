import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'RESEND_API_KEY not configured',
        configuration: {
          RESEND_API_KEY: 'missing',
          RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'not set',
          ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'not set',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set'
        }
      }, { status: 400 });
    }

    // Initialize Resend
    const resend = new Resend(apiKey);
    
    // Test configuration without sending email
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Flying Feathers <onboarding@resend.dev>';
    const adminEmail = process.env.ADMIN_EMAIL || 'witytech@gmail.com';
    const baseUrl = process.env.NEXTAUTH_URL || 
                    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://flyingfeathers.vercel.app');

    return NextResponse.json({
      status: 'configured',
      message: 'Email service is properly configured',
      configuration: {
        fromEmail,
        adminEmail,
        baseUrl,
        apiKeyConfigured: true,
        environment: process.env.NODE_ENV
      },
      note: 'This is a configuration test - no email was sent'
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error testing email configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 