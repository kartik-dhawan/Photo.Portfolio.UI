"use client";

import { THEMES, ColorTheme } from "@/lib/themes";

interface Props {
  value: string;
  onChange: (themeId: string) => void;
}

function ThemeCircle({ theme, selected }: { theme: ColorTheme; selected: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
        selected ? "border-white scale-110" : "border-zinc-700 hover:border-zinc-500"
      }`}
      title={theme.name}
    >
      <div className="w-full h-full flex">
        <div className="w-1/2 h-full" style={{ backgroundColor: theme.sidebar }} />
        <div className="w-1/2 h-full" style={{ backgroundColor: theme.accent }} />
      </div>
    </div>
  );
}

export default function ThemePicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
        Color Theme
      </span>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((theme) => (
          <div key={theme.id} onClick={() => onChange(theme.id)}>
            <ThemeCircle theme={theme} selected={value === theme.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
