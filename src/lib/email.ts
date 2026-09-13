import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL || 'Flying Feathers <onboarding@resend.dev>';
const BASE_URL = process.env.NEXTAUTH_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://flyingfeathers.co.uk');

/* ── Shared HTML helpers ───────────────────────────────────────────── */
function emailWrapper(content: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#22d3ee;margin:0 0 4px;">🏸 Flying Feathers</h1>
        <p style="color:#64748b;margin:0;font-size:13px;">Badminton Club Edinburgh</p>
      </div>
      ${content}
      <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #1e293b;">
        <p style="margin:0;font-size:11px;color:#475569;">Flying Feathers Badminton Club · Edinburgh · flyingfeathers.co.uk</p>
      </div>
    </div>`;
}

function ctaButton(label: string, url: string, color = '#22d3ee') {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="background:${color};color:#0f172a;padding:14px 32px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block;">${label}</a>
  </div>`;
}

function infoCard(rows: [string, string][]) {
  return `<div style="background:#1e293b;padding:16px 20px;border-radius:8px;margin:16px 0;">
    ${rows.map(([k, v]) => `<p style="margin:6px 0;"><strong style="color:#94a3b8;">${k}:</strong> ${v}</p>`).join('')}
  </div>`;
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log('[Email not sent — no RESEND_API_KEY]', { to, subject });
    return { success: false };
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) { console.error('Resend error:', error); return { success: false, error }; }
    return { success: true, data };
  } catch (e) {
    console.error('Email send error:', e);
    return { success: false };
  }
}

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
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Admin approval request details:');
    console.log('Admin Name:', adminName);
    console.log('Admin Email:', adminEmail);
    console.log('Approval URL:', approvalUrl);
    console.log('Base URL used:', baseUrl);
    console.log('==========================================');
    console.log('TO APPROVE: Visit the approval URL above');
    console.log('==========================================');
    
    // For production without email service, we could implement alternative notification
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Email service not configured in production!');
      console.error('Set RESEND_API_KEY environment variable');
      console.error('Manual approval required. Visit:', approvalUrl);
    }
    
    return { success: true, data: { message: 'Email service not configured, approval details logged', approvalUrl } };
  }
  
  try {
    // Use custom domain if available, fallback to Resend's onboarding domain
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Flying Feathers <onboarding@resend.dev>';
    const adminEmail = process.env.ADMIN_EMAIL || 'witytech@gmail.com';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
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
      console.error('Resend email error:', error);
      console.error('From email:', fromEmail);
      console.error('To email:', adminEmail);
      console.error('Environment:', process.env.NODE_ENV);
      console.error('API Key configured:', !!process.env.RESEND_API_KEY);
      return { success: false, error };
    }

    console.log('Approval email sent successfully:', data);
    console.log('From:', fromEmail, 'To:', adminEmail);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error };
  }
}

/* ── 1. Player Welcome Email ───────────────────────────────────────── */
export async function sendPlayerWelcomeEmail({ name, email }: { name: string; email: string }) {
  const html = emailWrapper(`
    <h2 style="color:#e2e8f0;margin:0 0 8px;">Welcome to Flying Feathers, ${name}! 🎉</h2>
    <p style="color:#94a3b8;">Your player profile is set up and you're ready to compete.</p>
    ${infoCard([['Name', name], ['Email', email], ['Portal', 'flyingfeathers.co.uk/player/portal']])}
    <p style="color:#94a3b8;">Here's what you can do next:</p>
    <ul style="color:#94a3b8;padding-left:20px;line-height:1.8;">
      <li>Browse open tournaments and register your team</li>
      <li>Invite a partner to complete your team registration</li>
      <li>Track your match history and standings</li>
    </ul>
    ${ctaButton('Go to Player Portal', `${BASE_URL}/player/portal`)}
  `);
  return send(email, 'Welcome to Flying Feathers! 🏸', html);
}

