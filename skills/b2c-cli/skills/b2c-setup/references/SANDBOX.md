# Sandbox Setup

A development sandbox with a sample site and a Storefront Next storefront. Sandboxes have no replication; load data and set up the storefront directly.

## 1. Create and Connect

Create a sandbox only when the user asks (it can be billable); see `b2c-cli:b2c-sandbox`.

```bash
b2c sandbox create --realm abcd --ttl 0 --wait --json
```

`--ttl 0` keeps the sandbox until deleted; the default is 24 hours. The sandbox grants OCAPI and WebDAV permissions to your API client by default.

Save a connection for the new host and select it:

```bash
b2c setup instance create my-sandbox --hostname abcd-001.dx.commercecloud.salesforce.com --active
b2c setup inspect
```

See `b2c-cli:b2c-config` for credentials and the SCAPI short code and tenant ID.

### Wait for SCAPI

A new sandbox reports `started` before SCAPI serves its tenant. For roughly 10 to 20 minutes, every SCAPI call for the tenant (sites, jobs, storefronts) returns `404 Could not find requested resource`, even with a valid token. This is not an API client problem: do not change the client's roles, scopes, or tenant filter for it. A tenant filter of `<realm>_sbx` already covers new sandboxes in the realm.

Commands that need SCAPI, such as `b2c mrt project create --mrt-backend scapi` and any command run with `--api-backend scapi`, must wait. Poll until the tenant answers:

```bash
until b2c sites list -i my-sandbox --api-backend scapi >/dev/null 2>&1; do sleep 30; done
```

Today `b2c job import` and `b2c job run` fall back to WebDAV and OCAPI while SCAPI is unavailable, so start the data load (step 2) right away and poll for SCAPI afterwards. Where a command or instance uses SCAPI only, with no OCAPI fallback, the whole setup waits for SCAPI: poll first, then load data.

## 2. Load Sample Data

Import a storefront dataset and rebuild its search indexes. `<datasets>` is a checkout of the storefront-datasets repository at the release that matches the storefront template; clone it first ([storefront datasets](DATASETS.md)).

```bash
b2c job import <datasets>/marketstreet --show-log
b2c job run Reindex --wait
b2c sites list
```

## 3. Set Up the Storefront

For Storefront Next, create the storefront for the imported site. Business Manager storefront setup also works.

```bash
b2c mrt project create "Market Street" --site MarketStreet --mrt-backend scapi
```

This needs an API client with the storefront scopes. Setup provisions the MRT project and environment, API and SLAS clients, and eCDN. It runs asynchronously; check progress with `b2c mrt project get -p <project-id> --mrt-backend scapi`.

Then generate the project code with the `sfnext` CLI (`pnpm dlx @salesforce/storefront-next-dev create-storefront`) and fill in its `.env` from the storefront's **Download .env** in Business Manager. API client, scaffolding, and `.env`: [Storefront Next setup](STOREFRONT-NEXT.md).

For a cartridge storefront, deploy the cartridges and set the site's cartridge path instead (`b2c-cli:b2c-code`, `b2c-cli:b2c-sites`).

## 4. Verify

- `b2c sites list` shows the site online.
- `b2c mrt env list -p <project-id> --mrt-backend scapi` shows the storefront's environment.
- A storefront search returns products (indexes rebuilt).
