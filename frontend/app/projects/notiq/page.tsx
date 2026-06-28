"use client";

import { useState } from "react";
import { usePhaseAccordion } from "../../../hooks/usePhaseAccordion";
import {
  PortfolioHero,
  PortfolioPageShell,
  PortfolioRainbow,
  PortfolioSection,
} from "../../../components/portfolio/PortfolioLayout";
import {
  PortfolioCommTable,
  PortfolioConceptGrid,
  PortfolioConceptTabs,
  PortfolioCoverageGrid,
  PortfolioPhases,
  PortfolioServiceGrid,
  PortfolioSignals,
  PortfolioStackGrid,
} from "../../../components/portfolio/PortfolioBlocks";

// ── Architecture SVG ─────────────────────────────────────────────────────────
function ArchSvg() {
  return (
    <svg width="100%" viewBox="0 0 960 648" role="img" style={{ display: "block" }}>
      <title>NotiQ microservices architecture</title>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <rect x="400" y="16" width="160" height="34" rx="6" fill="#1a1e25" stroke="#2e3540" strokeWidth="0.5" />
      <text x="480" y="33" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fill="#60a5fa">Client</text>
      <line x1="480" y1="50" x2="480" y2="78" stroke="#3a4050" strokeWidth="1" markerEnd="url(#arr)" />
      <text x="494" y="68" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">HTTPS</text>
      <text x="480" y="92" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050" letterSpacing="0.1em">PUBLIC</text>
      <rect x="20" y="100" width="920" height="64" rx="8" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="36" y="112" width="148" height="40" rx="6" fill="#13161b" stroke="#2e3540" strokeWidth="0.5" />
      <text x="110" y="123" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="11" fill="#6b7280">Route 53 · ALB</text>
      <text x="110" y="141" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">ACM TLS</text>
      <line x1="184" y1="132" x2="208" y2="132" stroke="#3a4050" strokeWidth="1" markerEnd="url(#arr)" />
      <rect x="210" y="108" width="710" height="48" rx="6" fill="rgba(96,165,250,0.07)" stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
      <text x="565" y="123" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="13" fontWeight="500" fill="#60a5fa">gateway-svc</text>
      <text x="565" y="141" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">auth · rate limit · circuit breaker · tenant routing</text>
      <line x1="480" y1="164" x2="480" y2="188" stroke="#3a4050" strokeWidth="1" markerEnd="url(#arr)" />
      <text x="494" y="180" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">gRPC</text>
      <text x="480" y="202" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050" letterSpacing="0.1em">WRITE PATH</text>
      <rect x="20" y="210" width="920" height="56" rx="8" fill="none" stroke="#1a3a2a" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="36" y="220" width="220" height="36" rx="6" fill="rgba(0,212,164,0.07)" stroke="rgba(0,212,164,0.22)" strokeWidth="1" />
      <text x="146" y="229" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#00d4a4">enqueue-svc</text>
      <text x="146" y="247" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">outbox · Bloom filter · idempotency</text>
      <line x1="256" y1="238" x2="280" y2="238" stroke="#3a4050" strokeWidth="1" markerEnd="url(#arr)" />
      <rect x="282" y="220" width="638" height="36" rx="6" fill="#13161b" stroke="#2e3540" strokeWidth="0.5" />
      <text x="601" y="229" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fill="#e2e6ee">Postgres</text>
      <text x="601" y="247" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">jobs · outbox · job_events · delivery_log · dead_letter</text>
      <line x1="480" y1="266" x2="480" y2="292" stroke="#3a4050" strokeWidth="1" markerEnd="url(#arr)" />
      <text x="494" y="283" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">LISTEN/NOTIFY · SKIP LOCKED</text>
      <text x="480" y="307" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050" letterSpacing="0.1em">WORKER TIER</text>
      <rect x="20" y="314" width="920" height="90" rx="8" fill="none" stroke="#1a3a2a" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="36" y="326" width="252" height="40" rx="6" fill="rgba(52,211,153,0.07)" stroke="rgba(52,211,153,0.25)" strokeWidth="1" />
      <text x="162" y="337" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#34d399">worker-svc [N]</text>
      <text x="162" y="355" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">consistent hash · gossip · lock-free MPSC</text>
      <text x="162" y="382" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">↔ UDP gossip between instances</text>
      <line x1="288" y1="346" x2="312" y2="346" stroke="#3a4050" strokeWidth="1" markerEnd="url(#arr)" />
      <text x="300" y="338" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">gRPC</text>
      <rect x="314" y="326" width="194" height="40" rx="6" fill="rgba(167,139,250,0.07)" stroke="rgba(167,139,250,0.25)" strokeWidth="1" />
      <text x="411" y="337" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="11" fontWeight="500" fill="#a78bfa">delivery-email</text>
      <text x="411" y="355" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">SES · retry · bulkhead</text>
      <rect x="521" y="326" width="194" height="40" rx="6" fill="rgba(167,139,250,0.07)" stroke="rgba(167,139,250,0.25)" strokeWidth="1" />
      <text x="618" y="337" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="11" fontWeight="500" fill="#a78bfa">delivery-sms</text>
      <text x="618" y="355" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">Twilio · retry · bulkhead</text>
      <rect x="728" y="326" width="192" height="40" rx="6" fill="rgba(167,139,250,0.07)" stroke="rgba(167,139,250,0.25)" strokeWidth="1" />
      <text x="824" y="337" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="11" fontWeight="500" fill="#a78bfa">delivery-webhook</text>
      <text x="824" y="355" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">HMAC · retry · bulkhead</text>
      <line x1="480" y1="404" x2="480" y2="418" stroke="#3a4050" strokeWidth="1" markerEnd="url(#arr)" />
      <text x="494" y="415" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">gRPC</text>
      <rect x="20" y="438" width="470" height="46" rx="8" fill="rgba(245,158,11,0.07)" stroke="rgba(245,158,11,0.25)" strokeWidth="1" />
      <text x="255" y="452" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#f59e0b">scheduler-svc</text>
      <text x="255" y="470" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">min-heap · cron · delayed jobs · saga orchestration</text>
      <rect x="500" y="438" width="440" height="46" rx="8" fill="rgba(232,121,249,0.07)" stroke="rgba(232,121,249,0.25)" strokeWidth="1" />
      <text x="720" y="452" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#e879f9">admin-svc</text>
      <text x="720" y="470" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">CQRS read model · tenant ops · dead-letter</text>
      <text x="480" y="498" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050" letterSpacing="0.1em">CROSS-CUTTING</text>
      <rect x="20" y="506" width="920" height="122" rx="8" fill="#13161b" stroke="#232830" strokeWidth="0.5" />
      {[
        { x: 36, label: "Redis", sub1: "rate limit", sub2: "idempotency · registry" },
        { x: 214, label: "S3", sub1: "payloads · audit log", sub2: "pg_dump backups" },
        { x: 392, label: "OpenTelemetry", sub1: "traces · metrics", sub2: "→ CloudWatch" },
        { x: 570, label: "Secrets Manager", sub1: "creds · API keys", sub2: "tokens" },
        { x: 748, label: "KMS", sub1: "RDS + S3", sub2: "at-rest enc." },
      ].map((b) => (
        <g key={b.x}>
          <rect x={b.x} y="520" width="168" height="94" rx="6" fill="#1a1e25" stroke="#2e3540" strokeWidth="0.5" />
          <text x={b.x + 84} y="549" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="11" fill="#e2e6ee">{b.label}</text>
          <text x={b.x + 84} y="567" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">{b.sub1}</text>
          <text x={b.x + 84} y="585" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">{b.sub2}</text>
        </g>
      ))}
    </svg>
  );
}

