"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemePicker from "./ThemePicker";

export default function Nav() {
  const path = usePathname();
  const onWriting = path === "/" || path.startsWith("/blog");

  return (
    <header className="nav">
      <nav className="nav-inner">
        <Link className="logo" href="/">
          genuine<span>·</span>folio
        </Link>
        <div className="nav-links">
          <Link className={`npill${onWriting ? " active" : ""}`} href="/">
            Writing
          </Link>
          <Link
            className={`npill${path.startsWith("/projects") ? " active" : ""}`}
            href="/projects"
          >
            Projects
          </Link>
          <Link
            className={`npill${path.startsWith("/about") ? " active" : ""}`}
            href="/about"
          >
            About
          </Link>
        </div>
        <div className="nav-spacer" />
        <ThemePicker />
      </nav>
    </header>
  );
}
