"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { resendTeacherWelcome, deleteTeacher, updateTeacherDetails } from "@/app/actions/teachers";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

export default function TeacherActions({
  teacherId,
  teacherName,
  firstName,
  lastName,
  email,
}: {
  teacherId: string;
  teacherName: string;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const boundUpdate = updateTeacherDetails.bind(null, teacherId);
  const [editState, editAction] = useFormState(boundUpdate, null);

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

  // Close modal automatically once save succeeds
  if (editState?.success && editOpen) {
    setEditOpen(false);
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3">
        {message && (
          <span className={`text-xs ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
            {message.text}
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          disabled={isPending}
          className="text-xs text-meq-sky hover:underline disabled:opacity-50"
        >
          Edit
        </button>
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

      {editOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Edit teacher</h3>
              <p className="text-sm text-gray-500 mt-0.5">{teacherName}</p>
            </div>

            <form action={editAction} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    name="firstName"
                    defaultValue={firstName}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    name="lastName"
                    defaultValue={lastName}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={email}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Changing the email changes the address used for login and emails.
                </p>
              </div>

              {editState?.error && <p className="text-sm text-red-600">{editState.error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <SaveButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