// ── ERD SVG ───────────────────────────────────────────────────────────────────
function ErdSvg() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px", overflowX: "auto" }}>
      <svg width="100%" viewBox="0 0 940 640" style={{ display: "block", minWidth: "700px" }}>
        {/* tenants */}
        <g>
          <rect x="20" y="20" width="200" height="178" rx="6" fill="#1a1e25" stroke="rgba(0,212,164,0.35)" strokeWidth="1.5" />
          <rect x="20" y="20" width="200" height="30" rx="6" fill="rgba(0,212,164,0.12)" stroke="rgba(0,212,164,0.35)" strokeWidth="1.5" />
          <rect x="20" y="43" width="200" height="7" rx="0" fill="rgba(0,212,164,0.12)" stroke="none" />
          <text x="120" y="40" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#00d4a4">tenants</text>
          <line x1="20" y1="50" x2="220" y2="50" stroke="rgba(0,212,164,0.2)" strokeWidth="0.5" />
          {[["id","uuid PK","#f59e0b"],["name","text","#3a4050"],["api_key_hash","text","#3a4050"],["rate_limit_rps","int","#3a4050"],["schema","text","#3a4050"],["created_at","timestamptz","#3a4050"]].map(([k,v,c],i)=>(
            <g key={k}><text x="36" y={68+i*20} fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">{k}</text><text x="184" y={68+i*20} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill={c}>{v}</text></g>
          ))}
          <line x1="20" y1="178" x2="220" y2="178" stroke="#232830" strokeWidth="0.5" />
          <text x="36" y="193" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">enqueue schema</text>
        </g>
        {/* jobs */}
        <g>
          <rect x="260" y="20" width="220" height="258" rx="6" fill="#1a1e25" stroke="rgba(0,212,164,0.35)" strokeWidth="1.5" />
          <rect x="260" y="20" width="220" height="30" rx="6" fill="rgba(0,212,164,0.12)" stroke="rgba(0,212,164,0.35)" strokeWidth="1.5" />
          <text x="370" y="40" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#00d4a4">jobs</text>
          <line x1="260" y1="50" x2="480" y2="50" stroke="rgba(0,212,164,0.2)" strokeWidth="0.5" />
          {[["id","uuid PK","#f59e0b"],["tenant_id","uuid FK","#60a5fa"],["status","text","#3a4050"],["priority","smallint","#3a4050"],["payload","jsonb","#3a4050"],["payload_s3_key","text?","#3a4050"],["idempotency_key","text","#3a4050"],["attempts","int","#3a4050"],["run_at","timestamptz","#3a4050"],["created_at","timestamptz","#3a4050"]].map(([k,v,c],i)=>(
            <g key={k}><text x="276" y={68+i*20} fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">{k}</text><text x="464" y={68+i*20} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill={c}>{v}</text></g>
          ))}
          <line x1="260" y1="258" x2="480" y2="258" stroke="#232830" strokeWidth="0.5" />
          <text x="276" y="272" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">enqueue schema</text>
        </g>
        {/* job_events */}
        <g>
          <rect x="540" y="20" width="200" height="198" rx="6" fill="#1a1e25" stroke="rgba(96,165,250,0.35)" strokeWidth="1.5" />
          <rect x="540" y="20" width="200" height="30" rx="6" fill="rgba(96,165,250,0.1)" stroke="rgba(96,165,250,0.35)" strokeWidth="1.5" />
          <text x="640" y="40" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#60a5fa">job_events</text>
          <line x1="540" y1="50" x2="740" y2="50" stroke="rgba(96,165,250,0.2)" strokeWidth="0.5" />
          {[["id","bigserial PK","#f59e0b"],["job_id","uuid FK","#60a5fa"],["event","text","#3a4050"],["worker_id","text","#3a4050"],["detail","jsonb","#3a4050"],["created_at","timestamptz","#3a4050"]].map(([k,v,c],i)=>(
            <g key={k}><text x="556" y={68+i*20} fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">{k}</text><text x="724" y={68+i*20} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill={c}>{v}</text></g>
          ))}
          <line x1="540" y1="178" x2="740" y2="178" stroke="#232830" strokeWidth="0.5" />
          <text x="556" y="193" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">enqueue schema</text>
        </g>
        {/* outbox */}
        <g>
          <rect x="760" y="20" width="160" height="158" rx="6" fill="#1a1e25" stroke="rgba(96,165,250,0.35)" strokeWidth="1.5" />
          <rect x="760" y="20" width="160" height="30" rx="6" fill="rgba(96,165,250,0.1)" stroke="rgba(96,165,250,0.35)" strokeWidth="1.5" />
          <text x="840" y="40" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#60a5fa">outbox</text>
          <line x1="760" y1="50" x2="920" y2="50" stroke="rgba(96,165,250,0.2)" strokeWidth="0.5" />
          {[["id","uuid PK","#f59e0b"],["job_id","uuid FK","#60a5fa"],["payload","text","#3a4050"],["processed","bool","#3a4050"],["created_at","timestamptz","#3a4050"]].map(([k,v,c],i)=>(
            <g key={k}><text x="776" y={68+i*20} fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">{k}</text><text x="904" y={68+i*20} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill={c}>{v}</text></g>
          ))}
          <line x1="760" y1="158" x2="920" y2="158" stroke="#232830" strokeWidth="0.5" />
          <text x="776" y="173" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">enqueue schema</text>
        </g>
        {/* notifications */}
        <g>
          <rect x="20" y="360" width="220" height="218" rx="6" fill="#1a1e25" stroke="rgba(167,139,250,0.35)" strokeWidth="1.5" />
          <rect x="20" y="360" width="220" height="30" rx="6" fill="rgba(167,139,250,0.1)" stroke="rgba(167,139,250,0.35)" strokeWidth="1.5" />
          <text x="130" y="380" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#a78bfa">notifications</text>
          <line x1="20" y1="390" x2="240" y2="390" stroke="rgba(167,139,250,0.2)" strokeWidth="0.5" />
          {[["id","uuid PK","#f59e0b"],["tenant_id","uuid FK","#60a5fa"],["recipient_id","text","#3a4050"],["seq","bigint","#3a4050"],["channels","text[]","#3a4050"],["template","text","#3a4050"],["vars","jsonb","#3a4050"],["created_at","timestamptz","#3a4050"]].map(([k,v,c],i)=>(
            <g key={k}><text x="36" y={408+i*20} fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">{k}</text><text x="224" y={408+i*20} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill={c}>{v}</text></g>
          ))}
          <line x1="20" y1="558" x2="240" y2="558" stroke="#232830" strokeWidth="0.5" />
          <text x="36" y="573" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">worker schema</text>
        </g>
        {/* delivery_log */}
        <g>
          <rect x="300" y="360" width="220" height="218" rx="6" fill="#1a1e25" stroke="rgba(167,139,250,0.35)" strokeWidth="1.5" />
          <rect x="300" y="360" width="220" height="30" rx="6" fill="rgba(167,139,250,0.1)" stroke="rgba(167,139,250,0.35)" strokeWidth="1.5" />
          <text x="410" y="380" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#a78bfa">delivery_log</text>
          <line x1="300" y1="390" x2="520" y2="390" stroke="rgba(167,139,250,0.2)" strokeWidth="0.5" />
          {[["id","bigserial PK","#f59e0b"],["notification_id","uuid FK","#60a5fa"],["channel","text","#3a4050"],["status","text","#3a4050"],["attempt","int","#3a4050"],["latency_ms","int","#3a4050"],["error","text?","#3a4050"],["created_at","timestamptz","#3a4050"]].map(([k,v,c],i)=>(
            <g key={k}><text x="316" y={408+i*20} fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">{k}</text><text x="504" y={408+i*20} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill={c}>{v}</text></g>
          ))}
          <line x1="300" y1="558" x2="520" y2="558" stroke="#232830" strokeWidth="0.5" />
          <text x="316" y="573" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">admin schema</text>
        </g>
        {/* dead_letter */}
        <g>
          <rect x="580" y="360" width="200" height="198" rx="6" fill="#1a1e25" stroke="rgba(58,64,80,0.8)" strokeWidth="1.5" />
          <rect x="580" y="360" width="200" height="30" rx="6" fill="rgba(58,64,80,0.3)" stroke="rgba(58,64,80,0.8)" strokeWidth="1.5" />
          <text x="680" y="380" textAnchor="middle" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#9ca3af">dead_letter</text>
          <line x1="580" y1="390" x2="780" y2="390" stroke="rgba(58,64,80,0.5)" strokeWidth="0.5" />
          {[["id","uuid PK","#f59e0b"],["original_job_id","uuid","#3a4050"],["tenant_id","uuid FK","#60a5fa"],["last_error","text","#3a4050"],["payload","jsonb","#3a4050"],["failed_at","timestamptz","#3a4050"]].map(([k,v,c],i)=>(
            <g key={k}><text x="596" y={408+i*20} fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">{k}</text><text x="764" y={408+i*20} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill={c}>{v}</text></g>
          ))}
          <line x1="580" y1="518" x2="780" y2="518" stroke="#232830" strokeWidth="0.5" />
          <text x="596" y="533" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">admin schema</text>
        </g>
        {/* relationships */}
        <line x1="220" y1="88" x2="260" y2="88" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="120" y1="198" x2="120" y2="340" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="120" y1="340" x2="130" y2="340" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="130" y1="340" x2="130" y2="360" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="480" y1="88" x2="540" y2="88" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="480" y1="128" x2="520" y2="128" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="520" y1="128" x2="520" y2="70" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="520" y1="70" x2="760" y2="70" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="240" y1="428" x2="300" y2="428" stroke="#3a4050" strokeWidth="1" strokeDasharray="4 3" />
        <text x="240" y="84" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">1:N</text>
        <text x="490" y="84" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">1:N</text>
        <text x="244" y="428" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">1:N</text>
        {/* legend */}
        <rect x="20" y="608" width="8" height="8" rx="2" fill="rgba(0,212,164,0.5)" />
        <text x="32" y="616" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">enqueue schema</text>
        <rect x="150" y="608" width="8" height="8" rx="2" fill="rgba(96,165,250,0.5)" />
        <text x="162" y="616" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">worker / event schema</text>
        <rect x="320" y="608" width="8" height="8" rx="2" fill="rgba(167,139,250,0.5)" />
        <text x="332" y="616" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">admin schema</text>
        <text x="600" y="616" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#f59e0b">PK</text>
        <text x="624" y="616" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">·</text>
        <text x="632" y="616" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#60a5fa">FK</text>
        <text x="652" y="616" dominantBaseline="central" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">· --- relation</text>
      </svg>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const SERVICES = [
  { cls: "gateway", name: "gateway-svc", owns: "owns: auth, routing, tenant resolution", tags: ["API Gateway pattern", "circuit breaker", "token bucket", "mTLS"], desc: "Single public entry point. JWT validation, per-tenant rate limiting via atomic Lua scripts in Redis, and downstream routing via gRPC. Circuit breaker implemented as a custom Tower::Layer — trips on error rate threshold, half-opens to probe recovery." },
  { cls: "queue", name: "enqueue-svc", owns: "owns: job ingestion, outbox, idempotency", tags: ["outbox pattern", "Bloom filter", "SKIP LOCKED", "event sourcing"], desc: "Writes job + outbox row in a single transaction — no dual-write risk. Bloom filter pre-screens idempotency keys before the Redis round-trip, cutting ~80% of duplicate checks. Job state is an append-only event log, never an overwritten status column." },
  { cls: "worker", name: "worker-svc", owns: "owns: dequeue, shard routing, fan-out", tags: ["consistent hashing", "SWIM gossip", "lock-free MPSC", "backpressure"], desc: "N instances, each a gossip node. A BTreeMap vnode ring routes notifications to shards — join/leave migrates only adjacent keys (~1/N). Lock-free MPSC channels connect the gossip, dequeue, and fan-out tasks inside each instance. No mutex on the hot path." },
  { cls: "delivery", name: "delivery-email", owns: "owns: SES delivery, email retry state", tags: ["bulkhead", "SES rate awareness", "decorrelated jitter"], desc: "Calls SES v2 with send-rate awareness — tracks quota consumption and signals backpressure upstream before hitting the SES throttle. A SES outage cannot starve SMS or webhook workers." },
  { cls: "delivery", name: "delivery-sms", owns: "owns: Twilio delivery, SMS retry state", tags: ["bulkhead", "per-tenant rate limit", "decorrelated jitter"], desc: "Twilio HTTP client with per-tenant send-rate limiting enforced via Redis token bucket. Retry uses decorrelated jitter across both transient network errors and Twilio 429s." },
  { cls: "delivery", name: "delivery-webhook", owns: "owns: HTTP delivery, HMAC signing", tags: ["bulkhead", "HMAC-SHA256", "strict timeout"], desc: "Outbound POST with HMAC-SHA256 payload signing. Retries on 5xx and network errors; 4xx goes straight to dead-letter." },
  { cls: "scheduler", name: "scheduler-svc", owns: "owns: cron, delayed jobs, saga orchestration", tags: ["min-heap", "saga", "distributed lock"], desc: "BinaryHeap over next_run_at — O(1) peek, O(log N) insert. Postgres advisory lock ensures only one replica fires a given job across a scaled deployment." },
  { cls: "admin-s", name: "admin-svc", owns: "owns: tenant ops, read model, dead-letter", tags: ["CQRS", "RDS read replica", "event replay"], desc: "Separate read path — queries delivery_log and job_events projections from the RDS read replica. Write commands go through enqueue-svc; reads never touch the primary." },
];

