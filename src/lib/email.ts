import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendApprovalEmailParams {
  adminName: string;
  adminEmail: string;
  approvalToken: string;
}

export async function sendApprovalEmail({ adminName, adminEmail, approvalToken }: SendApprovalEmailParams) {
  const approvalUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/approve?token=${approvalToken}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Flying Feathers <onboarding@resend.dev>', // Use Resend's domain for testing
      to: 'witytech@gmail.com',
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