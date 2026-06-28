/** Starter source for each directive family, used by the "Insert block" menu. */
export const DIRECTIVE_TEMPLATES: { label: string; source: string }[] = [
  {
    label: "Callout",
    source: ':::callout ⚠ "Heads up"\nSomething worth flagging.\n:::',
  },
  {
    label: "Character aside",
    source: ":::aside 🦀 \"Ferris' hot tip\"\nA personal note from the mascot.\n:::",
  },
  {
    label: "Timeline",
    source: ":::timeline\n2026 Milestone — what happened.\n2025 Earlier — the year before.\n:::",
  },
  {
    label: "Service cards",
    source:
      ':::cards\n:::card gateway "service-name" "owns: responsibility"\n- pattern\n- pattern\nA sentence describing the service.\n:::\n:::',
  },
  {
    label: "Coverage grid",
    source: ':::grid\n:::gitem "Component"\nWhat it does.\n:::\n:::',
  },
  {
    label: "Design signals",
    source: ':::signals\n:::signal "Decision"\nWhy it was made.\n:::\n:::',
  },
  {
    label: "Build accordion",
    source:
      ':::accordion 1 "Phase title" "subtitle"\n:::decision "Decision"\nThe reasoning.\n:::\n:::',
  },
  {
    label: "Concept tabs",
    source:
      ':::tabs\n:::tab "Tab label"\n:::concept micro "Concept name"\nThe explanation.\n:::\n:::\n:::',
  },
  {
    label: "Communication matrix",
    source: ":::matrix\n| From → To | Protocol | Notes |\n|---|---|---|\n| a → b | gRPC | note |\n:::",
  },
];
