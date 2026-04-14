"use server";

import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { getAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { sendTeacherWelcomeEmail, sendTeacherResendEmail } from "@/lib/email";
import { validatePassword } from "@/lib/security";
import { isValidTag } from "@/lib/teacher-tags";
import { parse } from "csv-parse/sync";

export async function createTeacher(formData: FormData) {
  const session = await getAdminSession();
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const classGroupIds = formData.getAll("classGroupIds") as string[];
  const tags = (formData.getAll("tags") as string[]).filter(isValidTag);

  if (!firstName || !lastName || !email) {
    return { error: "First name, last name, and email are required." };
  }

  const school = await prisma.school.findUnique({
    where: { id: session.schoolId },
    select: { name: true, authMode: true },
  });
  if (!school) return { error: "School not found." };

  if (school.authMode === "password" && !password) {
    return { error: "A password is required for this school." };
  }
  if (password) {
    const validation = validatePassword(password);
    if (!validation.valid) {
      return { error: validation.error };
    }
  }

  const existing = await prisma.teacher.findUnique({ where: { email } });
  if (existing) return { error: "A teacher with this email already exists." };

  await prisma.teacher.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash: password ? hashSync(password, 10) : "",
      schoolId: session.schoolId,
      tags: JSON.stringify(tags),
      classes: classGroupIds.length > 0
        ? { connect: classGroupIds.map((id) => ({ id })) }
        : undefined,
    },
  });

  // Email content follows school auth mode:
  // - sso: show Google SSO instructions (ignore any password)
  // - password / both: show password if supplied, otherwise SSO instructions
  const showPassword = school.authMode !== "sso" && !!password;
  await sendTeacherWelcomeEmail({
    email,
    firstName,
    password: showPassword ? password : undefined,
    schoolName: school.name,
  });

  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function deleteTeacher(teacherId: string) {
  await prisma.teacherAssessment.deleteMany({ where: { teacherId } });
  await prisma.teacher.delete({ where: { id: teacherId } });
  revalidatePath("/admin/teachers");
}

export async function resendTeacherWelcome(teacherId: string) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { school: { select: { name: true, authMode: true } } },
  });
  if (!teacher || teacher.schoolId !== session.schoolId) {
    return { error: "Teacher not found." };
  }

  try {
    await sendTeacherResendEmail({
      email: teacher.email,
      firstName: teacher.firstName,
      schoolName: teacher.school.name,
      authMode: teacher.school.authMode,
    });
    return { success: true };
  } catch (err) {
    console.error(`Failed to resend welcome email to ${teacher.email}:`, err);
    return { error: (err as Error).message || "Failed to send email." };
  }
}

// === BULK CSV UPLOAD ===

export async function previewTeachersCSV(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { error: "Please select a CSV file." };
  }

  const text = await file.text();
  let records: Array<Record<string, string>>;
  try {
    records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    return { error: "Could not parse CSV." };
  }

  if (records.length === 0) {
    return { error: "CSV file is empty." };
  }

  const headers = Object.keys(records[0]);
  return {
    headers,
    preview: records.slice(0, 3),
    totalRows: records.length,
    csvText: text,
  };
}

