import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { MessagingRealtimeProvider } from "@/components/messages/MessagingRealtimeProvider";
import { BRAND_PRIMARY, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { cn } from "@/lib/utils";

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Trouvez un prestataire de confiance ou publiez votre demande de service à Madagascar.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    locale: "fr_MG",
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: BRAND_PRIMARY,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", notoSans.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <MessagingRealtimeProvider>{children}</MessagingRealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
