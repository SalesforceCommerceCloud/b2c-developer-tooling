# Business Manager Integration

How code becomes something merchants can use. The long-form version is the "Business Manager Integration" section of `docs/README-PAGE-DESIGNER.md`.

## What gets generated

`pnpm cartridge:generate` (also part of `pnpm build`) scans your decorators and writes JSON under `cartridges/app_storefrontnext_base/cartridge/experience/`:

| Folder | Source | Content |
|--------|--------|---------|
| `components/<group>/<typeId>.json` | `@Component` + `@AttributeDefinition` + `@RegionDefinition` | Palette entries and their attribute editors |
| `pages/<name>.json` | `@PageType` + `@RegionDefinition` on a route | Page templates, with `route` and `aspectTypeIds` |
| `aspects/*.json` | aspect types (`pdp`, `plp`) | Aspect definitions for product and category pages |

Never hand-edit these files; regenerate. `pnpm cartridge:validate` checks them against the schemas. `pnpm cartridge:deploy` uploads the cartridge; `pnpm cartridge:deploy -- --delete` clears old cartridge files first.

The first time you set up an instance, `sfnext setup-base-cartridge --slas-client-id <id>` registers what the base cartridge needs on your SLAS client (see `docs/README-EMAIL-CARTRIDGE.md` in your project and `b2c-cli:b2c-slas`).

## `route` and `aspectTypeIds`

The generated page JSON carries two fields that tie a route to Business Manager:

- `route`: the URL pattern Business Manager loads in its preview iframe, with `:param` placeholders replaced by the product, category or search term the merchant selected (for example `/:siteId/:localeId/product/:productId`, `/:siteId/:localeId/category/:categoryId`, `/:siteId/:localeId`). It comes from the route file, so a renamed route file changes it on the next generate.
- `aspectTypeIds`: from `@PageType.supportedAspectTypes`. It decides which page templates are offered when a merchant creates a page for a product (`pdp`) or category (`plp`). An empty array means the template is for a fixed page.

The route's loader must fetch with the same aspect the decorator advertises (`fetchPageWithComponentData(args, { aspectType: 'pdp', productId })` with `supportedAspectTypes: ['pdp']`). This cross-file agreement is the most common page-level bug and produces no error, only the wrong template in Business Manager.

## Merchant setup checklist

After deploying the cartridge:

1. Make sure the cartridge is on the cartridge path of the site and the active code version holds the upload.
2. If the storefront was created outside Business Manager, connect it to Business Manager so Page Designer and Storefront Preview can see it (Administration > Sites > Storefronts > Connect Existing; needs an administrator role; confirm current steps in the Salesforce Storefront Next documentation).
3. Merchant Tools > Content > Page Designer: create a page, choose the template (page type) that matches the route, add components to its regions.
4. For aspect pages, assign the page to the product or category; for fixed pages, use the `pageId` your loader requests (for example `homepage`, `aboutus`).
5. Publish, then check the storefront. A `null` page (missing or unpublished) renders empty regions rather than an error.

## Design vs preview mode

Business Manager opens your storefront with `mode` and `pdToken` query parameters. `fetchPageFromLoader` switches to the page Business Manager specifies while in these modes, and `PageDesignerInit` blocks link navigation in edit mode. Keep both; neither needs changes when you add components.

## Where to look next

- Component missing or empty: [Troubleshooting](TROUBLESHOOTING.md)
- Deploy credentials and code versions: `b2c-cli:b2c-code`, `b2c-cli:b2c-webdav`
- Pushing the storefront bundle itself: `storefront-next:sfnext-deployment`
