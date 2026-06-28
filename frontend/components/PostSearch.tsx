"use client";

import { useState } from "react";
import type { PostItem } from "../lib/api";
import { searchPosts } from "../lib/api";
import PostRows from "./PostRows";

export default function PostSearch({ initialPosts }: { initialPosts: PostItem[] }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PostItem[] | null>(null);

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

  return (
    <>
      <input
        className="search"
        type="search"
        placeholder="Search posts…"
        value={q}
        onChange={(e) => onChange(e.target.value)}
      />
      <PostRows posts={results ?? initialPosts} />
    </>
  );
}
