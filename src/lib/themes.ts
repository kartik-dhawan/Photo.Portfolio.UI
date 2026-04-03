export interface ColorTheme {
  id: string;
  name: string;
  background: string;   // content area bg (applied)
  foreground: string;   // text color
  sidebar: string;      // sidebar bg (darker)
  preview: string;      // bright color for picker circle (not applied)
}

export const THEMES: ColorTheme[] = [
  // Pure black
  { id: "black",     name: "Black",      sidebar: "#000000", background: "#000000", foreground: "#ededed", preview: "#1a1a1a" },

  // Monochrome
  { id: "midnight",  name: "Midnight",   sidebar: "#050505", background: "#121212", foreground: "#ededed", preview: "#3a3a3a" },
  { id: "charcoal",  name: "Charcoal",   sidebar: "#080808", background: "#1a1a1a", foreground: "#e5e5e5", preview: "#4a4a4a" },

  // Tinted
  { id: "blush",     name: "Blush",      sidebar: "#1a0c12", background: "#2a1520", foreground: "#f5dde0", preview: "#e8a0b0" },
  { id: "lavender",  name: "Lavender",   sidebar: "#120a1e", background: "#201535", foreground: "#e0d4f0", preview: "#b898d8" },
  { id: "mint",      name: "Mint",       sidebar: "#081812", background: "#143025", foreground: "#d0f0e0", preview: "#80d0a8" },
  { id: "peach",     name: "Peach",      sidebar: "#1c1208", background: "#2c2015", foreground: "#f5e0d0", preview: "#e8b888" },
  { id: "sky",       name: "Sky",        sidebar: "#081428", background: "#142040", foreground: "#d0e5f5", preview: "#88b8e8" },
  { id: "cream",     name: "Cream",      sidebar: "#1a1608", background: "#2c2515", foreground: "#f5f0d0", preview: "#e0d888" },
  { id: "rose",      name: "Rose",       sidebar: "#1c0c1c", background: "#2c1535", foreground: "#f0d0e8", preview: "#d890c0" },
  { id: "sage",      name: "Sage",       sidebar: "#0c1a0c", background: "#183018", foreground: "#d5e8d5", preview: "#90c890" },
];

export const DEFAULT_THEME_ID = "black";

export function getThemeById(id: string): ColorTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
