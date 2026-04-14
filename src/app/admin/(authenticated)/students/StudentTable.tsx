"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BulkActions from "./BulkActions";
import DeleteStudentButton from "./DeleteStudentButton";
import ResetAssessmentButton from "./ResetAssessmentButton";

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  yearGroup: string;
  className: string | null;
  tier: string;
  loginCode: string;
  sen: boolean;
  assessments: Array<{ id: string; status: string; term: string }>;
}

interface ClassOption {
  id: string;
  name: string;
  yearGroupName: string;
}

export default function StudentTable({
  students,
  classes,
}: {
  students: StudentData[];
  classes: ClassOption[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.id)));
    }
  };

  const handleExport = useCallback(() => {
    const selectedStudents = students.filter((s) => selected.has(s.id));
    const csv = [
      "first_name,last_name,year_group,class_name,login_code,sen",
      ...selectedStudents.map(
        (s) => `${s.firstName},${s.lastName},${s.yearGroup},${s.className || ""},${s.loginCode},${s.sen ? "Yes" : "No"}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meq-students-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [students, selected]);

  useEffect(() => {
    const handler = () => handleExport();
    window.addEventListener("export-selected", handler);
    return () => window.removeEventListener("export-selected", handler);
  }, [handleExport]);

  return (
    <>
      <BulkActions
        selectedIds={Array.from(selected)}
        onClear={() => setSelected(new Set())}
        classes={classes}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && selected.size === students.length}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Year / Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Login Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                const latestAssessment = student.assessments[0];
                const status = latestAssessment?.status ?? "not_started";
                return (
                  <tr key={student.id} className={`hover:bg-gray-50 ${selected.has(student.id) ? "bg-meq-sky-light/30" : ""}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(student.id)}
                        onChange={() => toggleOne(student.id)}
                        className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </span>
                        {student.sen && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {student.yearGroup}
                      {student.className && ` / ${student.className}`}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        student.tier === "junior"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {student.tier === "junior" ? "Junior" : "Standard"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <code className="px-2 py-1 rounded bg-gray-100 text-sm font-mono text-gray-700">
                        {student.loginCode}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : status === "in_progress"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {status === "completed"
                          ? "Completed"
                          : status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <Link href={`/admin/students/${student.id}`} className="text-xs text-meq-sky hover:underline font-medium">
                          View
                        </Link>
                        <Link href={`/admin/students/${student.id}/edit`} className="text-xs text-meq-sky hover:underline">
                          Edit
                        </Link>
                        {latestAssessment && (
                          <ResetAssessmentButton
                            assessmentId={latestAssessment.id}
                            studentName={`${student.firstName} ${student.lastName}`}
                            term={latestAssessment.term}
                          />
                        )}
                        <DeleteStudentButton studentId={student.id} studentName={`${student.firstName} ${student.lastName}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No students yet.{" "}
                    <Link href="/admin/students/add" className="text-meq-sky hover:underline">Add a student</Link>{" "}
                    or{" "}
                    <Link href="/admin/students/upload" className="text-meq-sky hover:underline">upload a CSV</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
