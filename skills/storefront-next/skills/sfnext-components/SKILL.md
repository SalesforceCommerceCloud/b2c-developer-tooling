---
name: sfnext-components
description: >-
  Build and modify UI components in a Storefront Next storefront: page components with Suspense and use()/Await, createPage and withSuspense, Tailwind v4 token classes, shape tokens (rounded-ui, shadow-ui, border-ui), shadcn/ui primitives in src/components/ui (sync-shadcn), CVA variants, data-slot, DynamicImage, lazy-loaded overlays, and Storybook stories with snapshot tests. Use when creating or editing a component in src/components, adding a shadcn primitive, fixing styling that ignores the theme, writing a *.stories.tsx file, or running pnpm storybook:test. Do not use for re-branding colors, fonts, or logos (use `storefront-next:sfnext-theming`), route loaders (use `storefront-next:sfnext-data-fetching`), or Page Designer registration (use `storefront-next:sfnext-page-designer`).
---

# Storefront Next Components

How to write, style, and verify components in your storefront. Your project already ships the rules in `AGENTS.md`, `docs/README-UI-STYLING.md`, `docs/README-SHAPE-TOKENS.md`, `docs/README-SUSPENSE.md`, and `docs/README-STORYBOOK.md`; this skill is the task-oriented path through them.

## Before you create anything

1. Search `src/components/` for an existing component (`ls src/components`). Extend or compose it before adding a new one.
2. Decide the layer:
   - **Primitive** (Button, Card, Dialog): a shadcn fork in `src/components/ui/`. Only shadcn forks live there.
   - **Composite / domain component**: everything else, in `src/components/<kebab-name>/`.
   - **Optional feature**: a folder under `src/extensions/` (see `storefront-next:sfnext-extensions`).
3. Match the folder shape already used by neighbors:

```
src/components/my-widget/
├── index.tsx                   # implementation (default or named export)
├── index.test.tsx              # Vitest + Testing Library
└── stories/
    ├── index.stories.tsx       # Storybook (stories/ subfolder is required)
    ├── my-widget-snapshot.tsx  # optional snapshot fixture
    └── __snapshots__/          # generated baselines, commit them
```

Every `.ts`/`.tsx` file needs the Apache header enforced by the `custom/header-format` lint rule. Copy it from any existing file (or `AGENTS.md`).

## Styling rules

- Tailwind utility classes only; merge with `cn()` from `@/lib/utils`. No CSS modules, no per-component CSS files, no `style={{}}` (a truly dynamic API-driven value is the only exception).
- Global/theme CSS lives in `src/theme/` only (entry `src/theme/index.css`). There is no `src/app.css`.
- Use semantic token classes, never hard-coded colors. The `custom/color-linter` rule fails `pnpm lint` on raw palette classes such as `text-white` or `bg-red-500`; use `text-primary-foreground`, `text-destructive-foreground`, `bg-card`, `text-muted-foreground`, `border-border`.
- Header/footer chrome has its own classes: `bg-header-background`, `text-header-foreground`, `bg-header-menu-background`, `bg-footer-background`. Do not write `bg-[--header-background]`.
- A new token needs two edits: the value in `src/theme/tokens/*.css` and a `--color-x: var(--x)` line inside `@theme inline` in `src/theme/tailwind.css`. See [TOKEN-SYSTEM.md](references/TOKEN-SYSTEM.md).
- The shipped theme defines one (light) palette; there is no `.dark` token block. Do not promise dark mode in component work.
- Breakpoints are mobile-first (`sm`, `md`, `lg`, `xl`, `2xl`).

### Shape tokens (read before touching Card, Button, Input, Dialog)

Radius, shadow, and card border width come from three variables in `src/theme/tokens/core.css`: `--ui-radius`, `--ui-shadow`, `--ui-border-width`, consumed through `rounded-ui`, `shadow-ui`, `border-ui`.

- Never add `rounded-xl`, `rounded-none`, `shadow-md`, `shadow-none`, or `border-0` to a primitive or a Card to force a shape. Change the token, or scope it: `<Card className="[--ui-radius:var(--radius-xl)]">`.
- Always write the source names (`--ui-radius`). Writing the bridge names `--radius-ui` / `--shadow-ui` is a silent no-op.
- `border-ui` is Card-only. To show a Card border use `[--ui-border-width:1px]`, not `border`.

Full mechanism and scoped-override recipes: [SHAPE-TOKENS.md](references/SHAPE-TOKENS.md).

## Page components and Suspense

Route components receive `loaderData` with deferred fields as unresolved promises. Rules from `AGENTS.md`: one `<Suspense>` per async operation, stable promise identity (never `Promise.all`/`.then` in render; compose in the loader), skeletons where layout is known.

```tsx
import { Suspense, use } from 'react';
import { Await } from 'react-router';

function Reviews({ promise }: { promise: Promise<ReviewsData> }) {
    const reviews = use(promise);
    return <ReviewList reviews={reviews} />;
}

export default function ProductPage({ loaderData }: { loaderData: PageData }) {
    return (
        <>
            {/* use() needs a small child component */}
            <Suspense fallback={<ReviewsSkeleton />}>
                <Reviews promise={loaderData.reviews} />
            </Suspense>

            {/* Await resolves inline and supports a local errorElement */}
            <Suspense fallback={<RecsSkeleton />}>
                <Await resolve={loaderData.recommendations}>{(recs) => <Recommendations items={recs} />}</Await>
            </Suspense>
        </>
    );
}
```

