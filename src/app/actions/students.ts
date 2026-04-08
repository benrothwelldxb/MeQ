"use server";

import { prisma } from "@/lib/db";
import { generateLoginCode } from "@/lib/codes";
import { getTierFromYearGroup, LOGIN_CODE_CHARSET, LOGIN_CODE_LENGTH } from "@/lib/constants";
import { getAdminSession } from "@/lib/session";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

// === Auto-matching logic for CSV column headers ===

const FIELD_MATCHERS: Record<string, string[]> = {
  first_name: ["first", "firstname", "first name", "given", "forename"],
  last_name: ["last", "lastname", "last name", "surname", "family"],
  year_group: ["year", "yeargroup", "year group", "grade"],
  class_name: ["class", "form", "division", "class name", "classname"],
  login_code: ["code", "login", "logincode", "login code"],
  sen: ["sen", "send", "special", "additional"],
  school_uuid: ["school_id", "school_uuid", "uuid"],
};

function autoMatchColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();

  for (const [field, keywords] of Object.entries(FIELD_MATCHERS)) {
    const normalized = headers.map((h) => h.toLowerCase().trim());
    // Exact match first
    const exactIdx = normalized.findIndex((h) => h === field && !used.has(headers[normalized.indexOf(h)]));
    if (exactIdx !== -1) {
      mapping[field] = headers[exactIdx];
      used.add(headers[exactIdx]);
      continue;
    }
    // Keyword match
    for (const keyword of keywords) {
      const idx = normalized.findIndex((h, i) => h.includes(keyword) && !used.has(headers[i]));
      if (idx !== -1) {
        mapping[field] = headers[idx];
        used.add(headers[idx]);
        break;
      }
    }
  }

  return mapping;
}

export async function previewCSV(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { error: "Please select a CSV file." };
  }

  const text = await file.text();

  let records: Array<Record<string, string>>;
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "Could not parse CSV. Please check the format." };
  }

  if (records.length === 0) {
    return { error: "CSV file is empty." };
  }

  const headers = Object.keys(records[0]);
  const suggestedMapping = autoMatchColumns(headers);
  const preview = records.slice(0, 3);

  return {
    headers,
    suggestedMapping,
    preview,
    totalRows: records.length,
    csvText: text,
  };
}

function parseSenValue(val: string | undefined): boolean {
  if (!val) return false;
  const norm = val.trim().toLowerCase();
  return ["yes", "true", "1", "y"].includes(norm);
}

