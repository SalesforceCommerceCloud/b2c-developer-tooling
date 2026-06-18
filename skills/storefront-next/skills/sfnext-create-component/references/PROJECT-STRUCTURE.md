# Project Structure Reference

Storefront Next is a pnpm monorepo with a React Router v7 retail application.

## Key architecture

- **Monorepo:** pnpm workspaces, packages under `packages/`
- **Main app:** `packages/template-retail-rsc-app/` — React Router v7 retail application
- **Build tool:** Vite with SSR
- **Routing:** React Router v7 file-based routing
- **Styling:** Tailwind CSS v4, utility-first, token-driven
- **Commerce:** Salesforce Commerce Cloud (SCAPI) integration

## Theme file layout (the vertical surface)

```
src/theme/
├── tailwind.css            # CSS variable → Tailwind utility bridge
└── tokens/
    ├── brand.css           # ← the ONLY file that changes per vertical
    ├── core.css            # semantic roles (bg, fg, card, primary, …)
    ├── header.css          # header / footer surfaces
    ├── status.css          # destructive / warning / success / info
    ├── swatch.css          # variant-selector swatch UI
    └── components.css       # payment + cart-specific tokens
```

## App file organization

- **Routes:** `src/routes/` (file-based, mapped in `src/routes.ts`)
- **Components (composite):** `src/components/`
- **Components (Shadcn primitives):** `src/components/ui/`
- **Extensions:** `src/extensions/<name>/`
- **Providers:** `src/providers/`
- **Config / fixtures:** `src/config/`

## Common commands

- `pnpm dev` — start the dev server
- `pnpm build` — production build
- `pnpm typecheck` — TypeScript checking
- `pnpm lint` — ESLint (runs with `--max-warnings 0`)
- `pnpm test-storybook:snapshot:agent` — Storybook snapshot diff
