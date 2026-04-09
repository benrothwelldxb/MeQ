"use client";

import { useState, useRef, useEffect } from "react";

export default function PlayAudioButton({
  src,
  autoPlay = false,
}: {
  src: string;
  autoPlay?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener("ended", () => setPlaying(false));

    if (autoPlay) {
      audio.play().catch(() => {});
      setPlaying(true);
    }

    return () => {
      audio.pause();
      audio.removeEventListener("ended", () => setPlaying(false));
    };
  }, [src, autoPlay]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-center w-12 h-12 rounded-full transition-all ${
        playing
          ? "bg-meq-sky text-white scale-110"
          : "bg-meq-sky-light text-meq-sky hover:bg-meq-sky hover:text-white"
      }`}
      aria-label={playing ? "Stop reading" : "Read aloud"}
    >
      {playing ? (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12v12H6z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      )}
    </button>
  );
}