export async function uploadStudentsCSV(
  csvText: string,
  columnMapping: Record<string, string>
) {
  const session = await getAdminSession();

  let records: Array<Record<string, string>>;
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "Could not parse CSV." };
  }

  if (records.length === 0) {
    return { error: "CSV file is empty." };
  }

  const firstNameCol = columnMapping.first_name;
  const lastNameCol = columnMapping.last_name;
  const yearGroupCol = columnMapping.year_group;
  const classNameCol = columnMapping.class_name;
  const loginCodeCol = columnMapping.login_code;
  const senCol = columnMapping.sen;

  if (!firstNameCol || !lastNameCol || !yearGroupCol) {
    return { error: "Please map first name, last name, and year group columns." };
  }

  const existingCodes = new Set(
    (await prisma.student.findMany({ select: { loginCode: true } })).map(
      (s) => s.loginCode
    )
  );

  const students: Array<{
    firstName: string;
    lastName: string;
    yearGroup: string;
    className: string | null;
    loginCode: string;
    tier: string;
    sen: boolean;
    schoolId: string;
  }> = [];

  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const firstName = row[firstNameCol]?.trim();
    const lastName = row[lastNameCol]?.trim();
    const yearGroup = row[yearGroupCol]?.trim();
    const className = classNameCol ? row[classNameCol]?.trim() || null : null;
    let loginCode = loginCodeCol ? row[loginCodeCol]?.trim().toUpperCase() || "" : "";
    const sen = parseSenValue(senCol ? row[senCol] : undefined);

    if (!firstName || !lastName || !yearGroup) {
      errors.push(`Row ${i + 2}: Missing required fields`);
      continue;
    }

    if (!loginCode) {
      do {
        loginCode = generateLoginCode();
      } while (existingCodes.has(loginCode));
    }

    if (existingCodes.has(loginCode)) {
      errors.push(`Row ${i + 2}: Duplicate login code ${loginCode}`);
      continue;
    }

    existingCodes.add(loginCode);
    const tier = getTierFromYearGroup(yearGroup);
    students.push({ firstName, lastName, yearGroup, className, loginCode, tier, sen, schoolId: session.schoolId });
  }

  if (students.length === 0) {
    return { error: `No valid students found. ${errors.join("; ")}` };
  }

  await prisma.student.createMany({
    data: students,
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin");

  return {
    success: true,
    count: students.length,
    errors: errors.length > 0 ? errors : undefined,
    students: students.map((s) => ({
      name: `${s.firstName} ${s.lastName}`,
      code: s.loginCode,
      yearGroup: s.yearGroup,
      className: s.className,
    })),
  };
}

export async function deleteStudent(studentId: string) {
  await prisma.assessment.deleteMany({ where: { studentId } });
  await prisma.student.delete({ where: { id: studentId } });
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

export async function addStudent(formData: FormData) {
  const session = await getAdminSession();
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const yearGroupId = formData.get("yearGroupId") as string;
  const classGroupId = (formData.get("classGroupId") as string) || null;
  const schoolUuid = (formData.get("schoolUuid") as string)?.trim() || null;
  const sen = formData.get("sen") === "on";
  let loginCode = (formData.get("loginCode") as string)?.trim().toUpperCase() || "";

  if (!firstName || !lastName || !yearGroupId) {
    return { error: "First name, last name, and year group are required." };
  }

  const yearGroup = await prisma.yearGroup.findUnique({ where: { id: yearGroupId } });
  if (!yearGroup) return { error: "Year group not found." };

  let className: string | null = null;
  if (classGroupId) {
    const classGroup = await prisma.classGroup.findUnique({ where: { id: classGroupId } });
    className = classGroup?.name || null;
  }

  if (!loginCode) {
    const existingCodes = new Set(
      (await prisma.student.findMany({ select: { loginCode: true } })).map((s) => s.loginCode)
    );
    do {
      loginCode = generateLoginCode();
    } while (existingCodes.has(loginCode));
  } else {
    const codePattern = new RegExp(`^[${LOGIN_CODE_CHARSET}]{${LOGIN_CODE_LENGTH}}$`);
    if (!codePattern.test(loginCode)) {
      return { error: `Login code must be exactly ${LOGIN_CODE_LENGTH} characters using only: ${LOGIN_CODE_CHARSET}` };
    }
    const existing = await prisma.student.findUnique({ where: { loginCode } });
    if (existing) return { error: `Login code ${loginCode} is already in use.` };
  }

  const student = await prisma.student.create({
    data: {
      firstName,
      lastName,
      yearGroup: yearGroup.name,
      className,
      yearGroupId,
      classGroupId,
      tier: yearGroup.tier,
      sen,
      schoolUuid,
      loginCode,
      schoolId: session.schoolId,
    },
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin");

  return { success: true, loginCode: student.loginCode, studentId: student.id };
}

export async function updateStudent(studentId: string, formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const yearGroupId = formData.get("yearGroupId") as string;
  const classGroupId = (formData.get("classGroupId") as string) || null;
  const schoolUuid = (formData.get("schoolUuid") as string)?.trim() || null;
  const displayName = (formData.get("displayName") as string)?.trim() || null;
  const sen = formData.get("sen") === "on";

  if (!firstName || !lastName || !yearGroupId) {
    return { error: "First name, last name, and year group are required." };
  }

  const yearGroup = await prisma.yearGroup.findUnique({ where: { id: yearGroupId } });
  if (!yearGroup) return { error: "Year group not found." };

  let className: string | null = null;
  if (classGroupId) {
    const classGroup = await prisma.classGroup.findUnique({ where: { id: classGroupId } });
    className = classGroup?.name || null;
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      firstName,
      lastName,
      displayName,
      yearGroup: yearGroup.name,
      className,
      yearGroupId,
      classGroupId,
      tier: yearGroup.tier,
      sen,
      schoolUuid,
    },
  });

  revalidatePath("/admin/students");
  return { success: true };
}

export async function resetAssessment(assessmentId: string) {
  await prisma.assessment.delete({ where: { id: assessmentId } });
  revalidatePath("/admin/students");
  revalidatePath("/admin/results");
  return { success: true };
}
