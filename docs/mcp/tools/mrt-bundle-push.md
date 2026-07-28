---
description: Build and push bundles to Managed Runtime for PWA Kit and Storefront Next deployments.
---

# Bundle Deployment

MCP tools for building and deploying Managed Runtime (MRT) bundles for PWA Kit and Storefront Next. Available in the **MRT**, **PWAV3**, and **STOREFRONTNEXT** toolsets.

## mrt_bundle_push

Bundles a pre-built PWA Kit or Storefront Next project and pushes it to Managed Runtime (MRT). Optionally deploys to a target environment after push. The project must already be built (e.g., `npm run build` completed).

### Authentication

This tool reads MRT credentials from the same sources as the CLI.

| Logical value    | Required                 | Flag             | Environment variable | `dw.json` field  | Other source                                       |
| ---------------- | ------------------------ | ---------------- | -------------------- | ---------------- | -------------------------------------------------- |
| MRT project slug | Yes                      | `--project`      | `MRT_PROJECT`        | `mrtProject`     | -                                                  |
| MRT API key      | Yes                      | `--api-key`      | `MRT_API_KEY`        | `mrtApiKey`      | `api_key` in `~/.mobify`                           |
| MRT environment  | Only when `deploy: true` | `--environment`  | `MRT_ENVIRONMENT`    | `mrtEnvironment` | -                                                  |
| MRT cloud origin | No                       | `--cloud-origin` | `MRT_CLOUD_ORIGIN`   | `mrtCloudOrigin` | Uses `~/.mobify--{hostname}` with `--cloud-origin` |

**Configuration priority:** Flags → Environment variables → Config files (`dw.json`, `~/.mobify`)

See [MRT Credentials](../configuration#mrt-credentials) for complete setup details. See [Authentication Setup](../../guide/authentication#managed-runtime-api-key) for how to get your API key.

### Parameters

Defaults for `buildDirectory`, `ssrOnly`, and `ssrShared` are chosen by detected project type (Storefront Next, PWA Kit v3, or generic). Explicit parameters override the project-type defaults.

| Parameter        | Type    | Required | Default                | Description                                                                                                                                |
| ---------------- | ------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `buildDirectory` | string  | No       | `build`                | Path to build directory containing the built project files. Can be absolute or relative to the project directory.                          |
| `message`        | string  | No       | None                   | Deployment message to include with the bundle push. Useful for tracking deployments.                                                       |
| `ssrOnly`        | string  | No       | Varies by project type | Glob patterns for server-only files (SSR), comma-separated or JSON array. These files are only included in the server bundle.              |
| `ssrShared`      | string  | No       | Varies by project type | Glob patterns for shared files, comma-separated or JSON array. These files are included in both server and client bundles.                 |
| `deploy`         | boolean | No       | `false`                | Whether to deploy to an environment after push. When `true`, `environment` must be provided via `--environment` flag or `MRT_ENVIRONMENT`. |

#### Default values by project type

When `buildDirectory`, `ssrOnly`, or `ssrShared` are omitted, the tool detects the project type and applies these defaults:

**Generic** (used when no project type is detected; matches CLI `b2c mrt bundle deploy` defaults):

- `buildDirectory`: `build`
- `ssrOnly`: `ssr.js`, `ssr.mjs`, `server/**/*`
- `ssrShared`: `static/**/*`, `client/**/*`

**PWA Kit v3**:

- `buildDirectory`: `build`
- `ssrOnly`: `ssr.js`, `ssr.js.map`, `node_modules/**/*.*`
- `ssrShared`: `static/ico/favicon.ico`, `static/robots.txt`, `**/*.js`, `**/*.js.map`, `**/*.json`

**Storefront Next**:

- `buildDirectory`: `build`
- `ssrOnly`: `server/**/*`, `loader.js`, `streamingHandler.{js,mjs,cjs}`, `streamingHandler.{js,mjs,cjs}.map`, `ssr.{js,mjs,cjs}`, `ssr.{js,mjs,cjs}.map`, `!static/**/*`, `sfnext-server-*.mjs`, plus exclusions for Storybook and test files
- `ssrShared`: `client/**/*`, `static/**/*`, `**/*.css`, image/font extensions, plus exclusions for Storybook and test files

### Usage

Push a bundle without deploying:

```
Push the bundle from build directory to Managed Runtime.
```

Push a bundle and deploy to staging with a deployment message:

```
Build and push my Storefront Next bundle to staging with a deployment message.
```

**Returns:** `{bundleId, projectSlug, target, deployed, message}`

## See also

- [MRT Toolset](../toolsets#mrt) - Overview of Managed Runtime tools
- [Authentication Setup](../../guide/authentication#managed-runtime-api-key) - Set up MRT API key
- [Configuration](../configuration) - Configure MRT credentials
- [CLI commands](/cli/mrt) — `b2c mrt bundle push`
