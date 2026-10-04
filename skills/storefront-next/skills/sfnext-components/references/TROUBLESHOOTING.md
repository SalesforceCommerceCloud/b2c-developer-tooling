# Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| New color class renders nothing | Token defined but not bridged | Add `--color-x: var(--x)` in `@theme inline` in `src/theme/tailwind.css` |
| `pnpm lint` reports a hard-coded color utility | `custom/color-linter` | Use a semantic token class (`text-primary-foreground` instead of `text-white`) |
| Header class like `bg-[--header-background]` does nothing | Wrong syntax | Use `bg-header-background` |
| Setting `--radius-ui` / `--shadow-ui` has no effect | Bridge variables are compile-time only | Set `--ui-radius` / `--ui-shadow` |
| Card border will not appear | `border` / `border-2` used | `[--ui-border-width:1px]` on the Card |
| Links lose the site/locale prefix | `Link`/`useNavigate` imported from `react-router` | Import from `@/components/link` and `@/hooks/use-navigate` |
| Page flickers or re-suspends forever | Several promises in one `<Suspense>`, or promises composed during render | One boundary per promise; compose in the loader |
| Tailwind class works in dev but not in build or Storybook | File outside the `@source` globs in `src/theme/index.css` / `storybook.css` | Move the file under `src/` or extend the globs; run `pnpm lint:css` |
| Story not counted or not found | Not in a `stories/` subfolder | Move it to `<component>/stories/` |
| `pnpm test-storybook:...` not found | Script does not exist | `pnpm storybook:test --type=snapshot` |
| Snapshot failure after an intended change | Baseline is stale | `pnpm storybook:test --type=snapshot --update`, review the diff |
| shadcn fork has raw `rounded-md` / `shadow-sm` | Added with `npx shadcn add` | `node .claude/skills/sync-shadcn/sync.mjs restyle <file>` |
| `sync`/`status` reports no baseline | `.shadcn-baseline/` not seeded | `node .claude/skills/sync-shadcn/sync.mjs sync <name> --bootstrap` |
| Overlay code appears in the main bundle | Imported synchronously | `React.lazy` + `useDeferredUnmount`; check with `pnpm bundlesize` |
| Typecheck passes locally, fails after route changes | Stale generated types | `pnpm typecheck` runs `react-router typegen` first; run it, not bare `tsc` |
