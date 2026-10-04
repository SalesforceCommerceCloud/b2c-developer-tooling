# Rebrand Checklist

Work top to bottom; each item names the file to touch.

- [ ] `src/theme/tokens/core.css`: `--primary`, `--primary-foreground`, `--background`, `--foreground`, `--secondary`, `--accent`, `--muted`, `--border`, `--input`, `--ring`
- [ ] `src/theme/tokens/core.css`: contrast re-checked (text 4.5:1, borders and focus rings 3:1); update the ratio comments
- [ ] `src/theme/tokens/core.css`: `--ui-radius`, `--ui-shadow`, `--ui-border-width`
- [ ] `src/theme/base.css`: section-scoped Card border rules still match the chosen border width
- [ ] `src/theme/tokens/header.css`: header, menu, footer, newsletter colors; `--header-logo-filter`
- [ ] `src/theme/tokens/status.css`: status colors still readable against the new surfaces
- [ ] `src/theme/tokens/brand.css`: `--brand-*` primitives and hero scrims
- [ ] `src/theme/tokens/swatch.css`, `components.css`: swatch and badge defaults
- [ ] Font: `public/fonts/`, `src/lib/fonts.ts`, `@font-face` in `src/theme/base.css`, `--font-*` in `src/theme/tailwind.css`
- [ ] `public/images/logo.svg`, `public/favicon.ico`, hero images
- [ ] `common.defaultSiteName` in `src/locales/*/translations.json`
- [ ] Page Designer content referencing old imagery or colors
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm storybook:test --type=snapshot`, `--type=a11y`
- [ ] Visual pass: home, PLP, PDP, cart, checkout, account, error pages

## Common mistakes

| Mistake | Result |
|---|---|
| Editing only `brand.css` | Little changes; the palette is in `core.css` |
| Writing `--radius-ui` or `--shadow-ui` | Silent no-op; use `--ui-radius` / `--ui-shadow` |
| Changing the font file but not `base.css` `@font-face` | Old font still loads or fallback shows |
| Forgetting `--header-logo-filter` after a header color change | Logo unreadable |
| Hard-coding hex in components | `pnpm lint` fails (`custom/color-linter`) and the theme no longer controls it |
| Changing `--primary` and expecting the header to follow | Header tokens are independent; edit `header.css` |
