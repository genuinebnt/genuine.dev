export function SeriesBanner({ series }: { series: { name: string; part: number } }) {
  if (!series) return null;

  return (
    <div style={{
      marginBottom: "24px",
      padding: "12px 16px",
      borderRadius: "var(--radius)",
      backgroundColor: "var(--acc-bg)",
      border: "1px solid var(--acc-border)",
      color: "var(--acc)",
      fontSize: "13px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: "bold" }}>
        SERIES
      </span>
      <span>
        This is part {series.part} of the <strong>{series.name}</strong> series.
      </span>
    </div>
  );
}
