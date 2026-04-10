import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface StudentSessionData {
  studentId: string;
  assessmentId: string;
  firstName: string;
  tier: string;
}

export interface AdminSessionData {
  adminId: string;
  schoolId: string;
  email: string;
  pendingEmail?: string;
}

export interface TeacherSessionData {
  teacherId: string;
  schoolId: string;
  email: string;
  firstName: string;
}

export interface SuperAdminSessionData {
  superAdminId: string;
  email: string;
}

// Session timeouts (in seconds)
const STUDENT_SESSION_TTL = 60 * 60 * 3;           // 3 hours — long enough for an assessment session
const ADMIN_SESSION_TTL = 60 * 60 * 8;             // 8 hours — a school working day
const TEACHER_SESSION_TTL = 60 * 60 * 8;           // 8 hours — a school working day
const SUPER_ADMIN_SESSION_TTL = 60 * 60 * 2;       // 2 hours — shorter for platform admin

const sessionOptions = {
  password: process.env.SESSION_SECRET || "meq-session-secret-change-in-production-32chars!",
  cookieName: "meq-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: STUDENT_SESSION_TTL,
  },
  ttl: STUDENT_SESSION_TTL,
};

const adminSessionOptions = {
  ...sessionOptions,
  cookieName: "meq-admin-session",
  cookieOptions: { ...sessionOptions.cookieOptions, maxAge: ADMIN_SESSION_TTL },
  ttl: ADMIN_SESSION_TTL,
};

const teacherSessionOptions = {
  ...sessionOptions,
  cookieName: "meq-teacher-session",
  cookieOptions: { ...sessionOptions.cookieOptions, maxAge: TEACHER_SESSION_TTL },
  ttl: TEACHER_SESSION_TTL,
};

const superAdminSessionOptions = {
  ...sessionOptions,
  cookieName: "meq-super-session",
  cookieOptions: { ...sessionOptions.cookieOptions, maxAge: SUPER_ADMIN_SESSION_TTL },
  ttl: SUPER_ADMIN_SESSION_TTL,
};

export async function getStudentSession(): Promise<IronSession<StudentSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<StudentSessionData>(cookieStore, sessionOptions);
}

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
}

export async function getTeacherSession(): Promise<IronSession<TeacherSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<TeacherSessionData>(cookieStore, teacherSessionOptions);
}

export async function getSuperAdminSession(): Promise<IronSession<SuperAdminSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SuperAdminSessionData>(cookieStore, superAdminSessionOptions);
}
