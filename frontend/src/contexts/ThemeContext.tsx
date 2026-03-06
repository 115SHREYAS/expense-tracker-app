/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    return (stored as Theme) || "system";
  });

  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light") return "light";
    if (stored === "dark") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  useEffect(() => {
    const apply = () => {
      let effective: "light" | "dark";
      if (theme === "system") {
        effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        effective = theme;
      }
      setResolved(effective);
      document.documentElement.classList.toggle("dark", effective === "dark");
    };

    apply();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") apply(); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
