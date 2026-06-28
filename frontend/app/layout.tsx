import "../styles/globals.scss";
import type { Metadata } from "next";
import Script from "next/script";
import Nav from "../components/Nav";
import AppChrome from "../components/AppChrome";
import CommandPalette from "../components/CommandPalette";
import ThemeRoute from "../components/ThemeRoute";
import { themeBootScript } from "../lib/theme";

export const metadata: Metadata = {
  title: "genuine.dev",
  description: "Writing on Rust, systems, and security.",
};

// Applies saved site theme + per-page overrides before first paint.
const THEME_JS = themeBootScript();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_JS }}
        />
        <ThemeRoute />
        <Nav />
        <AppChrome>{children}</AppChrome>
        <CommandPalette />
      </body>
    </html>
  );
}
