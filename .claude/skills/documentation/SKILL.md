---
name: documentation
description: Updating user guides, CLI reference, and API documentation for the B2C CLI project. Use when adding or changing CLI command docs, writing JSDoc for TypeDoc generation, updating Vitepress sidebar config, or creating new guide pages.
metadata:
  internal: true
---

# Documentation

This skill covers updating documentation for the B2C CLI project.

## Documentation Structure

The project has four types of documentation:

```
docs/
├── guide/              # User guides (manually written)
│   ├── index.md
│   ├── installation.md
│   ├── authentication.md
│   └── configuration.md
├── cli/                # CLI reference (manually written)
│   ├── index.md
│   ├── code.md
│   ├── webdav.md
│   ├── jobs.md
│   └── ...
├── quickstart/         # Interactive Quickstart guides (page shims)
│   ├── index.md        # topic listing rendered by <QuickstartIndex/>
│   ├── deploy-code.md
│   ├── jobs.md
│   └── ...             # each renders <QuickstartGuide id="<id>" />
├── api/                # API reference (auto-generated)
│   └── *.md
└── .vitepress/
    ├── config.mts
    └── data/adventures/ # Quickstart guide DATA (TS source of truth)
        ├── _types.ts
        ├── _authoring.ts   # defineAdventure / step / choice / md / doc
        ├── _helpers.ts     # dwJson / ocapiConfig / scopes / link / check
        ├── index.ts        # registry + presets + feature flags
        └── <id>.ts         # one file per guide
```

## Documentation Types

### 1. User Guides (`docs/guide/`)

Purpose: Help users get started and understand concepts.

When to update:
- New features that need explanation
- Changes to installation or setup process
- New authentication methods
- Configuration changes

Example structure:

```markdown
# Getting Started

Introduction to the topic.

## Prerequisites

- Node.js 22+
- pnpm

## Installation

\`\`\`bash
pnpm install -g @salesforce/b2c-cli
\`\`\`

## Next Steps

- [Authentication](./authentication.md)
- [Configuration](./configuration.md)
```

### 2. CLI Reference (`docs/cli/`)

Purpose: Document command syntax, flags, and usage examples.

When to update:
- New commands added
- Flags added, removed, or changed
- Command behavior changes
- New examples needed

Structure per command topic:

```markdown
# Code Commands

Commands for managing code versions and cartridge deployment.

## b2c code deploy

Deploy cartridges to a B2C Commerce instance.

### Usage

\`\`\`bash
b2c code deploy [PATH] [FLAGS]
\`\`\`

### Arguments

| Argument | Description | Required | Default |
|----------|-------------|----------|---------|
| PATH | Path to cartridges directory | No | . |

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| --server | -s | Instance hostname | - |
| --code-version | -v | Code version name | - |
| --cartridge | -c | Include specific cartridges | - |
| --exclude-cartridge | -x | Exclude cartridges | - |

### Examples

\`\`\`bash
# Deploy all cartridges in current directory
b2c code deploy --server dev01.example.com --code-version v1

# Deploy specific cartridges
b2c code deploy ./cartridges -c app_storefront -c app_custom

# Deploy excluding certain cartridges
b2c code deploy -x test_cartridge -x bm_extensions
\`\`\`

### Authentication

Requires WebDAV credentials (username/password) or OAuth.
```

### 3. Quickstart Guides (`docs/quickstart/` + `docs/.vitepress/data/adventures/`)

Purpose: Interactive, branching wizards that synthesise a minimal `dw.json`
+ checklist + verify command for a specific user task. The user-facing name
is **Quickstart guide**; the internal data type is `Adventure` and the
authoring helpers are named accordingly (legacy term — keep it inside
`.ts` files only, never in user-visible UI strings).

Each guide is a typed `Adventure` object built with `defineAdventure({...})`.
The page at `docs/quickstart/<id>.md` is just a 3-line shim:

```md
---
title: My guide · Quickstart
description: Short tagline.
layout: doc
sidebar: false
aside: false
---

<QuickstartGuide id="my-guide" />
```

The real content lives in `docs/.vitepress/data/adventures/<id>.ts`:

```ts
import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link, ocapiConfig, scopes} from './_helpers.js';

export const myGuide = defineAdventure({
  id: 'my-guide',
  title: 'Do the thing',
  tagline: 'One-line summary.',
  icon: 'mdi:something',
  tags: ['oauth', 'webdav'],            // search / filter on the index
  priority: 'common',                   // 'core' | 'common' | 'specialized' | 'niche'
  intro: 'Optional preamble shown above step 1.',
  steps: [
    step('auth', {
      title: 'How will you authenticate?',
      doc: doc('/guide/authentication', 'account-manager-api-client'),
      choices: [
        choice('client-credentials', {
          title: 'Client Credentials',
          icon: 'mdi:key-variant',
          body: md`Recommended for CI. See [JWT setup](/guide/authentication#jwt-authentication-certificate-based).`,
          contributes: {authMethod: 'client-credentials'},
        }),
      ],
    }),
  ],
  synthesize(state) {
    return {
      dwJson: dwJson({hostname: true, clientId: true, clientSecret: state.authMethod === 'client-credentials'}),
      checklist: [check('Create an Account Manager API client', link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'))],
      verifyCommand: 'b2c whatever',
    };
  },
});
```

After authoring, register the guide in `docs/.vitepress/data/adventures/index.ts`
(import + push into the `adventures` array under the matching priority comment).

**When to update an existing guide:**
- A CLI command, flag, or env-var name referenced in the synthesizer or a
  choice body changed.
- A doc heading anchor referenced via `doc()` / `link()` / a markdown
  `[text](/path#anchor)` link was renamed (the build-time anchor checker
  catches this — `pnpm --filter @salesforce/b2c-dx-docs run docs:build`).
