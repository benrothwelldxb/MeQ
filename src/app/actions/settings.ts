"use server";

import { prisma } from "@/lib/db";
import { getSchoolSettings } from "@/lib/school";
import { revalidatePath } from "next/cache";

export async function updateSchoolSettings(formData: FormData) {
  const school = await getSchoolSettings();
  const name = (formData.get("name") as string)?.trim() || school.name;
  const currentTerm = (formData.get("currentTerm") as string) || school.currentTerm;
  const academicYear = (formData.get("academicYear") as string)?.trim() || school.academicYear;

  await prisma.school.update({
    where: { id: school.id },
    data: { name, currentTerm, academicYear },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}
