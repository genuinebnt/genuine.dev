import type { PostItem } from "./api";
import { postTags } from "./metadata";

export type TagCount = { tag: string; count: number };

/** All tags across posts with their usage count, most-used first. */
export function allTags(posts: PostItem[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of postTags(post.metadata)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Posts carrying a given tag (tags are already URL-safe, matched verbatim). */
export function postsForTag(posts: PostItem[], tag: string): PostItem[] {
  return posts.filter((post) => postTags(post.metadata).includes(tag));
}
