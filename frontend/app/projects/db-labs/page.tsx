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
  PortfolioFooterLinks,
  PortfolioPhases,
  PortfolioServiceGrid,
  PortfolioSignals,
  PortfolioStackGrid,
} from "../../../components/portfolio/PortfolioBlocks";

function ArchSvg() {
  return (
    <svg width="100%" viewBox="0 0 880 340" role="img" style={{ display: "block" }}>
      <title>db-labs disk-oriented architecture</title>
      <defs>
        <marker id="dbl-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#3a4050" strokeWidth="1.5" />
        </marker>
      </defs>
      <rect x="340" y="16" width="200" height="36" rx="6" fill="#1a1e25" stroke="#2e3540" />
      <text x="440" y="38" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="12" fill="#60a5fa">SQL / CLI client</text>
      <line x1="440" y1="52" x2="440" y2="76" stroke="#3a4050" markerEnd="url(#dbl-arr)" />
      <rect x="260" y="84" width="360" height="48" rx="8" fill="rgba(167,139,250,0.07)" stroke="rgba(167,139,250,0.28)" strokeDasharray="4 3" />
      <text x="440" y="104" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#a78bfa">Parser · Binder · Planner</text>
      <text x="440" y="122" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">P3+ — relational algebra → physical plan</text>
      <line x1="440" y1="132" x2="440" y2="156" stroke="#3a4050" markerEnd="url(#dbl-arr)" />
      <rect x="260" y="164" width="360" height="48" rx="8" fill="rgba(245,158,11,0.07)" stroke="rgba(245,158,11,0.28)" strokeDasharray="4 3" />
      <text x="440" y="184" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#f59e0b">Volcano executors</text>
      <text x="440" y="202" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">P3 — scan · filter · join · aggregate</text>
      <line x1="440" y1="212" x2="440" y2="236" stroke="#3a4050" markerEnd="url(#dbl-arr)" />
      <rect x="180" y="244" width="520" height="48" rx="8" fill="rgba(0,212,164,0.07)" stroke="rgba(0,212,164,0.28)" />
      <text x="440" y="264" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="13" fontWeight="500" fill="#00d4a4">Buffer Pool Manager</text>
      <text x="440" y="282" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">P1 — ARC replacer · page guards · disk scheduler · 8 KB frames</text>
      <line x1="440" y1="292" x2="440" y2="316" stroke="#3a4050" markerEnd="url(#dbl-arr)" />
      <rect x="300" y="320" width="280" height="16" rx="4" fill="#13161b" stroke="#232830" />
      <text x="440" y="332" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">Disk Manager · heap / slotted pages · WAL (later)</text>
      <rect x="20" y="244" width="140" height="48" rx="8" fill="rgba(96,165,250,0.07)" stroke="rgba(96,165,250,0.28)" strokeDasharray="4 3" />
      <text x="90" y="264" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="11" fontWeight="500" fill="#60a5fa">B+Tree index</text>
      <text x="90" y="282" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">P2 · latch crabbing</text>
      <line x1="160" y1="268" x2="180" y2="268" stroke="#3a4050" strokeDasharray="3 2" markerEnd="url(#dbl-arr)" />
    </svg>
  );
}

function PageLayoutSvg() {
  return (
    <div className="schema-wrap">
      <svg width="100%" viewBox="0 0 720 280" style={{ display: "block", minWidth: "560px" }}>
        <title>8 KB page layout</title>
        {[
          { x: 20, title: "page header", color: "#60a5fa", fields: [["page_id", "u32"], ["lsn", "u64"], ["free_space", "u16"], ["slot_count", "u16"]] },
          { x: 240, title: "slot directory", color: "#a78bfa", fields: [["offset", "u16"], ["length", "u16"], [" tombstone", "flag"], ["…", "per tuple"]] },
          { x: 460, title: "tuple heap (tail)", color: "#00d4a4", fields: [["null bitmap", "header"], ["fixed attrs", "inline"], ["var attrs", "offset+len"], ["packed from", "page end"]] },
        ].map((t) => (
          <g key={t.title}>
            <rect x={t.x} y="20" width="200" height={38 + t.fields.length * 22} rx="6" fill="#1a1e25" stroke={`${t.color}55`} strokeWidth="1.5" />
            <rect x={t.x} y="20" width="200" height="28" rx="6" fill={`${t.color}18`} stroke={`${t.color}55`} strokeWidth="1.5" />
            <text x={t.x + 100} y="38" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="11" fontWeight="500" fill={t.color}>{t.title}</text>
            {t.fields.map(([k, v], i) => (
              <g key={k}>
                <text x={t.x + 14} y={66 + i * 22} fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">{k}</text>
                <text x={t.x + 186} y={66 + i * 22} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">{v}</text>
              </g>
            ))}
          </g>
        ))}
        <line x1="220" y1="100" x2="240" y2="100" stroke="#3a4050" />
        <line x1="440" y1="100" x2="460" y2="100" stroke="#3a4050" />
        <text x="360" y="200" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="10" fill="#6b7280">BusTub page size: 8 KB · slotted-page layout from L03–L05</text>
      </svg>
    </div>
  );
}

