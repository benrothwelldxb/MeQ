import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import Link from "next/link";

export default async function TeacherDashboard() {
  const session = await getTeacherSession();
  const school = await getSchoolSettings(session.schoolId);

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.teacherId },
    include: {
      classes: {
        include: {
          yearGroup: true,
          students: {
            include: {
              assessments: {
                where: { term: school.currentTerm, academicYear: school.academicYear, status: "completed" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) return null;

  const teacherAssessmentCounts = await prisma.teacherAssessment.groupBy({
    by: ["studentId"],
    where: {
      teacherId: teacher.id,
      term: school.currentTerm,
      academicYear: school.academicYear,
      status: "completed",
    },
  });
  const completedTeacherIds = new Set(teacherAssessmentCounts.map((ta) => ta.studentId));

  // Overall stats
  const totalStudents = teacher.classes.reduce((sum, cls) => sum + cls.students.length, 0);
  const totalStudentCompleted = teacher.classes.reduce(
    (sum, cls) => sum + cls.students.filter((s) => s.assessments.length > 0).length,
    0
  );
  const totalTeacherCompleted = teacher.classes.reduce(
    (sum, cls) => sum + cls.students.filter((s) => completedTeacherIds.has(s.id)).length,
    0
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {teacher.firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          {TERM_LABELS[school.currentTerm]} — {school.academicYear}
        </p>
      </div>

      {/* Quick Stats */}
      {teacher.classes.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            <p className="text-xs text-gray-400 mt-1">across {teacher.classes.length} class{teacher.classes.length !== 1 ? "es" : ""}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">Student Self-Assessments</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalStudentCompleted} <span className="text-sm font-normal text-gray-400">/ {totalStudents}</span>
            </p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
              <div
                className="h-full bg-meq-sky rounded-full transition-all"
                style={{ width: `${totalStudents ? Math.round((totalStudentCompleted / totalStudents) * 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">Your Teacher Assessments</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalTeacherCompleted} <span className="text-sm font-normal text-gray-400">/ {totalStudents}</span>
            </p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${totalStudents ? Math.round((totalTeacherCompleted / totalStudents) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Class Cards */}
      <div className="grid gap-6">
        {teacher.classes.map((cls) => {
          const classTotal = cls.students.length;
          const studentCompleted = cls.students.filter((s) => s.assessments.length > 0).length;
          const teacherCompleted = cls.students.filter((s) => completedTeacherIds.has(s.id)).length;

          return (
            <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {cls.yearGroup.name} — {cls.name}
                  </h2>
                  <p className="text-sm text-gray-500">{classTotal} students</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/teacher/class/${cls.id}/assess`}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
                  >
                    Assess Class
                  </Link>
                  <Link
                    href={`/teacher/class/${cls.id}`}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    View Results
                  </Link>
                  {school.pulseEnabled && (
                    <Link
                      href={`/teacher/class/${cls.id}/pulse`}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                      Pulse
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Student Self-Assessment</p>
                  <p className="text-lg font-bold text-gray-900">
                    {studentCompleted} / {classTotal}
                    <span className="text-sm font-normal text-gray-500 ml-1">completed</span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Your Teacher Assessment</p>
                  <p className="text-lg font-bold text-gray-900">
                    {teacherCompleted} / {classTotal}
                    <span className="text-sm font-normal text-gray-500 ml-1">completed</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {teacher.classes.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No classes assigned yet. Ask your admin to assign you to a class.</p>
          </div>
        )}
      </div>
    </div>
  );
}
