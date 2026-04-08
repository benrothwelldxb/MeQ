"use server";

import { prisma } from "@/lib/db";
import { generateLoginCode } from "@/lib/codes";
import { getTierFromYearGroup } from "@/lib/constants";
import { getAdminSession } from "@/lib/session";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

export async function uploadStudentsCSV(formData: FormData) {
  const session = await getAdminSession();
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

  // Validate required fields
  const requiredFields = ["first_name", "last_name", "year_group"];
  const headers = Object.keys(records[0]);
  const missing = requiredFields.filter((f) => !headers.includes(f));
  if (missing.length > 0) {
    return { error: `Missing columns: ${missing.join(", ")}` };
  }

  // Get existing codes to avoid duplicates
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
    schoolId: string;
  }> = [];

  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const firstName = row.first_name?.trim();
    const lastName = row.last_name?.trim();
    const yearGroup = row.year_group?.trim();
    const className = row.class_name?.trim() || null;
    let loginCode = row.login_code?.trim().toUpperCase() || "";

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
    students.push({ firstName, lastName, yearGroup, className, loginCode, tier, schoolId: session.schoolId });
  }

  if (students.length === 0) {
    return { error: `No valid students found. ${errors.join("; ")}` };
  }

  // Bulk create
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
  let loginCode = (formData.get("loginCode") as string)?.trim().toUpperCase() || "";

  if (!firstName || !lastName || !yearGroupId) {
    return { error: "First name, last name, and year group are required." };
  }

  // Look up year group for tier and name
  const yearGroup = await prisma.yearGroup.findUnique({ where: { id: yearGroupId } });
  if (!yearGroup) return { error: "Year group not found." };

  // Look up class group name if provided
  let className: string | null = null;
  if (classGroupId) {
    const classGroup = await prisma.classGroup.findUnique({ where: { id: classGroupId } });
    className = classGroup?.name || null;
  }

  // Generate or validate login code
  if (!loginCode) {
    const existingCodes = new Set(
      (await prisma.student.findMany({ select: { loginCode: true } })).map((s) => s.loginCode)
    );
    do {
      loginCode = generateLoginCode();
    } while (existingCodes.has(loginCode));
  } else {
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
