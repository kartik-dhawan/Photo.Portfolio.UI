export interface ColorTheme {
  id: string;
  name: string;
  background: string;   // content area bg (lighter)
  foreground: string;   // text color
  sidebar: string;      // sidebar bg (darker)
}

export const THEMES: ColorTheme[] = [
  // Monochrome
  { id: "black",     name: "Midnight",   sidebar: "#000000", background: "#0a0a0a", foreground: "#ededed" },
  { id: "silver",    name: "Silver",     sidebar: "#111113", background: "#1c1c1e", foreground: "#f0f0f0" },
  { id: "charcoal",  name: "Charcoal",   sidebar: "#0a0a0a", background: "#161616", foreground: "#e5e5e5" },

  // Tinted — sidebar is deep dark, background is noticeably lighter tinted
  { id: "blush",     name: "Blush",      sidebar: "#140a0e", background: "#1e1215", foreground: "#f5dde0" },
  { id: "lavender",  name: "Lavender",   sidebar: "#0e0a16", background: "#18121e", foreground: "#e0d4f0" },
  { id: "mint",      name: "Mint",       sidebar: "#081210", background: "#101c18", foreground: "#d0f0e0" },
  { id: "peach",     name: "Peach",      sidebar: "#140e08", background: "#1e1610", foreground: "#f5e0d0" },
  { id: "sky",       name: "Sky",        sidebar: "#080e18", background: "#101620", foreground: "#d0e5f5" },
  { id: "cream",     name: "Cream",      sidebar: "#141208", background: "#1e1a10", foreground: "#f5f0d0" },
  { id: "rose",      name: "Rose",       sidebar: "#140a14", background: "#1e1020", foreground: "#f0d0e8" },
  { id: "sage",      name: "Sage",       sidebar: "#0a120a", background: "#121c12", foreground: "#d5e8d5" },
];

export const DEFAULT_THEME_ID = "black";

export function getThemeById(id: string): ColorTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
