---
name: scaffold-app
description: >-
  Generate complete commerce app scaffolding with architecture-aware structure.
  Use immediately when users mention "new app", "create app", "scaffold", "starter template",
  or describe building a commerce integration (tax, payment, shipping, loyalty, etc.).
  Supports three architectures: UI-only (frontend components), Backend-only (SFCC hooks/services),
  and Fullstack (both). Don't wait for explicit "scaffold" request - trigger proactively when
  starting any new commerce app from scratch.
---

# Scaffold Commerce App

Generate a complete starter structure for commerce apps with architecture-appropriate files and templates.

> **Cross-tool note:** References to `/skill-name` (e.g., `/package-app`, `/generate-service-impex`) are Claude Code invocation syntax. If using another assistant, read and follow the corresponding `.claude/skills/<skill-name>/SKILL.md` file instead.

## Architecture Types

Three patterns optimize for different integration needs:

**UI-only** - Storefront components without backend
- Use when: Adding visual features, widgets, or UI enhancements that don't need server-side logic
- Creates: storefront-next/, components, hooks, no cartridges
- Example: Product review display, image gallery, custom carousel

**Backend-only** - Server-side logic without UI
- Use when: Integrating external services, processing data, or Business Manager functionality
- Creates: cartridges/, hooks.json, services, impex/, no storefront-next
- Example: Tax calculation API, payment processor, shipping rates

**Fullstack** - Both UI and backend
- Use when: Complete features needing both presentation and business logic
- Creates: Both storefront-next/ and cartridges/
- Example: Loyalty program with points display and calculation

## Workflow

### 1. Determine Architecture

If the user's description clearly indicates type, proceed directly. Otherwise ask:

"What type of app are you building?
1. UI-only (frontend components)
2. Backend-only (SFCC hooks/services)  
3. Fullstack (both UI and backend)"

### 2. Collect Information

