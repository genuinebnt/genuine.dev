import "../styles/globals.scss";
import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import CommandPalette from "../components/CommandPalette";

export const metadata: Metadata = {
  title: "genuine·folio",
  description: "Writing on Rust, systems, and security.",
};

// Defines the theme/accent controls + applies the saved theme before first paint.
const THEME_JS = `function __a(h,a){var n=parseInt(h.slice(1),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'}function __setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('theme',t)}catch(e){}}function __setAccent(h){var d=document.documentElement;d.style.setProperty('--acc',h);d.style.setProperty('--acc-bg',__a(h,0.08));d.style.setProperty('--acc-border',__a(h,0.25));try{localStorage.setItem('accent',h)}catch(e){}}function __resetAccent(){var d=document.documentElement;d.style.removeProperty('--acc');d.style.removeProperty('--acc-bg');d.style.removeProperty('--acc-border');try{localStorage.removeItem('accent')}catch(e){}}(function(){try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);var ac=localStorage.getItem('accent');if(ac)__setAccent(ac)}catch(e){}})();`;

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
        <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
      </head>
      <body>
        <Nav />
        <main className="shell page">{children}</main>
        <Footer />
        <CommandPalette />
      </body>
    </html>
  );
}
