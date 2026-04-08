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
  username: string;
}

export interface TeacherSessionData {
  teacherId: string;
  email: string;
  firstName: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "meq-session-secret-change-in-production-32chars!",
  cookieName: "meq-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

const adminSessionOptions = {
  ...sessionOptions,
  cookieName: "meq-admin-session",
};

const teacherSessionOptions = {
  ...sessionOptions,
  cookieName: "meq-teacher-session",
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