const COMPONENTS = [
  { cls: "gateway", name: "disk manager", owns: "owns: page I/O, file allocation", tags: ["8 KB pages", "O_DIRECT-style", "page_id"], desc: "read_exact_at / write_all_at on a single database file. Every buffer pool miss ends here. Page is the unit of addressing for the entire engine." },
  { cls: "worker", name: "buffer pool manager", owns: "owns: frame table, pin counts, fetch/evict", tags: ["thread-safe", "RAII guards", "P1"], desc: "Maps page_id → frame in memory. Fetch on miss, evict via replacer when pool is full. PageGuard / ReadPageGuard / WritePageGuard enforce pin invariants at compile time where possible." },
  { cls: "queue", name: "ARC replacer", owns: "owns: eviction policy, ghost lists", tags: ["ARC", "adaptive", "L05"], desc: "CMU Spring 2026 uses ARC (not plain LRU). Tracks recency and frequency with ghost entries for pages recently evicted — adapts to scan-heavy vs point-query workloads." },
  { cls: "scheduler", name: "disk scheduler", owns: "owns: async I/O worker, request queue", tags: ["background thread", "promise/future", "P1"], desc: "Decouples executor threads from blocking disk syscalls. BPM submits read/write requests; a worker thread drains the queue and fulfills promises — same pattern as BusTub's DiskScheduler." },
  { cls: "delivery", name: "B+ tree index", owns: "owns: ordered keys, latch crabbing", tags: ["P2", "concurrency", "indexes"], desc: "The beast project — insert/split/merge with latch crabbing for concurrent readers and writers. Bloom/cuckoo filters from the Indexes & Filters lectures layer on top later." },
  { cls: "admin-s", name: "query executors", owns: "owns: Volcano iterator tree", tags: ["P3", "operators", "plans"], desc: "SeqScan, IndexScan, Filter, NestedLoopJoin, HashJoin, Aggregation — each operator implements next()/reset(). Physical plan is a tree of Box<dyn Executor>." },
  { cls: "worker", name: "lock manager", owns: "owns: 2PL, deadlock detection", tags: ["P4", "2PL", "wait-for graph"], desc: "Shared/exclusive row and table locks, strict two-phase locking, waits-for graph cycle detection. MVCC lectures come after — timestamp ordering and version chains in the same phase." },
  { cls: "gateway", name: "WAL + ARIES recovery", owns: "owns: durability, crash recovery", tags: ["L22–L23", "ARIES", "future"], desc: "Write-ahead log, checkpointing, analysis/redo/undo phases. Phase 1 lectures span two sessions on logging and recovery — implemented after P4 when the rest of the engine can generate log records." },
];

const COMM = [
  ["Executor → BPM", "in-process", "sync", "FetchPage(page_id)", "pool full → replacer picks victim; dirty page flushed first"],
  ["BPM → disk scheduler", "channel", "async", "enqueue Read/Write request", "worker thread fulfills; caller awaits future"],
  ["Disk scheduler → disk manager", "syscall", "sync", "read_exact_at / write_all_at", "EIO → propagate as typed StorageError"],
  ["BPM → ARC replacer", "in-process", "sync", "RecordAccess / Evict", "ghost list tracks recently evicted page_ids"],
  ["Index scan → B+ tree", "in-process", "sync", "latch crabbing descent", "split/merge under write latch; readers crabbing"],
  ["Txn → lock manager", "in-process", "sync", "Lock / Unlock / Wait", "deadlock → abort youngest txn in cycle"],
  ["BPM page guard drop", "RAII", "sync", "unpin on Drop", "use-after-unpin caught by debug pin counts"],
];

