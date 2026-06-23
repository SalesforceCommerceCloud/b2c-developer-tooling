---
name: sfnext-create-figma-kit
description: Build or sync a Storefront Next vertical's Figma design kit — duplicate the official kit, update Brand variable collections from brand.css, edit components at the correct layer, and publish Figma Code Connect mappings. Use when asked to set up, duplicate, or sync a Figma kit, update Figma brand variables, or keep design and code tokens aligned. Requires the Figma MCP server.
persona: developer
category: Headless Storefront (Storefront Next)
tags: [design-system, figma, headless, storefront-next, storefront]
---

# Create a Figma Kit Skill

This skill is the entrypoint for setting up or syncing the **Figma design kit** for a Storefront Next vertical, so the kit stays aligned with the brand tokens defined in code.

It is the design-kit companion to `sfnext-create-vertical` (in the `storefront-next` plugin): create or change the brand tokens in code first, then run this skill to mirror them in Figma.

## Step 0 — Verify prerequisites (required)

This workflow uses the **Figma MCP server**. Before proceeding, confirm:

- [ ] The Figma MCP server is connected in your AI tool's MCP configuration.
- [ ] You have a Figma URL with a `node-id` parameter for the component or frame to work with.
- [ ] You have edit access to the Figma file.

**If the Figma MCP server is not connected, stop here.** Configure it (see your IDE's MCP docs), then return to this skill.

**Getting a node-id:** in Figma, right-click any frame or component → **Copy/Paste as → Copy link**. The URL contains `node-id=<value>`.

## Source kit

Duplicate the official **Storefront Next Design System** community kit:
<https://www.figma.com/community/file/1646023293012114166>

Open the community file in Figma and use **Open in Figma → Duplicate** to copy it into your own drafts, then move it into your team project. Record the new file key in your project's design-system notes (e.g. `docs/design-system/FIGMA_FILE_KEYS.md`) so the mapping is reproducible.

## Workflow

### Phase 1 — Duplicate the official kit

Do this in Figma (API duplication needs elevated OAuth scopes):

1. Open the official kit.
2. File menu → **Duplicate to your drafts**.
3. Move the duplicate into the correct team project.
4. Rename it: `Storefront NEXT — [Vertical Name]`.
5. Copy the new file key from the URL (`figma.com/design/<FILE_KEY>/...`) and record it.

### Phase 2 — Update variable collections (tokens first)

Update **only** the Brand collection values to match `src/theme/tokens/brand.css`. Do not edit Semantic/Core values directly — they alias the Brand values.

| CSS variable (`brand.css`) | Figma variable |
|----------------------------|----------------|
| `--brand-black` | `Brand / black` |
| `--brand-white` | `Brand / white` |
| `--brand-gray-50` … `--brand-gray-950` | `Brand / gray-*` |
| `--brand-primary` | `Brand / primary` |

**Non-negotiable color rule:** all fills/strokes/effects bind to variables. No raw hex/RGB. If no existing variable fits, stop, document the node and reason, propose a name/value, and get approval before creating it. See [Figma Component Editing Reference](references/FIGMA-COMPONENT-EDITING.md).

### Phase 3 — Typography

If the vertical uses custom fonts, update the text styles (`text/body`, `text/label`, `text/heading`) and make sure the fonts are available via the Figma Font Service or uploaded custom fonts.

### Phase 4 — Component edits at the correct layer

When a component needs to change, edit at the right layer and respect the instance/component boundary — you cannot append children to an instance; edit the source component. See [Figma Component Editing Reference](references/FIGMA-COMPONENT-EDITING.md) for the layer table and the extend-before-create rule, and [Vertical → Figma Kit Sync Reference](references/VERTICAL-FIGMA-SYNC.md) for tracing code changes to the right Figma node.

### Phase 5 — Code Connect

Maintain `.figma.ts` mappings for components and publish them after changes.

```typescript
// src/components/ui/<component>.figma.ts
import { figma } from '@figma/code-connect'
import { ComponentName } from './<component>'

figma.connect(ComponentName, 'FIGMA_FILE_URL', {
  props: {
    variant: figma.enum('Variant', {
      default: 'default',
      secondary: 'secondary',
    }),
  },
  example: ({ variant }) => <ComponentName variant={variant} />,
})
```

Replace `FIGMA_FILE_URL` with the full Figma URL including `node-id`, then publish:

```bash
FIGMA_ACCESS_TOKEN=<your-token> npx figma connect publish
```

### Phase 6 — Publish and maintain

1. Publish the Figma library.
2. Notify the design team to accept updates.

Ongoing: token change in `brand.css` → update Brand variables → republish. Component prop/variant change → update `.figma.ts` → republish Code Connect.

## Execution modes

- **Assisted (Figma MCP automation):** validate target nodes before mutation (component vs instance), apply one logical batch at a time (tokens → logo → components), screenshot after each batch, keep every color operation variable-bound. Best for bulk token updates and repeated component edits.
- **Manual:** use this workflow as a checklist while editing directly in Figma; keep a change log (file key · pages/components changed · variables touched · publish timestamp); run Code Connect publish from the terminal. Best for one-off or design-led sessions without MCP access.

## Required outcomes

- Vertical Figma file duplicated, renamed, and its key recorded.
- Brand variables synced from `src/theme/tokens/brand.css`; no detached hex/RGB.
- Source component edits propagate to instances (verified by screenshot).
- Code Connect mappings updated and published when components changed.
- Library republished and announced to the design team.

## Verification

If you changed `.figma.ts` mappings or component code as part of the sync, run from the monorepo root:

```bash
pnpm typecheck
pnpm lint
pnpm test-storybook:snapshot:agent
```

All three must pass with zero errors and zero warnings.

## Related Skills

- `storefront-next:sfnext-create-vertical` - Define the brand tokens in code (run this first)
- `storefront-next:sfnext-create-component` - Author the React component a Code Connect mapping points to

## Reference Documentation

- [Vertical → Figma Kit Sync Reference](references/VERTICAL-FIGMA-SYNC.md) - Tracing code changes to Figma nodes, logo and propagation steps
- [Figma Component Editing Reference](references/FIGMA-COMPONENT-EDITING.md) - Edit layers, variable binding, instance vs component, plugin API gotchas
- [Token System Reference](references/TOKEN-SYSTEM.md) - The brand/semantic token model shared with code
- [Project Structure Reference](references/PROJECT-STRUCTURE.md) - Where brand tokens and `.figma.ts` mappings live
- [Troubleshooting Reference](references/TROUBLESHOOTING.md) - Token and sync pitfalls
