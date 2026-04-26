"use client";

import { useState, useRef } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { updatePulseQuestionAudio } from "@/app/actions/frameworks";

export default function PulseAudioButton({
  pulseQuestionId,
  frameworkId,
  currentUrl,
}: {
  pulseQuestionId: string;
  frameworkId: string;
  currentUrl?: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("questionAudio", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        const newUrl = res[0].url;
        setUrl(newUrl);
        await updatePulseQuestionAudio(pulseQuestionId, frameworkId, newUrl);
      }
      setUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setUploading(false);
      alert(`Upload failed: ${error.message}`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await startUpload([file]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async () => {
    if (!confirm("Remove this audio?")) return;
    setUrl(null);
    await updatePulseQuestionAudio(pulseQuestionId, frameworkId, null);
  };

  const icon = (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/x-m4a"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id={`pulse-audio-${pulseQuestionId}`}
      />
      {url ? (
        <>
          <a href={url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300" title="Play audio" aria-label="Play audio">
            {icon}
          </a>
          <button
            onClick={handleRemove}
            className="text-xs text-red-400 hover:text-red-300"
            title="Remove audio"
            aria-label="Remove audio"
          >
            ×
          </button>
        </>
      ) : (
        <label
          htmlFor={`pulse-audio-${pulseQuestionId}`}
          className={`inline-flex items-center gap-1 text-xs cursor-pointer ${uploading ? "text-gray-500" : "text-gray-400 hover:text-gray-200"}`}
          title="Upload audio"
          aria-label="Upload audio"
        >
          {uploading ? <span>...</span> : icon}
        </label>
      )}
    </div>
  );
}
