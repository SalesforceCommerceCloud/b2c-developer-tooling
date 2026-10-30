---
name: b2c-setup
description: Plan and run end-to-end setup of a B2C Commerce sandbox or realm (staging, production, development) with the b2c CLI — sample storefront data, sites, search indexes, code, Storefront Next storefronts, and replication — with confirmation before changes to shared instances. Use this skill whenever the user wants to set up a new sandbox or realm, load demo or sample data, stand up a storefront on a fresh instance, or get production ready from staging — even if they just say "set up my new realm" or "get Market Street running on my sandbox". For CLI connection settings alone, use b2c-cli:b2c-config.
---

# B2C Setup Skill

Set up a B2C Commerce sandbox or realm from an empty instance to a working storefront. This skill is an index: pick the path for the target, follow its reference, and use the workflow catalog for product- or feature-specific steps.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (for example, `npx @salesforce/b2c-cli sites list`).

## Safety First

Classify every target before changing it. Staging, production, and development instances are shared and can serve live traffic; imports and replication there change global settings for every site on the instance.

| Target                                     | Before each change                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Sandbox                                    | Confirm creating (billable) or deleting a sandbox. Imports and storefront setup can proceed once the user asked.       |
| Staging, production, development instances | State the instance hostname and the exact change, then wait for explicit approval. Ask again for each separate change. |

- Never infer that a target is a sandbox from a configuration name; check the hostname (see [safety](references/SAFETY.md)).
- Approval for one instance or step does not carry to the next.
- Production and development receive code and data by replication from staging. Do not import site data there directly; the storefront record is the exception (see `b2c-cli:b2c-storefronts`).

Recommend Safety Mode for shared instances: [safety](references/SAFETY.md).

## Choose a Path

| Goal                                                      | Path                                          |
| --------------------------------------------------------- | --------------------------------------------- |
| A development sandbox with sample data and a storefront   | [Sandbox setup](references/SANDBOX.md)        |
| A new realm: staging first, then production / development | [Realm setup](references/REALM.md)            |
| Sample sites, catalogs, and content for any instance      | [Storefront datasets](references/DATASETS.md) |
| Add an instance to an existing Storefront Next project    | `b2c-cli:b2c-storefronts`                     |

Every path starts the same way:

1. **Connect.** Configure the instance and API client, then check with `b2c setup inspect`. See `b2c-cli:b2c-config`; API clients and roles: `b2c-cli:b2c-am`.
2. **Check what exists.** `b2c sites list` and `b2c code list` show existing sites and code versions. Do not overwrite existing sites or settings without approval.
3. **Load data** (staging or sandbox only), then **rebuild search indexes**.
4. **Deploy code** for the storefront type (cartridges, or a Storefront Next storefront).
5. **Verify** each step before starting the next.

## Workflow Catalog

Steps that depend on the product line, license, or feature. Use only the rows that apply to the user's realm.

| Workflow                                   | Applies to                                 | Guidance                                                             |
| ------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------- |
| Instance connection, API clients, roles    | All                                        | `b2c-cli:b2c-config`, `b2c-cli:b2c-am`, `b2c-cli:b2c-bm-users-roles` |
| Sample data and search indexes             | All                                        | [Storefront datasets](references/DATASETS.md), `b2c-cli:b2c-job`     |
| Site archives and custom data              | All                                        | `b2c-cli:b2c-site-import-export`                                     |
| Code and data replication                  | Realms (staging to production/development) | `b2c-cli:b2c-replication`                                            |
| Storefront Next storefront and MRT project | Storefront Next                            | `b2c-cli:b2c-storefronts`, `b2c-cli:b2c-mrt`                         |
| Cartridge storefronts (SFRA)               | Cartridge-based storefronts                | `b2c-cli:b2c-code`, `b2c-cli:b2c-sites`                              |
| Shopper authentication (SLAS)              | Headless and composable storefronts        | `b2c-cli:b2c-slas`                                                   |
| Commerce apps                              | Commerce apps                              | `b2c-cli:b2c-cap`                                                    |
| eCDN zones and certificates                | Storefronts on eCDN                        | `b2c-cli:b2c-ecdn`                                                   |

## Related Skills

- [Realm Setup guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/realm-setup.md) (`b2c docs read guide-realm-setup`) — the user-facing version of this skill
- `b2c-cli:b2c-sandbox` — create, start, stop, and clone sandboxes
- `b2c-cli:b2c-storefronts` — create or import Storefront Next storefronts
- `b2c-cli:b2c-replication` — replication jobs for staging
- `b2c-ops:b2c-production-triage` — investigate problems after launch
