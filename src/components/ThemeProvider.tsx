"use client";

import { useEffect } from "react";
import { getThemeById } from "@/lib/themes";

interface Props {
  themeId: string;
  children: React.ReactNode;
}

export default function ThemeProvider({ themeId, children }: Props) {
  useEffect(() => {
    const theme = getThemeById(themeId);
    const root = document.documentElement;
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--foreground", theme.foreground);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-dark", theme.accentDark);
    document.body.style.background = theme.background;
    document.body.style.color = theme.foreground;
  }, [themeId]);

  return <>{children}</>;
}
