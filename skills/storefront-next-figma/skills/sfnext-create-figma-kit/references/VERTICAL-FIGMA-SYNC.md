# Vertical → Figma Kit Sync Reference

When a new vertical is created in code, these steps ensure the Figma kit reflects it correctly.

## Step 1 — Audit changed components before opening Figma

Run `git diff --name-only` (or `git status`) to get the exact list of modified files. Split results into two buckets:

| Bucket | Action |
|--------|--------|
| **New vertical-only components** (e.g. `<vertical>-announcement-bar`) | Build new frames in Figma at the page composition layer |
| **Modified shared components** (e.g. `header/index.tsx`, `product-view.tsx`) | Find the source component in Figma and edit it |

Never guess which Figma component to edit — always trace from the code file to the Figma component ID.

## Step 2 — Build a component ID map once, reuse it

Before the first edit session, run a one-time inspection to map component names → Figma node IDs and which page they live on. Store this map (e.g. as a comment in your skill notes) so you don't rediscover the hierarchy every session.

```
// Example map for a Beauty vertical
// .Header            → 10052:10952  (page: 🟢 Header)
// Product Overviews  → 12174:11185  (page: 🟢 Product Overviews)
// Gallery=Carousel   → 13055:349861 (page: 🟢 Product Overviews) ← PRIMITIVE, don't add vertical content here
// Logo (medium)      → 12087:46186  (page: Content (Images & Illustration))
```

## Step 3 — Token sync before visual edits

Always sync brand tokens (colors, typography) first. Visual component edits that rely on token colors will be wrong if tokens aren't updated.

Order: **tokens → logo → shared component overrides → new page-level frames**

## Step 4 — Logo wordmarks are vectors, not text

In the base kit, logo wordmarks are VECTOR paths (not editable text nodes). To update for a new vertical:

1. Find the `logo 1` source frame inside the logo component.
2. Remove the VECTOR child.
3. Insert a TEXT node with the new brand name.
4. Hide `logo-mark` if the new brand is text-only.

## Step 5 — Verify propagation

After editing a source component, screenshot an INSTANCE of it (e.g. the header on a vertical storefront page) to confirm the change cascaded. Source edits propagate to instances automatically.