const PHASES = [
  { num: "01", cls: "", title: "Postgres as the queue broker", sub: "SKIP LOCKED · LISTEN/NOTIFY · outbox · event sourcing", decisions: [
    { t: "Why Postgres, and where it breaks", p: "A Postgres-native queue keeps job state transactional with the rest of the application. No external broker, no dual-write race, no new failure domain to operate. The honest tradeoffs: Postgres becomes the throughput ceiling at very high write rates, WAL amplification increases under heavy job churn." },
    { t: "SKIP LOCKED for concurrent dequeue", p: "Multiple workers claim different jobs from the same table with zero serialization conflicts — no advisory locks, no SELECT FOR UPDATE blocking. Rows locked by another transaction are skipped entirely." },
    { t: "LISTEN/NOTIFY for low-latency wake", p: "Workers sleep on a Postgres channel and wake on INSERT rather than polling on a fixed interval. The outbox CDC task guarantees at-least-once delivery regardless of whether the notification was received." },
    { t: "Event log, not status column", p: "Job state is an append-only sequence: Enqueued → Claimed → Failed → Retried → Delivered. Current state is a projection over that log. Audit trail is free. Replay is exact." },
  ]},
  { num: "02", cls: "blue", title: "Distributed worker fleet", sub: "Consistent hashing · SWIM gossip · lock-free concurrency", decisions: [
    { t: "Consistent hashing for shard routing", p: "BTreeMap vnode ring over a 2³² token space. 150 virtual nodes per worker smooth load distribution. A node leaving migrates only the adjacent token range — ~1/N of total keys." },
    { t: "SWIM-lite for membership", p: "Direct ping → suspect on timeout → indirect ping via K random peers → dead on no ack. Epidemic broadcast piggybacks membership deltas on outgoing pings — O(log N) convergence without a central coordinator." },
    { t: "Lock-free MPSC between tasks", p: "crossbeam-channel connects the gossip task, dequeue task, and fan-out task inside each worker instance. No mutex on the hot path. AtomicU8 for node liveness state with Acquire/Release ordering." },
    { t: "Zero-copy payload fan-out", p: "Notification payloads are wrapped in bytes::Bytes. Fan-out to N delivery channels clones the Arc pointer, not the heap allocation. A criterion benchmark confirms zero extra heap allocations per channel." },
  ]},
  { num: "03", cls: "purple", title: "Reliability under failure", sub: "Bulkhead · circuit breaker · backpressure · chaos testing", decisions: [
    { t: "Three delivery services, not one", p: "Email, SMS, and webhook are separate ECS services with separate deployment pipelines and failure domains. A SES outage has zero effect on Twilio throughput." },
    { t: "End-to-end backpressure", p: "Each delivery service signals its capacity upstream when near saturation. worker-svc aggregates these signals and propagates upstream to enqueue-svc. Unbounded queues cause silent data loss." },
    { t: "Decorrelated jitter, not exponential", p: "Naive exponential backoff synchronizes retries across instances and causes thundering herd after mass failure. Decorrelated jitter keeps retry waves spread over time." },
    { t: "Chaos test suite", p: "A --chaos flag randomly kills workers mid-flight, delays acks, and injects network partitions. A test run audits the delivery_log and proves zero message loss." },
  ]},
  { num: "04", cls: "green", title: "Cloud infrastructure", sub: "ECS · RDS · Terraform · IAM · observability", decisions: [
    { t: "Everything in Terraform", p: "VPC with public/private subnet split, SGs as code, one ECS task definition per service, RDS multi-AZ + read replica, ElastiCache, Secrets Manager, KMS, Route 53, ACM. Nothing clicked in the console." },
    { t: "IRSA over static credentials", p: "Each ECS task assumes its own least-privilege IAM role. enqueue-svc can write to S3. delivery-email can call SES. No shared credentials, no static access keys." },
    { t: "Custom scaling metric", p: "ECS auto-scaling for worker-svc is driven by Postgres job queue depth — not CPU. CPU is the wrong signal; queue depth is what actually needs to scale against." },
    { t: "OpenTelemetry throughout", p: "Every service emits traces via tracing-opentelemetry. One trace ID spans gateway → enqueue → worker → delivery across gRPC boundaries via propagated context metadata." },
  ]},
  { num: "05", cls: "warn", title: "Service communication choices", sub: "gRPC · protobuf · per-service schema · UUID v7", decisions: [
    { t: "gRPC over REST for inter-service", p: "gRPC gives strongly-typed contracts via protobuf, generated client stubs, binary encoding (~3-10× smaller than JSON), and built-in streaming. Breaking changes caught at compile time." },
    { t: "Per-service Postgres schema", p: "Each service owns its tables under a named schema. No service queries another's tables directly — all cross-service reads go through gRPC." },
    { t: "UUID v7 for sortable IDs", p: "UUID v4 is random — index locality is poor. UUID v7 is time-ordered: new rows land at the end of the index, giving sequential write patterns and better insert throughput." },
    { t: "Tokio over async-std", p: "Tokio has the strongest ecosystem alignment: axum, tonic, sqlx, fred, and crossbeam all integrate directly. Ecosystem coherence matters more than runtime benchmarks at this scale." },
  ]},
];

