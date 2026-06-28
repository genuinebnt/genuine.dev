"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "../lib/auth";
import NavPolybar from "./NavPolybar";
import { TypewriterBrand } from "./TypewriterBrand";

export default function Nav() {
  const path = usePathname();
  const onArticles = path.startsWith("/blog");
  const onProjects = path.startsWith("/projects");
  const onAbout = path.startsWith("/about") || path === "/now" || path === "/uses";
  const onAdmin = path.startsWith("/admin");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const sync = () => setIsAdmin(!!getToken());
    sync();
    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [path]);

  return (
    <header className="nav">
      <nav className="nav-inner">
        <Link className="logo" href="/" aria-label="genuine.dev home">
          <TypewriterBrand />
        </Link>
        <div className="nav-links">
          <Link className={`npill${onArticles ? " active" : ""}`} href="/blog">
            Articles
          </Link>
          <Link className={`npill${onProjects ? " active" : ""}`} href="/projects">
            Projects
          </Link>
          <Link className={`npill${onAbout ? " active" : ""}`} href="/about">
            About
          </Link>
          {isAdmin && (
            <Link className={`npill admin${onAdmin ? " active" : ""}`} href="/admin">
              Admin ✦
            </Link>
          )}
        </div>
        <div className="nav-spacer" />
        <NavPolybar />
      </nav>
    </header>
  );
}
