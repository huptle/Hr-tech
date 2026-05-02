import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Tech · Recruitment pipeline",
  description:
    "Voice screening, candidate ranking, interview scheduling, and notifications.",
};

/**
 * Inline script that runs before React hydrates — reads the stored theme from
 * localStorage and sets data-theme on <html> to prevent flash of wrong theme.
 */
function ThemeInitScript() {
  const script = `
    (function() {
      try {
        var t = localStorage.getItem('theme');
        if (t === 'light' || t === 'dark') {
          document.documentElement.setAttribute('data-theme', t);
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="flex min-h-full flex-col bg-background text-text-primary">
        <AppNav />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
