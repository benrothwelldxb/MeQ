import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "MeQ <noreply@wasil.org>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Branded email shell — MeQ logo header, Wasil footer.
// Logos are served from /public so they're publicly reachable for email clients.
function wrapEmail(body: string): string {
  return `
    <div style="background: #f9fafb; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="padding: 24px 32px 0; text-align: center;">
          <img src="${APP_URL}/meq-logo.png" alt="MeQ" width="56" height="56" style="border-radius: 12px; display: inline-block;" />
        </div>
        ${body}
        <div style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="margin: 0 0 8px; color: #9ca3af; font-size: 11px; letter-spacing: 0.5px;">POWERED BY</p>
          <img src="${APP_URL}/wasil-logo-grey.png" alt="Wasil" height="20" style="opacity: 0.7; display: inline-block;" />
        </div>
      </div>
    </div>
  `;
}

/** Parse a comma/semicolon-separated list of emails. Trims, lowercases, dedupes. */
export function parseEmailList(value: string | null | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  for (const raw of value.split(/[,;]/)) {
    const e = raw.trim().toLowerCase();
    if (e && e.includes("@")) seen.add(e);
  }
  return Array.from(seen);
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set. Would have sent: ${subject}`);
    return { skipped: true as const };
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (result.error) {
    console.error(`[email] Resend rejected email: ${result.error.message}`, result.error);
    throw new Error(`Resend error: ${result.error.message}`);
  }

  console.log(`[email] Sent: ${subject} (id: ${result.data?.id})`);
  return { skipped: false as const, id: result.data?.id };
}

/**
 * Send many emails at once via Resend's batch API (avoids per-send rate limits).
 * Resend accepts up to 100 messages per batch call.
 */
async function sendEmailBatch(
  messages: Array<{ to: string; subject: string; html: string }>
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  if (!resend) {
    for (const m of messages) {
      console.warn(`[email] RESEND_API_KEY not set. Would have sent to ${m.to}: ${m.subject}`);
    }
    return { sent: 0, failed: 0, skipped: true };
  }

  let sent = 0;
  let failed = 0;
  const CHUNK = 100;

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK).map((m) => ({
      from: FROM_EMAIL,
      to: m.to,
      subject: m.subject,
      html: m.html,
    }));

    try {
      const result = await resend.batch.send(chunk);
      if (result.error) {
        console.error(`[email] Resend batch rejected (${chunk.length} messages):`, result.error);
        failed += chunk.length;
      } else {
        const ids = result.data?.data?.length ?? chunk.length;
        sent += ids;
        console.log(`[email] Batch sent ${ids} messages`);
      }
    } catch (err) {
      console.error(`[email] Resend batch threw for ${chunk.length} messages:`, err);
      failed += chunk.length;
    }
  }

  return { sent, failed, skipped: false };
}

export async function sendPasswordResetEmail(email: string, token: string, userType: string) {
  const resetPath = userType === "teacher" ? "/teacher/reset-password" : userType === "super" ? "/super/reset-password" : "/admin/reset-password";
  const resetUrl = `${APP_URL}${resetPath}?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your MeQ password",
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Reset your password</h2>
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
    `),
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
  password?: string;
  schoolName: string;
}) {
  const loginUrl = `${APP_URL}/teacher/login`;
  const ssoMode = !password;

  const credentialsBlock = ssoMode
    ? `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 12px; color: #1e40af; font-weight: 600;">Sign in with Google</p>
          <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Use your school Google account:</p>
          <p style="margin: 0; color: #1e293b; font-weight: 600;">${email}</p>
        </div>`
    : `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Email</p>
          <p style="margin: 0 0 16px; color: #1e293b; font-weight: 600;">${email}</p>
          <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Password</p>
          <p style="margin: 0; color: #1e293b; font-weight: 600;">${password}</p>
        </div>`;

  const footer = ssoMode
    ? `<p style="color: #94a3b8; font-size: 14px;">Click "Sign in with Google" on the login page and choose your ${email} account.</p>`
    : `<p style="color: #94a3b8; font-size: 14px;">We recommend changing your password after your first login.</p>`;

  await sendEmail({
    to: email,
    subject: `Welcome to MeQ — ${schoolName}`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Welcome to MeQ, ${firstName}!</h2>
        <p style="color: #64748b; line-height: 1.6;">
          You've been added as a teacher at <strong>${schoolName}</strong>.
        </p>
        ${credentialsBlock}
        <div style="margin: 32px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Sign In
          </a>
        </div>
        ${footer}
      </div>
    `),
  });
}

// === Safeguarding Alerts ===

