import type { ReactNode } from "react";
import { PORTFOLIO_RAINBOW } from "../../lib/projects";
import { ReadingProgress } from "../ReadingProgress";

interface Pill {
  label: string;
  value: string;
}

interface Props {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  pills: Pill[];
}

export function PortfolioHero({ eyebrow, title, lead, pills }: Props) {
  return (
    <header className="portfolio-hero">
      <div className="now-eyebrow">{eyebrow}</div>
      <h1 className="portfolio-title">{title}</h1>
      <p className="portfolio-lead">{lead}</p>
      <div className="portfolio-meta">
        {pills.map(({ label, value }) => (
          <span key={label} className="portfolio-pill">
            <strong>{label}</strong> {value}
          </span>
        ))}
      </div>
    </header>
  );
}

export function PortfolioRainbow({
  colors = PORTFOLIO_RAINBOW,
}: {
  colors?: readonly string[];
}) {
  return (
    <div className="divider5 portfolio-rainbow">
      {colors.map((color) => (
        <div key={color} style={{ background: color }} />
      ))}
    </div>
  );
}

export function PortfolioSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="portfolio-section">
      <div className="section-label">{label}</div>
      {children}
    </section>
  );
}

/** Long-form portfolio case studies — window scroll + reading progress bar. */
export function PortfolioPageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ReadingProgress targetId="reading-target" />
      <div id="reading-target" className="portfolio-page">
        {children}
      </div>
    </>
  );
}
