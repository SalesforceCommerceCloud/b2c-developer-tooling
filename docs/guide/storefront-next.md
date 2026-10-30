---
description: Support Storefront Next development and operations with the B2C CLI, MCP, and agent skills. Create storefronts and their API client, generate project code, get the environment file, add instances to an MRT project, manage environment variables, tail logs, and work with deployments.
---

# Storefront Next

Develop and operate your Storefront Next storefront with the B2C CLI and your AI assistant. Manage environment variables together, investigate runtime errors, and get help with routing, data fetching, and Page Designer components.

<span id="step-1-create-an-on-demand-sandbox-optional"></span>
<span id="step-2-create-a-slas-client"></span>
<span id="step-3-create-an-mrt-environment"></span>
<span id="connect-the-b2c-commerce-instance"></span>

## Start with Storefront Setup

Use **storefront setup in Business Manager** to create your storefront and its API clients, Managed Runtime project, default environment, and initial configuration. Follow the Salesforce guide for your source-code workflow:

- [Create Storefront Next with a GitHub repository](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm-github.html)
- [Create Storefront Next with local code](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm.html)

To load a sample site first, or to set up a new sandbox or realm end to end, see [Realm Setup](./realm-setup).

Use the generated configuration for local development and the existing MRT resources for the operations below. For additional environments and production launch, follow [Launch Your Storefront Next](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-launch-storefront.html).

## Set Up Storefronts from the CLI

Choose between creating and importing by whether the Managed Runtime (MRT) project should already exist:

| Goal                                                                 | Use                                                                        |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A new storefront with a new MRT project                              | Storefront setup in Business Manager, or `b2c mrt project create`          |
| Add another instance, such as production, to an existing MRT project | Export the storefront from the source instance and import it on the target |

Creating a storefront always provisions a new MRT project, even when one with the same name and sites exists. Storefronts are not included in code and data replication. To keep staging and production in one project, create the storefront once, then export and import it on each other instance.

### Create a Storefront

Create a storefront for one or more existing sites with the SCAPI Storefronts API:

```bash
b2c mrt project create "My Storefront" --site MySite --mrt-backend scapi

# Creation runs asynchronously; check setupStatus.
b2c mrt project get -p <project-id> --mrt-backend scapi
```

Setup creates the storefront's API and SLAS clients, eCDN configuration, MRT project, and default environment. It can take up to 30 minutes. The returned `storefrontId` is the MRT project ID.

#### API Client

Creating a storefront from the CLI uses the SCAPI Storefronts API, which needs an Account Manager API client with the `Salesforce Commerce API` role and the storefront scopes. The API client that storefront setup creates doesn't have these scopes. If your configured client lacks them, create one (requires the API Administrator or Account Administrator role in Account Manager):

```bash
b2c am clients create \
  --name "Storefront automation" \
  --orgs <org-id> \
  --password "<client-secret>" \
  --roles SALESFORCE_COMMERCE_API \
  --role-tenant-filter "SALESFORCE_COMMERCE_API:abcd_001" \
  --scopes "mail,roles,tenantFilter,openid,sfcc.storefront.storefronts.rw,sfcc.storefront.environments.rw,sfcc.storefront.deployments.rw" \
  --default-scopes "mail,roles,tenantFilter,openid,sfcc.storefront.storefronts.rw,sfcc.storefront.environments.rw,sfcc.storefront.deployments.rw" \
  --active
```