export async function sendPulseSafeguardingAlert({
  dslEmail,
  schoolName,
  studentName,
  yearGroup,
  className,
  flaggedDomains,
  freeText,
}: {
  dslEmail: string | string[];
  schoolName: string;
  studentName: string;
  yearGroup: string;
  className: string | null;
  flaggedDomains: Array<{ domain: string; score: number }>;
  freeText?: string | null;
}) {
  const pulseUrl = `${APP_URL}/admin/pulse`;

  await sendEmail({
    to: dslEmail,
    subject: `\u26A0\uFE0F Safeguarding alert \u2014 ${studentName} (${schoolName})`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin: 0 0 8px; font-size: 18px;">\u26A0\uFE0F Weekly Pulse Safeguarding Alert</h2>
          <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
            A student's Weekly Pulse response indicates they may need support.
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Student</p>
          <p style="margin: 0 0 12px; color: #1e293b; font-weight: 600; font-size: 16px;">${studentName}</p>

          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Year / Class</p>
          <p style="margin: 0 0 12px; color: #1e293b;">${yearGroup}${className ? ` / ${className}` : ""}</p>

          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Low scoring domains</p>
          <ul style="margin: 0 0 12px; padding-left: 20px;">
            ${flaggedDomains.map((f) => `<li style="color: #991b1b;">${f.domain} \u2014 scored ${f.score}/5</li>`).join("")}
          </ul>

          ${freeText ? `
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Student comment</p>
            <p style="margin: 0; padding: 12px; background: #fff; border-left: 3px solid #dc2626; color: #1e293b; font-style: italic;">"${freeText}"</p>
          ` : ""}
        </div>

        <div style="margin: 32px 0;">
          <a href="${pulseUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Review in MeQ
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px;">
          This alert was sent automatically by MeQ. Follow your school's safeguarding procedures.
          You are receiving this because you are listed as the Designated Safeguarding Lead for ${schoolName}.
        </p>
      </div>
    `),
  });
}

export async function sendSurveySafeguardingAlert({
  dslEmail,
  schoolName,
  surveyTitle,
  studentName,
  yearGroup,
  className,
  flagReason,
  flaggedText,
  anonymous,
  surveyId,
}: {
  dslEmail: string | string[];
  schoolName: string;
  surveyTitle: string;
  studentName: string | null;
  yearGroup: string | null;
  className: string | null;
  flagReason: string;
  flaggedText: string;
  anonymous: boolean;
  surveyId: string;
}) {
  const surveyUrl = `${APP_URL}/admin/surveys/${surveyId}/results`;

  await sendEmail({
    to: dslEmail,
    subject: `\u26A0\uFE0F Safeguarding alert \u2014 "${surveyTitle}" response flagged (${schoolName})`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin: 0 0 8px; font-size: 18px;">\u26A0\uFE0F Survey Response Flagged</h2>
          <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
            A response to "${surveyTitle}" contains content that may indicate a concern.
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Student</p>
          <p style="margin: 0 0 12px; color: #1e293b; font-weight: 600;">
            ${anonymous ? "Anonymous (cannot identify)" : studentName || "Unknown"}
            ${!anonymous && yearGroup ? ` \u00B7 ${yearGroup}${className ? ` / ${className}` : ""}` : ""}
          </p>

          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Flag reason</p>
          <p style="margin: 0 0 12px; color: #991b1b;">Keyword match: ${flagReason}</p>

          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Flagged text</p>
          <p style="margin: 0; padding: 12px; background: #fff; border-left: 3px solid #dc2626; color: #1e293b; font-style: italic;">"${flaggedText}"</p>
        </div>

        <div style="margin: 32px 0;">
          <a href="${surveyUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Review in MeQ
          </a>
        </div>

        ${anonymous ? `
          <p style="color: #94a3b8; font-size: 12px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px;">
            <strong>Note:</strong> This survey was anonymous. The student cannot be identified from the response.
            If the content indicates immediate risk, work with your pastoral team to identify patterns or speak to all students who completed this survey.
          </p>
        ` : ""}

        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
          This alert was sent automatically by MeQ. Follow your school's safeguarding procedures.
          You are receiving this because you are listed as the Designated Safeguarding Lead for ${schoolName}.
        </p>
      </div>
    `),
  });
}

