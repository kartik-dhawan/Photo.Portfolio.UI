const RESERVED_SECTION_KEYS = new Set(["__title__", "__footer__", "__default__"]);

/** Case-insensitive key for grouping sidebar sections (reserved keys unchanged). */
export function sectionGroupKey(sectionName: string | undefined): string {
  const trimmed = sectionName?.trim() ?? "";
  if (!trimmed) return "__default__";
  if (RESERVED_SECTION_KEYS.has(trimmed)) return trimmed;
  return trimmed.toLowerCase();
}

export function sectionNamesEqual(a: string | undefined, b: string | undefined): boolean {
  return sectionGroupKey(a) === sectionGroupKey(b);
}
