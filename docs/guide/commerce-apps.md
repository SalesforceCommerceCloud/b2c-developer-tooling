---
description: Use the B2C CLI and agent skills to validate, package, install, uninstall, and pull Commerce App Packages (CAPs). Links to the official Commerce Apps ISV Developer Guide for the full specification.
---

# Commerce Apps (CAPs)

Commerce App Packages (CAPs) are the standard format for distributing B2C Commerce integrations. A CAP bundles back-end cartridges, IMPEX configuration data, and Storefront Next UI extensions into a single installable unit, deployed to an instance with a platform job.

This page covers what the **B2C CLI** does for CAPs and the **agent skills** we recommend. It is intentionally brief: the [Commerce Apps ISV Developer Guide](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/commerce-apps-overview.html) on Salesforce Developers is the authoritative source for the CAP format, manifest schema, architectures, domains and extension points, the installation state machine, and the submission/registry process. Use this page for the CLI workflow; follow the links for the spec.

## Develop CAPs with AI Agent Skills

If you build CAPs with an AI coding agent, install the agent skills so it understands the CAP format, the `b2c cap` commands, and the scaffolding/packaging/submission workflow. We recommend three plugins:

- **`b2c-cli`** — the `b2c cap` commands (validate, package, install, uninstall, list, tasks, pull) and the rest of the CLI.
- **`b2c`** — the B2C Commerce development patterns CAPs are built from (cartridges, hooks, metadata, Custom APIs, Storefront Next extensions).
- **`cap-dev`** — scaffolding, generating IMPEX, validating, and submitting CAPs to the registry.

