import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendApprovalEmailParams {
  adminName: string;
  adminEmail: string;
  approvalToken: string;
}

export async function sendApprovalEmail({ adminName, adminEmail, approvalToken }: SendApprovalEmailParams) {
  // Use production URL if available, fallback to localhost for dev, then fallback to vercel app URL
  const baseUrl = process.env.NEXTAUTH_URL || 
                  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://flyingfeathers.vercel.app');
  const approvalUrl = `${baseUrl}/api/auth/approve?token=${approvalToken}`;
  
  // If Resend is not configured, log the approval details instead
  if (!resend) {
    console.log('==========================================');
    console.log('EMAIL SERVICE NOT CONFIGURED');
    console.log('==========================================');
    console.log('IMPORTANT: RESEND_API_KEY is missing!');
    console.log('Admin approval request details:');
    console.log('Admin Name:', adminName);
    console.log('Admin Email:', adminEmail);
    console.log('Approval URL:', approvalUrl);
    console.log('==========================================');
    console.log('TO APPROVE: Visit the approval URL above');
    console.log('==========================================');
    
    // For production without email service, we could implement alternative notification
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Email service not configured in production!');
      console.error('Manual approval required. Visit:', approvalUrl);
    }
    
    return { success: true, data: { message: 'Email service not configured, approval details logged', approvalUrl } };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Flying Feathers <onboarding@resend.dev>', // Use Resend's domain for testing
      to: 'witytech@gmail.com', // Admin email - this should be configurable
      subject: 'New Admin Registration Approval Request - Flying Feathers',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #e2e8f0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22d3ee; margin-bottom: 10px;">Flying Feathers Badminton Club</h1>
            <h2 style="color: #e2e8f0; font-size: 24px;">Admin Approval Request</h2>
          </div>
          
          <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #22d3ee; margin-top: 0;">New Admin Registration</h3>
            <p style="margin: 10px 0;"><strong>Name:</strong> ${adminName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${adminEmail}</p>
            <p style="margin: 10px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 10px 0;"><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approvalUrl}" 
               style="background: linear-gradient(to right, #22d3ee, #0891b2); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-size: 16px; 
                      font-weight: bold;
                      display: inline-block;">
              Approve Admin Access
            </a>
          </div>
          
          <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">
              Click the button above to approve this admin registration. If you cannot click the button, copy and paste this URL into your browser:
            </p>
            <p style="margin: 10px 0; font-size: 14px; color: #22d3ee; word-break: break-all;">
              ${approvalUrl}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              Flying Feathers Badminton Club Edinburgh<br>
              Tournament Management System
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending approval email:', error);
      return { success: false, error };
    }

    console.log('Approval email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error };
  }
} 