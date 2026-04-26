"use client";

import { useState, useRef, useEffect, useId } from "react";

/**
 * Gmail-style email chips input. Type an email and press Enter / comma /
 * space / Tab — it converts to a chip with an × to remove. Paste a
 * comma-separated list and each address becomes its own chip.
 *
 * Renders a hidden input named `name` containing the chips joined by commas
 * so it works with the existing server actions that read a comma-separated
 * dslEmail string via parseEmailList.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseToChips(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter((s) => s && EMAIL_RE.test(s))
    )
  );
}

export default function EmailChipsInput({
  name,
  defaultValue = "",
  placeholder = "name@school.org",
  ariaLabel,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [chips, setChips] = useState<string[]>(() => parseToChips(defaultValue));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Re-parse if defaultValue changes between renders (e.g. server pushed
  // fresh data after a save).
  useEffect(() => {
    setChips(parseToChips(defaultValue));
  }, [defaultValue]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return true;
    if (!EMAIL_RE.test(trimmed)) {
      setError(`"${trimmed}" doesn't look like an email address.`);
      return false;
    }
    setError(null);
    setChips((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    return true;
  };

  const remove = (email: string) => {
    setChips((prev) => prev.filter((e) => e !== email));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        if (commit(draft)) setDraft("");
      }
    } else if (e.key === "Backspace" && !draft && chips.length > 0) {
      // Pop the last chip back into the input for editing — like Gmail.
      e.preventDefault();
      setDraft(chips[chips.length - 1]);
      setChips((prev) => prev.slice(0, -1));
    } else if (e.key === " " && draft.includes("@")) {
      // Space commits only after an @-sign so users can still type their name
      // before the cursor catches up.
      e.preventDefault();
      if (commit(draft)) setDraft("");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (/[,;\s]/.test(pasted)) {
      e.preventDefault();
      const additions = parseToChips(pasted);
      setError(null);
      setChips((prev) => Array.from(new Set([...prev, ...additions])));
      setDraft("");
    }
  };

  const handleBlur = () => {
    if (draft.trim()) {
      if (commit(draft)) setDraft("");
    }
  };

  return (
    <div>
      <div
        className="w-full min-h-[42px] px-2 py-1.5 rounded-lg border border-gray-300 focus-within:border-meq-sky bg-white flex flex-wrap gap-1.5 items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-meq-sky-light text-meq-sky text-sm"
          >
            <span>{email}</span>
            <button
              type="button"
              onClick={() => remove(email)}
              aria-label={`Remove ${email}`}
              className="w-4 h-4 rounded-full hover:bg-meq-sky/20 flex items-center justify-center text-xs leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="email"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={chips.length === 0 ? placeholder : ""}
          aria-label={ariaLabel ?? "Add email address"}
          className="flex-1 min-w-[180px] px-1 py-1 outline-none border-0 bg-transparent text-sm"
        />
      </div>
      {/* Hidden input keeps the existing server-action contract: comma-joined string */}
      <input type="hidden" name={name} value={chips.join(",")} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
