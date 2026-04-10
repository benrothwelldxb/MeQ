import { prisma } from "./db";

/**
 * Validate password complexity.
 * Rules: min 8 characters, at least 1 letter and 1 number.
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: "Password is required" };
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  return { valid: true };
}

/**
 * Track failed login attempts and enforce lockout.
 * After MAX_ATTEMPTS failures within WINDOW_MINUTES, the email is locked
 * out for LOCKOUT_MINUTES.
 */
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

export async function recordFailedLogin(email: string, userType: string) {
  await prisma.failedLoginAttempt.create({
    data: { email: email.toLowerCase(), userType },
  });
}

export async function clearFailedLogins(email: string, userType: string) {
  await prisma.failedLoginAttempt.deleteMany({
    where: { email: email.toLowerCase(), userType },
  });
}

export async function isLockedOut(email: string, userType: string): Promise<{ locked: boolean; unlocksAt?: Date }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const recentAttempts = await prisma.failedLoginAttempt.findMany({
    where: {
      email: email.toLowerCase(),
      userType,
      attemptedAt: { gte: windowStart },
    },
    orderBy: { attemptedAt: "desc" },
  });

  if (recentAttempts.length < MAX_ATTEMPTS) {
    return { locked: false };
  }

  // Locked — unlock after the most recent attempt + lockout window
  const mostRecent = recentAttempts[0].attemptedAt;
  const unlocksAt = new Date(mostRecent.getTime() + LOCKOUT_MINUTES * 60 * 1000);

  if (unlocksAt.getTime() <= Date.now()) {
    // Lockout has expired — clear the counter
    await clearFailedLogins(email, userType);
    return { locked: false };
  }

  return { locked: true, unlocksAt };
}

export function formatLockoutMessage(unlocksAt: Date): string {
  const minutesRemaining = Math.ceil((unlocksAt.getTime() - Date.now()) / (60 * 1000));
  return `Too many failed attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`;
}