export async function sendAdminWelcomeEmail({
  email,
  schoolName,
  hasPassword = true,
}: {
  email: string;
  schoolName: string;
  hasPassword?: boolean;
}) {
  const loginUrl = `${APP_URL}/admin/login`;

  const instructions = hasPassword
    ? `<p style="color: #64748b; line-height: 1.6;">
        Sign in with your email address (<strong>${email}</strong>) and the password provided by your platform administrator.
      </p>`
    : `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px; color: #1e40af; font-weight: 600;">Sign in with Google</p>
        <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Click "Sign in with Google" on the login page and choose your account:</p>
        <p style="margin: 0; color: #1e293b; font-weight: 600;">${email}</p>
      </div>`;

  await sendEmail({
    to: email,
    subject: `MeQ Admin — ${schoolName}`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Your MeQ admin account is ready</h2>
        <p style="color: #64748b; line-height: 1.6;">
          A MeQ admin account has been created for <strong>${schoolName}</strong>.
        </p>
        ${instructions}
        <div style="margin: 32px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Sign In
          </a>
        </div>
      </div>
    `),
  });
}

export async function sendTeacherResendEmail({
  email,
  firstName,
  schoolName,
  authMode,
}: {
  email: string;
  firstName: string;
  schoolName: string;
  authMode: string;
}) {
  const loginUrl = `${APP_URL}/teacher/login`;
  const forgotUrl = `${APP_URL}/teacher/forgot-password`;

  const ssoBlock = `
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <p style="margin: 0 0 4px; color: #1e40af; font-weight: 600;">Sign in with Google</p>
      <p style="margin: 0; color: #64748b; font-size: 14px;">Use your ${email} account.</p>
    </div>`;
  const passwordBlock = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <p style="margin: 0 0 4px; color: #1e293b; font-weight: 600;">Sign in with a password</p>
      <p style="margin: 0; color: #64748b; font-size: 14px;">Use <strong>${email}</strong> and your password. If you don't have one yet, <a href="${forgotUrl}" style="color: #3b82f6;">set a password here</a>.</p>
    </div>`;

  const options =
    authMode === "sso"
      ? ssoBlock
      : authMode === "password"
      ? passwordBlock
      : ssoBlock + passwordBlock;

  await sendEmail({
    to: email,
    subject: `Your MeQ access — ${schoolName}`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Welcome to MeQ, ${firstName}</h2>
        <p style="color: #64748b; line-height: 1.6;">
          Here's how to sign in to your <strong>${schoolName}</strong> account.
        </p>
        ${options}
        <div style="margin: 32px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Go to login
          </a>
        </div>
      </div>
    `),
  });
}

function renderStaffWellbeingDeployEmail({
  email,
  firstName,
  schoolName,
  termLabel,
  customMessage,
}: {
  email: string;
  firstName: string;
  schoolName: string;
  termLabel: string;
  customMessage?: string;
}): { to: string; subject: string; html: string } {
  const wellbeingUrl = `${APP_URL}/teacher/wellbeing`;
  return {
    to: email,
    subject: `Your ${termLabel} wellbeing check-in is ready`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Hi ${firstName},</h2>
        <p style="color: #64748b; line-height: 1.6;">
          Your <strong>${termLabel}</strong> staff wellbeing check-in is now available at <strong>${schoolName}</strong>.
          It takes about 5 minutes and your individual responses are kept private.
        </p>
        ${customMessage
          ? `<div style="background: #f8fafc; border-left: 3px solid #93b5cf; padding: 12px 16px; margin: 20px 0; color: #1e293b; font-style: italic;">${customMessage}</div>`
          : ""}
        <div style="margin: 32px 0;">
          <a href="${wellbeingUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Start Check-In
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          Leadership only sees aggregated, anonymised data — and only when at least 5 staff have responded.
        </p>
      </div>
    `),
  };
}

function renderStaffWellbeingNudgeEmail({
  email,
  firstName,
  schoolName,
  termLabel,
}: {
  email: string;
  firstName: string;
  schoolName: string;
  termLabel: string;
}): { to: string; subject: string; html: string } {
  const wellbeingUrl = `${APP_URL}/teacher/wellbeing`;
  return {
    to: email,
    subject: `A gentle reminder — your ${termLabel} wellbeing check-in`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Hi ${firstName},</h2>
        <p style="color: #64748b; line-height: 1.6;">
          Just a gentle reminder that your <strong>${termLabel}</strong> wellbeing check-in at <strong>${schoolName}</strong> is still open.
          It takes about 5 minutes — every voice matters, and your responses stay private.
        </p>
        <div style="margin: 32px 0;">
          <a href="${wellbeingUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Complete check-in
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          Leadership only sees aggregated, anonymised data — and only when at least 5 staff have responded.
          If you've already completed this, please ignore this reminder.
        </p>
      </div>
    `),
  };
}

export async function sendStaffWellbeingNudgeBatch(
  recipients: Array<{ email: string; firstName: string }>,
  opts: { schoolName: string; termLabel: string }
) {
  const messages = recipients.map((r) => renderStaffWellbeingNudgeEmail({
    email: r.email,
    firstName: r.firstName,
    schoolName: opts.schoolName,
    termLabel: opts.termLabel,
  }));
  return sendEmailBatch(messages);
}

export async function sendSLTDigest({
  to,
  schoolName,
  termLabel,
  stats,
}: {
  to: string | string[];
  schoolName: string;
  termLabel: string;
  stats: {
    totalStudents: number;
    completedThisTerm: number;
    avgScore: number | null;
    openSafeguardingAlerts: number;
    pulseCompletedThisWeek: number;
    flaggedThisWeek: number;
  };
}) {
  const adminUrl = `${APP_URL}/admin`;
  const safeguardingUrl = `${APP_URL}/admin/safeguarding`;
  const completionPct =
    stats.totalStudents > 0
      ? Math.round((stats.completedThisTerm / stats.totalStudents) * 100)
      : 0;

  const statRow = (label: string, value: string, accent?: string) => `
    <tr>
      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">${label}</td>
      <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${accent || "#1e293b"}; font-size: 16px;">${value}</td>
    </tr>`;

  await sendEmail({
    to,
    subject: `MeQ weekly digest — ${schoolName}`,
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 4px;">Weekly digest</h2>
        <p style="color: #64748b; margin: 0 0 20px; font-size: 14px;">${schoolName} · ${termLabel}</p>

        <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
          ${statRow("Total students", String(stats.totalStudents))}
          ${statRow("Completed this term", `${stats.completedThisTerm} (${completionPct}%)`)}
          ${statRow("Average MeQ score", stats.avgScore != null ? String(stats.avgScore) : "—")}
          ${statRow("Pulse responses this week", String(stats.pulseCompletedThisWeek))}
          ${statRow("Flagged responses this week", String(stats.flaggedThisWeek), stats.flaggedThisWeek > 0 ? "#dc2626" : undefined)}
          ${statRow("Open safeguarding alerts", String(stats.openSafeguardingAlerts), stats.openSafeguardingAlerts > 0 ? "#dc2626" : undefined)}
        </table>

        <div style="margin: 28px 0 8px;">
          <a href="${adminUrl}" style="display: inline-block; background: #93b5cf; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-right: 8px;">
            Open dashboard
          </a>
          ${stats.openSafeguardingAlerts > 0
            ? `<a href="${safeguardingUrl}" style="display: inline-block; background: #fef2f2; color: #991b1b; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; border: 1px solid #fecaca;">
                 Review ${stats.openSafeguardingAlerts} alert${stats.openSafeguardingAlerts === 1 ? "" : "s"}
               </a>`
            : ""}
        </div>
      </div>
    `),
  });
}

