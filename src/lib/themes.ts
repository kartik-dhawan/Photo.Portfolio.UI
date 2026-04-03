export interface ColorTheme {
  id: string;
  name: string;
  background: string;   // content area bg (lighter)
  foreground: string;   // text color
  sidebar: string;      // sidebar bg (darker)
}

export const THEMES: ColorTheme[] = [
  // Pure black
  { id: "black",     name: "Black",      sidebar: "#000000", background: "#000000", foreground: "#ededed" },

  // Monochrome
  { id: "midnight",  name: "Midnight",   sidebar: "#050505", background: "#111111", foreground: "#ededed" },
  { id: "silver",    name: "Silver",     sidebar: "#0e0e10", background: "#1e1e22", foreground: "#f0f0f0" },
  { id: "charcoal",  name: "Charcoal",   sidebar: "#080808", background: "#181818", foreground: "#e5e5e5" },

  // Tinted — sidebar deep dark, background noticeably brighter
  { id: "blush",     name: "Blush",      sidebar: "#180c10", background: "#2c1820", foreground: "#f5dde0" },
  { id: "lavender",  name: "Lavender",   sidebar: "#100a1a", background: "#201530", foreground: "#e0d4f0" },
  { id: "mint",      name: "Mint",       sidebar: "#081410", background: "#142a20", foreground: "#d0f0e0" },
  { id: "peach",     name: "Peach",      sidebar: "#181008", background: "#2c2014", foreground: "#f5e0d0" },
  { id: "sky",       name: "Sky",        sidebar: "#081020", background: "#141e38", foreground: "#d0e5f5" },
  { id: "cream",     name: "Cream",      sidebar: "#181408", background: "#2c2614", foreground: "#f5f0d0" },
  { id: "rose",      name: "Rose",       sidebar: "#180c18", background: "#2c1430", foreground: "#f0d0e8" },
  { id: "sage",      name: "Sage",       sidebar: "#0c1608", background: "#182c18", foreground: "#d5e8d5" },
];

export const DEFAULT_THEME_ID = "black";

export function getThemeById(id: string): ColorTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