- An auth/role/scope/permission requirement changed.

**When to add a new guide:**
- A new CLI command surface or workflow that needs more than a doc page —
  i.e., the user has to make decisions and we can synthesise a useful
  `dw.json` / checklist for each path.
- See `PLAN_guides.md` at the repo root for the prioritised backlog.

**When to remove a guide:**
- The underlying CLI surface is deprecated or has been merged into another
  guide. Remove the `.ts`, the `.md` shim, and the registry entry.

**Authoring helpers (do not reinvent these):**
| Helper | Purpose |
|--------|---------|
| `defineAdventure` | Wraps the literal in a typed `Adventure`; normalises step array → record. |
| `step(id, {...})` | One step in the wizard. Has a `doc:` anchor and a list of choices. |
| `choice(id, {...})` | One option inside a step. `contributes:` feeds the synthesizer. |
| `md\`…\`` | Tagged template for multi-line markdown bodies. |
| `doc(path, hash, label)` | Internal doc anchor for `step.doc` and choice `body` links. |
| `link(...)` | Same shape as `doc` but used inside synthesizer `check(...)` items. |
| `check(text, href)` | One numbered checklist item in synthesised output. |
| `dwJson({...})` | Builds a placeholder dw.json snippet with the right keys. |
| `ocapiConfig(client, [...])` | OCAPI Data API JSON for a list of features (`'codeVersions'`, `'jobs'`, `'sites'`, `'siteCartridges'`). |
| `scopes(...)` | Computes the OAuth scope list from named bundles. |

**Validation:**
- `pnpm --filter @salesforce/b2c-dx-docs run docs:typecheck` — strict tsc.
- `pnpm --filter @salesforce/b2c-dx-docs run docs:build` — the build hook
  walks every reachable choice combination, calls `synthesize`, and
  validates every `step.doc` anchor, every checklist `link()`, every
  markdown `[text](/path#anchor)` inside choice `body` strings, and every
  link inside synthesizer `warnings`.

### 4. API Reference (`docs/api/`)

Purpose: Document the SDK programmatic API.

This is **auto-generated** from TypeScript JSDoc comments using TypeDoc.

Never edit files in `docs/api/` directly. Instead:

1. Update JSDoc comments in SDK source files
2. Run `pnpm run docs:api` to regenerate

## Writing JSDoc for API Docs

### Module-Level Documentation

Add to barrel files (`index.ts`):

```typescript
/**
 * Authentication strategies for B2C Commerce APIs.
 *
 * This module provides various authentication mechanisms:
 * - OAuth 2.0 client credentials
 * - Basic authentication
 * - API key authentication
 *
 * @example
 * ```typescript
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'my-client',
 *   clientSecret: 'my-secret',
 * });
 * ```
 *
 * @module auth
 */
```

### Class Documentation

```typescript
/**
 * Client for WebDAV file operations on B2C Commerce instances.
 *
 * Supports uploading, downloading, and managing files in various
 * WebDAV roots (Cartridges, IMPEX, Logs, etc.).
 *
 * @example
 * ```typescript
 * const client = new WebDavClient(hostname, auth);
 * await client.put('Cartridges/v1/app_custom/file.js', content);
 * ```
 */
export class WebDavClient {
  /**
   * Creates a new WebDAV client.
   *
   * @param hostname - The B2C Commerce instance hostname
   * @param auth - Authentication strategy to use
   */
  constructor(hostname: string, auth: AuthStrategy) {}
}
```

### Function Documentation

```typescript
/**
 * Deploys cartridges to a B2C Commerce instance.
 *
 * Discovers cartridges in the specified path, creates a ZIP archive,
 * and uploads via WebDAV.
 *
 * @param instance - The B2C instance to deploy to
 * @param cartridgePath - Path containing cartridge directories
 * @param options - Deployment options
 * @returns Deployment result with uploaded cartridges
 *
 * @example
 * ```typescript
 * const result = await deployCartridges(instance, './cartridges', {
 *   include: ['app_storefront'],
 * });
 * console.log(result.cartridges);
 * ```
 *
 * @throws {DeploymentError} If deployment fails
 */
export async function deployCartridges(
  instance: B2CInstance,
  cartridgePath: string,
  options?: DeployOptions
): Promise<DeployResult> {}
```

