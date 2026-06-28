import Subscribe from "./Subscribe";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Subscribe />
        <div className="footer-meta">
          <div className="footer-meta-left">
            <span>© 2026 genuine·folio</span>
            <a href="/feed.xml">RSS</a>
          </div>
          <span className="footer-meta-right">built with Rust · Next.js</span>
        </div>
      </div>
    </footer>
  );
}
