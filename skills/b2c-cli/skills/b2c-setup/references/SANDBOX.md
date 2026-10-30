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

## 2. Load Sample Data

Import a storefront dataset and rebuild its search indexes: [storefront datasets](DATASETS.md).

```bash
b2c job import ./storefront-datasets/marketstreet --show-log
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
