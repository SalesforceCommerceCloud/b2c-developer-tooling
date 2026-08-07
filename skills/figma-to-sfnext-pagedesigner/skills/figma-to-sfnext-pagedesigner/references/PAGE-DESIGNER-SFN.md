# Page Designer + Storefront Next — mental model & gotchas

> **Purpose:** background reference for the `figma-to-sfnext-pd` skill. It teaches the mental model, developer workflow, and gotchas for exposing React components to Page Designer in a Storefront Next project. The skill reads this file during its pre-flight step.

---

## 1. Related tooling

Salesforce's official agent-skill plugins cover adjacent workflows and are worth installing alongside this skill:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install storefront-next   # sf.next patterns incl. Page Designer decorators
claude plugin install b2c-cli           # deploys, jobs, WebDAV, sandboxes
claude plugin install b2c               # backend cartridge patterns
# optional:
claude plugin install b2c-dx-mcp        # MCP server (SCAPI schema discovery, MRT)
claude plugin install storefront-next-figma  # Figma design-kit sync workflows
```

⚠️ **Do NOT use the deprecated `sfnext_*` MCP tools** (e.g. `sfnext_add_page_designer_decorator`). They predate Storefront Next 1.0 GA and are superseded by the `storefront-next` plugin above.

When uncertain about anything below, fetch the official docs (Section 7) — this feature area is young and moving.

---

## 2. Mental model — how Page Designer connects to Storefront Next

Page Designer (PD) is the visual editor in Business Manager where merchants build pages by dragging **component types** into **page-type regions**. Classically (SFRA), developers hand-authored JSON meta-definition files + ISML render scripts in a cartridge.

**Storefront Next changes the authoring model:** your React components ARE the Page Designer components. No separate ISML versions. The bridge is **component metadata**:

1. You annotate React components in `src/` with TypeScript **decorators**: `@Component`, `@PageType`, `@Aspect`.
2. The `sfnext` CLI **scans `src/` for those decorators and generates the classic PD JSON metadata** into `cartridge/cartridge/experience/` (separate files for components, page types, aspects).
3. That generated cartridge is deployed to the B2C instance, which is what makes your components appear in the Page Designer visual editor for merchants.
4. At runtime, the storefront renders PD pages via **prebuilt page manifests** served from the **MRT Data Store** (not assembled per shopper request), and/or the **`shopperExperience`** SCAPI client for page/content lookups.

So there are two sync loops to keep straight:
- **Dev-time loop (you):** decorated components → generated metadata cartridge → deployed to B2C. Keeps the *palette of available components* in PD current.
- **Merchant-time loop (automatic):** merchant edits pages in PD → system job prebuilds manifests → pushed to MRT Data Store → storefront reads them. Keeps the *page content* current.

---

## 3. Developer workflow

### Author
Create/modify a React component, annotate with the PD decorators (`@Component` for component types, `@PageType` for page layouts with regions, `@Aspect` for dynamic page types like PDP/PLP templates). The `storefront-next` plugin skill has the current decorator API — follow it rather than guessing attribute schemas.

### Generate + deploy metadata
```bash
pnpm sfnext generate-cartridge   # scans src/ decorators → JSON metadata in cartridge/cartridge/experience/
pnpm sfnext deploy-cartridge     # uploads cartridge to B2C Commerce (reads dw.json / SDK config)
```
Requires valid B2C credentials resolvable by the tooling SDK (`dw.json`, env vars, or CLI flags).

### Keep metadata in sync automatically (recommended once stable)
```ts
// config.ts
export const GENERATE_AND_DEPLOY_CARTRIDGE_ON_MRT_PUSH = true; // default: false
```
With this on, every `pnpm sfnext push` (MRT deploy) first regenerates and redeploys the cartridge metadata — code on MRT and component palette in PD can't drift.

### Deploy the storefront itself
```bash
pnpm sfnext push -e <mrt-environment> -w
```

---

## 4. Runtime & publishing (what merchants/admins do — you'll get support questions)

- Merchant authors PD content on **staging**. A system job (`sfcc-generate-and-push-page-manifests`) runs **every 5 minutes**, prebuilds each PD page, and pushes manifests to the MRT Data Store. Manifests are never authored manually.
- **Staging → production:** admin replicates; the `sfcc-push-page-manifests` job runs automatically on production after replication. Then verify on the storefront.
- **Edits made directly on production are NOT picked up automatically.** Fix: Business Manager → Administration → Operations → Jobs → run `sfcc-generate-and-push-page-manifests` manually, confirm success in Job History.
- This manifest mechanism is **Storefront Next only** — it does not apply to PWA Kit, SFRA, or SiteGenesis. Don't apply old PWA Kit PD integration patterns (`page-designer.html` docs) to sf.next projects.

---

## 5. Prerequisites & gotchas checklist

- [ ] **Storefront connected in BM.** If the storefront was created via CLI/MRT API (not through Business Manager), PD and Storefront Preview can't see it until you connect it: BM → Administration → Sites → Storefronts → **Connect Existing** (needs Business Administrator-level role). BM-created storefronts are connected already.
- [ ] `dw.json` (or equivalent env config) present and valid for `deploy-cartridge`.
- [ ] MRT env vars set for `push`: `SFCC_MRT_PROJECT`, `SFCC_MRT_ENVIRONMENT`, `SFCC_MRT_API_KEY` (or credentials file).
- [ ] Component not showing in PD editor? In order: regenerate cartridge → redeploy cartridge → confirm cartridge upload succeeded on the active code version → hard-refresh PD.
- [ ] Content edits not showing on storefront? Check which instance was edited (direct-prod trap above) and the manifest job history; remember up to ~5 min staging job latency.
- [ ] Rendering PD content in routes: fetch via the **`shopperExperience`** client from `@salesforce/storefront-next-runtime/scapi`, in a **server loader** (never client-side useEffect — sf.next is server-load-everything).
- [ ] Node ≥ 24.13, pnpm ≥ 10.28; `sfnext` runs as `pnpm sfnext …` from project root, never installed globally.

---

## 6. Vocabulary quick reference

| Term | Meaning |
|---|---|
| Page type | Layout definition with named regions merchants fill with components |
| Component type | Reusable building block with merchant-editable attributes |
| Region | Named slot in a page/component that accepts child components |
| Aspect / dynamic page | Template page driven by runtime attributes (e.g. PDP/PLP templates) |
| Decorators (`@Component`, `@PageType`, `@Aspect`) | TS annotations on React components that the CLI compiles into PD metadata |
| Generated cartridge | `cartridge/cartridge/experience/` JSON produced by `generate-cartridge` — never hand-edit; regenerate |
| Page manifest | Prebuilt PD page description stored in the MRT Data Store, read at render time |
| MRT Data Store | MRT-side storage syncing site preferences + PD manifests from B2C |
| `shopperExperience` | SCAPI client namespace for fetching PD pages/content in loaders |

---

## 7. Official docs (fetch when uncertain — this area changes fast)

- Page Designer with Storefront Next: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-page-designer.html
- MRT Data Store & manifest jobs: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-mrt-data-store.html
- Connect an existing storefront: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-connect-storefront.html
- CLI reference (generate-cartridge / deploy-cartridge / push): https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-cli.html
- SCAPI client (shopperExperience): https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-api-integration.html
- Agentic B2C Developer Toolkit (plugins/MCP): https://salesforcecommercecloud.github.io/b2c-developer-tooling/
- Classic PD concepts (background only — SFRA-era): https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-dev-for-page-designer.html