const PHASES = [
  {
    num: "01", cls: "", title: "P0 — Count-Min Sketch primer", sub: "probabilistic structures · atomics · TDD",
    decisions: [
      { t: "Warm up before pages", p: "BusTub's Rust-track primer replaces the C++ warmup — a mergeable frequency sketch with atomic counters exercises hashing, Relaxed ordering, and test-driven design before touching the buffer pool." },
      { t: "Approximate before exact", p: "Count-Min Sketch overcounts but never undercounts — same family of trade-offs as Bloom filters in the indexing module. P0 proves the testing harness and crate layout." },
      { t: "Port, don't copy", p: "bustub-private and SQLite are read-only references. Every line of db-labs engine code is typed by hand — agents mentor, they don't implement." },
      { t: "Shipped with tests", p: "Matrix insert/count/merge/clear with comprehensive tests. Top-K via min-heap on sketch estimates ships as part of the primer." },
    ],
  },
  {
    num: "02", cls: "blue", title: "P1 — Buffer pool manager", sub: "ARC · disk scheduler · page guards · 8 KB frames",
    decisions: [
      { t: "ARC over LRU", p: "CMU Spring 2026 specifies Adaptive Replacement Cache — ghost lists for recently evicted pages adapt to scan-heavy vs point-query workloads better than naive LRU." },
      { t: "Disk scheduler decouples I/O", p: "Background worker + channel of read/write requests. BPM never blocks on syscalls — submits a future and awaits on the executor thread, matching BusTub's DiskScheduler." },
      { t: "Page guards as RAII", p: "ReadPageGuard / WritePageGuard pin on acquire, unpin on Drop — even on panic. Debug builds track pin counts to catch use-after-unpin." },
      { t: "Thread-safe from day one", p: "Frame table, replacer, and scheduler must be safe across concurrent FetchPage calls — Project 1 is the concurrency foundation for latch crabbing in P2." },
    ],
  },
  {
    num: "03", cls: "purple", title: "P2 — B+ tree index", sub: "latch crabbing · splits · concurrent readers/writers",
    decisions: [
      { t: "The hardest Rust port", p: "C++ BusTub uses raw page pointers and manual latch release during crabbing. Rust routes through page_id + BPM guards — same algorithm, different API shaped by the borrow checker." },
      { t: "Crabbing protocol", p: "Acquire latch on child before releasing parent on descent. Writes may split/merge — exclusive latches held up the path until the structural change completes." },
      { t: "Ordered index + range scan", p: "Leaf nodes linked for sequential scan. Internal nodes only route — all data lives in leaves. Height stays O(log n) with balanced splits." },
      { t: "Filters layer on later", p: "Bloom and cuckoo filters from the Indexes & Filters lectures extend the tree — core P2 is the B+ tree itself." },
    ],
  },
  {
    num: "04", cls: "green", title: "P3 — Query executors", sub: "Volcano iterator · scan · join · aggregate",
    decisions: [
      { t: "Pull-based operator tree", p: "Each executor implements next(): Option<Tuple>. Parent pulls from child — clean trait composition in Rust, with child iterator lifetimes as the design challenge." },
      { t: "Physical operators first", p: "SeqScan, IndexScan, NestedLoopJoin, HashJoin, Aggregation — cost-based optimizer (L15–L16) comes after executors work and can be validated against real plans." },
      { t: "Hash join spill", p: "Build + probe phases for equi-join. Memory budget exceeded → partition and spill sorted runs to disk — external sort shares the same infrastructure." },
      { t: "Tuple layout matches storage", p: "Executor Row type aligns with slotted-page tuple format from P1 — no impedance mismatch between storage and execution layers." },
    ],
  },
  {
    num: "05", cls: "warn", title: "P4 — Concurrency control", sub: "2PL · deadlock detection · MVCC · WAL",
    decisions: [
      { t: "Strict two-phase locking", p: "Shared/exclusive locks on rows and tables. All locks held until txn end — prevents cascading aborts. Wait-for graph detects deadlock cycles." },
      { t: "MVCC as second story", p: "After 2PL works, version chains and snapshot isolation (L20–L21) add a reader-friendly path — readers see a timestamp snapshot without read locks." },
      { t: "ARIES recovery closes the engine", p: "Write-ahead log + analysis/redo/undo phases (L22–L23) require a working txn + storage stack. WAL ties dirty-page flush to crash consistency." },
      { t: "Single-node scope for portfolio", p: "Phase 1 BusTub components complete a disk-oriented relational DBMS — the portfolio case study. Distributed and columnar engines are future learning, not this project's ship target." },
    ],
  },
];