type TabId = "micro" | "dist" | "sysdes" | "rust" | "perf" | "dsa";
const TABS: { id: TabId; label: string }[] = [
  { id: "micro", label: "Microservices" },
  { id: "dist", label: "Distributed systems" },
  { id: "sysdes", label: "System design" },
  { id: "rust", label: "Rust" },
  { id: "perf", label: "Performance" },
  { id: "dsa", label: "Algorithms" },
];

const CONCEPTS: Record<TabId, { domain: string; name: string; desc: string }[]> = {
  micro: [
    { domain: "micro", name: "Outbox pattern", desc: "enqueue-svc writes job + outbox row in one transaction. A CDC task reads the outbox and publishes to worker-svc. This decouples reliable message publishing from the write path without a distributed transaction." },
    { domain: "micro", name: "Saga — choreography vs orchestration", desc: "Delivery fan-out uses choreography: each step emits an event, compensation triggers on downstream failure. Multi-step flows use orchestration: an explicit state machine drives steps and runs compensation in reverse." },
    { domain: "micro", name: "Custom circuit breaker as Tower::Layer", desc: "Gateway-svc wraps downstream gRPC calls in a circuit breaker implemented as a Tower::Layer + Tower::Service. Closed → Open on error rate threshold, Open → Half-open after timeout, Half-open → Closed on probe success." },
    { domain: "micro", name: "CQRS — separate read and write models", desc: "Write commands flow through enqueue-svc to the Postgres primary. Read queries flow through admin-svc against the RDS read replica. Each model is optimized for its access pattern." },
    { domain: "micro", name: "Bulkhead isolation", desc: "Three delivery services — email, SMS, webhook — each with its own ECS task, deployment pipeline, connection pool, and retry budget. A SES quota breach is confined to its service." },
    { domain: "micro", name: "mTLS inter-service auth", desc: "All gRPC calls between services use mutual TLS. Certificates provisioned via ACM Private CA in Terraform. A compromised delivery service cannot impersonate gateway-svc or enqueue-svc." },
  ],
  dist: [
    { domain: "dist", name: "SWIM failure detection", desc: "Direct ping → timeout → indirect ping via K random peers → suspect → dead. Epidemic dissemination of membership deltas piggybacks on outgoing pings. Full cluster converges in O(log N) rounds." },
    { domain: "dist", name: "Consistent hashing with virtual nodes", desc: "BTreeMap over a 2³² token space. 150 virtual nodes per physical worker ensures even distribution. A node leaving migrates only adjacent keys — ~1/N of total keys." },
    { domain: "dist", name: "At-least-once delivery with idempotency", desc: "Jobs are retried on failure. A Bloom filter pre-screens idempotency keys before a Redis SET NX confirms deduplication. ~80% of duplicate checks never reach Redis." },
    { domain: "dist", name: "Partition-ordered delivery", desc: "Notifications carry a monotonically increasing sequence number scoped to (tenant_id, recipient_id). SKIP LOCKED on the sequence column ensures a recipient's notifications are always claimed in order." },
    { domain: "dist", name: "End-to-end backpressure", desc: "Delivery services signal saturation upstream via a backpressure flag in gRPC responses. worker-svc tracks this with an atomic queue depth counter and signals enqueue-svc to reject new jobs." },
    { domain: "dist", name: "Distributed lock via Postgres advisory", desc: "scheduler-svc acquires a Postgres advisory lock before firing a cron job. Only one instance fires regardless of replica count. Cheaper and more correct than Redlock for single-database deployments." },
  ],
  sysdes: [
    { domain: "sysdes", name: "Push + pull hybrid delivery", desc: "LISTEN/NOTIFY wakes workers with microsecond latency when a job is inserted. SKIP LOCKED handles the actual claim. Push gives low latency; pull gives correctness under failure." },
    { domain: "sysdes", name: "Atomic rate limiting in Redis", desc: "Token bucket and sliding window rate limiters are implemented as Lua scripts executed atomically in Redis. Two separate INCR + EXPIRE commands would introduce a race." },
    { domain: "sysdes", name: "Write fan-out with independent retry", desc: "One notification produces N channel jobs — one per delivery service. Each channel has its own retry budget and backpressure signal. A webhook timing out doesn't affect email delivery state." },
    { domain: "sysdes", name: "Multi-tenant isolation at row level", desc: "Every table carries a tenant_id column. Per-tenant rate limits and backpressure thresholds are configurable. One noisy tenant sending burst traffic cannot exhaust another's delivery capacity." },
    { domain: "sysdes", name: "Graceful degradation by design", desc: "Redis unavailability → rate limiter falls back to allow-all. SES outage → circuit trips, jobs accumulate in Postgres, delivery resumes on recovery. No single component failure causes data loss." },
    { domain: "sysdes", name: "Payload tiering to object storage", desc: "Notification payloads above a size threshold are written to S3 and referenced by key. Postgres stays fast for metadata queries; S3 handles bulk storage." },
  ],
  rust: [
    { domain: "rust", name: "Custom Tower middleware", desc: "Circuit breaker implemented as Tower::Layer + Tower::Service. Each state transition is modeled explicitly. Composable with other layers — auth, tracing, and circuit breaking chain without coupling." },
    { domain: "rust", name: "Compile-time SQL validation", desc: "sqlx::query! macros check every SQL query against the live database schema at compile time. Schema drift that would cause a runtime panic instead causes a compile error." },
    { domain: "rust", name: "Async stream composition with pin-project", desc: "The CDC outbox reader is implemented as a self-referential async stream using pin-project. tokio::select! multiplexes the gossip probe loop and the dequeue poll loop inside each worker task." },
    { domain: "rust", name: "Atomic memory ordering", desc: "AtomicU8 encodes node liveness. The gossip task writes with Release; the routing task reads with Acquire. SeqCst would be correct but imposes a global memory fence — unnecessary here." },
    { domain: "rust", name: "Graceful shutdown with CancellationToken", desc: "A tokio-util CancellationToken propagates through the task tree. Every task selects on the cancellation signal. On SIGTERM, in-flight jobs drain before the process exits." },
    { domain: "rust", name: "Workspace with shared proto library", desc: "Single Cargo workspace with 8 service crates and a notiq-common library. tonic + prost generate gRPC stubs from shared .proto files. All services share the same error types and tracing setup." },
  ],
  perf: [
    { domain: "perf", name: "Lock-free MPSC on the hot path", desc: "crossbeam-channel replaces a Mutex<VecDeque> between the gossip, dequeue, and fan-out tasks. Benchmarked under 10k rps: the lock-free path shows lower p99 latency and no contention spikes." },
    { domain: "perf", name: "Zero-copy payload fan-out", desc: "Notification payloads are held as bytes::Bytes — a reference-counted heap slice. Fanning out to 3 delivery channels clones the Arc pointer three times. No heap allocation per channel." },
    { domain: "perf", name: "Bloom filter to reduce Redis round-trips", desc: "A per-process Bloom filter pre-screens idempotency keys. In duplicate-heavy workloads, ~80% of Redis SET NX calls are skipped entirely." },
    { domain: "perf", name: "tokio-console for async profiling", desc: "tokio-console surfaces task wakeup latency, poll duration, and starvation. Used to find a slow webhook delivery task starving the dequeue loop." },
    { domain: "perf", name: "Atomic queue depth without contention", desc: "Queue depth is an Arc<AtomicUsize> incremented on enqueue and decremented on completion. The backpressure check is a single atomic load — never blocks on the hot path." },
    { domain: "perf", name: "Connection pool sizing per service", desc: "Each service has its own sqlx PgPool sized to its query pattern. enqueue-svc runs short write transactions and needs high concurrency; admin-svc runs long analytics queries and needs fewer connections." },
  ],
  dsa: [
    { domain: "dsa", name: "BTreeMap as consistent hash ring", desc: "BTreeMap<u32, WorkerId> maps token positions to worker instances. A clockwise successor lookup is a range() call — O(log N). 150 virtual nodes per worker inserted at startup by hashing the worker ID with different seeds." },
    { domain: "dsa", name: "Min-heap for deadline scheduling", desc: "std::collections::BinaryHeap with Reverse<Instant> holds pending jobs ordered by next_run_at. O(1) peek at the nearest deadline, O(log N) insert. The scheduler sleeps until the top entry's deadline." },
    { domain: "dsa", name: "Bloom filter for probabilistic dedup", desc: "A Bloom filter gives constant-time membership tests with zero false negatives. An idempotency key that has never been seen is guaranteed to pass. False positive rate is a tunable tradeoff." },
    { domain: "dsa", name: "Decorrelated jitter backoff", desc: "sleep = min(cap, random_between(base, previous_sleep × 3)). Unlike full jitter, this breaks temporal correlation between retrying instances — consecutive sleeps are randomized relative to each other." },
    { domain: "dsa", name: "Michael-Scott lock-free queue", desc: "crossbeam-channel's internal queue is a Michael-Scott queue — a CAS-based MPSC structure with O(1) enqueue and dequeue. Understanding the ABA problem is the depth behind using the library." },
    { domain: "dsa", name: "Sliding window vs token bucket", desc: "Token bucket allows controlled burst. Sliding window counts requests within a rolling interval with no burst allowance. Both implemented as atomic Lua scripts in Redis. The choice depends on whether burst traffic should be tolerated." },
  ],
};

