"use client";

import { useState, useTransition } from "react";
import { resendTeacherWelcome, deleteTeacher } from "@/app/actions/teachers";

export default function TeacherActions({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleResend() {
    setMessage(null);
    startTransition(async () => {
      const result = await resendTeacherWelcome(teacherId);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Email sent" });
      }
      setTimeout(() => setMessage(null), 4000);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${teacherName}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteTeacher(teacherId);
    });
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {message && (
        <span className={`text-xs ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {message.text}
        </span>
      )}
      <button
        type="button"
        onClick={handleResend}
        disabled={isPending}
        className="text-xs text-meq-sky hover:underline disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Resend welcome"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