type TabId = "storage" | "index" | "exec" | "txn" | "refs";
const TABS: { id: TabId; label: string }[] = [
  { id: "storage", label: "Storage" },
  { id: "index", label: "Indexing" },
  { id: "exec", label: "Execution" },
  { id: "txn", label: "Transactions" },
  { id: "refs", label: "References" },
];

const CONCEPTS: Record<TabId, { domain: string; name: string; desc: string }[]> = {
  storage: [
    { domain: "sysdes", name: "8 KB slotted pages", desc: "BusTub page size. Header + slot directory + tuples packed from the tail. Deletes mark slots free; compaction garbage-collects." },
    { domain: "sysdes", name: "Why not mmap?", desc: "OS cannot make DBMS-aware eviction decisions, cannot handle page-level latches, and page faults are unacceptable for WAL durability." },
    { domain: "perf", name: "Storage hierarchy", desc: "NVM/DRAM (ns) → NVMe (~10µs) → HDD (~10ms). Buffer pool exists to minimize trips to the bottom of the hierarchy." },
    { domain: "rust", name: "Page guards (RAII)", desc: "Pin on acquire, unpin on Drop. WritePageGuard vs ReadPageGuard enforce access mode. Debug builds track pin counts to catch use-after-unpin." },
    { domain: "sysdes", name: "ARC replacement", desc: "Adaptive Replacement Cache — balances recency (T1) and frequency (T2) with ghost entries for evicted pages. Adapts to scan vs point-query workloads." },
    { domain: "rust", name: "Disk scheduler pattern", desc: "Background worker + channel of I/O requests. BPM never blocks on syscalls directly — submits a future and awaits on the executor thread." },
  ],
  index: [
    { domain: "sysdes", name: "B+ tree invariants", desc: "All keys in internal nodes separate subtrees; leaves linked for range scan; tree height O(log n). Splits propagate upward." },
    { domain: "sysdes", name: "Latch crabbing", desc: "Acquire latch on child before releasing parent when descending. Write path may hold exclusive latches through split/merge." },
    { domain: "sysdes", name: "Bloom / cuckoo filters", desc: "CMU Indexes & Filters lectures — probabilistic membership before disk lookup. Count-Min Sketch primer connects to similar approximate structures." },
    { domain: "sysdes", name: "Hash indexes", desc: "Extendible hashing, linear hashing — O(1) point lookup vs B+ tree's ordered range scan. Different trade-off for equality-only workloads." },
    { domain: "perf", name: "Index-only scans", desc: "Covering index avoids heap fetch when all projected columns live in the index. Planner cost model chooses index vs seq scan." },
    { domain: "rust", name: "Concurrent tree in Rust", desc: "No raw pointer sibling links — likely page_id indirection through BPM. Latch as RwLock per page or custom spin latch; borrow checker shapes the API." },
  ],
  exec: [
    { domain: "sysdes", name: "Volcano / iterator model", desc: "Each operator implements next(): Option<Tuple>. Pull-based — parent asks child for next row. Simple composition, higher per-tuple overhead." },
    { domain: "sysdes", name: "Relational algebra", desc: "Select, Project, Join, Aggregate — every SQL query compiles to a tree of these operators. P3 implements physical versions." },
    { domain: "perf", name: "Hash join vs NLJ", desc: "Build phase + probe phase for equi-join. Nested-loop for small inner or non-equi conditions. Memory budget determines spill to disk." },
    { domain: "sysdes", name: "External sort", desc: "Sort runs that exceed memory — merge phase over sorted runs on disk. Foundation for ORDER BY and merge join." },
    { domain: "sysdes", name: "Cost-based optimizer", desc: "L15–L16: statistics, selectivity estimation, join ordering. Post-P3 — needs working executors to validate plan choices." },
    { domain: "rust", name: "Executor trait design", desc: "Box<dyn Executor> plan tree vs enum dispatch. Tuple as owned Row struct with Schema metadata — align with slotted-page layout from storage." },
  ],
  txn: [
    { domain: "sysdes", name: "ACID properties", desc: "Atomicity via undo, durability via WAL, isolation via locks or MVCC, consistency via constraints + app logic." },
    { domain: "sysdes", name: "Strict 2PL", desc: "Acquire locks before access; hold all locks until txn end. Prevents cascading aborts; may deadlock — wait-for graph detection." },
    { domain: "sysdes", name: "MVCC snapshot isolation", desc: "Readers see a snapshot timestamp; writers create new versions. No read locks — write skew is the anomaly to handle." },
    { domain: "sysdes", name: "ARIES recovery", desc: "Analysis → Redo (replay all) → Undo (abort incomplete txns). LSN chain links log records to buffer pool pages." },
    { domain: "dist", name: "Distributed preview (L24–L25)", desc: "15-445 now includes distributed DB lectures — capstone for Phase 4 Raft/sharding after local engine is solid." },
    { domain: "sysdes", name: "Isolation levels", desc: "Read uncommitted through serializable — what anomalies each level allows. Serializable via SSI or strict 2PL." },
  ],
  refs: [
    { domain: "sysdes", name: "bustub-private (C++)", desc: "Primary CMU reference — buffer/, storage/, execution/, concurrency/. Agents may show C++ snippets; user ports algorithms independently." },
    { domain: "sysdes", name: "SQLite 2.5.0 for reading", desc: "Real-world pager.c, btree.c, vdbe.c — how production systems solved the same problems 20 years ago." },
    { domain: "sysdes", name: "mkdb (Rust, paths only)", desc: "Prior Rust DB work in paging/ and storage/ — compare approaches, never paste. User types every line of db-labs." },
    { domain: "sysdes", name: "CMU Database Group YouTube", desc: "Andy Pavlo 15-445 + 15-721 lectures — watch before reading textbook chapters. Schedule synced to Spring 2026." },
    { domain: "sysdes", name: "Architecture of a DB System", desc: "Hellerstein et al. — the survey paper every database engineer should read once." },
    { domain: "sysdes", name: "MiniLSM + Database Internals", desc: "skyzh MiniLSM for LSM phases; Petrov's Database Internals for storage engine depth in Phase 3." },
  ],
};

