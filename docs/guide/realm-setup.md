---
description: Set up a new sandbox or realm with sample storefront data, search indexes, Storefront Next storefronts, and replication from staging to production.
---

# Realm Setup

Take a new sandbox or realm from an empty instance to a working storefront with the B2C CLI and your AI assistant. Load a sample site from the storefront datasets, rebuild search indexes, set up a Storefront Next storefront, and replicate from staging to production.

The `b2c-setup` skill guides your assistant through these steps. The [B2C MCP](../mcp/) features it, and the [b2c-cli plugin](./agent-skills#available-plugins) includes it.

## Before You Start

- Configure each instance: see [Configuration](./configuration). For a realm, add a named instance for staging, production, and any development instance.
- Use an API client with access to every instance. See [Account Manager](./account-manager) and [Authentication](./authentication).
- Check the setup with `b2c setup inspect -i <instance>`.

### Protect Shared Instances

Staging, production, and development are shared instances. A site import there can change global settings, such as active locales and the instance time zone, for every site. Production and development get code and data from staging by replication; do not import site data on them directly.

Add a [Safety Mode](./safety) policy to each shared instance. With `confirm: true`, the CLI asks before an action the safety level blocks:

```json
{
  "configs": [
    {
      "name": "sandbox",
      "hostname": "abcd-001.dx.commercecloud.salesforce.com",
      "safety": {"level": "NONE"}
    },
    {
      "name": "staging",
      "hostname": "staging-abcd-example.demandware.net",
      "safety": {"level": "NO_DELETE", "confirm": true}
    },
    {
      "name": "production",
      "hostname": "production-abcd-example.demandware.net",
      "safety": {"level": "READ_ONLY", "confirm": true}
    }
  ]
}
```

See [per-instance policies](./safety#per-instance-configuration) and [confirmation](./safety#confirmation-mode). The `b2c-setup` skill also tells your assistant to name the target instance and wait for your approval before each change to a shared instance.

## Storefront Datasets

Salesforce publishes sample data for the reference storefronts in [storefront-datasets](https://github.com/SalesforceCommerceCloud/storefront-datasets). Each dataset is a site archive with a site, catalogs, price books, inventory, content, and promotions.

| Dataset directory  | Site ID        |
| ------------------ | -------------- |
| `foundations-data` | `Foundations`  |
| `marketstreet`     | `MarketStreet` |
| `beautynext`       | `BeautyNext`   |
| `footwear-data`    | `Footwear`     |
| `furniture-data`   | `Furniture`    |
| `luxury-data`      | `Luxury`       |

Releases are tagged with the Storefront Next template version they target, such as `v1.4.0`. Use the release that matches your storefront's template. Each release also attaches a ZIP per dataset.

```bash
git clone --branch v1.4.0 --depth 1 https://github.com/SalesforceCommerceCloud/storefront-datasets.git
```

`b2c job import` accepts a directory, so you do not need to zip a dataset first. Add `--split` if the upload is too large for one import. On an instance that already has sites, review the dataset's `preferences.xml` and other top-level files before you import it.

## Set Up a Sandbox

Sandboxes have no replication: import data and set up the storefront directly.

```bash
# Create a sandbox (billable) and save a connection for it
b2c sandbox create --realm abcd --ttl 0 --wait
b2c setup instance create my-sandbox --hostname abcd-001.dx.commercecloud.salesforce.com --active

# Import a dataset and rebuild search indexes
b2c job import ./storefront-datasets/marketstreet --show-log
b2c job run Reindex --wait
b2c sites list

# Create a Storefront Next storefront for the site
b2c mrt project create "Market Street" --site MarketStreet --mrt-backend scapi
```

The Foundations, Market Street, and Beauty Next datasets include a `Reindex` job. For other sites, run the system search index jobs; see [system jobs with custom request bodies](/cli/jobs#system-jobs-with-custom-request-bodies).

Storefront creation runs asynchronously. Check progress with `b2c mrt project get -p <project-id> --mrt-backend scapi`, then get the project configuration from the storefront in Business Manager. You can also use **storefront setup in Business Manager** instead of `mrt project create`; see [Storefront Next](./storefront-next#start-with-storefront-setup).

<ExamplePrompt>

> Set up my sandbox my-sandbox with the Market Street dataset for Storefront Next 1.4.0: import it, rebuild the search indexes, and create a Storefront Next storefront for the site.

</ExamplePrompt>

## Set Up a Realm

Set up staging completely, then replicate to production and development, then connect the storefront on each target.

### 1. Prepare Staging

Import your site data, or a dataset for a demo site, rebuild the search indexes, and create the storefront:

```bash
b2c job import ./storefront-datasets/marketstreet -i staging --show-log
b2c job run Reindex -i staging --wait
b2c mrt project create "Market Street" --site MarketStreet -i staging --mrt-backend scapi
```

For cartridge storefronts, deploy and activate a code version; see [code commands](/cli/code).

### 2. Replicate to Production

Replicate from staging with replication jobs in three steps: code, global data, then site data. Global data creates the site on the target, so on the first replication, run it before site data. The `b2c-replication` skill has the job definitions.

```bash
b2c job run Replicate-Code -i staging --wait --show-log
b2c job run Replicate-Global -i staging --wait --show-log
b2c job run Replicate-MarketStreet -i staging --wait --show-log
```

Replication changes production. Review what each job replicates before you run it.

### 3. Connect the Storefront

Storefronts do not replicate. Creating a storefront on production makes a second Managed Runtime project. To keep staging and production in one project, export the storefront from staging and import it on production:

```bash
b2c job export --storefront market-street -i staging --output ./storefront-export
b2c job import ./storefront-export/<archive-name> -i production --wait-for-storefront --show-log
```

The storefront import requires the `user-id` in the export to be an Account Manager user who is authorized for the target. An export made with client credentials records the API client's service user; edit `user-id` before importing. Verify with `b2c mrt env list -p <project-id> -i production --mrt-backend scapi`.

<ExamplePrompt>

> Our new realm has staging and production configured. Set up the Market Street dataset on staging with a Storefront Next storefront, then replicate it to production and connect the same Managed Runtime project there. Ask me before each change.

</ExamplePrompt>

## Troubleshooting

| Problem                                                                           | What to check                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Import fails with a generic error                                                 | Rerun with `--show-log`; the cause is in the `[DATAERROR]` lines.   |
| `There must be a root directory with the same name as the archive`                | Rename the ZIP or its root folder to match.                         |
| Search returns no products                                                        | Rebuild the search indexes on that instance.                        |
| First site replication fails with `Optimistic locking failure` or a generic error | Replicate global data first, then site data, as separate jobs.      |
| Storefront import reports a user that is not authorized                           | Set `user-id` in the exported storefront XML to an authorized user. |

When something fails after launch, see [Operations](./operations).

## Related

- [Storefront Next](./storefront-next) — environment variables, logs, and deployments after setup
- [Operations](./operations) — job health and incident investigation
- [Safety Mode](./safety) — policies and confirmation for shared instances
- [Sandbox commands](/cli/sandbox), [Job commands](/cli/jobs), [MRT commands](/cli/mrt)
