# Review Checklist

Use when reviewing or self-checking a Page Designer component (`@Component`) or page route (`@PageType`). Read-only: report findings with `file:line`, say why each matters, and group them as Bugs (break at runtime or in Business Manager), Conventions (drift from the rest of your project) and Polish.

A file is in scope if it uses `@Component` or `@PageType`, or is listed in `src/lib/page-designer/static-registry.ts`. Components use sections 1-4; page routes use sections 1 (page type part), 3 (region rendering) and 5.

## 1. Metadata

**`@Component`**
- `typeId` is a literal that matches the registry suffix (`Content.hero` -> `'hero'`). A mismatch means the component never resolves.
- `name` is human-readable and differs from `typeId`; `description` says which attributes drive which behavior.
- `group` is set (`Content` or `Layout`) rather than defaulting to `storefrontnext_base`.
- The metadata class is `export`ed.

**`@AttributeDefinition`** (every merchant-configurable prop needs one)
- `type` is one of the valid types (`integer`, not `number`). An invalid string is not caught by TypeScript.
- `enum` has `values`, and its `defaultValue` is one of them.
- `image` props are typed as the `Image` object (`image.url`), not `string`.
- `id` equals the field name; a mismatch means merchant values never reach the prop.
- `required` matches the component: a prop with a destructuring default should be `required: false`; a prop that crashes on `undefined` should be `true`.
- `defaultValue` equals the component's destructuring default (otherwise the editor pre-fills one value and runtime falls back to another).
- `name` and `description` present.

**`@RegionDefinition`**
- Every declared region id is rendered by a matching `<Region regionId>`, and every rendered id is declared.
- `componentTypeInclusions`/`Exclusions` are fully qualified when they cross groups (`'Content.productTile'` from a `Layout.*` host); unqualified ids take the host's group.
- `maxComponents` only where the layout limits children.
- `@RegionDefinition([])` or no decorator on a leaf is fine.

**`@PageType`** (routes)
- Exported, empty class with `name`, `description`, `supportedAspectTypes`. `[]` is valid for fixed-page routes.
- `supportedAspectTypes` agrees with the loader's `aspectType`. Flag a loader aspect not in the list, a listed aspect the loader never fetches, and aspect ids that do not fit the aspect (for example `productId` with a category aspect). This is the most valuable cross-file check: Business Manager shows the wrong template with no error.
- No `@AttributeDefinition` on page types.

## 2. Module contract (components)

- Default export is the component.
- Named `fallback` export exists, is light (no `useState`/`useEffect`, no fetching, nothing that suspends), uses the same attribute props, and reserves dimensions.
- Skeletons live in `fallback`, not in the main component.
- A `loader` export is a function with the `{ componentData, context, request }` signature; the registry has `{ loader: 'loader' }` (regenerate if not); attributes are read from `componentData.data`; `null` is returned for "nothing configured"; independent fetches use `Promise.all`; errors are not swallowed.
- Server-only imports (`*.server.ts`) appear only in loader files, never in the component body.

## 3. Rendering

- Injected props (`component`, `data`, `designMetadata`, `regionId`, and rarely `componentData`) are destructured out before any `...rest` spread onto a DOM element. Unused ones are prefixed with `_`.
- Nested regions use component mode: `<Region component={component} regionId="x" />`, with no `page` prop, no `fallbackElement`, no Suspense wrapper, no promises.
- Route regions use page mode: `<Region page={loaderData.page} regionId="x" />`. `critical` only on above-the-fold regions with an awaited page and no local `fallbackElement`.
- Instance-specific `<style>` output is scoped (for example with `useId()`); unscoped CSS collides when two instances share a page.
- Images: `Image` object, `DynamicImage` for responsive widths, `alt` always present (empty for decorative), `priority="high"` only on LCP candidates.
- No `'use client'` directives; this is React Router, not React Server Components.
- Developer-owned strings go through `useTranslation()`; merchant attribute text stays raw.
- `memo` only on components with stable props.

## 4. Anti-patterns

1. `errorElement` on a `<Region>` used to render hard-coded content for an unconfigured page.
2. A loader fetching data that only an `errorElement` uses.
3. Skeleton markup inside the main component.
4. `fetchPriority="high"` on every image.
5. An `@Component` that is not in `static-registry.ts` (registry not regenerated, or file outside `src/components`).

## 5. Do not flag

- `@PageType` with `supportedAspectTypes: []` on fixed-page routes.
- `@RegionDefinition([])` on leaves, or an omitted decorator on a leaf.
- Missing comments that justify valid choices.
- Formatting and import-order nits the linter already enforces.

## Report format

```
## Bugs
1. `src/components/foo/index.tsx:42` - Page Designer props leak to the DOM.
   `designMetadata` and `component` are not destructured before `...rest` reaches a <div>; React warns in dev and emits `designmetadata="[object Object]"` in production.

## Conventions
2. `src/components/foo/index.tsx:18` - `@Component` has no `group`; peers use 'Content' or 'Layout'.

## Polish
3. `src/components/foo/index.tsx:25` - Description is generic.
```

End with a one-line count per severity. A clean review should say so explicitly.
