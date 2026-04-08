"use client";

import { useState, useRef, useCallback } from "react";
import { saveTeacherAnswers, submitTeacherAssessments } from "@/app/actions/teacher-assessment";

interface Student {
  id: string;
  name: string;
  completed: boolean;
}

interface Question {
  orderIndex: number;
  prompt: string;
  domain: string;
  answerOptions: { label: string; value: number }[];
}

export default function BatchInputGrid({
  classGroupId,
  students,
  questions,
  savedAnswers,
}: {
  classGroupId: string;
  students: Student[];
  questions: Question[];
  savedAnswers: Record<string, Record<string, number>>;
}) {
  const [answers, setAnswers] = useState<Record<string, Record<string, number>>>(savedAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const doSave = useCallback(async (studentId: string, studentAnswers: Record<string, number>) => {
    setSaving(true);
    await saveTeacherAnswers(studentId, studentAnswers);
    setSaving(false);
  }, []);

  const handleAnswer = (studentId: string, questionIndex: number, value: number) => {
    setAnswers((prev) => {
      const studentAnswers = { ...(prev[studentId] || {}), [String(questionIndex)]: value };
      const updated = { ...prev, [studentId]: studentAnswers };

      // Debounced save
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        doSave(studentId, studentAnswers);
      }, 500);

      return updated;
    });
  };

  const handleSubmitAll = async () => {
    // Save all pending
    for (const [studentId, studentAnswers] of Object.entries(answers)) {
      await saveTeacherAnswers(studentId, studentAnswers);
    }
    setSubmitting(true);
    await submitTeacherAssessments(classGroupId);
    setSubmitting(false);
    setSubmitted(true);
  };

  const totalQuestions = questions.length;
  const completedStudents = students.filter((s) => {
    const a = answers[s.id] || {};
    return Object.keys(a).length >= totalQuestions || s.completed;
  });

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Assessments Submitted!</h2>
        <p className="text-gray-500">{completedStudents.length} students assessed.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {completedStudents.length} / {students.length} students fully rated
          {saving && <span className="ml-2 text-meq-sky">Saving...</span>}
        </p>
        <button
          onClick={handleSubmitAll}
          disabled={submitting || completedStudents.length === 0}
          className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-leaf hover:bg-meq-leaf/90 disabled:opacity-50 transition-all"
        >
          {submitting ? "Submitting..." : "Submit All Completed"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 min-w-[160px]">
                  Student
                </th>
                {questions.map((q) => (
                  <th
                    key={q.orderIndex}
                    className="px-2 py-3 text-xs font-semibold text-gray-500 text-center min-w-[100px]"
                    title={q.prompt}
                  >
                    <div className="truncate max-w-[100px]">Q{q.orderIndex}</div>
                    <div className="text-[10px] text-gray-400 font-normal truncate">{q.domain.replace(/([A-Z])/g, " $1").trim()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                const studentAnswers = answers[student.id] || {};
                const answeredCount = Object.keys(studentAnswers).length;
                const isComplete = answeredCount >= totalQuestions || student.completed;

                return (
                  <tr key={student.id} className={isComplete ? "bg-emerald-50/30" : ""}>
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{student.name}</span>
                        {isComplete && (
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </td>
                    {questions.map((q) => {
                      const value = studentAnswers[String(q.orderIndex)];
                      return (
                        <td key={q.orderIndex} className="px-2 py-2 text-center">
                          <select
                            value={value ?? ""}
                            onChange={(e) => handleAnswer(student.id, q.orderIndex, parseInt(e.target.value))}
                            disabled={student.completed}
                            className="w-full px-1 py-1.5 text-sm rounded border border-gray-200 focus:border-meq-sky focus:outline-none disabled:bg-gray-100"
                          >
                            <option value="">—</option>
                            {q.answerOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.value}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">Answer Scale</p>
        <div className="flex gap-6 text-xs text-gray-600">
          {questions[0]?.answerOptions.map((opt) => (
            <span key={opt.value}><strong>{opt.value}</strong> = {opt.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
