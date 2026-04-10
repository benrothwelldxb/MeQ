"use client";

import { useState, useRef } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { updateQuestionMedia } from "@/app/actions/frameworks";

type MediaType = "image" | "audio";

export default function QuestionMediaButton({
  questionId,
  frameworkId,
  mediaType,
  currentUrl,
}: {
  questionId: string;
  frameworkId: string;
  mediaType: MediaType;
  currentUrl?: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const endpoint = mediaType === "image" ? "questionImage" : "questionAudio";
  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        const newUrl = res[0].url;
        setUrl(newUrl);
        await updateQuestionMedia(questionId, frameworkId, {
          [mediaType === "image" ? "symbolImageUrl" : "audioUrl"]: newUrl,
        });
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
    if (!confirm(`Remove this ${mediaType}?`)) return;
    setUrl(null);
    await updateQuestionMedia(questionId, frameworkId, {
      [mediaType === "image" ? "symbolImageUrl" : "audioUrl"]: null,
    });
  };

  const accept = mediaType === "image" ? "image/*" : "audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/x-m4a";
  const icon = mediaType === "image" ? (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id={`${mediaType}-${questionId}`}
      />
      {url ? (
        <>
          {mediaType === "image" ? (
            <a href={url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300">
              {icon}
            </a>
          ) : (
            <a href={url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300">
              {icon}
            </a>
          )}
          <button
            onClick={handleRemove}
            className="text-xs text-red-400 hover:text-red-300"
            title={`Remove ${mediaType}`}
          >
            ×
          </button>
        </>
      ) : (
        <label
          htmlFor={`${mediaType}-${questionId}`}
          className={`inline-flex items-center gap-1 text-xs cursor-pointer ${uploading ? "text-gray-500" : "text-gray-400 hover:text-gray-200"}`}
          title={`Add ${mediaType}`}
        >
          {uploading ? <span>...</span> : icon}
        </label>
      )}
    </div>
  );
}