const COVERAGE = [
  { svc: "P0 Count-Min Sketch", impl: "Atomic matrix, merge, Top-K heap — primer shipped with full test suite." },
  { svc: "Replacer trait + LRU stub", impl: "Current focus — ARC replacer next; trait boundary defined for BPM integration." },
  { svc: "Disk manager", impl: "Planned — 8 KB positional I/O via FileExt. Persistent backend for the buffer pool." },
  { svc: "Disk scheduler", impl: "Planned — background worker thread, async request queue, promise fulfillment." },
  { svc: "Buffer pool manager", impl: "Planned — frame table, fetch/new/evict, thread-safe pin counts." },
  { svc: "Page guards", impl: "Planned — RAII ReadPageGuard / WritePageGuard enforcing pin + access mode." },
  { svc: "B+ tree index", impl: "Planned — insert, split, merge, latch-crabbing concurrency." },
  { svc: "Query executors", impl: "Planned — Volcano operators: scan, filter, join, aggregate." },
  { svc: "Lock manager", impl: "Planned — 2PL, wait-for graph deadlock detection." },
  { svc: "WAL + ARIES recovery", impl: "Planned — durability and crash recovery after txn layer lands." },
];

const STACK = [
  { crate: "Rust 2024 edition", role: "Single binary + lib — std only, no external DB crates" },
  { crate: "std::sync::atomic", role: "Count-Min Sketch counters — Relaxed ordering for frequency cells" },
  { crate: "std::os::unix::fs::FileExt", role: "Disk manager — positional read/write at page offsets" },
  { crate: "std::thread + channels", role: "Disk scheduler worker loop" },
  { crate: "cargo test", role: "TDD — tests specify behavior; implementation typed by hand" },
  { crate: "criterion (planned)", role: "Buffer pool hit rate, B+ tree throughput benchmarks" },
  { crate: "bustub-private (reference)", role: "C++ CMU reference — algorithms cited, never pasted" },
  { crate: "SQLite 2.5.0 (reference)", role: "pager.c · btree.c — real-world storage reading" },
];

