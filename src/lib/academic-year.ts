/**
 * Compute the next academic year string given a current one.
 * Accepts "2025-2026" or "2025/2026" → returns "2026-2027".
 * If we can't parse it, just appends one year to the trailing 4-digit value.
 */
export function nextAcademicYear(current: string): string {
  const match = current.match(/^(\d{4})[-/](\d{4})$/);
  if (match) {
    const start = parseInt(match[1], 10);
    return `${start + 1}-${start + 2}`;
  }
  const last = current.match(/(\d{4})$/);
  if (last) {
    const end = parseInt(last[1], 10);
    return `${end}-${end + 1}`;
  }
  return current;
}
