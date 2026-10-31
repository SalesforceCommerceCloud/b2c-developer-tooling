# Storefront Next Setup

Create the storefront on the instance, generate the project code, and fill in the project's `.env`. For the storefront record itself (create or import, moving to another instance), see `b2c-cli:b2c-storefronts`.

## 1. API Client for the CLI

Business Manager storefront setup needs only the user's roles. Creating a storefront from the CLI (`b2c mrt project create --mrt-backend scapi`) and the SCAPI MRT commands need an Account Manager API client. The client that storefront setup creates does not have the storefront scopes, so do not use it for these commands.

Check the configured client first:

```bash
b2c setup inspect
b2c mrt project list --mrt-backend scapi
```

If the client is missing or the call returns 401/403, create or update one. Creating a client requires browser sign-in with the Account Manager **API Administrator** or **Account Administrator** role and adds a credential to the organization. **Before creating it, show the user every value (organization, roles, tenant filter, scopes, active) and wait for explicit approval.** The full procedure is in `b2c-cli:b2c-am` (Create Client).

```bash
b2c am clients create --user-auth \
  --name "Storefront automation" \
  --orgs <org-id> \
  --password "<12+ character secret>" \
  --roles SALESFORCE_COMMERCE_API \
  --role-tenant-filter "SALESFORCE_COMMERCE_API:abcd_001" \
  --scopes "mail,roles,tenantFilter,openid,sfcc.storefront.storefronts.rw,sfcc.storefront.environments.rw,sfcc.storefront.deployments.rw,sfcc.jobs.rw,sfcc.sites" \
  --default-scopes "mail,roles,tenantFilter,openid,sfcc.storefront.storefronts.rw,sfcc.storefront.environments.rw,sfcc.storefront.deployments.rw,sfcc.jobs.rw,sfcc.sites" \
  --active
```

| Scope                             | Used by                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| `sfcc.storefront.storefronts.rw`  | `mrt project create`, `get`, `list`, `update`, `delete`     |
| `sfcc.storefront.environments.rw` | `mrt env` and `mrt env var` commands                        |
| `sfcc.storefront.deployments.rw`  | `mrt bundle` commands and `sfnext push --mrt-backend scapi` |
| `sfcc.jobs.rw`, `sfcc.sites`      | Dataset import, `Reindex`, `sites list`                     |

Add the tenant ID of every instance the client should reach to the tenant filter (`abcd_001,abcd_002`). Save the client ID and secret with `short-code` and `tenant-id` in the instance configuration (`b2c-cli:b2c-config`); never print the secret. Client management: `b2c-cli:b2c-am`. Scope reference: [Authentication guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.md) (`b2c docs read guide-authentication`).

The user who runs storefront setup, or whose login is the storefront's `user-id`, also needs the **Managed Runtime User** or **Managed Runtime Admin** role in Account Manager and Business Manager access to storefronts (Business Administrator, or a role with read-write access to storefronts).

## 2. Create the Storefront

```bash
b2c mrt project create "Market Street" --site MarketStreet --mrt-backend scapi
b2c mrt project get -p <storefront-id> --mrt-backend scapi   # until setupStatus is success
```

Setup takes up to 30 minutes and creates the MRT project and environment, the storefront's Account Manager and SLAS clients, and eCDN. The response's `storefrontId` is the MRT project ID; it differs from the storefront name.

## 3. Generate the Project Code

Use the `sfnext` CLI from `@salesforce/storefront-next-dev`. Other `sfnext` commands run from the project's own dependency (`pnpm sfnext ...`); `create-storefront` runs before a project exists, so run it with `pnpm dlx` outside any project:

```bash
pnpm dlx @salesforce/storefront-next-dev create-storefront -n market-street -V fashion --defaults
```

| Flag                    | Use                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `-n, --name`            | Project folder name                                                                                                                              |
| `-V, --vertical`        | Template vertical: match the dataset (`fashion` for Market Street, `cosmetic` for Beauty Next, `foundations`, `footwear`, `furniture`, `luxury`) |
| `-b, --template-branch` | Template release tag; pin it to match the [dataset](DATASETS.md) version                                                                         |
| `-d, --defaults`        | Skip prompts and use the template's `.env.default` values                                                                                        |
| `-o, --output-dir`      | Parent directory for the project                                                                                                                 |