**All apps need:**
- Domain (tax, payment, shipping, gift-cards, ratings-and-reviews, loyalty, search, address-verification, analytics, approaching-discounts, fraud)
- App name (kebab-case, unique identifier) - **CRITICAL:** This will be used as the folder name and must match the "id" field in manifest.json
- Display name (human-readable with vendor)
- Version (typically 1.0.0)
- Description (one sentence)
- Publisher name and URL
- Minimum SFNext version (optional - semver `X.Y.Z` or `X.Y.Z-prerelease`, if the app requires a minimum Storefront Next version)
- Maximum SFNext version (optional - semver, inclusive; only set if you've confirmed an incompatibility — e.g., a known-breaking future major release)
- Minimum SFRA version (optional - semver `X.Y.Z` or `X.Y.Z-prerelease`, if the app requires a minimum SFRA version) — **only ask this if a minimum SFNext version was provided above.** SFRA is additive to SFNext and may never be declared alone; don't offer an SFRA-only path.
- Maximum SFRA version (optional - semver, inclusive; same guidance as above; only applicable if SFRA min version was set)

> When provided, add `storefrontSupport` to both `commerce-app.json` (inside the ZIP) and the root manifest entry. Values must match. Each storefront key (`sfnext`, `sfra`) accepts `minVersion` (required when the key is present) and an optional `maxVersion`. `sfra` requires `sfnext` to also be present — never generate a `storefrontSupport` object with `sfra` but no `sfnext`.
- Additional context (optional - docs, requirements, API details)

**Folder Structure:** Apps must be at `{domain}/{appName}/` where `{appName}` matches the "id" field. Installation URL: `https://raw.githubusercontent.com/{owner}/{repo}/{tag}/{domain}/{appName}/{zipFileName}`

**UI-only and Fullstack also need:**
- **Target IDs:** All target IDs use the `sfcc.` prefix. Commerce apps typically span multiple UI targets (e.g., checkout flow + order summary + header). Ask which targets the app needs rather than assuming single-component usage. Common patterns:
  - Tax/shipping: `sfcc.checkout.shippingOptions`, `sfcc.checkout.orderSummary`, `sfcc.orderSummary.tax`
  - Payment: `sfcc.checkout.payment`, `sfcc.checkout.payment.paymentMethods`, `sfcc.checkout.placeOrder.before`
  - Loyalty: `sfcc.header.before.cart`, `sfcc.checkout.orderSummary`, `sfcc.orderSummary.adjustments`
  - Reviews: `sfcc.pdp.reviews.summary`, `sfcc.pdp.reviews.list`, `sfcc.pdp.reviews.form`, `sfcc.productCard.reviews.rating`

**Backend-only and Fullstack also need:**
- Cartridge name (convention: `int_<vendor>_<appname>`, max 50 characters)
- Service ID (dotted notation: `vendor.appname.api`)

UI-only apps skip cartridge/service questions since they don't need backend infrastructure.

### 3. Create Structure

Use the creation script when available:
```bash
bash scripts/create_structure.sh <domain> <appName> <appName> <version> <cartridgeName>
```

Or create manually based on architecture:

```bash
mkdir -p <domain>/<appName>/commerce-<appName>-app-v<version>
cd <domain>/<appName>/commerce-<appName>-app-v<version>
mkdir -p icons

# All apps get these base directories
mkdir -p app-configuration  # Required for tasksList.json

# UI-only OR Fullstack: Add storefront (extension system)
mkdir -p storefront-next/src/extensions/<appName>/{components,hooks,context,providers,routes,tests}
mkdir -p storefront-next/src/extensions/<appName>/locales/en-US

# Backend-only OR Fullstack: Add cartridges and impex
mkdir -p cartridges/site_cartridges/<cartridgeName>/cartridge/scripts/{hooks,helpers,services}
mkdir -p cartridges/site_cartridges/<cartridgeName>/test/{mocks,unit}
mkdir -p impex/{install/meta,install/sites/SITEID,uninstall}

# Fullstack only: Add Business Manager cartridge
mkdir -p cartridges/bm_cartridges/bm_<appName>

# Every cartridge root needs an empty .project file (required for b2c cartridge discovery)
touch cartridges/site_cartridges/<cartridgeName>/.project
touch cartridges/bm_cartridges/bm_<appName>/.project
```

**`.project` files:** Every cartridge root (each immediate child of `cartridges/site_cartridges/` and `cartridges/bm_cartridges/`) MUST contain a `.project` file — required for b2c cartridge discovery. `create_structure.sh` creates these empty automatically. If a developer later imports a real Eclipse-generated `.project` file (non-empty), leave it as-is — don't overwrite it.

This structure enables the installation URL pattern and allows side-by-side development of different versions.

### 4. Generate Files

Read templates from `assets/templates/`, replace placeholders, and write to app directory.

**Template variables:**
- `{{appName}}`, `{{displayName}}`, `{{version}}`, `{{description}}`
- `{{domain}}`, `{{publisherName}}`, `{{publisherUrl}}`
- `{{cartridgeName}}`, `{{serviceId}}` (backend only)

**All apps:**
- `commerce-app.json` (from template: `assets/templates/commerce-app.json.tmpl`)
- `README.md` (from template: `assets/templates/README.md.tmpl`)
- `app-configuration/tasksList.json` (required - post-installation checklist for merchants)

**tasksList.json structure:**
Generate merchant-facing tasks that guide post-installation setup and verification. These are steps merchants complete after installing the app.

```json
[
  {
    "name": "Configure API Credentials",
    "description": "Add your [vendor] API key in Business Manager > Merchant Tools > Custom Site Preferences.",
    "link": "/on/demandware.store/Sites-Site/default/ViewApplication-BM?SelectedMenuItem=site-prefs_custom_prefs",
    "taskNumber": "1"
  },
  {
    "name": "Test Integration in Sandbox",
    "description": "Process a test order to verify the integration is working correctly.",
    "taskNumber": "2"
  }
]
```

Tailor tasks to domain for merchant post-installation:
- **Tax/Shipping/Payment:** Add API credentials, configure service settings, test checkout transactions
- **Loyalty/Gift Cards:** Configure points rules, test balance lookups, verify redemption
- **UI-only apps:** Verify components appear on storefront, check responsive behavior
- **Fullstack:** Both UI verification and backend configuration steps

**Backend/Fullstack apps:**
- `cartridges/site_cartridges/<cartridgeName>/package.json` (template: `package.json.tmpl`) - **Must include `"hooks": "cartridge/scripts/hooks.json"` field** to establish contract between app manifest and hook registry
- `cartridges/site_cartridges/<cartridgeName>/cartridge/scripts/hooks.json` (template: `hooks.json.tmpl` - adjust for domain) - **Use explicit script paths, never return undefined from hooks (always return dw.system.Status)**
- Hook script (template: `hook-script.js.tmpl`) - **Use `require()` not `importPackage()` for module loading**
- Service wrapper (template: `service-wrapper.js.tmpl`)
- Helper and test files (inline templates in Step 4 reference below)
- **Both install and uninstall:** `impex/install/services.xml` and `impex/uninstall/services.xml` (templates: `services-install.xml.tmpl`, `services-uninstall.xml.tmpl`) - **Dual IMPEX structure ensures safe merchant lifecycle management and proper cleanup on app removal**

For site preferences, invoke `/generate-site-preferences-impex` skill.

**UI/Fullstack apps (Storefront Next Extension):**
- `storefront-next/src/extensions/<appName>/target-config.json` - Component registration with targetId
- `storefront-next/src/extensions/<appName>/index.ts` - Barrel file exports
- TypeScript components (`.tsx`) with prop interfaces and i18n support
- **All three locales:** `locales/en-US/translations.json`, `locales/en-GB/translations.json`, `locales/it-IT/translations.json` - Internationalization (must use useTranslation, not hardcoded strings)
- Test files (`.test.tsx`) for component testing (vi.mock MUST be outside describe/it blocks)

**Important:** All storefront files must use TypeScript (.ts/.tsx), not JavaScript. The extension system requires:
- Proper type annotations and interfaces
- Components and providers MUST use default export (extension system uses dynamic imports)
- Use `import type` for ALL types/interfaces (React types, custom types); regular `import` only for runtime values
- Context providers registered in target-config.json (not inline wrapping)
- Unit tests (.test.tsx) for coverage enforcement
- Always use `useTranslation()` - never hardcode English strings; namespace uses ext + PascalCase (e.g., `useTranslation('extProductReviews')`), JSON root key uses camelCase (e.g., `"productReviews"`)
- **Generate all three locales:** en-US, en-GB, it-IT with identical key structures
- **Configuration:** Use `useConfig<AppConfig>()` with direct property access (`appConfig.extension?.appName?.key || defaultValue`), NEVER use `.get()` method. PUBLIC__ env vars with double underscores (e.g., `PUBLIC__app__extension__appName__apiKey`)
- **Follow Storefront Next ESLint and Prettier rules:** semicolons, single quotes, 4-space indentation, trailing commas (ES5), parentheses around arrow params, bracket spacing, JSX bracket same line, no hardcoded Tailwind colors, no duplicate imports, no array index as React key, consistent type imports, no console statements, printWidth 120, useCallback formatting (see references/storefront-plugin-templates.md for complete config)
- **Use 4-space indentation** for all TypeScript, JSX, and JSON files (1 level = 4 spaces)
- Verify target IDs exist before using (grep for UITarget in codebase or check the complete target ID reference)

**Critical Exclusions (DO NOT generate):**
- ❌ No Tailwind config files (Storefront Next uses `@theme inline` with CSS 4)
- ❌ No hardcoded Salesforce version numbers in dependencies
- ❌ No direct color/spacing values in components (use theme variables)
- ❌ No `importPackage()` in hook implementations (use `require()`)

See `references/storefront-plugin-templates.md` for complete extension templates.

### 5. Domain-Specific Hooks

Configure hooks.json based on domain:
- **Tax:** `app.tax.calculate`, `app.tax.commit`, `app.tax.cancel`
- **Payment:** `app.payment.processor.<appName>`
- **Shipping:** `app.shipping.calculate`
- **Loyalty:** `app.loyalty.calculate`, `app.loyalty.points`
- **Gift Cards:** `app.payment.processor.<appName>`, `app.giftcard.balance`
- **Ratings/Reviews:** `app.data.enrich`

### 6. Validate and Guide

Check:
- [ ] All required directories exist
- [ ] commerce-app.json has correct version and metadata
- [ ] README created
- [ ] **app-configuration/tasksList.json created** with merchant post-installation tasks
- [ ] Backend apps: cartridge files, hooks.json (with explicit script paths), **both install/ and uninstall/ impex directories**
- [ ] Backend apps: package.json includes `"hooks": "cartridge/scripts/hooks.json"` field
- [ ] Backend/Fullstack apps: every cartridge root (`cartridges/site_cartridges/<cartridgeName>/`, `cartridges/bm_cartridges/bm_<appName>/`) has a `.project` file (empty is fine)
- [ ] Backend apps: Hook implementations use `require()` not `importPackage()`, always return dw.system.Status
- [ ] UI apps: storefront-next structure with target-config.json, TypeScript components, tests
- [ ] UI apps: index.ts barrel file, **all three locale files** (en-US, en-GB, it-IT), i18n usage with useTranslation
- [ ] UI apps: Configuration uses `useConfig<AppConfig>()` with **direct property access** (never `.get()` method), PUBLIC__ env vars
- [ ] UI apps: Verify target IDs exist in codebase (check Complete Target ID Reference)
- [ ] UI apps: ESLint and Prettier compliance (semicolons, single quotes, 4-space indent, trailing commas ES5, parentheses around arrow params, bracket spacing, JSX bracket same line, no duplicate imports, no array index keys, import type, no hardcoded colors, no console)
- [ ] UI apps: **No Tailwind config files, no hardcoded theme values**
- [ ] .gitignore updated to exclude `**/commerce-*-app-*/`

Provide next steps:

```
✅ App structure created at: <domain>/<appName>/commerce-<appName>-app-v<version>/

Next steps:
1. **Review and customize app-configuration/tasksList.json** - update tasks to match your implementation
2. Customize generated files for your use case
3. {UI: Implement components | Backend: Implement hooks/helpers | Fullstack: Implement both}
4. {Backend/Fullstack: Update service credentials and test with SFCC}
5. Write tests
6. **Add app icon to icons/ directory** (PNG 512x512px recommended). Icon filename becomes the `iconName` in root manifest (e.g., `icons/avalara.png` → `"iconName": "avalara.png"`)
7. Use /package-app when ready
8. Use /validate-app before submission
9. Delete extracted directory before committing (commit only the ZIP)

⚠️  Only commit: <appName>-v<version>.zip, catalog.json (if new), and update commerce-apps-manifest/manifest.json

Get started: cd <domain>/<appName>/commerce-<appName>-app-v<version>
{Backend/Fullstack: cd cartridges/site_cartridges/<cartridgeName> && npm install}

📚 Related skills for implementation guidance:
{UI/Fullstack: - Check references/storefront-plugin-templates.md for complete UI patterns and ESLint rules}
{Backend/Fullstack: - Use /generate-service-impex for additional service configurations}
{Backend/Fullstack: - Use /generate-site-preferences-impex for configuration options}
{Backend/Fullstack: - Use /generate-custom-object-impex for data storage needs}
{All: - Use /validate-impex to check XML files before importing}
```

## Best Practices

- Use templates from `assets/templates/` - they include proper structure and error handling
- **Multi-target approach:** Commerce apps typically span multiple UI targets, not single components. Ask about all needed targets (e.g., checkout flow + order summary + header) and generate all component shells together.
- **Task list and icons:** Always generate `app-configuration/tasksList.json` with merchant-facing post-installation tasks (credential setup, testing, verification). Remind vendors to customize the task list for their app and **add app icon to icons/ directory before submission** (PNG, 512x512px recommended).
- **UI-only apps:** Use TypeScript (.tsx) for all components with proper type annotations. Focus on component reusability with clear prop interfaces. Must include tests (.test.tsx) for coverage enforcement. Always use `useTranslation()` for i18n - never hardcode strings. **Generate all three locales** (en-US, en-GB, it-IT) with identical key structures. Configuration uses `useConfig<AppConfig>()` with **direct property access** (`appConfig.extension?.appName?.key || defaultValue`), never `.get()` method. PUBLIC__ env vars follow double underscore convention. **Follow Prettier and ESLint rules:** 4-space indentation, trailing commas, parentheses around arrow params, single quotes, consistent type imports, no duplicate imports, no array index keys, no hardcoded Tailwind colors, no console statements, useCallback proper indentation. **Never generate Tailwind config files** - use `@theme inline`.
- **Storefront extension system:** Register components via target-config.json using `targetId`, `path`, `order` fields. Context providers go in `contextProviders` array, not inline wrapping. Locales use `locales/{locale}/translations.json` structure. **Always verify targetId exists** using the Complete Target ID Reference in storefront-plugin-templates.md - non-existent targets cause components to never render.
- **Backend apps:** Need comprehensive error handling and logging for production debugging. **Hook implementations must use `require()` not `importPackage()`**, always return `dw.system.Status` (never undefined). **package.json must include `"hooks": "cartridge/scripts/hooks.json"` field.** Generate **both install/ and uninstall/ impex directories** for safe merchant lifecycle management.
- **Fullstack apps:** Maintain separation - UI in storefront-next/, business logic in cartridges/
- **Naming conventions:** Cartridge names: `int_<vendor>_<product>` (max 50 characters), Service IDs: dotted notation
- **Context capture:** Document API details, auth methods, special requirements for future reference
