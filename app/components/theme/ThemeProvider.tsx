"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

type Props = ThemeProviderProps & {
  nonce?: string;
};

export default function ThemeProvider({ children, nonce, ...props }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
