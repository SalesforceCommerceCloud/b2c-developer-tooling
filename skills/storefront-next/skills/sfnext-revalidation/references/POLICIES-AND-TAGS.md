# Policies and tags reference

## Policy inputs

`shouldRevalidate` receives `currentUrl`, `nextUrl`, `formMethod`, `formAction`, `actionStatus`, `actionResult` and `defaultShouldRevalidate`.

- Action submissions have `formMethod` other than GET. Resolve the target with `getActionPath(formAction, currentUrl.origin)` from `@/lib/revalidation/routes/shared`, then compare to `resourceRoutes` values.
- A navigation has no non-GET `formMethod`. Compare pathname and the search params the loader consumes.
- `useRevalidator().revalidate()` arrives with `defaultShouldRevalidate` true and no `formMethod`; return `defaultShouldRevalidate` for that case so explicit refreshes work.
- Treat any 2xx `actionStatus` as success, not only 200.

## Decision table

| Situation | Policy |
|---|---|
| Loader reads only data no action changes (navigation menu) | `return false` |
| Loader reads URL filters | skip when only those params change; the navigation re-runs it with new params |
| Expensive loader, few relevant writes | allowlist (suppress by default), as in `product.ts` |
| Cheap loader, few irrelevant writes | denylist, as in `root.ts` |
| Resource fetcher backing a provider | opt in when `actionResult` carries its payload (`basket.basketId`) |
| Many routes depend on one data domain | tags |

## Modals and drawers

Lazy modals and drawers join the active set only after opening. List each modal as potential target (loads a resource fetcher on open) and trigger (submits an action). Fix by gating the fetcher-owning route, or by not mounting the loading component until needed.

## Tags

Primitives (`src/lib/revalidation/tags/index.ts`):

| Export | Role |
|---|---|
| `withRevalidateTags(result, tags)` | action: attach `revalidateTags` to the result |
| `shouldRevalidateForTags(spec, { ambient, expand })` | route: build a `shouldRevalidate`; `spec` is a tag array or `({ params }) => tags` |
| `tagGroup(tag, deps)` | subscriber: a tag plus the tags it depends on |
| `tagImplications(map)` | emitter side: expand an emitted tag into implied concrete tags |
| `matchesTag(pattern, emitted)` | the matcher |
| `normalizeTags`, `resolveTags` | utilities |

Matching rules: the subscriber's pattern is compared to each emitted tag segment by segment. A trailing `.*` in the pattern matches any deeper tags. A pattern that omits `:id` matches all instances; if both pin an id they must equal. An emitted `*` is a literal segment.

Ambient tags (cross-cutting dimensions such as currency) are appended to every subscription unless you pass `{ ambient: false }`. The default vocabulary is empty; define it per app with `tagImplications` if you need it.

Compose with an extra guard when needed:

```ts
const byTags = shouldRevalidateForTags(['cart.*']);
export const shouldRevalidate = (args) => byTags(args) && args.nextUrl.searchParams.get('drawer') === 'open';
```

Keep tag catalogs small and per domain in `src/lib/revalidation/tags/<domain>.ts`. Test them with the pattern in `index.example.test.ts`.

## Root policy

The root policy (`routes/root.ts`) defaults to revalidate, so avoid adding expensive work to the root loader; put it in a leaf route or stream it. Request-wide state is produced by the middleware chain in `src/root.tsx`.
