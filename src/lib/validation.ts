import { z } from "zod";
import { LOGIN_CODE_CHARSET, LOGIN_CODE_LENGTH } from "./constants";

const codePattern = new RegExp(`^[${LOGIN_CODE_CHARSET}]{${LOGIN_CODE_LENGTH}}$`);

export const loginCodeSchema = z
  .string()
  .length(LOGIN_CODE_LENGTH)
  .regex(codePattern, "Invalid login code");

export const answerSchema = z.object({
  questionNum: z.number().int().min(1).max(40),
  value: z.number().int().min(1).max(4),
});

export const csvRowSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  class_name: z.string().optional(),
  year_group: z.string().min(1),
  login_code: z.string().optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Phase 2 schemas

export const teacherLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const addStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  yearGroupId: z.string().min(1, "Year group is required"),
  classGroupId: z.string().optional(),
  schoolUuid: z.string().optional(),
  loginCode: z.string().optional(),
});

export const editStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  yearGroupId: z.string().min(1, "Year group is required"),
  classGroupId: z.string().optional(),
  schoolUuid: z.string().optional(),
  displayName: z.string().optional(),
});

export const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  classGroupIds: z.array(z.string()).optional(),
});

export const yearGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tier: z.enum(["junior", "standard"]),
  sortOrder: z.number().int().optional(),
});

export const classGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  yearGroupId: z.string().min(1, "Year group is required"),
});

export const interventionSchema = z.object({
  domain: z.string().min(1),
  level: z.string().min(1),
  tier: z.enum(["junior", "standard"]),
  audience: z.enum(["student", "teacher"]),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const schoolSettingsSchema = z.object({
  name: z.string().min(1),
  currentTerm: z.enum(["term1", "term2", "term3"]),
  academicYear: z.string().min(1),
});
