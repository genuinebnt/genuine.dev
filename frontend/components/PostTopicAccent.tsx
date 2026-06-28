"use client";

import { useEffect } from "react";
import { applyPostTopic, clearPostTopic } from "../lib/theme";

/** Applies `[data-topic]` accent on post pages when the override is set to per-topic. */
export function PostTopicAccent({ topic }: { topic: string }) {
  useEffect(() => {
    applyPostTopic(topic);
    return () => clearPostTopic();
  }, [topic]);

  return null;
}