const INFRA = [
  { svc: "ECS Fargate", impl: "One task definition per service. Independent deploy pipelines. Auto-scales on queue depth, not CPU." },
  { svc: "ALB · Route 53", impl: "ALB in public subnet, all services in private. Per-tenant subdomain routing via listener rules. ACM TLS." },
  { svc: "RDS Postgres · Multi-AZ", impl: "Multi-AZ primary for HA failover. Read replica for admin-svc CQRS read model. RTO tested and measured." },
  { svc: "ElastiCache Redis", impl: "Cluster mode. Rate limiting, idempotency keys, worker registry, channel backpressure signals." },
  { svc: "S3 · SSE-KMS", impl: "Large payload spill, audit log export, pg_dump backup. Server-side encryption via KMS." },
  { svc: "IAM · IRSA", impl: "Each ECS task assumes its own least-privilege role. No static keys anywhere." },
  { svc: "Secrets Manager", impl: "DB credentials, API keys, and Twilio tokens fetched at startup per service. Automatic rotation without redeploy." },
  { svc: "KMS", impl: "RDS encryption at rest. S3 SSE-KMS per bucket. ACM Private CA for inter-service mTLS certificates." },
  { svc: "CloudWatch · X-Ray", impl: "OTel OTLP export per service. Custom queue depth metric drives auto-scaling. Distributed traces via X-Ray." },
  { svc: "VPC Endpoints", impl: "Interface endpoints for S3, Secrets Manager, and ECR — traffic stays within the VPC. Reduces NAT cost." },
  { svc: "WAF · Shield", impl: "WAF on ALB with rate-based rules as first line of defence. Shield Standard covers volumetric DDoS." },
  { svc: "SES v2", impl: "Email delivery channel. Domain verification + DKIM in Terraform. Send-rate quota tracking drives backpressure." },
  { svc: "VPC · subnets · SGs", impl: "Public/private subnet split. Security group rules as Terraform code. Nothing configured via the console." },
  { svc: "ECR · GitHub Actions", impl: "One ECR repo per service. Image scanning on push. CI builds, tests, and pushes on merge. ECS rolling deploy." },
];

