# Suspense and streaming recipes

Read `docs/README-SUSPENSE.md` in your project for the full guide.

## Placement

Every component that calls `use(promise)` or renders `<Await>` must sit under a `<Suspense>`. Place the boundary as low as possible, around only the subtree that reads the promise, so the rest of the page is not held back. A consumer with no boundary above it suspends the nearest ancestor (often the whole route) and blocks the shell.

```tsx
// Bad: boundary wraps the page; one slow promise hides everything
<Suspense fallback={<PageSkeleton />}><Page /></Suspense>

// Good: boundary wraps only the reader
<Header />
<Suspense fallback={<ReviewsSkeleton />}><Reviews promise={loaderData.reviews} /></Suspense>
```

## Granularity

- Independent data: sibling boundaries, so each resolves on its own.
- One logical unit that must appear together: one promise composed in the loader, one boundary.
- Do not nest a boundary per field of one entity; do not share one boundary across unrelated promises.

## Promise stability

Stable sources: `loaderData`, `useRouteLoaderData`, `useOutletContext`, props passed from those, `useRef`, `useState` lazy pinned, module-level constants.

Unstable (new identity each render): `Promise.all/race/allSettled` in render, `.then`/`.catch`/`.finally` chains in render, `new Promise`, async IIFEs, `useMemo(() => promise)`.

Fixes:

```ts
// in the loader: compose there
const summary = Promise.all([a(), b()]).then(([x, y]) => ({ x, y }));
return { summary };
```

```tsx
// component-local promise that depends on props: pin it
const [promise] = useState(() => fetchSomething(id));          // lazy pin, fixed for mount
// or re-pin only when the key changes
const ref = useRef<{ key: string; p: Promise<Data> }>();
if (ref.current?.key !== id) ref.current = { key: id, p: fetchSomething(id) };
```

Client-side `fetchSomething` here must be a fetcher-driven or already-started promise; prefer composing in the loader whenever the data is knowable there.

## Skeletons

Size the skeleton to the final content (same height and grid) to avoid layout shift. For listing grids reuse the product-grid skeleton and `DeferredProductGrid`.

## Critical Page Designer regions

Page-level LCP region: `await` the page in the loader and render `<Region critical>` (no region fallback element). Component-level data inside keeps its own boundaries.

## Errors in streamed data

A rejected promise reaches the nearest `errorElement` on `<Await>` or the route `ErrorBoundary`. For optional sections use `errorElement={null}` and log in the loader; for important ones show an inline retry.
