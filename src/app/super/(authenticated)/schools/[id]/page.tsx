import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import SchoolSettingsForm from "./SchoolSettingsForm";
import FrameworkAssigner from "./FrameworkAssigner";

export default async function ManageSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      framework: { select: { id: true, name: true } },
      _count: {
        select: {
          students: true,
          teachers: true,
          admins: true,
          yearGroups: true,
          classGroups: true,
        },
      },
      admins: {
        select: { id: true, email: true },
        orderBy: { createdAt: "asc" },
      },
      teachers: {
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { lastName: "asc" },
      },
    },
  });

  if (!school) notFound();

  const frameworks = await prisma.framework.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Framework is locked if any assessment has been completed this academic year
  const completedThisYear = await prisma.assessment.count({
    where: {
      status: "completed",
      academicYear: school.academicYear,
      student: { schoolId: school.id },
    },
  });
  const frameworkLocked = completedThisYear > 0;

  return (
    <div className="max-w-3xl">
      <Link href="/super" className="text-sm text-meq-sky hover:underline">
        &larr; Back to Schools
      </Link>
      <h1 className="text-2xl font-bold text-white mt-2 mb-1">{school.name}</h1>
      <p className="text-sm text-gray-500 mb-6">/{school.slug}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Students", value: school._count.students },
          { label: "Teachers", value: school._count.teachers },
          { label: "Admins", value: school._count.admins },
          { label: "Year Groups", value: school._count.yearGroups },
          { label: "Classes", value: school._count.classGroups },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Settings form */}
      <SchoolSettingsForm school={school} />

      {/* Admins */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
        <h2 className="font-bold text-white mb-4">Admins</h2>
        <div className="space-y-2">
          {school.admins.map((admin) => (
            <div key={admin.id} className="flex items-center bg-gray-700/50 rounded-lg px-4 py-3">
              <span className="text-sm text-white">{admin.email}</span>
            </div>
          ))}
          {school.admins.length === 0 && (
            <p className="text-sm text-gray-500">No admins.</p>
          )}
        </div>
      </div>

      {/* Teachers */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
        <h2 className="font-bold text-white mb-4">Teachers ({school.teachers.length})</h2>
        {school.teachers.length > 0 ? (
          <div className="space-y-2">
            {school.teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-3">
                <span className="text-sm text-white">
                  {teacher.firstName} {teacher.lastName}
                </span>
                <span className="text-xs text-gray-400">{teacher.email}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No teachers yet.</p>
        )}
      </div>

      {/* Framework */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
        <h2 className="font-bold text-white mb-4">Framework</h2>
        <FrameworkAssigner
          schoolId={school.id}
          currentFrameworkId={school.framework?.id ?? null}
          frameworks={frameworks}
          locked={frameworkLocked}
          completedCount={completedThisYear}
          academicYear={school.academicYear}
        />
      </div>
    </div>
  );
}