const STACK = [
  { crate: "axum", role: "HTTP API + Tower middleware chain" },
  { crate: "tonic + prost", role: "gRPC server, client, codegen from .proto" },
  { crate: "tokio", role: "async runtime throughout all services" },
  { crate: "tower", role: "circuit breaker + middleware composition" },
  { crate: "tower-http", role: "request tracing · compression · timeouts" },
  { crate: "sqlx", role: "Postgres · compile-time query validation" },
  { crate: "fred", role: "Redis · rate limiter · worker registry" },
  { crate: "crossbeam-channel", role: "lock-free MPSC on the hot path" },
  { crate: "bytes", role: "zero-copy payload fan-out" },
  { crate: "bloom", role: "probabilistic idempotency pre-screen" },
  { crate: "aws-sdk-rust", role: "SES v2 · S3 · Secrets Manager" },
  { crate: "tracing-opentelemetry", role: "OTel span instrumentation per service" },
  { crate: "opentelemetry-otlp", role: "OTLP export → CloudWatch · Jaeger" },
  { crate: "tokio-console", role: "async task profiling + starvation detection" },
  { crate: "criterion", role: "benchmarking · allocation counting" },
  { crate: "pin-project", role: "self-referential async stream structs" },
  { crate: "tokio-util", role: "CancellationToken · graceful shutdown" },
  { crate: "uuid (v7)", role: "time-ordered IDs · sequential index writes" },
  { crate: "thiserror", role: "typed errors across service boundaries" },
  { crate: "jsonwebtoken", role: "JWT validation in gateway-svc" },
  { crate: "hmac + sha2", role: "webhook payload signing · vnode hashing" },
  { crate: "argon2", role: "tenant API key hashing" },
  { crate: "reqwest", role: "outbound webhook HTTP delivery" },
  { crate: "testcontainers", role: "Postgres + Redis in integration tests" },
  { crate: "refinery", role: "versioned SQL migrations" },
];

