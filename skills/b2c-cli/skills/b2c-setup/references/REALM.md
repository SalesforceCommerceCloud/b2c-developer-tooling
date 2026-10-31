# Realm Setup

A realm's staging instance is the source of code and data; production and development receive them by replication. Set up staging completely, then replicate, then connect the storefront on each target.

Every step below changes a shared instance. Before each one, give the hostname and command and wait for approval (see [safety](SAFETY.md)).

## 1. Connect All Instances

Configure a named instance for staging, production, and development, with Safety Mode policies (see [safety](SAFETY.md)). Use the same API client on every instance where possible.

```bash
b2c setup instance list
b2c setup inspect -i staging
```

## 2. Prepare Staging

1. **Data.** Import your site archives, or a [storefront dataset](DATASETS.md) for a demo site, then rebuild the search indexes.

   ```bash
   b2c job import ./storefront-datasets/marketstreet -i staging --show-log
   b2c job run Reindex -i staging --wait
   ```

2. **Code.** For cartridge storefronts, deploy and activate a code version (`b2c-cli:b2c-code`).
   - **Staging requires two-factor code upload.** Staging instances normally reject cartridge uploads without a client certificate (mTLS). The symptom is usually `403 Forbidden` on writes under `Cartridges` while reads and `Impex` writes succeed. Ask the user which setup their realm uses. On legacy realms, Salesforce Support provides a CA bundle and code goes to the `cert.staging.*` hostname. On Hyperforce realms, the user registers their own CA through eCDN (`b2c ecdn mtls create`, Hyperforce only). See [Two-Factor Authentication](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.md#two-factor-authentication-mtls) and [Set Up Two-Factor Code Upload](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/hyperforce.md#set-up-two-factor-code-upload) (`b2c docs read guide-hyperforce`).
   - **Hooks need a feature switch.** If the code registers order or basket hooks, Commerce API hook execution must be on (**Administration > Global Preferences > Feature Switches**). Without it, hooks are skipped and the warn log shows `SCAPI hook invoked but feature is disabled`.
3. **Storefront.** For Storefront Next, create the storefront on staging (Business Manager storefront setup, or `b2c mrt project create "My Storefront" --site MySite -i staging --mrt-backend scapi`). Scopes, project code, and `.env`: [Storefront Next setup](STOREFRONT-NEXT.md).
4. **Verify** the site on staging before replicating.

## 3. Replicate to Production or Development

Use replication jobs on staging (`b2c-cli:b2c-replication`):

1. Code (if staging has a code version to replicate).
2. Global data, which creates the site on the target.
3. Site data.

The first replication of a site must run global data before site data; a combined run fails. Replication applies to everything the configuration selects, so confirm the tasks with the user.

```bash
b2c job run Replicate-Code -i staging --wait --show-log
b2c job run Replicate-Global -i staging --wait --show-log
b2c job run Replicate-MySite -i staging --wait --show-log
```

## 4. Connect the Storefront on Each Target

Storefronts do not replicate. To keep production and staging in one MRT project, export the storefront from staging and import it on the target; creating a storefront there makes a second project.

```bash
b2c job export --storefront my-storefront -i staging --output ./storefront-export
b2c job import ./storefront-export/<archive-name> -i production --wait-for-storefront --show-log
```

Requirements and troubleshooting: `b2c-cli:b2c-storefronts`.

## 5. Verify

- `b2c sites list -i production` shows the replicated site.
- `b2c mrt env list -p <project-id> -i production --mrt-backend scapi` shows a production environment in the same project as staging.
- Rebuild search indexes on the target if search returns no products.
