import type { ReactNode } from "react";

export interface PortfolioPhase {
  num: string;
  cls?: string;
  title: string;
  sub: string;
  decisions: { t: string; p: string }[];
}

interface Props {
  phases: PortfolioPhase[];
  openPhases: Set<number>;
  onToggle: (index: number) => void;
}

export function PortfolioPhases({ phases, openPhases, onToggle }: Props) {
  return (
    <div className="phases">
      {phases.map((phase, index) => (
        <div
          key={phase.num}
          className={`phase${openPhases.has(index) ? " open" : ""}`}
        >
          <button
            type="button"
            className="phase-header"
            onClick={() => onToggle(index)}
            aria-expanded={openPhases.has(index)}
          >
            <div className={`phase-num${phase.cls ? ` ${phase.cls}` : ""}`}>
              {phase.num}
            </div>
            <div>
              <div className="phase-title">{phase.title}</div>
              <div className="phase-sub">{phase.sub}</div>
            </div>
          </button>
          <div className="phase-body">
            <div className="decision-grid">
              {phase.decisions.map((decision) => (
                <div key={decision.t} className="decision">
                  <div className="decision-title">{decision.t}</div>
                  <p>{decision.p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PortfolioConceptTabs<T extends string>({
  tabs,
  activeTab,
  onSelect,
  children,
}: {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onSelect: (id: T) => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="notiq-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`notiq-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="notiq-panel active portfolio-concept-panel">{children}</div>
    </>
  );
}

export function PortfolioCommTable({
  rows,
}: {
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="table-scroll-wide">
      <table className="comm-table">
        <thead>
          <tr>
            <th>call</th>
            <th>protocol</th>
            <th>pattern</th>
            <th>failure handling</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([call, proto, cls, pattern, failure]) => (
            <tr key={call}>
              <td>{call}</td>
              <td>
                <span className={cls ? `tag-${cls}` : undefined}>{proto}</span>
              </td>
              <td>{pattern}</td>
              <td>{failure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortfolioServiceGrid({
  services,
}: {
  services: {
    name: string;
    cls: string;
    owns: string;
    tags: string[];
    desc: string;
  }[];
}) {
  return (
    <div className="service-grid">
      {services.map((service) => (
        <div key={service.name} className={`svc-card ${service.cls}`}>
          <div className="svc-name">{service.name}</div>
          <div className="svc-owns">{service.owns}</div>
          <div className="svc-tags">
            {service.tags.map((tag) => (
              <span key={tag} className="svc-tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="svc-details">{service.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function PortfolioCoverageGrid({
  items,
}: {
  items: { svc: string; impl: string }[];
}) {
  return (
    <div className="coverage-grid">
      {items.map((item) => (
        <div key={item.svc} className="cov-item">
          <div className="cov-service">{item.svc}</div>
          <div className="cov-impl">{item.impl}</div>
        </div>
      ))}
    </div>
  );
}

export function PortfolioStackGrid({
  items,
}: {
  items: { crate: string; role: string }[];
}) {
  return (
    <div className="stack-grid">
      {items.map((item) => (
        <div key={item.crate} className="stack-item">
          <div className="stack-crate">{item.crate}</div>
          <div className="stack-role">{item.role}</div>
        </div>
      ))}
    </div>
  );
}

export function PortfolioSignals({
  items,
}: {
  items: { tag: string; cls: string; text: string }[];
}) {
  return (
    <div className="signal-list">
      {items.map((item) => (
        <div key={`${item.tag}-${item.text.slice(0, 24)}`} className="signal-item">
          <span className={`signal-tag ${item.cls}`}>{item.tag}</span>
          <div className="signal-text">{item.text}</div>
        </div>
      ))}
    </div>
  );
}

export function PortfolioConceptGrid({
  concepts,
}: {
  concepts: { domain: string; name: string; desc: string }[];
}) {
  return (
    <div className="concept-grid">
      {concepts.map((concept) => (
        <div key={concept.name} className="concept-card">
          <span className={`concept-domain ${concept.domain}`}>{concept.domain}</span>
          <div className="concept-name">{concept.name}</div>
          <div className="concept-desc">{concept.desc}</div>
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";

export function PortfolioFooterLinks({
  links,
}: {
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div className="portfolio-footer-links">
      {links.map((link) =>
        link.external ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            {link.label}
          </a>
        ) : (
          <Link key={link.href} href={link.href} className="btn">
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
}
