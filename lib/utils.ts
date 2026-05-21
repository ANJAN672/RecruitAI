/**
 * Parse a JSON string into a string array.
 * Returns [] for null/undefined/empty input or malformed JSON, so callers
 * can safely render skill lists without a try/catch at every call site.
 */
export function safeParseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
