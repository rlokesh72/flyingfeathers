import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Approval token is required' },
        { status: 400 }
      );
    }

    // Find user by approval token
    const user = await User.findOne({ approvalToken: token });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired approval token' },
        { status: 404 }
      );
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || 'https://flyingfeathers.vercel.app';
    const loginUrl = `${baseUrl}/login`;

    if (user.isApproved) {
      // Return success page even if already approved
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Already Approved - Flying Feathers</title>
          <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 40px; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; background: #1e293b; padding: 40px; border-radius: 10px; }
            .logo { color: #22d3ee; font-size: 24px; margin-bottom: 20px; }
            .status { color: #22d3ee; font-size: 18px; margin-bottom: 20px; }
            .message { color: #94a3b8; line-height: 1.6; }
            .button { background: linear-gradient(to right, #22d3ee, #0891b2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🏸 Flying Feathers Badminton Club</div>
            <div class="status">✅ Already Approved</div>
            <div class="message">
              The admin account for <strong>${user.email}</strong> has already been approved and is active.
            </div>
            <a href="${loginUrl}" class="button">Go to Login</a>
          </div>
        </body>
        </html>
      `, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Approve the user
    user.isApproved = true;
    await user.save();

    // Return success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Approved - Flying Feathers</title>
        <style>
          body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 40px; text-align: center; }
          .container { max-width: 500px; margin: 0 auto; background: #1e293b; padding: 40px; border-radius: 10px; }
          .logo { color: #22d3ee; font-size: 24px; margin-bottom: 20px; }
          .status { color: #10b981; font-size: 18px; margin-bottom: 20px; }
          .message { color: #94a3b8; line-height: 1.6; }
          .button { background: linear-gradient(to right, #22d3ee, #0891b2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🏸 Flying Feathers Badminton Club</div>
          <div class="status">✅ Admin Approved Successfully!</div>
          <div class="message">
            The admin account for <strong>${user.email}</strong> has been approved and is now active.<br><br>
            <strong>${user.name}</strong> can now log in to the tournament management system.
          </div>
          <a href="${loginUrl}" class="button">Go to Login Page</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 