import Subscribe from "./Subscribe";

export default function Footer() {
  return (
    <footer className="footer">
      <Subscribe />
      <div className="footer-inner">
        <span>© 2026 genuine·folio</span>
        <a href="/feed.xml">RSS</a>
        <div className="nav-spacer" />
        <span>built with Rust · Next.js</span>
      </div>
    </footer>
  );
}
