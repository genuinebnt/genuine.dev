import Script from "next/script";
import { themeBootScript } from "../lib/theme";

/** Blocking theme boot — must run before first paint (no flash). */
export default function ThemeBootScript() {
  return (
    <Script
      id="theme-boot"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: themeBootScript() }}
    />
  );
}
