export interface ColorTheme {
  id: string;
  name: string;
  background: string;   // main content bg
  foreground: string;   // text color
  sidebar: string;      // sidebar bg (darker)
  accent: string;       // lighter pastel for UI elements
}

export const THEMES: ColorTheme[] = [
  // Monochrome
  { id: "black",     name: "Midnight",   background: "#000000", foreground: "#ededed", sidebar: "#0a0a0a", accent: "#1e1e1e" },
  { id: "silver",    name: "Silver",     background: "#1c1c1e", foreground: "#f0f0f0", sidebar: "#141416", accent: "#2c2c30" },
  { id: "charcoal",  name: "Charcoal",   background: "#141414", foreground: "#e5e5e5", sidebar: "#0e0e0e", accent: "#222222" },

  // Pastels
  { id: "blush",     name: "Blush",      background: "#0d0a0b", foreground: "#f5dde0", sidebar: "#120d0f", accent: "#2a1a1e" },
  { id: "lavender",  name: "Lavender",   background: "#0c0a10", foreground: "#e0d4f0", sidebar: "#100d15", accent: "#221a30" },
  { id: "mint",      name: "Mint",       background: "#080d0b", foreground: "#d0f0e0", sidebar: "#0b100e", accent: "#162820" },
  { id: "peach",     name: "Peach",      background: "#100b08", foreground: "#f5e0d0", sidebar: "#140e0a", accent: "#2e2018" },
  { id: "sky",       name: "Sky",        background: "#080b10", foreground: "#d0e5f5", sidebar: "#0a0d14", accent: "#18222e" },
  { id: "cream",     name: "Cream",      background: "#0f0d08", foreground: "#f5f0d0", sidebar: "#13100b", accent: "#2e2a18" },
  { id: "rose",      name: "Rose",       background: "#100810", foreground: "#f0d0e8", sidebar: "#140b14", accent: "#2e1828" },
  { id: "sage",      name: "Sage",       background: "#0a0d0a", foreground: "#d5e8d5", sidebar: "#0d100d", accent: "#1e2a1e" },
];

export const DEFAULT_THEME_ID = "black";

export function getThemeById(id: string): ColorTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
