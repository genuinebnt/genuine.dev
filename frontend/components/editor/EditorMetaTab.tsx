"use client";

import { publicDocPath } from "../../lib/cmsPages";
import { TOPIC_KEYS, topicColor } from "../../lib/topic";
import UiCheckbox from "../ui/UiCheckbox";
import ScheduleDateTimeInput from "../ui/ScheduleDateTimeInput";

export type MetaTabProps = {
  slug: string;
  setSlug: (v: string) => void;
  summary: string;
  setSummary: (v: string) => void;
  kind: string;
  setKind: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  scheduleAt: string;
  setScheduleAt: (v: string) => void;
  featured: boolean;
  setFeatured: (v: boolean) => void;
  tags: string;
  setTags: (v: string) => void;
  tech: string;
  setTech: (v: string) => void;
  topic: string;
  setTopic: (v: string) => void;
  seriesName: string;
  setSeriesName: (v: string) => void;
  seriesPart: string;
  setSeriesPart: (v: string) => void;
  coverImage: string | null;
  setCoverImage: (v: string | null) => void;
  onCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  words: number;
  readMin: number;
};

export default function EditorMetaTab({
  slug,
  setSlug,
  summary,
  setSummary,
  kind,
  setKind,
  status,
  setStatus,
  scheduleAt,
  setScheduleAt,
  featured,
  setFeatured,
  tags,
  setTags,
  tech,
  setTech,
  topic,
  setTopic,
  seriesName,
  setSeriesName,
  seriesPart,
  setSeriesPart,
  coverImage,
  setCoverImage,
  onCover,
  words,
  readMin,
}: MetaTabProps) {
  const scheduledHint = scheduleAt.trim()
    ? "Shows as scheduled in admin until published"
    : "Leave empty to save as a plain draft";

  return (
    <>
      <div className="sb-section">
        <div className="sb-h">metadata</div>
        <div className="meta-field">
          <div className="mf-label">slug</div>
          <input
            className="mf-input"
            placeholder="from title"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          {(() => {
            const live = publicDocPath({ slug: slug || "…", kind });
            return live ? <div className="slug-preview">Live URL: genuine.dev{live}</div> : null;
          })()}
        </div>
        <div className="meta-field">
          <div className="mf-label">summary</div>
          <textarea
            className="mf-input"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <div className="meta-field" style={{ flex: 1 }}>
            <div className="mf-label">kind</div>
            <select className="mf-input" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="post">post</option>
              <option value="project">project</option>
              <option value="page">page</option>
            </select>
          </div>
          <div className="meta-field" style={{ flex: 1 }}>
            <div className="mf-label">status</div>
            <select className="mf-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>
        <div className="meta-field">
          <div className="mf-label">schedule for (optional)</div>
          <ScheduleDateTimeInput value={scheduleAt} onChange={setScheduleAt} />
          <div className="slug-preview">{scheduledHint}</div>
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">topic</div>
        <div className="topic-grid">
          {TOPIC_KEYS.map((t) => (
            <button
              key={t}
              type="button"
              className={`tpick${topic === t ? " sel" : ""}`}
              style={
                topic === t
                  ? {
                      borderColor: topicColor(t),
                      color: topicColor(t),
                      background: `${topicColor(t)}18`,
                    }
                  : undefined
              }
              onClick={() => setTopic(topic === t ? "" : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">tags</div>
        <input
          className="mf-input"
          placeholder="rust, performance, …"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {kind === "project" && (
        <div className="sb-section">
          <div className="sb-h">tech stack</div>
          <input
            className="mf-input"
            placeholder="rust, postgres, …"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
          />
        </div>
      )}

      <div className="sb-section">
        <div className="sb-h">series</div>
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            className="mf-input"
            placeholder="Series name"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            className="mf-input"
            type="number"
            min={1}
            value={seriesPart}
            onChange={(e) => setSeriesPart(e.target.value)}
            style={{ width: "52px" }}
          />
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">options</div>
        <UiCheckbox checked={featured} onChange={setFeatured} label="Featured on homepage" />
      </div>

      <div className="sb-section">
        <div className="sb-h">cover image</div>
        {coverImage && (
          <img
            src={coverImage}
            alt="cover"
            style={{ width: "100%", borderRadius: "var(--radius)", marginBottom: "6px" }}
          />
        )}
        <div style={{ display: "flex", gap: "6px" }}>
          <label className="btn-sm" style={{ cursor: "pointer" }}>
            {coverImage ? "Replace" : "Upload"}
            <input type="file" accept="image/*" hidden onChange={onCover} />
          </label>
          {coverImage && (
            <button type="button" className="btn-sm danger" onClick={() => setCoverImage(null)}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">stats</div>
        <div className="stat-row">
          <div className="stat-box">
            <div className="sv">{words}</div>
            <div className="sl">words</div>
          </div>
          <div className="stat-box">
            <div className="sv">{readMin}</div>
            <div className="sl">min read</div>
          </div>
        </div>
      </div>
    </>
  );
}
