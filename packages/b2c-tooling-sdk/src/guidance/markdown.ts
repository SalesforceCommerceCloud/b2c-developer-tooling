/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Heading offsets use JavaScript character positions for section selection. */
export interface GuidanceHeading {
  id: string;
  title: string;
  level: number;
  start: number;
  end: number;
}

/** Stable ATX heading IDs, excluding frontmatter and fenced code examples. */
export function guidanceHeadings(content: string): GuidanceHeading[] {
  const headings: GuidanceHeading[] = [];
  const used = new Set<string>();
  let offset = 0;
  let fence: string | undefined;
  let frontmatter = content.startsWith('---\n') || content.startsWith('---\r\n');
  for (const line of content.split(/(?<=\n)/)) {
    const trimmed = line.trim();
    if (frontmatter) {
      if (offset > 0 && trimmed === '---') frontmatter = false;
    } else {
      const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
      if (fence) {
        if (marker?.[0] === fence[0] && marker.length >= fence.length && trimmed === marker) fence = undefined;
      } else if (marker) {
        fence = marker;
      } else {
        const match = /^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
        if (match) {
          const title = match[2];
          const base =
            title
              .toLowerCase()
              .replace(/[^\p{L}\p{N}\s_-]/gu, '')
              .replace(/\s+/g, '-') || 'section';
          let id = base;
          let suffix = 0;
          while (used.has(id)) id = `${base}-${++suffix}`;
          used.add(id);
          headings.push({id, title, level: match[1].length, start: offset, end: content.length});
        }
      }
    }
    offset += line.length;
  }
  for (const [index, heading] of headings.entries()) {
    heading.end = headings.slice(index + 1).find((next) => next.level <= heading.level)?.start ?? content.length;
  }
  return headings;
}
