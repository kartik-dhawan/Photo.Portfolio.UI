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

/** URL slug for a section, e.g. "Commercial Work" → "commercial-work". */
export function sectionSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** True if the given URL slug matches a section name. */
export function slugMatchesSection(slug: string, sectionName: string | undefined): boolean {
  if (!sectionName) return false;
  const key = sectionGroupKey(sectionName);
  if (key.startsWith("__")) return false;
  return sectionSlug(sectionName) === slug;
}