const SIGNALS = [
  { tag: "portfolio", cls: "db", text: "Third portfolio project alongside NotiQ and genuine.dev — a learning DBMS you can read about in a case study, not a curriculum checklist page." },
  { tag: "learning", cls: "db", text: "The goal is to implement every BusTub Phase-1 component in Rust and understand why each invariant exists — not to ship a faster Postgres." },
  { tag: "learning", cls: "db", text: "Agents are mentors, not implementers. Reference repos can show C++ snippets; db-labs Rust is typed by the owner only — except tests when asked." },
  { tag: "storage", cls: "db", text: "8 KB pages per CMU Spring 2026 BusTub spec. Frame size, replacer policy, and scheduler queue depth all flow from this constant." },
  { tag: "storage", cls: "db", text: "ARC over LRU for Project 1 — ghost lists remember recently evicted pages and adapt to scan-heavy workloads that destroy naive LRU." },
  { tag: "concurrency", cls: "rust", text: "Latch crabbing in Rust is the P2 risk. C++ uses raw page pointers; Rust routes through page_id + BPM guards — different API, same algorithm." },
  { tag: "concurrency", cls: "rust", text: "Page guards must unpin on Drop even on panic — RAII is not optional when the pool has a fixed frame count." },
  { tag: "architecture", cls: "db", text: "Disk-oriented stack: executors pull tuples from indexes that read pages through a buffer pool that owns all concurrency on fixed-size frames." },
  { tag: "references", cls: "db", text: "SQLite 2.5.0 source shows pager and B-tree from a shipped system. BusTub shows the academic clean-room version. Read both; implement neither verbatim." },
  { tag: "scope", cls: "dist", text: "NotiQ is the distributed systems showcase on this site. db-labs completes at single-node Phase 1 — Raft and columnar engines are separate future work." },
];

const DB_LABS_RAINBOW = [
  "var(--acc)",
  "var(--blue)",
  "var(--purple)",
  "var(--warn)",
  "var(--faint)",
] as const;

export default function DbLabsProject() {
  const { openPhases, togglePhase } = usePhaseAccordion([0]);
  const [activeTab, setActiveTab] = useState<TabId>("storage");

  return (
    <PortfolioPageShell>
      <PortfolioHero
        eyebrow="Rust · Database internals · Systems"
        title={
          <>
            db<span style={{ color: "var(--acc)" }}>-</span>labs
          </>
        }
        lead="A from-scratch relational DBMS in Rust — built to explore what it takes to implement storage, indexing, query execution, and transactions from the page up. BusTub-shaped architecture, hand-typed engine code, reference repos for algorithms only."
        pills={[
          { label: "Language", value: "Rust" },
          { label: "Pattern", value: "disk-oriented DBMS" },
          { label: "Pages", value: "8 KB · slotted" },
          { label: "Reference", value: "CMU BusTub" },
          { label: "GitHub", value: "genuinebnt/db-labs" },
        ]}
      />

      <PortfolioRainbow colors={DB_LABS_RAINBOW} />

      <PortfolioSection label="disk-oriented architecture">
        <ArchSvg />
      </PortfolioSection>

      <PortfolioSection label="engine components">
        <PortfolioServiceGrid services={COMPONENTS} />
      </PortfolioSection>

      <PortfolioSection label="internal call flow">
        <PortfolioCommTable rows={COMM} />
      </PortfolioSection>

      <PortfolioSection label="how it was built — key decisions">
        <PortfolioPhases phases={PHASES} openPhases={openPhases} onToggle={togglePhase} />
      </PortfolioSection>

      <PortfolioSection label="engineering depth">
        <PortfolioConceptTabs tabs={TABS} activeTab={activeTab} onSelect={setActiveTab}>
          <PortfolioConceptGrid concepts={CONCEPTS[activeTab]} />
        </PortfolioConceptTabs>
      </PortfolioSection>

      <PortfolioSection label="implementation status">
        <PortfolioCoverageGrid items={COVERAGE} />
      </PortfolioSection>

      <PortfolioSection label="8 KB page layout">
        <PageLayoutSvg />
      </PortfolioSection>

      <PortfolioSection label="tech stack">
        <PortfolioStackGrid items={STACK} />
      </PortfolioSection>

      <PortfolioSection label="decisions worth discussing">
        <PortfolioSignals items={SIGNALS} />
      </PortfolioSection>

      <PortfolioFooterLinks
        links={[
          { href: "/projects", label: "← All projects" },
          { href: "https://github.com/genuinebnt/db-labs", label: "GitHub →", external: true },
          { href: "/projects/notiq", label: "NotiQ case study →" },
        ]}
      />
    </PortfolioPageShell>
  );
}
