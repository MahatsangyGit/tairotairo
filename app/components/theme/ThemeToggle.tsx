"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const isDark =
      resolvedTheme === "dark" ||
      document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-4xl border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={toggleTheme}
        aria-label="Changer le thème"
      >
        <Sun className="size-4 opacity-0" aria-hidden />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-4xl border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      <Sun className="size-4 dark:hidden" aria-hidden />
      <Moon className="size-4 hidden dark:block" aria-hidden />
    </button>
  );
}