const SIGNALS = [
  { tag: "storage", cls: "db", text: "SKIP LOCKED gives lock-free row exclusion without advisory locks or serializable transactions. Multiple workers claim different jobs concurrently with no conflicts. Compared to SELECT FOR UPDATE, it never blocks — it simply skips locked rows and moves on." },
  { tag: "storage", cls: "db", text: "LISTEN/NOTIFY is not reliable for at-least-once delivery — a worker that crashes between notification and claim loses the message. The outbox CDC task handles delivery guarantees independently. LISTEN/NOTIFY is used only for low-latency wake." },
  { tag: "storage", cls: "db", text: "Append-only event log instead of a mutable status column. Replaying job_events reconstructs any job's history at any point in time. This makes debugging failures trivial and makes dead-letter replay in admin-svc exact." },
  { tag: "microservices", cls: "micro", text: "Outbox pattern over dual-write: writing to the queue atomically with the job record means there's no window where the job exists but hasn't been dispatched. The CDC task provides the eventual publishing guarantee." },
  { tag: "microservices", cls: "micro", text: "Circuit breaker as a Tower::Layer rather than a global flag: scoped to the downstream service it protects, composable with other middleware, and testable in isolation." },
  { tag: "microservices", cls: "micro", text: "CQRS because the write path and read path have genuinely different access patterns. The write path needs low-latency transactional inserts. The admin read path runs multi-join analytics over millions of delivery_log rows." },
  { tag: "distributed", cls: "dist", text: "SWIM over a central heartbeat: a heartbeat server is a single point of failure and a bottleneck at scale. SWIM scales O(log N) and has no coordinator. The tradeoff is that false positive detection latency is tunable but never zero." },
  { tag: "distributed", cls: "dist", text: "Consistent hashing with 150 virtual nodes: without virtual nodes, removing a single physical worker reassigns all its keys to one successor, causing a hotspot. 150 per worker is the Cassandra default — a well-studied heuristic." },
  { tag: "distributed", cls: "dist", text: "Decorrelated jitter over exponential backoff: after a mass failure, naive exponential backoff synchronizes retries across instances. The thundering herd problem it prevents has taken down production systems." },
  { tag: "infrastructure", cls: "cloud", text: "Queue depth as the ECS scaling metric instead of CPU: a queue worker's CPU is low when idle and spikes when overwhelmed. Queue depth is a leading indicator; CPU is a lagging one." },
  { tag: "infrastructure", cls: "cloud", text: "IRSA over a shared IAM role: each service needs exactly the permissions its function requires. A shared role is a security smell — credential scope should be minimal and auditable per service." },
  { tag: "Rust", cls: "rust", text: "Acquire/Release on AtomicU8 node state rather than SeqCst: SeqCst imposes a total global order on all atomic operations — unnecessarily expensive here. The gossip task always writes; the routing task always reads." },
  { tag: "Rust", cls: "rust", text: "bytes::Bytes for zero-copy fan-out: cloning an Arc pointer is two atomic increments. Cloning a heap Vec is a malloc and a memcpy. At 3 delivery channels per notification, zero-copy fan-out eliminates 3 allocations per notification." },
];

