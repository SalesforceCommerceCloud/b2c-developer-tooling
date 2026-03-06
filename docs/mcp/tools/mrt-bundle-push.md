---
description: Build and push bundles to Managed Runtime for PWA Kit and Storefront Next deployments.
---

# mrt_bundle_push

Creates a bundle from a pre-built PWA Kit or Storefront Next project and pushes it to Managed Runtime (MRT). Optionally deploys to a target environment after push.

## Overview

The `mrt_bundle_push` tool bundles a pre-built project and uploads it to Managed Runtime. It:

1. Reads the build directory (default: `./build`).
2. Creates a bundle with server-only files (SSR) and shared files.
3. Pushes the bundle to Managed Runtime.
4. Optionally deploys to a target environment (staging or production).

**Important:** The project must already be built (e.g., `npm run build` completed) before using this tool.

This tool is shared across the MRT, PWAV3, and STOREFRONTNEXT toolsets.

## Authentication

Requires Managed Runtime (MRT) credentials. See [MRT Credentials](../configuration#mrt-credentials) for complete details.

**Configuration priority:**
1. Flags (`--api-key`, `--project`, `--environment`)
2. Environment variables (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`)
3. `~/.mobify` config file (or `~/.mobify--[hostname]` if `--cloud-origin` is set)

## Parameters

Defaults for `buildDirectory`, `ssrOnly`, and `ssrShared` are chosen by detected project type (Storefront Next, PWA Kit v3, or generic). Explicit parameters override the project-type defaults.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `buildDirectory` | string | No | `./build` | Path to build directory containing the built project files. Can be absolute or relative to the project directory. |
| `message` | string | No | None | Deployment message to include with the bundle push. Useful for tracking deployments. |
| `ssrOnly` | string | No | Varies by project type | Glob patterns for server-only files (SSR), comma-separated or JSON array. These files are only included in the server bundle. |
| `ssrShared` | string | No | Varies by project type | Glob patterns for shared files, comma-separated or JSON array. These files are included in both server and client bundles. |
| `deploy` | boolean | No | `false` | Whether to deploy to an environment after push. When `true`, `environment` must be provided via `--environment` flag or `MRT_ENVIRONMENT`. |

### Default values by project type

When `buildDirectory`, `ssrOnly`, or `ssrShared` are omitted, the tool detects the project type and applies these defaults:

**Generic** (used when no project type is detected; matches CLI `b2c mrt bundle deploy` defaults):

- `buildDirectory`: `./build`
- `ssrOnly`: `ssr.js`, `ssr.mjs`, `server/**/*`
- `ssrShared`: `static/**/*`, `client/**/*`

**PWA Kit v3**:

- `buildDirectory`: `./build`
- `ssrOnly`: `ssr.js`, `ssr.js.map`, `node_modules/**/*.*`
- `ssrShared`: `static/ico/favicon.ico`, `static/robots.txt`, `**/*.js`, `**/*.js.map`, `**/*.json`

**Storefront Next**:

- `buildDirectory`: `./build`
- `ssrOnly`: `server/**/*`, `loader.js`, `streamingHandler.{js,mjs,cjs}`, `streamingHandler.{js,mjs,cjs}.map`, `ssr.{js,mjs,cjs}`, `ssr.{js,mjs,cjs}.map`, `!static/**/*`, `sfnext-server-*.mjs`, plus exclusions for Storybook and test files
- `ssrShared`: `client/**/*`, `static/**/*`, `**/*.css`, image/font extensions, plus exclusions for Storybook and test files

## Usage Examples

### Push Bundle Only

Push a bundle without deploying:

```
Use the MCP tool to push the bundle from ./build directory to Managed Runtime.
```

### Push and Deploy to Staging

Push a bundle and deploy to staging:

```
Use the MCP tool to build and push my Storefront Next bundle to staging.
```

### Push and Deploy to Production

Push a bundle and deploy to production with a message:

```
Use the MCP tool to deploy my PWA Kit or Storefront Next bundle to production with a deployment message.
```

### Custom Build Directory

Push from a custom build directory:

```
Use the MCP tool to push the bundle from ./dist directory to Managed Runtime.
```

## Output

Returns a push result object containing:

- `bundleId` - Unique identifier for the pushed bundle
- `projectSlug` - MRT project slug
- `target` - Target environment (if deployed)
- `deployed` - Whether the bundle was deployed (if `deploy: true`)
- `message` - Deployment message (if provided)

## Requirements

- Pre-built project (run `npm run build` or equivalent first)
- MRT API key configured
- MRT project slug configured
- Valid build directory with required files

## Error Handling

The tool throws an error if:

- `project` isn’t provided (required)
- `deploy: true` but `environment` isn’t provided
- Build directory doesn’t exist or is invalid
- MRT API authentication fails
- Bundle push fails

## Related Tools

- Part of the [MRT](../toolsets#mrt), [PWAV3](../toolsets#pwav3), and [STOREFRONTNEXT](../toolsets#storefrontnext) toolsets
- Auto-enabled for PWA Kit v3 and Storefront Next projects

## See Also

- [MRT Toolset](../toolsets#mrt) - Overview of Managed Runtime tools
- [Authentication Setup](../../guide/authentication#managed-runtime-api-key) - Set up MRT API key
- [Configuration](../configuration) - Configure MRT credentials
- [CLI Reference](../../cli/mrt) - Equivalent CLI command: `b2c mrt bundle push`
