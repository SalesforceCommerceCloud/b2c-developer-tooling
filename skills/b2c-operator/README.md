# b2c-operator

> GENERATED — DO NOT EDIT. Assembled by `scripts/assemble-personas.mjs` from skills in their home plugins.

Curated operational skills for Salesforce B2C Commerce — deploy code and activate versions, manage On-Demand Sandboxes, run and monitor jobs, retrieve and debug logs, manage eCDN/MRT edge delivery, and administer Account Manager / Business Manager access. A persona bundle drawn from the b2c-cli and b2c plugins; install instead of those, not alongside, to avoid duplicating skills.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace.

## Installation

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-operator@b2c-developer-tooling
```

> This is a curated **bundle** of skills also published in `b2c-cli` and `b2c`. Install it **instead of** those plugins, not alongside — installing both duplicates the same skills and their always-on context.

## What's included

- **`b2c-am`** (b2c-cli) — Manage Account Manager resources including API clients, users, roles, and organizations.
- **`b2c-bm-users-roles`** (b2c-cli) — Manage Business Manager users, access roles, role permissions, and per-user access keys on a B2C Commerce instance using the b2c CLI.
- **`b2c-cap`** (b2c-cli) — Manage Commerce App Packages (CAPs), also called commerce apps or apps, and commerce features using the b2c CLI.
- **`b2c-cip`** (b2c-cli) — Run analytics reports and SQL queries against B2C Commerce Intelligence data using the b2c CLI.
- **`b2c-code`** (b2c-cli) — Deploy, download, and manage cartridge code versions on B2C Commerce instances.
- **`b2c-content`** (b2c-cli) — Export, list, and validate Page Designer content from B2C Commerce libraries.
- **`b2c-debug`** (b2c-cli) — Debug B2C Commerce server-side scripts using the b2c CLI.
- **`b2c-ecdn`** (b2c-cli) — Manage eCDN zones, security settings, and edge configuration for B2C Commerce storefronts.
- **`b2c-job`** (b2c-cli) — Run and monitor jobs on B2C Commerce instances using the b2c CLI, including site archive import/export and search indexing.
- **`b2c-logs`** (b2c-cli) — Retrieve and search logs from B2C Commerce instances using the b2c CLI.
- **`b2c-mrt`** (b2c-cli) — Deploy and manage Managed Runtime (MRT) storefronts using the b2c CLI.
- **`b2c-sandbox`** (b2c-cli) — Create and manage on-demand sandboxes (ODS) for B2C Commerce using the b2c CLI.
- **`b2c-site-import-export`** (b2c-cli) — Import and export site archives containing metadata XML on B2C Commerce instances using the b2c CLI.
- **`b2c-sites`** (b2c-cli) — List storefront sites, check site status, and manage cartridge paths on B2C Commerce instances using the b2c CLI.
- **`b2c-webdav`** (b2c-cli) — List, upload, download, and manage files on B2C Commerce instances via WebDAV.
- **`sfnext-deployment`** (storefront-next) — Build and deploy Storefront Next storefronts to Managed Runtime (MRT) using the sfnext CLI.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