const COMM_ROWS: [string, string, string, string, string][] = [
  ["gateway → enqueue-svc", "gRPC", "grpc", "sync request/reply", "circuit breaker trips → 503 to client"],
  ["gateway → admin-svc", "gRPC", "grpc", "sync request/reply", "circuit breaker → graceful degradation"],
  ["enqueue-svc → worker-svc", "async queue", "async", "outbox + CDC + LISTEN/NOTIFY", "worker down → jobs persist in Postgres, zero loss"],
  ["worker-svc → delivery-*", "gRPC", "grpc", "fan-out, bulkhead per channel", "channel down → dead-letter; others unaffected"],
  ["scheduler-svc → enqueue-svc", "gRPC", "grpc", "saga orchestration step", "enqueue fail → saga compensates in reverse"],
  ["worker-svc ↔ worker-svc", "UDP gossip", "udp", "SWIM probe + epidemic broadcast", "partition → suspect → dead → ring rebalance"],
  ["all services → Postgres", "TCP / sqlx pool", "", "connection pool, schema per service", "Multi-AZ failover, pool reconnect"],
  ["all services → Redis", "TCP / fred-rs", "", "rate limit · idempotency · backpressure", "Redis down → configurable allow-all fallback"],
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NotiQPage() {
  const { openPhases, togglePhase } = usePhaseAccordion([0]);
  const [activeTab, setActiveTab] = useState<TabId>("micro");

  return (
    <PortfolioPageShell>
      <PortfolioHero
        eyebrow="Rust · Distributed Systems · AWS"
        title={
          <>
            NotiQ — <span style={{ color: "var(--acc)" }}>Distributed Notification Platform</span>
          </>
        }
        lead="Eight Rust microservices communicating over gRPC and a Postgres-native job queue. Built to explore what actually breaks when you operate a reliable delivery system at scale — gossip-based membership, consistent hashing, lock-free concurrency, and end-to-end backpressure across service boundaries."
        pills={[
          { label: "Language", value: "Rust" },
          { label: "Services", value: "8 microservices" },
          { label: "Queue", value: "Postgres-native · SKIP LOCKED" },
          { label: "Membership", value: "SWIM gossip · consistent hashing" },
          { label: "Infra", value: "AWS ECS · Terraform" },
          { label: "Observability", value: "OpenTelemetry · CloudWatch" },
        ]}
      />

      <PortfolioRainbow />

      <PortfolioSection label="system architecture">
        <ArchSvg />
      </PortfolioSection>

      <PortfolioSection label="services — bounded contexts">
        <PortfolioServiceGrid services={SERVICES} />
      </PortfolioSection>

      <PortfolioSection label="service communication">
        <PortfolioCommTable rows={COMM_ROWS} />
      </PortfolioSection>

      <PortfolioSection label="how it was built — key decisions">
        <PortfolioPhases phases={PHASES} openPhases={openPhases} onToggle={togglePhase} />
      </PortfolioSection>

      <PortfolioSection label="engineering depth">
        <PortfolioConceptTabs tabs={TABS} activeTab={activeTab} onSelect={setActiveTab}>
          <PortfolioConceptGrid concepts={CONCEPTS[activeTab]} />
        </PortfolioConceptTabs>
      </PortfolioSection>

      <PortfolioSection label="AWS infrastructure">
        <PortfolioCoverageGrid items={INFRA} />
      </PortfolioSection>

      <PortfolioSection label="data model">
        <ErdSvg />
      </PortfolioSection>

      <PortfolioSection label="tech stack">
        <PortfolioStackGrid items={STACK} />
      </PortfolioSection>

      <PortfolioSection label="decisions worth discussing">
        <PortfolioSignals items={SIGNALS} />
      </PortfolioSection>
    </PortfolioPageShell>
  );
}
