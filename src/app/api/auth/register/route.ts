import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendApprovalEmail } from '@/lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-this-in-production';

// Password validation function
function validatePassword(password: string): { isValid: boolean; message: string } {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumbers) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
  }
  
  return { isValid: true, message: 'Password is valid' };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate approval token
    const approvalToken = crypto.randomBytes(32).toString('hex');

    // Create new user (not approved yet)
    const user = await User.create({
      name,
      email,
      password,
      approvalToken,
      isApproved: false,
    });

    // Send approval email
    let emailResult;
    try {
      emailResult = await sendApprovalEmail({
        adminName: user.name,
        adminEmail: user.email,
        approvalToken,
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail registration if email fails
      emailResult = { success: false, error: emailError };
    }

    // If in development or email failed, provide manual approval info
    const responseData: any = {
      message: 'Registration submitted successfully. Please wait for admin approval. You will receive an email notification once approved.',
      status: 'pending_approval'
    };

    // In development or when email service is not configured, include approval URL for testing
    if (process.env.NODE_ENV === 'development' || !emailResult?.success) {
      const baseUrl = process.env.NEXTAUTH_URL || 
                      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://flyingfeathers.vercel.app');
      responseData.manualApprovalUrl = `${baseUrl}/api/auth/approve?token=${approvalToken}`;
      responseData.note = 'Email service may not be configured. Use the manual approval URL if needed.';
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 