# Troubleshooting Reference

## Token not found in Tailwind utilities
If a CSS variable exists in a token file but has no Tailwind utility in `tailwind.css`:
- Open `src/theme/tailwind.css`.
- Add a bridge entry: `--color-my-new-token: var(--my-new-token);`.
- Then use `bg-my-new-token` in components — never the `bg-[--my-new-token]` arbitrary syntax.

## Colors look wrong in dark mode
- You probably hardcoded a color (`bg-white`, `text-black`, raw hex) instead of using a semantic token.
- Replace with the semantic utility (`bg-background`, `text-foreground`, etc.). Dark mode is handled by `.dark` overrides in the token files automatically.

## Vertical changes leak into other verticals
- You edited a shared token file (`core.css`, `header.css`, `status.css`, `swatch.css`, `components.css`). Move the change into `brand.css`.
- Or you added `if (vertical)` logic to a shared component. Replace it with a CVA variant, a slot/render-prop on the base, or an extension.

## Component already exists
If a scan finds an existing component that covers the need:
- Add a new CVA variant instead of creating a new component.
- Wrap in a thin composite if behaviour differs.
- Never duplicate.

## Local pages won't render without SCAPI
- Use fixtures: create `src/config/<vertical>-fixtures.ts` and short-circuit the `_app.tsx` and `_app.product.$productId.tsx` loaders during vertical development.
- Restore the real SCAPI calls once credentials are available.

## Linter errors after changes
Run `pnpm lint:fix` first. If errors remain, check:
- Missing copyright header (required on every `.ts`/`.tsx` file).
- Raw hex value or hardcoded Tailwind color — replace with a semantic token class.
- Missing `data-slot` attribute on a component root.

## Snapshot tests fail after visual changes
Run `pnpm test-storybook:snapshot:agent -- --updateSnapshot` to update baselines after intentional visual changes.
