"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={
        typeof window === "undefined"
          ? undefined
          : ({ type: "application/json" } as const)
      }
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
