"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode, useEffect } from "react";
import { useAppStore } from "@/lib/store";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  useEffect(() => {
    if (theme === "BlueElectra") {
      document.documentElement.setAttribute("theme", "BlueElectra");
      document.documentElement.classList.add("dark");
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.removeAttribute("theme");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.removeAttribute("theme");
    }
  }, [theme]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark", "system"]}
    >
      {children}
    </NextThemesProvider>
  );
}