/* ── 2. Tournament Registration Confirmation ───────────────────────── */
export async function sendTournamentRegistrationEmail({
  playerName, email, tournamentName, teamName, scheduledDate,
}: { playerName: string; email: string; tournamentName: string; teamName: string; scheduledDate: string }) {
  const dateStr = new Date(scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const html = emailWrapper(`
    <h2 style="color:#e2e8f0;margin:0 0 8px;">You're registered! ✅</h2>
    <p style="color:#94a3b8;">Hi ${playerName}, your team has been registered for <strong style="color:#22d3ee;">${tournamentName}</strong>.</p>
    ${infoCard([['Team Name', teamName], ['Tournament', tournamentName], ['Date', dateStr], ['Status', 'Pending admin confirmation']])}
    <p style="color:#94a3b8;font-size:13px;">⚠️ Your registration is <strong>pending</strong> until an admin confirms your team. You'll receive another email when that happens.</p>
    <p style="color:#94a3b8;font-size:13px;">👥 Don't forget to invite a partner — you need two players to complete your team.</p>
    ${ctaButton('Find a Partner', `${BASE_URL}/player/tournaments/${tournamentName}`)}
  `);
  return send(email, `Registered for ${tournamentName} — Flying Feathers`, html);
}

/* ── 3. Partner Invitation Email ───────────────────────────────────── */
export async function sendPartnerInviteEmail({
  inviterName, partnerName, partnerEmail, teamName, tournamentName, tournamentId, registrationId, inviteToken,
}: {
  inviterName: string; partnerName: string; partnerEmail: string;
  teamName: string; tournamentName: string; tournamentId: string; registrationId: string; inviteToken: string;
}) {
  const acceptUrl  = `${BASE_URL}/api/player/invite-response?token=${inviteToken}&action=accept`;
  const declineUrl = `${BASE_URL}/api/player/invite-response?token=${inviteToken}&action=decline`;

  const html = emailWrapper(`
    <h2 style="color:#e2e8f0;margin:0 0 8px;">You've been invited to join a team! 🏸</h2>
    <p style="color:#94a3b8;">Hi ${partnerName}, <strong style="color:#22d3ee;">${inviterName}</strong> wants you to be their partner for:</p>
    ${infoCard([['Tournament', tournamentName], ['Team Name', teamName], ['Invited by', inviterName]])}
    <p style="color:#94a3b8;">Accept or decline below — this link expires in <strong>48 hours</strong>.</p>
    <div style="display:flex;gap:12px;justify-content:center;margin:24px 0;flex-wrap:wrap;">
      <a href="${acceptUrl}" style="background:#22d3ee;color:#0f172a;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block;">✅ Accept Invite</a>
      <a href="${declineUrl}" style="background:#1e293b;color:#e2e8f0;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block;border:1px solid #334155;">❌ Decline</a>
    </div>
    <p style="color:#475569;font-size:12px;text-align:center;">Or log into your <a href="${BASE_URL}/player/registrations" style="color:#22d3ee;">player portal</a> to respond there.</p>
  `);
  return send(partnerEmail, `${inviterName} wants you as their badminton partner — Flying Feathers`, html);
}

/* ── 4. Partner Accepted Notification ─────────────────────────────── */
export async function sendPartnerAcceptedEmail({
  player1Name, player1Email, player2Name, teamName, tournamentName,
}: { player1Name: string; player1Email: string; player2Name: string; teamName: string; tournamentName: string }) {
  const html = emailWrapper(`
    <h2 style="color:#e2e8f0;margin:0 0 8px;">Your partner accepted! 🎉</h2>
    <p style="color:#94a3b8;">Great news ${player1Name}! <strong style="color:#22d3ee;">${player2Name}</strong> has accepted your invitation.</p>
    ${infoCard([['Team', teamName], ['Player 1', player1Name], ['Player 2', player2Name], ['Tournament', tournamentName], ['Status', 'Team confirmed — pending admin approval']])}
    <p style="color:#94a3b8;font-size:13px;">Your team is now complete. An admin will review and confirm your registration shortly.</p>
    ${ctaButton('View My Registrations', `${BASE_URL}/player/registrations`)}
  `);
  return send(player1Email, `${player2Name} accepted your team invite — Flying Feathers`, html);
}

/* ── 5. Partner Declined Notification ─────────────────────────────── */
export async function sendPartnerDeclinedEmail({
  player1Name, player1Email, player2Name, teamName, tournamentName,
}: { player1Name: string; player1Email: string; player2Name: string; teamName: string; tournamentName: string }) {
  const html = emailWrapper(`
    <h2 style="color:#e2e8f0;margin:0 0 8px;">Partner invite declined</h2>
    <p style="color:#94a3b8;">Hi ${player1Name}, <strong style="color:#f472b6;">${player2Name}</strong> was unable to join your team this time.</p>
    ${infoCard([['Team', teamName], ['Tournament', tournamentName]])}
    <p style="color:#94a3b8;">No worries — you can invite another player from your portal.</p>
    ${ctaButton('Find Another Partner', `${BASE_URL}/player/tournaments`)}
  `);
  return send(player1Email, `Partner invite declined — Flying Feathers`, html);
}

/* ── 6. Admin: New Confirmed Team Notification ─────────────────────── */
export async function sendAdminTeamConfirmedEmail({
  teamName, player1Name, player2Name, tournamentName,
}: { teamName: string; player1Name: string; player2Name: string; tournamentName: string }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'witytech@gmail.com';
  const html = emailWrapper(`
    <h2 style="color:#e2e8f0;margin:0 0 8px;">New team registration to review 📋</h2>
    <p style="color:#94a3b8;">A team has confirmed their partnership and is awaiting your approval.</p>
    ${infoCard([['Tournament', tournamentName], ['Team Name', teamName], ['Player 1', player1Name], ['Player 2', player2Name], ['Action required', 'Accept or reject in admin panel']])}
    ${ctaButton('Review in Admin Panel', `${BASE_URL}/dashboard/tournaments`)}
  `);
  return send(adminEmail, `New team registration: ${teamName} — ${tournamentName}`, html);
}