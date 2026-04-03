export interface ColorTheme {
  id: string;
  name: string;
  background: string;   // main content bg
  foreground: string;   // text color
  sidebar: string;      // sidebar bg (darker)
  accent: string;       // bright pastel for circle preview
}

export const THEMES: ColorTheme[] = [
  // Monochrome
  { id: "black",     name: "Midnight",   background: "#000000", foreground: "#ededed", sidebar: "#0a0a0a", accent: "#e0e0e0" },
  { id: "silver",    name: "Silver",     background: "#1c1c1e", foreground: "#f0f0f0", sidebar: "#111113", accent: "#d0d0d4" },
  { id: "charcoal",  name: "Charcoal",   background: "#141414", foreground: "#e5e5e5", sidebar: "#0a0a0a", accent: "#c8c8c8" },

  // Pastels — sidebar is dark tinted, accent is bright pastel
  { id: "blush",     name: "Blush",      background: "#0d0a0b", foreground: "#f5dde0", sidebar: "#1a0e12", accent: "#f5b8c4" },
  { id: "lavender",  name: "Lavender",   background: "#0c0a10", foreground: "#e0d4f0", sidebar: "#150e1e", accent: "#c8a8e8" },
  { id: "mint",      name: "Mint",       background: "#080d0b", foreground: "#d0f0e0", sidebar: "#0c1812", accent: "#a0e8c8" },
  { id: "peach",     name: "Peach",      background: "#100b08", foreground: "#f5e0d0", sidebar: "#1c1208", accent: "#f5c8a0" },
  { id: "sky",       name: "Sky",        background: "#080b10", foreground: "#d0e5f5", sidebar: "#0c1220", accent: "#a0c8f0" },
  { id: "cream",     name: "Cream",      background: "#0f0d08", foreground: "#f5f0d0", sidebar: "#1a1608", accent: "#f0e8a0" },
  { id: "rose",      name: "Rose",       background: "#100810", foreground: "#f0d0e8", sidebar: "#1c0c1a", accent: "#e8a0d0" },
  { id: "sage",      name: "Sage",       background: "#0a0d0a", foreground: "#d5e8d5", sidebar: "#0e180e", accent: "#a8d8a8" },
];

export const DEFAULT_THEME_ID = "black";

export function getThemeById(id: string): ColorTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