### Type Documentation

```typescript
/**
 * Configuration for OAuth authentication.
 */
export interface OAuthConfig {
  /** OAuth client ID */
  clientId: string;

  /** OAuth client secret */
  clientSecret: string;

  /** OAuth scopes to request */
  scopes?: string[];
}
```

## Building Documentation

```bash
# Generate API docs from JSDoc
pnpm run docs:api

# Start dev server (includes API generation)
pnpm run docs:dev

# Build static site
pnpm run docs:build

# Preview built site
pnpm run docs:preview
```

## TypeDoc Configuration

Located in `typedoc.json`:

```json
{
  "entryPoints": [
    "packages/b2c-tooling-sdk/src/auth/index.ts",
    "packages/b2c-tooling-sdk/src/clients/index.ts",
    "packages/b2c-tooling-sdk/src/operations/code/index.ts"
  ],
  "out": "docs/api",
  "plugin": [
    "typedoc-plugin-markdown",
    "typedoc-vitepress-theme"
  ],
  "exclude": ["**/*.generated.ts"]
}
```

When adding new SDK modules, add their barrel file to `entryPoints`.

## Vitepress Configuration

Located in `docs/.vitepress/config.mts`:

```typescript
export default defineConfig({
  title: 'B2C CLI',
  base: '/b2c-developer-tooling/',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'CLI Reference', link: '/cli/' },
      { text: 'API Reference', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Authentication', link: '/guide/authentication' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'Commands',
          items: [
            { text: 'code', link: '/cli/code' },
            { text: 'webdav', link: '/cli/webdav' },
          ],
        },
      ],
    },
  },
});
```

When adding new CLI commands or guide pages, update the sidebar config.

## Claude Code Skills (Plugin)

The `skills/b2c-cli/skills/` directory contains skills that teach Claude about using the CLI commands. These are distributed via the plugin.

When to update:
- New CLI commands added
- Existing commands changed
- New usage patterns

Skill format:

```markdown
---
name: b2c-<topic>
description: Brief description
---

# B2C <Topic> Skill

Overview of the command topic.

## Examples

### <Use Case>

\`\`\`bash
# Comment explaining the command
b2c <topic> <command> [args] [flags]
\`\`\`

### <Another Use Case>

\`\`\`bash
b2c <topic> <command> --flag value
\`\`\`
```

## Documentation Update Checklist

### When Adding a CLI Command

1. Update `docs/cli/<topic>.md` with command documentation
2. Update `docs/.vitepress/config.mts` sidebar if new topic
3. Update `skills/b2c-cli/skills/b2c-<topic>/SKILL.md` with examples
4. **Evaluate Quickstart impact**: does this command warrant its own guide
   under `docs/.vitepress/data/adventures/`, or extend an existing one
   (e.g., a new `b2c sites …` subcommand may belong in the `cartridge-path`
   guide)? See `PLAN_guides.md` for the prioritised backlog.

### When Adding an SDK Module

1. Write module-level JSDoc in barrel file
2. Write JSDoc for all public classes, functions, types
3. Add entry point to `typedoc.json` if new module
4. Run `pnpm run docs:api` to regenerate

### When Changing CLI Behavior

1. Update affected examples in `docs/cli/*.md`
2. Update affected examples in `skills/b2c-cli/skills/*/SKILL.md`
3. Update guide pages if conceptual changes
4. **Sweep matching Quickstart guides**: every command name, flag, env var,
   or anchor used in a guide's `synthesize` / choice `body` / warning lives
   in `docs/.vitepress/data/adventures/<id>.ts`. Run
   `pnpm --filter @salesforce/b2c-dx-docs run docs:build` — the anchor
   checker will flag broken doc links automatically; renamed commands /
   flags need manual review.

### When Adding Configuration Options

1. Update `docs/guide/configuration.md`
2. Update relevant CLI command docs with new flags
3. Update skills with new flag examples
4. **Update Quickstart helpers if needed**: if the new option is a new
   `dw.json` field, add a placeholder mapping to `dwJson()` in
   `docs/.vitepress/data/adventures/_helpers.ts`. If it's a new OAuth
   scope, add a `SCOPE_BUNDLES` entry. Then surface it in the relevant
   guide(s).

### When Renaming a Doc Heading

1. The build-time anchor checker (`pnpm run docs:build`) will fail loudly
   with the old slug — fix every `doc()` / `link()` / markdown
   `[text](/path#anchor)` reference in
   `docs/.vitepress/data/adventures/*.ts`.

## Navigation Structure

**Top Navigation:**
- Guide (`/guide/`)
- Quickstart (`/quickstart/`)
- CLI Reference (`/cli/`)
- API Reference (`/api/`)

**Sidebar:**
- Contextual based on section
- API reference sidebar auto-generated from TypeDoc

## Style Guidelines

- Use code blocks with language hints (```bash, ```typescript)
- Include practical examples for every command/function
- Keep flag tables consistent across command docs
- Use relative links for internal references
- Avoid emojis unless specifically requested
