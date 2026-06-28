import "../styles/globals.scss";
import type { Metadata } from "next";
import Nav from "../components/Nav";
import AppChrome from "../components/AppChrome";
import CommandPalette from "../components/CommandPalette";
import ThemeRoute from "../components/ThemeRoute";
import ThemeBootScript from "../components/ThemeBootScript";
import SiteEnhancements from "../components/SiteEnhancements";
import KeyboardShortcuts from "../components/KeyboardShortcuts";

export const metadata: Metadata = {
  title: "genuine.dev",
  description: "Writing on Rust, systems, and security.",
};

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
        <ThemeBootScript />
        <ThemeRoute />
        <SiteEnhancements />
        <Nav />
        <AppChrome>{children}</AppChrome>
        <CommandPalette />
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
