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
