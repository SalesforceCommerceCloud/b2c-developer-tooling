# Troubleshooting Page Designer

Start with the command loop: `pnpm cartridge:generate`, `pnpm cartridge:validate`, `pnpm cartridge:deploy`, then hard-refresh Business Manager. Most "it does not show up" problems are one of these not having run against the right instance and code version.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Component absent from the Business Manager palette | Cartridge not regenerated or not deployed; deployed to a code version the site does not use; cartridge not on the site's path; metadata class not `export`ed | Export the class, run generate, validate and deploy, confirm the active code version, hard-refresh |
| `cartridge:generate` or `validate` fails | Invalid `searching` combination; unknown attribute `type`; non-literal decorator argument; `enum` without `values` | Fix the decorator; generation parses decorators statically, so use literals |
| Component is in the palette but renders nothing | `typeId` or `group` differs from the registry entry (`Content.hero` vs `Layout.hero`); registry stale; missing default export | Compare the decorator with `src/lib/page-designer/static-registry.ts`; restart `pnpm dev` or `pnpm build` |
| Component not in `static-registry.ts` | File outside `src/components`, or `@Component` typeId is not a string literal | Move it or make it a literal; restart the dev server |
| Page is empty on the storefront | No published page for that `pageId` or aspect assignment; wrong `pageId` in the loader; loader fetched a different aspect than the template | Check the page in Business Manager; `fetchPageWithComponentData` returns `null` on 404/API error |
| Wrong template offered for products or categories | `supportedAspectTypes` disagrees with the loader's `aspectType` | Make them agree (`['pdp']`/`'pdp'`, `['plp']`/`'plp'`) |
| Region shows nothing though merchants filled it | `<Region regionId>` not matching the `@RegionDefinition` id; region declared but never rendered | Cross-check ids in both directions |
| `data` prop is `undefined` | Exported `loader` is an object (`{ server }`) not a function; registry lacks `{ loader: 'loader' }`; loader reads attributes from the wrong place | `export const loader = loaders.server`; read `componentData.data.<attr>`; regenerate the registry |
| Loader data for an attribute is `undefined` | Attribute `id` differs from the field name; attribute not declared on the metadata class | Align `id` and field name |
| Image attribute crashes or shows nothing | Treated as a string | It is an object: use `image.url` and `image.focalPoint` |
| `markup` attribute shows literal tags | Rendered as text | Render as HTML only if the content is trusted |
| Blank space then content pops in (layout shift) | `fallback` missing or height-less | Export a `fallback` that reserves the final height |
| Suspense never resolves / whole region blank | `fallback` suspends (hooks, fetching); `critical` region given an unresolved page | Keep `fallback` synchronous; `await` the page for critical regions |
| React warns about `designMetadata`/`component` props on a DOM element | Spreading `...rest` onto a DOM element | Destructure the injected props (`component`, `data`, `designMetadata`, `regionId`) out before spreading |
| TypeScript error on `<Region>` | Mixed `page` and `component` props, or `fallbackElement` on a component-mode region | Use page mode at route level and component mode for nested regions, never both |
| Nested region empty | Page mode used inside a component, or `component` prop missing | `<Region component={component} regionId="..." />` |
| Design mode links navigate away | `PageDesignerInit` removed from `root.tsx` | Restore it |
| Edits in Business Manager not reflected on the storefront | Editing a different instance than the storefront reads; cached page | Check the environment and site; see `storefront-next:sfnext-revalidation` for caching |

## Debugging tips

```bash
pnpm cartridge:generate          # regenerate metadata; errors name the offending decorator
pnpm cartridge:validate          # schema-check the generated JSON
grep -n "Content.hero" src/lib/page-designer/static-registry.ts   # is the component registered?
ls cartridges/app_storefrontnext_base/cartridge/experience/components   # is the metadata there?
```

Deploy problems (auth, WebDAV, code version) are not Page Designer problems; use `b2c-cli:b2c-code` and `b2c-cli:b2c-webdav`, and rerun with `--log-level trace`.
