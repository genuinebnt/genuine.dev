/** Status strip tone — maps to `.status-strip.status-*` in globals.scss. */
export type RowStatusStrip =
  | "published"
  | "draft"
  | "scheduled"
  | "complete"
  | "wip"
  | "muted";

type Props = {
  status: RowStatusStrip;
  topicClass?: string;
  topicColor?: string;
};

/** Left-edge pair: muted status tick + full-height topic bar (writing index, projects). */
export default function ContentRowBars({ status, topicClass, topicColor }: Props) {
  return (
    <div className="content-bars" aria-hidden>
      <span className={`status-strip status-${status}`} />
      <span
        className={`topic-bar${topicClass ? ` ${topicClass}` : ""}`}
        style={!topicClass && topicColor ? { background: topicColor } : undefined}
      />
    </div>
  );
}
