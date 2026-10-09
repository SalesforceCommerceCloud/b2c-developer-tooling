# Page Designer + Storefront Next: mental model and gotchas

> **Purpose:** background reference for the `figma-to-sfnext-pagedesigner` skill. It explains how React components become Page Designer components in a Storefront Next project. The skill reads this file during pre-flight. For the full decorator, registry and loader API, use `storefront-next:sfnext-page-designer`.

---

## 1. Related tooling

Install these alongside this skill:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install storefront-next           # Storefront Next skills incl. sfnext-page-designer
claude plugin install b2c-cli                   # cartridge/code deploys, Managed Runtime, WebDAV
claude plugin install b2c                       # classic B2C and Page Designer background
# optional:
claude plugin install b2c-dx-mcp                # MCP server (docs search, SCAPI discovery, cartridge_deploy)
claude plugin install storefront-next-figma     # Figma design-kit workflows
```

When uncertain about anything below, read the official docs (section 7); this area evolves.

---

## 2. Mental model

Page Designer (PD) is the visual editor in Business Manager where merchants drag **component types** into **page-type regions**. Classic (SFRA) PD needs hand-written JSON meta-definitions and ISML. In Storefront Next, **your React components are the PD components**. The bridge is decorator metadata:

1. You annotate components under `src/components` with decorators from `@/lib/decorators`: `@Component` (component type), `@AttributeDefinition` (editable fields), `@RegionDefinition` (named child slots). Page routes use `@PageType` (with `supportedAspectTypes` for dynamic PDP/PLP templates). There is no `@Aspect` decorator.
2. The Vite plugin generates `src/lib/page-designer/static-registry.ts` from `@Component` classes, keyed `<Group>.<typeId>`. It is generated; do not hand-edit it.
3. `pnpm cartridge:generate` (also run by `pnpm build`) turns the decorators into Business Manager JSON under `cartridges/app_storefrontnext_base/cartridge/experience/` (`components/<Group>/<typeId>.json`, `pages/`, `aspects/`).
4. `pnpm cartridge:deploy` uploads that cartridge to the B2C instance, which makes the components appear in the PD palette.
5. At runtime a route loader calls `fetchPageWithComponentData` (which reads the page from the Shopper Experience API and attaches each component's loader promise), and `<Region>` renders the components by registry id.

Two loops to keep straight:

- **Dev-time loop (you):** decorated components, generated cartridge, deployed to B2C. Keeps the palette current.
- **Merchant-time loop:** merchants edit pages in PD; the storefront renders their content. For how published page content reaches your storefront (publishing, jobs, replication), see the official docs in section 7 rather than assuming timing.

---

## 3. Developer workflow

```bash
pnpm dev                     # regenerates the registry as components change
pnpm cartridge:generate      # decorators -> cartridge JSON
pnpm cartridge:validate      # validate the generated JSON
pnpm cartridge:deploy        # upload to B2C (-- --delete removes old files first)
pnpm push                    # deploy the storefront bundle to Managed Runtime
```

The same commands exist as `pnpm sfnext generate-cartridge`, `validate-cartridge`, `deploy-cartridge` and `push`. The optional MCP tool `cartridge_deploy` deploys the cartridge. Credentials come from `dw.json`, environment variables or CLI flags; see `b2c-cli:b2c-code`.

Deploy order: cartridge first (palette), bundle second (rendering). Both must be current before merchants see working blocks.

---

## 4. Prerequisites and gotchas

- [ ] **Storefront connected in Business Manager.** A storefront created outside Business Manager may need connecting before PD and Storefront Preview see it; check the official docs (section 7) for the current steps.
- [ ] A valid `dw.json` (or equivalent) for `cartridge:deploy`; MRT credentials for `push` (see `b2c-cli:b2c-mrt`).
- [ ] Component missing from the PD palette: regenerate, validate, redeploy to the active code version, hard-refresh PD. Also check the registry entry exists.
- [ ] Block renders empty: the exported `loader` is not a function, or the attribute is read from the wrong place. Attributes are at `componentData.data.*` in loaders.
- [ ] Every component needs a `fallback` export.
- [ ] Render PD content in route loaders with `fetchPageWithComponentData` (server-side), not in client effects. `<Region>` takes `page` (and no `componentData`).
- [ ] Node >= 24 and pnpm >= 10.28; run `sfnext` as `pnpm sfnext ...` from the project root.

---

## 5. Vocabulary

| Term | Meaning |
| --- | --- |
| Page type | Layout definition with named regions (`@PageType` on a route's metadata class) |
| Component type | Reusable block with merchant-editable attributes (`@Component`) |
| Region | Named slot that accepts child components (`@RegionDefinition`, rendered by `<Region>`) |
| Aspect / dynamic page | Template page driven by runtime attributes, such as PDP or PLP (`supportedAspectTypes`) |
| Generated cartridge | `cartridges/app_storefrontnext_base/cartridge/experience/` JSON; regenerate, never hand-edit |
| Static registry | Generated map of `<Group>.<typeId>` to lazy component imports and loader/fallback flags |

---

## 6. Where this skill ends

This skill produces components, metadata and a deployed palette. Placing blocks on a specific page, aspect types and critical regions are covered by `storefront-next:sfnext-page-designer`; token changes by `storefront-next:sfnext-theming`.

---

## 7. Official docs

- Page Designer with Storefront Next: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-page-designer.html
- MRT Data Store: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-mrt-data-store.html
- Connect an existing storefront: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-connect-storefront.html
- CLI reference: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-cli.html
- Agentic B2C Developer Toolkit: https://salesforcecommercecloud.github.io/b2c-developer-tooling/llms.txt
