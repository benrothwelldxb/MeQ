"use server";

import { prisma } from "@/lib/db";
import { generateLoginCode } from "@/lib/codes";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

export async function uploadStudentsCSV(formData: FormData) {
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
    students.push({ firstName, lastName, yearGroup, className, loginCode });
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