Add `sfcc.jobs.rw` and `sfcc.sites` to import data and rebuild search indexes with the same client. Then add the client ID, secret, short code, and tenant ID to your [configuration](./configuration). See [Scopes by Command](./authentication#scopes-by-command) and [Account Manager](./account-manager).

The user who sets up the storefront also needs the Managed Runtime User or Managed Runtime Admin role in Account Manager and Business Manager access to storefronts.

### Generate the Project Code

Generate the storefront code with the `sfnext` CLI's `create-storefront` command. Because it runs before a project exists, run it with `pnpm dlx` outside any project; other `sfnext` commands run from the project's own dependency:

```bash
pnpm dlx @salesforce/storefront-next-dev create-storefront -n my-storefront -V fashion --defaults

cd my-storefront
pnpm install
pnpm run dev
```

Choose the `--vertical` (`-V`) that matches your site's data, such as `fashion` for the Market Street dataset or `cosmetic` for Beauty Next. Pin a template release with `--template-branch` to match your [dataset version](./realm-setup#storefront-datasets). Without `--defaults`, the command asks for extensions and configuration values. See the [`sfnext` CLI reference](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-cli.html) for all options. The default values point to a public demo instance, so replace the project's `.env` before you connect it to your own instance.

### Get the Environment File

On the storefront's detail page in Business Manager (**Administration > Storefronts**), click **Download .env**. The file contains your instance settings, MRT project and environment IDs, and the storefront's Account Manager and SLAS client credentials. Replace the project's `.env` with its contents and keep it out of source control.

::: warning
The client secrets are available for download only once. No CLI command or API returns the file or its secrets: storefront and MRT environment variable values and SLAS client secrets are masked.
:::

Without the download, rebuild the non-secret values from your instance:

| Variable                                                     | Where to find it                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `MRT_PROJECT`                                                | `storefrontId` from `b2c mrt project list --mrt-backend scapi`                                 |
| `MRT_TARGET`                                                 | The environment ID from `b2c mrt env list -p <project-id> --mrt-backend scapi`                 |
| `PUBLIC__app__commerce__api__clientId`                       | The SLAS client named `Automated Storefront Step: <storefront name>` in `b2c slas client list` |
| `PUBLIC__app__commerce__api__organizationId`                 | `f_ecom_` followed by your tenant ID, such as `f_ecom_abcd_001`                                |
| `PUBLIC__app__commerce__api__shortCode`                      | Your instance's SCAPI short code                                                               |
| `PUBLIC__app__defaultSiteId`, `PUBLIC__app__commerce__sites` | Your storefront's sites                                                                        |

To replace a lost SLAS client secret, rotate it with `b2c slas client update <client-id> --secret <new-secret>`, then update it everywhere the storefront uses it, including the MRT environment. See [SLAS commands](/cli/slas). For the full SCAPI walkthrough, see [Create Storefront Next with SCAPI](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-scapi-create-storefront.html).

### Add Another Instance

Exporting and importing storefronts requires B2C Commerce 26.10 or later on both instances.

```bash
# Export the storefront record from staging, by storefront name.
b2c job export --storefront my-storefront -i staging --output ./storefront-export

# Import it on production and wait for storefront setup.
b2c job import ./storefront-export/<archive-name> -i production --wait-for-storefront --show-log
```

The export contains only the storefront record: its name, type, sites, MRT project (`mrt-site`), MRT organization (`org-slug`), and the acting `user-id`. The import creates the storefront and runs the `sfcc-post-import-setup-storefront` job. That job provisions the instance's API and SLAS clients, eCDN, and a new MRT environment in the existing project. Setup can take 20 minutes or more.

The import fails unless all of these are true on the target:

- **The sites exist** and do not belong to another storefront. Replicate or import them first.
- **The storefront name is free.** Do not delete a storefront to retry an import. Deleting it removes its MRT project for every instance.
- **The MRT organization matches** the target instance's organization.
- **The user is authorized.** An import with client credentials uses the archive's `user-id`, which must be an Account Manager user with a Managed Runtime role in the organization. An export made with client credentials records the API client's service user instead; change `user-id` in `storefronts/<storefront-name>.xml` before you import.

When an import fails, the summary error is generic. Check the `[DATAERROR]` lines in the job log, which `--show-log` prints.

Source repository links are not imported; connect the new environment to source control separately. Verify that both instances show the same project, each with its own environment:

```bash
b2c mrt env list -p <project-id> -i staging --mrt-backend scapi
b2c mrt env list -p <project-id> -i production --mrt-backend scapi
```

The project ID is the `mrt-site` value in the export, not the storefront name.

<ExamplePrompt>

> Our Storefront Next storefront runs on staging. Connect production to the same Managed Runtime project: check the import requirements, export the storefront from staging, and import it on production. Ask me before changing production.

</ExamplePrompt>

## Prerequisites

Use an existing Storefront Next project and an MRT API key with access to its project and target environment. See [CLI installation](/guide/installation) and [MRT configuration](/guide/configuration#mrt-api-key) for credentials and defaults. You can also replace `b2c` in these examples with `npx @salesforce/b2c-cli`.

Replace `my-storefront` and `staging` with your MRT project and environment IDs.

<span id="step-4-set-environment-variables"></span>
<span id="variable-reference"></span>
<span id="multi-site-configuration"></span>

## Manage Environment Variables

Storefront setup configures the initial MRT variables. Use the CLI to inspect or change selected values as your storefront evolves. Salesforce's [Environment Variables guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-environment-vars.html) covers naming, visibility, and supported configuration paths.

The toolkit can also use common Storefront Next project variables as local CLI, MCP, and IDE configuration. See [Storefront Next configuration compatibility](./configuration#storefront-next-compatibility) for the supported mappings and precedence.

### Update Several Values Together

```bash
# Inspect the target environment's variables.
b2c mrt env var list --project my-storefront --environment staging

# Set locale defaults together in one update.
b2c mrt env var set \
  PUBLIC__app__i18n__fallbackLng=en-US \
  'PUBLIC__app__i18n__supportedLngs=["en-US","fr-FR"]' \
  --project my-storefront --environment staging
```

Use locales supported by your storefront and sites. Variable changes redeploy the environment; wait for that deployment before checking the result. Keep secrets out of `PUBLIC__` variables, which are exposed to the browser.

### Apply an Environment File

Keep the values intended for each MRT environment in a separate file. Review the proposed changes before applying them:

```bash
b2c mrt env var push --file .env.staging \
  --project my-storefront --environment staging
```

The command compares the file with the target, shows the differences, and asks for confirmation. It leaves remote variables absent from the file unchanged and excludes `MRT_` variables by default. Review local-only values and instance-specific credentials before sharing configuration across environments; keep files containing secrets out of source control.

See [MRT environment variable commands](/cli/mrt#environment-variable-commands) for individual updates, removal, and file options.

<span id="step-6-debugging-with-log-tailing"></span>

## Tail Application Logs

Stream logs while reproducing a server-rendering error or checking a deployment:

```bash
b2c mrt tail-logs --project my-storefront --environment staging

# Show errors and warnings.
b2c mrt tail-logs --project my-storefront --environment staging \
  --level ERROR --level WARN

# Match an error or request pattern.
b2c mrt tail-logs --project my-storefront --environment staging \
  --search 'timeout|500'
```

Press Ctrl+C to stop. See [Logging in Storefront Next](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-logging.html) for application logging conventions. For historical investigation across MRT, SLAS, and eCDN, follow [Debug Your Storefront Next Site Using Log Center](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-debug-log-center.html).

<span id="step-5-deploy"></span>

## Work with Deployments

For source builds and uploads, follow the [Storefront Next deployment workflow](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-push-mrt-auto.html) using the template's `push` package script (`sfnext push`). It uses the MRT resources created during setup.

Use the B2C CLI to inspect uploaded bundles or deploy an existing bundle to a selected environment:

```bash
b2c mrt bundle list --project my-storefront

# Deploy a reviewed bundle; replace 12345 with its ID.
b2c mrt bundle deploy 12345 --project my-storefront --environment staging
```

For release automation, see [MRT commands](/cli/mrt#bundle-commands) and [CI/CD with GitHub Actions](/guide/ci-cd). For vanity domains, routing, and access-control headers, use the [Storefront Next launch guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-launch-storefront.html) alongside the [eCDN commands](/cli/ecdn).

## Work with Your AI Assistant

The [B2C MCP](/mcp/) includes Storefront Next skills for routing, data fetching, configuration, Page Designer, testing, and deployment. Your assistant can use that guidance alongside documentation search and the toolkit's operations. No separate skills installation is needed; [standalone Agent Skills](/guide/agent-skills) are also available.

<ExamplePrompt>

> Review my Storefront Next project's configuration and the staging MRT environment. Identify differences relevant to this deployment and explain the proposed changes before applying them.

</ExamplePrompt>

<ExamplePrompt>

> Add a Page Designer component with an editable heading, image, and link. Follow the patterns in this Storefront Next project and explain how to preview it.

</ExamplePrompt>

Your assistant can stream live MRT logs through the MCP. MRT environment-variable management uses the B2C CLI, so make it available for those changes.

## Next Steps

- [Storefront Next documentation](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-get-started.html) - Platform setup and development guides.
- [Manage Sites for Storefront Next](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-manage-sites.html) - Site assignments in Business Manager.
- [Deploy the Page Designer cartridge](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-pd-deploy-cartridge.html) - Publish component metadata to your B2C Commerce instance.
- [Operations](/guide/operations) - Investigate job health and checkout incidents with your assistant.
