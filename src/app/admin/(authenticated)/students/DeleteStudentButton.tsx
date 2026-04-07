"use client";

import { deleteStudent } from "@/app/actions/students";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    await deleteStudent(studentId);
    router.refresh();
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Delete {studentName}?</span>
        <button
          onClick={handleDelete}
          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-gray-400 hover:text-red-600 transition-colors"
    >
      Delete
    </button>
  );
}
