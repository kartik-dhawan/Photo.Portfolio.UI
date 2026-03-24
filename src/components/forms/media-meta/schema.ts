import * as yup from "yup";

export const mediaMetaSchema = yup.object({
  title: yup.string().trim().default(""),
  date: yup.string().default(""),
  duration: yup.string().trim().default(""),
  link: yup.string().trim().url("Must be a valid URL").default(""),
  brandId: yup.string().default(""),
});

export type MediaMetaFormValues = yup.InferType<typeof mediaMetaSchema>;

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function parseDuration(str: string): number | undefined {
  const trimmed = str.trim();
  if (!trimmed) return undefined;
  let total = 0;
  const mMatch = trimmed.match(/(\d+)\s*m/);
  const sMatch = trimmed.match(/(\d+)\s*s/);
  if (mMatch) total += parseInt(mMatch[1]) * 60;
  if (sMatch) total += parseInt(sMatch[1]);
  if (total === 0 && /^\d+$/.test(trimmed)) total = parseInt(trimmed);
  return total > 0 ? total : undefined;
}