`b2c-cli` and `b2c` ship in the [B2C Developer Tooling marketplace](/guide/agent-skills); `cap-dev` ships separately from the [`SalesforceCommerceCloud/commerce-apps`](https://github.com/SalesforceCommerceCloud/commerce-apps) registry repository.

### Claude Code

```bash
# B2C Developer Tooling skills (the CLI + platform development patterns)
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-cli
claude plugin install b2c

# CAP authoring skills (separate marketplace)
claude plugin marketplace add SalesforceCommerceCloud/commerce-apps
claude plugin install cap-dev --scope project
```

Add `--scope project` to any install to scope it to the current project instead of your user profile. The `b2c-cli` and `b2c` skills also install via `b2c setup skills`, and the `cap-dev` skills via `b2c setup skills cap-dev` for other agents (Cursor, Codex, Copilot). For full plugin management — listing, updating, and uninstalling — see the [Agent Skills & Plugins guide](/guide/agent-skills).

> **Which tool for what?** Use the `cap-dev` skills to **author** a CAP (scaffold the structure, generate IMPEX, validate against the registry rules, and open a submission PR). Use the **B2C CLI** to **operate** on a CAP against an instance (validate locally, package, install, uninstall, list, and pull).

## CLI Workflow

The B2C CLI provides the `cap` topic for working with Commerce App Packages. The commands accept a CAP **directory** or a packaged **`.zip`**.

```bash
# Validate structure locally (no instance required)
b2c cap validate ./commerce-my-integration-app-v1.0.0

# Package into a distributable zip (no instance required)
b2c cap package ./commerce-my-integration-app-v1.0.0 --output ./dist

# Install on a sandbox (uploads via WebDAV, then runs the install job)
b2c cap install ./commerce-my-integration-app-v1.0.0 --site RefArch

# Install a pre-built zip
b2c cap install ./dist/my-integration-v1.0.0.zip --site RefArch

# List apps installed on an instance (add --local to list CAP directories on disk)
b2c cap list --site RefArch

# View post-install configuration tasks (with Business Manager deep links)
b2c cap tasks my-integration --site RefArch

# Pull installed app sources for cartridge or Storefront Next development
b2c cap pull my-integration --site RefArch

# Uninstall (the app's domain is discovered automatically)
b2c cap uninstall my-integration --site RefArch
```

`validate` and `package` (and `list --local`) are local-only and need no credentials, which makes them well-suited to CI. `install`, `uninstall`, `tasks`, `pull`, and remote `list` run a system job and/or query the instance, so they require authentication — see [Authentication Requirements](#authentication-requirements). On `install`, the CLI uploads the package via WebDAV to `Impex/commerce-apps/` and triggers the `sfcc-install-commerce-app` platform job, which deploys cartridges and imports IMPEX data.

See the [CAP CLI reference](/cli/cap) for every command, flag, and option.

### Creating a Storefront Pull Request

If a CAP includes Storefront Next content, pass `--create-pr` on `install` to have the install job automatically open a pull request against the related Storefront Next storefront — provided a repository is also connected to the storefront:

```bash
b2c cap install ./commerce-my-integration-app-v1.0.0 --site RefArch --create-pr
```

The pull request contains the storefront changes the app provides, so a developer can review and merge them rather than having them applied directly. The flag is **off by default**; if the app has no storefront content or no repository is connected to the storefront, it has no effect.

### Inspecting Installed State

After install, complete the setup wizard tasks in Business Manager or follow the deep links from `b2c cap tasks`. `b2c cap list` reports each installed app's **install status** and **configuration status** per site. For the full installation state machine (the `INSTALLING → INSTALLED → NOT_CONFIGURED → CONFIGURING → CONFIGURED` happy path plus the error and uninstall flows), see the [Architecture guide](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/architecture.html).

## VS Code Extension Integration

The Salesforce B2C Commerce VS Code extension provides Commerce App support directly in the file explorer.

- **CAP detection** — any directory containing a `commerce-app.json` file is decorated with a **CA** badge in the explorer, making CAP directories easy to identify.
- **Install from the explorer** — right-click a CAP directory and choose **Install Commerce App (CAP)**. You will be prompted for the target site ID.

## Authentication Requirements

The remote `cap` commands (`install`, `uninstall`, `tasks`, `pull`, and remote `list`) require both:

- **OAuth credentials** (`SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`) — for running the system job via OCAPI
- **WebDAV credentials** (`SFCC_USERNAME`, `SFCC_PASSWORD`) — for uploading the CAP zip (there is no SCAPI substitute for the WebDAV upload)

```bash
export SFCC_SERVER=my-instance.commercecloud.salesforce.com
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

You can also authenticate WebDAV interactively in the browser with `--user-auth`. The local-only commands (`validate`, `package`, `list --local`) need no credentials. See the [Authentication Guide](/guide/authentication) for complete setup, including Account Manager OAuth clients with WebDAV permissions.

## CI/CD Integration

Because `validate` and `package` are local-only, a typical pipeline validates and packages on every change and installs to a dedicated sandbox on promotion. All `cap` commands accept `--json` for machine-readable output.

```yaml
- name: Validate CAP
  run: b2c cap validate ./commerce-my-integration-app-v${{ env.VERSION }} --json

- name: Package CAP
  run: b2c cap package ./commerce-my-integration-app-v${{ env.VERSION }} --output ./dist --json

- name: Install CAP
  run: b2c cap install ./dist/my-integration-v${{ env.VERSION }}.zip --site ${{ env.SITE_ID }} --json
  env:
    SFCC_SERVER: ${{ secrets.SFCC_SERVER }}
    SFCC_CLIENT_ID: ${{ secrets.SFCC_CLIENT_ID }}
    SFCC_CLIENT_SECRET: ${{ secrets.SFCC_CLIENT_SECRET }}
    SFCC_USERNAME: ${{ secrets.SFCC_USERNAME }}
    SFCC_PASSWORD: ${{ secrets.SFCC_PASSWORD }}
```

## Reference

- [CAP CLI Commands](/cli/cap) — full `b2c cap` command and flag reference
- [Commerce Apps ISV Developer Guide](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/commerce-apps-overview.html) — the authoritative CAP specification, covering:
  - [Architecture](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/architecture.html) — the three app architectures, extension points (e.g. `sfcc.app.tax.calculate`), UI targets, CAP directory structure, and the installation state machine
  - [Development environment](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/development-environment.html) — sandbox setup, the `cap-dev` Claude Code skills, and the end-to-end lifecycle
  - [Packaging](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/packaging.html) — required files, the `commerce-app.json` manifest, and zip layout
  - [Testing & validation](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/testing-validation.html) and [submission & review](https://developer.salesforce.com/docs/commerce/commerce-solutions/guide/submission-review.html) — the registry review checklist and submission process
