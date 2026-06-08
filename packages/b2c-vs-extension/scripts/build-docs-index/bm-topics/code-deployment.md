---
id: code-deployment
title: Code Deployment
category: deployment
tags: [code, version, deployment, release]
---

Code on a B2C Commerce instance is grouped into **code versions**. Only one
code version is active per instance; activating a different version is the
release mechanism.

## Where to manage

`Administration > Site Development > Code Deployment`

## Typical flow

1. Build cartridges locally or in CI.
2. Upload to a new code version directory via WebDAV (`Cartridges/<version>/`).
3. Activate the new code version once health checks pass.
4. Keep the previous version available for fast rollback.

## CLI shortcuts

The B2C CLI provides:

```bash
sf b2c code list-versions
sf b2c code activate <version>
sf b2c code download <version>
```

The VS Code extension exposes the same actions in the Cartridges sidebar.

## Tips

- Name code versions like `version1_2026_05_01_a` so the active one sorts to
  the top of the list.
- Keep at least 2 inactive code versions for safe rollback.
- Code versions are **per-instance** — a sandbox, dev, staging, and production
  each have their own.
- Activation is atomic on the storefront layer but not on the OCAPI layer —
  expect a few seconds of cache invalidation churn after activation.
