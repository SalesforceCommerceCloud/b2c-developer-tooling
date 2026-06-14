---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': patch
'b2c-vs-extension': minor
'@salesforce/b2c-agent-plugins': patch
---

Add support for Page Designer "content blocks" (reusable `fragment.*`-typed content).

Content blocks are now a first-class node type: the SDK classifies them as `FRAGMENT` (instead of mislabeling them as components), parses their display name, and exposes `Library.getContentBlocks()` to list a library's blocks (including unlinked ones). The CLI renders them distinctly in `content export`/`content list` (as `CONTENT BLOCK`), counts them in export summaries, and supports `content list --type fragment`. In the VS Code extension, each library gains a **Content Blocks** group that is the single source of truth for a block; because blocks are shared singletons, every page/component that links a block shows a reference that reveals the canonical block in the group rather than an editable copy. A right-click **Convert to Content Block** action turns an inline component into a reusable shared block.