export async function sendStaffWellbeingDeployBatch(
  recipients: Array<{ email: string; firstName: string }>,
  opts: { schoolName: string; termLabel: string; customMessage?: string }
) {
  const messages = recipients.map((r) => renderStaffWellbeingDeployEmail({
    email: r.email,
    firstName: r.firstName,
    schoolName: opts.schoolName,
    termLabel: opts.termLabel,
    customMessage: opts.customMessage,
  }));
  return sendEmailBatch(messages);
}

export async function sendSuperAdminWelcomeEmail({
  email,
  hasPassword = true,
}: {
  email: string;
  hasPassword?: boolean;
}) {
  const loginUrl = `${APP_URL}/super/login`;

  const instructions = hasPassword
    ? `<p style="color: #64748b; line-height: 1.6;">
        Sign in with your email (<strong>${email}</strong>) and the password provided to you.
      </p>`
    : `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px; color: #1e40af; font-weight: 600;">Sign in with Google</p>
        <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Click "Sign in with Google" on the login page and choose your account:</p>
        <p style="margin: 0; color: #1e293b; font-weight: 600;">${email}</p>
      </div>`;

  await sendEmail({
    to: email,
    subject: "MeQ Platform Admin access",
    html: wrapEmail(`
      <div style="padding: 24px 32px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">You have MeQ Platform Admin access</h2>
        <p style="color: #64748b; line-height: 1.6;">
          You've been granted super admin access to the MeQ platform. You can now manage schools, frameworks, and platform settings.
        </p>
        ${instructions}
        <div style="margin: 32px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #1e293b; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Sign In
          </a>
        </div>
      </div>
    `),
  });
}