Without `--defaults`, the command prompts for extensions and each configuration value. `.env.default` points to a public demo instance, so a project generated with defaults runs but does not use the user's instance until the `.env` is replaced (step 4).

```bash
cd market-street
pnpm install
pnpm run dev
```

Template features: [Storefront Next Template Features](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-template-compare.md) (`b2c docs read sfnext/sfnext-template-compare`). `sfnext` command reference: [Command-Line Interface (CLI) Reference](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-cli.md) (`b2c docs read sfnext/sfnext-cli`). For project-level setup and configuration, use the `storefront-next:sfnext-project-setup` skill if it is installed.

## 4. Get the `.env` File

**Business Manager is the only source of the complete file.** On the storefront's detail page (**Administration > Storefronts > _storefront_**), **Download .env** saves `env.txt` with the instance settings, MRT project and environment IDs, and the storefront's Account Manager and SLAS credentials. Replace the project's `.env` with its contents.

The client secrets in that file can be downloaded only once; later downloads omit them. Ask the user to download it; do not read, print, or commit its secrets. Keep `.env` out of source control.

No CLI command or API returns the file or its secrets: the Storefronts API returns no credentials, MRT environment variable values are masked, and SLAS client secrets are masked. If the download is not available, rebuild the non-secret values from the instance:

| `.env` key                                                   | Source                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `MRT_PROJECT`                                                | `storefrontId` from `b2c mrt project list --mrt-backend scapi`                                    |
| `MRT_TARGET`                                                 | Environment ID from `b2c mrt env list -p <project> --mrt-backend scapi`                           |
| `PUBLIC__app__commerce__api__clientId`                       | SLAS client named `Automated Storefront Step: <storefront name>` in `b2c slas client list --json` |
| `PUBLIC__app__commerce__api__organizationId`                 | `f_ecom_<tenant-id>`, for example `f_ecom_abcd_001`                                               |
| `PUBLIC__app__commerce__api__shortCode`                      | The instance's SCAPI short code                                                                   |
| `PUBLIC__app__defaultSiteId`, `PUBLIC__app__commerce__sites` | The storefront's sites (`b2c sites list`)                                                         |

The storefront's SLAS client is private. A lost secret cannot be read back: rotate it with `b2c slas client update <client-id> --secret <new-secret>` (confirm first, then update `COMMERCE_API_SLAS_SECRET` wherever the old secret is set, including the MRT environment), or create a separate SLAS client for local development (`b2c-cli:b2c-slas`).

## 5. Deploy

Push from the project with the template's `push` script and the MRT project and environment from `.env`:

```bash
pnpm sfnext push --project <storefront-id> --environment <environment-id> --mrt-backend scapi --wait
```

`--mrt-backend scapi` uses the API client from step 1 (`SFCC_OAUTH_CLIENT_ID` / `SFCC_OAUTH_CLIENT_SECRET`, short code, tenant ID); without it, `push` uses an MRT API key. See [Deploy Storefront Next to MRT](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-push-mrt-auto.md) (`b2c docs read sfnext/sfnext-push-mrt-auto`) and `b2c-cli:b2c-mrt`.

## Salesforce Guides

- [Create Storefront Next with SCAPI](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-scapi-create-storefront.md) (`b2c docs read sfnext/sfnext-scapi-create-storefront`) — API client, create, generate, deploy
- [Create Storefront Next in Business Manager with Local Code](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm.md) (`b2c docs read sfnext/sfnext-quick-start-create-bm`)
- [Create Storefront Next with a GitHub Repository](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm-github.md) (`b2c docs read sfnext/sfnext-quick-start-create-bm-github`)
- [Explore Storefront Next Code Locally](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-sf.md) (`b2c docs read sfnext/sfnext-quick-start-create-sf`) — demo instance, no setup
- [Automate Storefront Administration with APIs](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-api.md) (`b2c docs read sfnext/sfnext-mrt-api`) — storefront API scopes
