export interface ColorTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  accent: string;       // lighter shade for UI elements
  accentDark: string;   // darker shade
}

export const THEMES: ColorTheme[] = [
  // Monochrome
  { id: "black",     name: "Midnight",     background: "#000000", foreground: "#ededed", accent: "#27272a", accentDark: "#18181b" },
  { id: "white",     name: "Snow",         background: "#fafafa", foreground: "#171717", accent: "#e5e5e5", accentDark: "#d4d4d4" },
  { id: "charcoal",  name: "Charcoal",     background: "#1a1a1a", foreground: "#e5e5e5", accent: "#333333", accentDark: "#262626" },

  // Blues
  { id: "navy",      name: "Navy",         background: "#0a0f1a", foreground: "#cbd5e1", accent: "#1e293b", accentDark: "#0f172a" },
  { id: "ocean",     name: "Ocean",        background: "#042f2e", foreground: "#ccfbf1", accent: "#134e4a", accentDark: "#0d3d3b" },

  // Warm
  { id: "espresso",  name: "Espresso",     background: "#1c1210", foreground: "#e8ddd5", accent: "#3b2820", accentDark: "#2a1c15" },
  { id: "wine",      name: "Wine",         background: "#1a0a10", foreground: "#f0d0dd", accent: "#3b1428", accentDark: "#2a0e1d" },
  { id: "amber",     name: "Amber",        background: "#1a1400", foreground: "#fef3c7", accent: "#3b3000", accentDark: "#2a2200" },

  // Cool
  { id: "forest",    name: "Forest",       background: "#0a1a0a", foreground: "#d1e7d1", accent: "#1a3a1a", accentDark: "#0f2a0f" },
  { id: "slate",     name: "Slate",        background: "#0f1117", foreground: "#c8cdd5", accent: "#1e2230", accentDark: "#151925" },
  { id: "plum",      name: "Plum",         background: "#150a1a", foreground: "#e8d0f0", accent: "#2a1438", accentDark: "#1f0e2a" },
];

export const DEFAULT_THEME_ID = "black";

export function getThemeById(id: string): ColorTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
