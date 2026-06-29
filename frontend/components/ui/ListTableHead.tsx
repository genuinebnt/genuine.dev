/** Column label row for public list pages — mirrors admin `post-table th` typography. */
type Variant = "articles" | "projects";

const COLUMNS: Record<Variant, { label: string; align?: "right" }[]> = {
  articles: [
    { label: "title / tags" },
    { label: "topic" },
    { label: "date" },
    { label: "read", align: "right" },
  ],
  projects: [
    { label: "project" },
    { label: "topic" },
    { label: "status" },
    { label: "links", align: "right" },
  ],
};

type Props = {
  variant: Variant;
};

export default function ListTableHead({ variant }: Props) {
  return (
    <thead>
      <tr>
        {COLUMNS[variant].map((col) => (
          <th
            key={col.label}
            style={col.align === "right" ? { textAlign: "right" } : undefined}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