export async function uploadTeachersCSV(csvText: string) {
  const session = await getAdminSession();

  let records: Array<Record<string, string>>;
  try {
    records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    return { error: "Could not parse CSV." };
  }

  if (records.length === 0) {
    return { error: "CSV is empty." };
  }

  // Find columns — flexible header matching
  const findCol = (names: string[]) => {
    return Object.keys(records[0]).find((k) => names.includes(k.toLowerCase().trim()));
  };

  const firstNameCol = findCol(["first_name", "firstname", "first name", "given", "forename"]);
  const lastNameCol = findCol(["last_name", "lastname", "last name", "surname", "family"]);
  const emailCol = findCol(["email", "email_address"]);
  const passwordCol = findCol(["password"]);
  const classCol = findCol(["class", "class_name", "classes"]);
  const tagsCol = findCol(["tags", "role", "roles"]);

  if (!firstNameCol || !lastNameCol || !emailCol) {
    return { error: "CSV must have first_name, last_name, and email columns." };
  }

  const school = await prisma.school.findUnique({
    where: { id: session.schoolId },
    select: { name: true, authMode: true },
  });

  // Load classes for lookup
  const classGroups = await prisma.classGroup.findMany({
    where: { schoolId: session.schoolId },
    include: { yearGroup: true },
  });
  const classByName: Record<string, string> = {};
  for (const cg of classGroups) {
    classByName[cg.name.toLowerCase()] = cg.id;
    classByName[`${cg.yearGroup.name.toLowerCase()} ${cg.name.toLowerCase()}`] = cg.id;
  }

  const created: Array<{ name: string; email: string; password: string }> = [];
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const firstName = row[firstNameCol]?.trim();
    const lastName = row[lastNameCol]?.trim();
    const email = row[emailCol]?.trim().toLowerCase();
    const password = passwordCol ? row[passwordCol]?.trim() || "" : "";

    if (!firstName || !lastName || !email) {
      errors.push(`Row ${i + 2}: Missing required fields`);
      continue;
    }

    if (!email.includes("@")) {
      errors.push(`Row ${i + 2}: Invalid email "${email}"`);
      continue;
    }

    const existing = await prisma.teacher.findUnique({ where: { email } });
    if (existing) {
      errors.push(`Row ${i + 2}: Teacher with email ${email} already exists`);
      continue;
    }

    // If no password column or empty cell, leave blank for Google SSO login.
    // If password provided, validate it. If school is password-only, require one.
    if (school?.authMode === "password" && !password) {
      errors.push(`Row ${i + 2}: Password required (school is password-only)`);
      continue;
    }
    if (password) {
      const validation = validatePassword(password);
      if (!validation.valid) {
        errors.push(`Row ${i + 2}: ${validation.error}`);
        continue;
      }
    }

    // Parse classes — supports "5A, 5B" or "Year 5 5A" formats
    const classGroupIds: string[] = [];
    if (classCol && row[classCol]?.trim()) {
      const parts = row[classCol].split(/[,;|]/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        const id = classByName[part.toLowerCase()];
        if (id) classGroupIds.push(id);
      }
    }

    // Parse tags — supports "Class Teacher, Inclusion" or "Class Teacher|PLT"
    const tagsValue: string[] = [];
    if (tagsCol && row[tagsCol]?.trim()) {
      const parts = row[tagsCol].split(/[,;|]/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (isValidTag(p)) tagsValue.push(p);
      }
    }

    try {
      await prisma.teacher.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash: password ? hashSync(password, 10) : "",
          schoolId: session.schoolId,
          tags: JSON.stringify(tagsValue),
          classes: classGroupIds.length > 0
            ? { connect: classGroupIds.map((id) => ({ id })) }
            : undefined,
        },
      });

      // Send welcome email (graceful fallback if RESEND not set)
      const showPassword = school?.authMode !== "sso" && !!password;
      try {
        await sendTeacherWelcomeEmail({
          email,
          firstName,
          password: showPassword ? password : undefined,
          schoolName: school?.name ?? "your school",
        });
      } catch (err) {
        console.error(`Failed to send welcome email to ${email}:`, err);
      }

      created.push({ name: `${firstName} ${lastName}`, email, password: showPassword ? password : "(SSO)" });
    } catch (err) {
      errors.push(`Row ${i + 2}: Failed to create — ${(err as Error).message}`);
    }
  }

  revalidatePath("/admin/teachers");

  return {
    success: true,
    count: created.length,
    errors: errors.length > 0 ? errors : undefined,
    teachers: created,
  };
}

export async function updateTeacherTags(teacherId: string, tags: string[]) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { schoolId: true },
  });
  if (!teacher || teacher.schoolId !== session.schoolId) {
    return { error: "Teacher not found." };
  }

  const valid = tags.filter(isValidTag);
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { tags: JSON.stringify(valid) },
  });
  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function updateTeacherClasses(teacherId: string, classGroupIds: string[]) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  // Ensure teacher belongs to the admin's school
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { schoolId: true },
  });
  if (!teacher || teacher.schoolId !== session.schoolId) {
    return { error: "Teacher not found." };
  }

  // Ensure all class groups belong to the same school
  if (classGroupIds.length > 0) {
    const validClasses = await prisma.classGroup.count({
      where: { id: { in: classGroupIds }, schoolId: session.schoolId },
    });
    if (validClasses !== classGroupIds.length) {
      return { error: "Invalid class selection." };
    }
  }

  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      classes: { set: classGroupIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/admin/teachers");
  return { success: true };
}