`createPage` (`@/components/create-page`) wraps a component with the standard Suspense fallback and keys the page so navigations remount it:

```tsx
import { createPage } from '@/components/create-page';

export default createPage({
    component: CategoryView,
    fallback: <CategorySkeleton />,            // optional; default is a generic skeleton
    getPageKey: (data) => data?.categoryId,    // optional; default is pathname+search+hash
});
```

`withSuspense` (`@/components/with-suspense`) is the lower-level HOC for a single async child. Details: `docs/README-SUSPENSE.md`.

## Links, navigation, text

- Import `Link`/`NavLink` from `@/components/link` and `useNavigate` from `@/hooks/use-navigate`, never from `react-router`. The wrappers add the site/locale URL prefix; the originals silently drop it. Combine with `href()` for typed params.
- Strings go through `react-i18next` (`useTranslation`) and prices through `formatCurrency` in `@/lib/currency`. Do not hard-code `'en-US'` or `$`. See `storefront-next:sfnext-i18n`.

## Images

Use `<DynamicImage>` (`@/components/dynamic-image`) with `widths` (and `heights` for cropping) for product and content images; add `priority="high"` to the LCP image. Behavior is configured under the `images` key of `config.server.ts` (`quality`, `formats`, `fallbackFormat`, `host`, `enableDis`, `realmHostMappings`); see `docs/README-IMAGES.md`. Wrap grids in `DynamicImageProvider` (`@/providers/dynamic-image`) instead of prop-drilling sizes.

## Overlays

Modals, drawers, and dialogs hidden on first render must be `React.lazy()` and mounted only after first interaction, gated on `open` with `useDeferredUnmount` from `@/hooks/use-deferred-unmount`. Do not keep a sticky "loaded" latch. Pattern: `docs/README-PERFORMANCE.md` ("Lazy Loading for Overlays").

## shadcn primitives

`src/components/ui/` files are forks of shadcn/ui that you own and may edit in place (shape tokens, `data-slot`, extra props). Do not put non-shadcn components there, and do not hand-copy from the shadcn docs. Use the in-project `sync-shadcn` skill (`.claude/skills/sync-shadcn/`):

```bash
S=.claude/skills/sync-shadcn/sync.mjs
node $S add slider             # fetch from shadcn, apply shape tokens + import convention, seed baseline
node $S restyle --all --check  # gate: exit 1 if any fork has drifted off the shape-token rules
node $S restyle src/components/ui/toggle.tsx   # normalize one file
```

Prefer `add` over `npx shadcn@latest add`: `npx` pulls the older `new-york` registry style and leaves raw `rounded-md`/`shadow-sm` classes you then have to restyle. To pull upstream fixes into an existing fork, use `status` / `sync <name>` / `diff <name>` / `advance <name>` (a 3-way merge that keeps your edits); these need a merge baseline in `.shadcn-baseline/`, which `add` and `sync <name> --bootstrap` create. Read `.claude/skills/sync-shadcn/SKILL.md` for conflict handling. If it mentions a path that does not exist in your project, use the `ui` directory configured in `components.json`.

## Stories and verification

Each reusable component needs `stories/*.stories.tsx` using `@storybook/react-vite` and a title from the fixed taxonomy (`Products/Product Tile/Product Tile`). `src/components/ui/` is excluded from story coverage. Details and the snapshot fixture pattern: [STORYBOOK.md](references/STORYBOOK.md).

```bash
pnpm typecheck
pnpm lint                                  # oxlint (color-linter, header, a11y rules) + biome format check
pnpm test                                  # Vitest
pnpm storybook:test --type=snapshot        # add --update only for intended DOM changes
pnpm storybook:test --type=a11y            # axe-core; new stories must pass
```

Interaction and a11y runs need Chromium once (`pnpm exec playwright install chromium`).

## More detail

- [COMPONENT-AUTHORING.md](references/COMPONENT-AUTHORING.md): worked example, CVA variants, accessibility checklist, CSS component classes vs React components, mask icons
- [TOKEN-SYSTEM.md](references/TOKEN-SYSTEM.md): token files, bridge, class names
- [SHAPE-TOKENS.md](references/SHAPE-TOKENS.md): shape token mechanism and traps
- [STORYBOOK.md](references/STORYBOOK.md): story layout, titles, snapshots
- [TROUBLESHOOTING.md](references/TROUBLESHOOTING.md): symptom to fix

## Related Skills

- `storefront-next:sfnext-theming` - Change palette, fonts, logo, and shape for your brand
- `storefront-next:sfnext-data-fetching` - Loaders that feed data to components
- `storefront-next:sfnext-page-designer` - Make a component Page Designer-editable
- `storefront-next:sfnext-extensions` - Extension folders and UI targets
- `storefront-next:sfnext-testing` - Vitest, Storybook, and e2e testing
- `storefront-next:sfnext-accessibility` - Accessibility requirements and scans
- `storefront-next:sfnext-i18n` - Translating component text
- `storefront-next:sfnext-performance` - Lazy loading, images, bundle size
