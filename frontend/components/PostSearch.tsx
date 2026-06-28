"use client";

import { useState, useMemo } from "react";
import type { PostItem } from "../lib/api";
import { searchPosts } from "../lib/api";
import { postTags } from "../lib/metadata";
import PostRows from "./PostRows";

export default function PostSearch({ initialPosts }: { initialPosts: PostItem[] }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PostItem[] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialPosts.forEach((p) => {
      postTags(p.metadata).forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [initialPosts]);

  async function onChange(value: string) {
    setQ(value);
    if (value.trim() === "") {
      setResults(null);
      return;
    }
    try {
      setResults(await searchPosts(value));
    } catch {
      setResults([]);
    }
  }

  // Filter posts by active tag if set
  const displayedPosts = (results ?? initialPosts).filter(p => {
    if (!activeTag) return true;
    return postTags(p.metadata).includes(activeTag);
  });

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <input
          style={{
            width: "100%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "10px 16px",
            color: "var(--text)",
            fontFamily: "var(--sans)",
            fontSize: "14px",
            outline: "none",
            marginBottom: "16px"
          }}
          type="search"
          placeholder="Search posts…"
          value={q}
          onChange={(e) => onChange(e.target.value)}
        />
        
        {allTags.length > 0 && (
          <div className="chips">
            <span 
              className={`chip clickable ${!activeTag ? 'active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              all
            </span>
            {allTags.map(tag => (
              <span 
                key={tag}
                className={`chip clickable ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <PostRows posts={displayedPosts} />
    </>
  );
}
