import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "MeQ <noreply@wasil.org>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set. Would have sent to ${to}: ${subject}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, userType: string) {
  const resetPath = userType === "teacher" ? "/teacher/reset-password" : userType === "super" ? "/super/reset-password" : "/admin/reset-password";
  const resetUrl = `${APP_URL}${resetPath}?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your MeQ password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #64748b; line-height: 1.6;">
          We received a request to reset your MeQ password. Click the button below to choose a new one.
        </p>
        <div style="margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendTeacherWelcomeEmail({
  email,
  firstName,
  password,
  schoolName,
}: {
  email: string;
  firstName: string;
  password: string;
  schoolName: string;
}) {
  const loginUrl = `${APP_URL}/teacher/login`;

  await sendEmail({
    to: email,
    subject: `Welcome to MeQ — ${schoolName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Welcome to MeQ, ${firstName}!</h2>
        <p style="color: #64748b; line-height: 1.6;">
          You've been added as a teacher at <strong>${schoolName}</strong>. Here are your login details:
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Email</p>
          <p style="margin: 0 0 16px; color: #1e293b; font-weight: 600;">${email}</p>
          <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Password</p>
          <p style="margin: 0; color: #1e293b; font-weight: 600;">${password}</p>
        </div>
        <div style="margin: 32px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Sign In
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">
          We recommend changing your password after your first login.
        </p>
      </div>
    `,
  });
}

export async function sendAdminWelcomeEmail({
  email,
  schoolName,
}: {
  email: string;
  schoolName: string;
}) {
  const loginUrl = `${APP_URL}/admin/login`;

  await sendEmail({
    to: email,
    subject: `MeQ Admin — ${schoolName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Your MeQ admin account is ready</h2>
        <p style="color: #64748b; line-height: 1.6;">
          A MeQ admin account has been created for <strong>${schoolName}</strong>.
        </p>
        <p style="color: #64748b; line-height: 1.6;">
          Sign in with your email address (<strong>${email}</strong>) and the password provided by your platform administrator.
        </p>
        <div style="margin: 32px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Sign In
          </a>
        </div>
      </div>
    `,
  });
}
