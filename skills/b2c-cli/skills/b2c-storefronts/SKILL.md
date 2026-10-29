---
name: b2c-storefronts
description: Set up and move Storefront Next (composable) storefronts between B2C Commerce instances with the b2c CLI. Use this skill whenever the user needs to choose between creating a storefront and importing one, connect a production or other instance to an existing Managed Runtime project, export or import a storefront with a site archive, or find a storefront's project configuration and credentials — even if they just say "set up my storefront on production" or "why did my storefront import fail".
---

# B2C Storefronts Skill

A Storefront Next storefront links B2C Commerce sites on an instance to a Managed Runtime (MRT) project. Setup also creates the storefront's API clients, SLAS client, eCDN configuration, and MRT environment.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (for example, `npx @salesforce/b2c-cli job export --storefront my-storefront`).

## Create or Import

Choose by whether the MRT project should already exist:

| Goal                                                                      | Use                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A new storefront with a **new** MRT project                               | Storefront setup in Business Manager, or `b2c mrt project create`          |
| Add another instance (for example, production) to an **existing** project | Export the storefront from the source instance and import it on the target |

Creating a storefront always provisions a new MRT project, even if one with the same name and sites already exists. To keep staging and production in one project, create the storefront once, then export and import it.

Storefronts do **not** replicate. Code and data replication from staging (see `b2c-cli:b2c-replication`) leaves them out, so import the storefront on each target instance.

## Create a Storefront

Business Manager storefront setup is the primary path; it also scaffolds the project configuration. To create one from the CLI over the SCAPI Storefronts API:

```bash
b2c mrt project create "My Storefront" --site MySite --mrt-backend scapi
```

Creation runs asynchronously. See the `b2c-cli:b2c-mrt` skill for SCAPI backend setup and scopes (`sfcc.storefront.storefronts.rw`).

## Move a Storefront to Another Instance

Requires B2C Commerce 26.10 or later on both instances.

```bash
# 1. Export the storefront record from the source instance (by storefront name)
b2c job export --storefront my-storefront -i staging --output ./storefront-export

# 2. Import the extracted archive directory on the target and wait for setup
b2c job import ./storefront-export/<archive-name> -i production --wait-for-storefront --show-log
```

The export extracts to `./storefront-export/<archive-name>/storefronts/<storefront-name>.xml`. It contains only the storefront record: storefront name, type, associated sites, MRT project (`mrt-site`), MRT organization (`org-slug`), and the acting `user-id`. Neither MRT environments nor bundles are copied.

The import creates the storefront and runs `sfcc-post-import-setup-storefront`. That job provisions API and SLAS clients, site state, eCDN, and a new MRT environment in the existing project. It can take 20 minutes or more. Without `--wait-for-storefront`, the command returns once the archive import finishes and setup keeps running on the instance.

### Import Requirements

The import fails, without creating anything, unless all of these hold on the target:

- **Sites exist.** Every associated site must exist on the target and not already belong to another storefront. Replicate or import the site first.
- **Name is free.** No storefront with the same name exists on the target. Do not delete a storefront to retry an import: deleting a storefront over the SCAPI backend (`mrt project delete`) removes its MRT project for every instance.
- **Same MRT organization.** The `org-slug` must match the target instance's MRT organization.
- **Authorized identity.** An import run from a Business Manager session uses that user. An API import (client credentials) uses the `user-id` in the archive, which must be an Account Manager user with a Managed Runtime role in the instance's organization.

An export made with client credentials records the API client's service user (for example, `scapi-<client-id>@...`), which fails that check on import. Before importing, set `user-id` in `storefronts/<storefront-name>.xml` to an authorized user's login.

Source repository (GitHub) links are not imported. Connect the new environment to source control separately if needed.

When the import fails, read the job log (`--show-log`, or `b2c job log sfcc-site-archive-import`). The summary error is generic (`Internal fatal error`); the cause appears as a `[DATAERROR]` line.

### Verify

```bash
# Both instances should list the same project, each with its own environment
b2c mrt env list -p my-mrt-project -i staging --mrt-backend scapi
b2c mrt env list -p my-mrt-project -i production --mrt-backend scapi
```

The MRT project ID is the `mrt-site` value in the export, not the storefront name.

## Project Configuration and Credentials

To develop locally or configure CI against a storefront, download its project configuration and credentials from the storefront's detail page in Business Manager. Use that file for the storefront project rather than copying values by hand. See the [Storefront Next guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/storefront-next.md) (`b2c docs read guide-storefront-next`) for how the CLI uses common Storefront Next project variables.

## Related Skills

- `b2c-cli:b2c-mrt` — MRT projects, environments, bundles, and environment variables
- `b2c-cli:b2c-site-import-export` — site archive layout and other export data units
- `b2c-cli:b2c-job` — job execution, logs, and waiting
- `b2c-cli:b2c-replication` — replicate the sites a storefront needs before importing it
