---
name: b2c-production-release
description: Run a safe production code release on B2C Commerce — deploy to a new code version, activate it, verify health, and roll back fast if needed. Use this skill whenever the user is shipping code to a Production (or Staging) instance and wants a controlled, reversible release: "deploy to production", "activate the new code version", "cut a release", "roll back the last deploy", "the release broke the site, revert it", or "what's our rollback plan". This is the operator runbook that orchestrates the lower-level b2c-cli:b2c-code, b2c-cli:b2c-logs, and b2c-cli:b2c-cip skills into one release procedure with guardrails.
persona: operator
category: Deployment & Release
tags: [deployment, ci-cd, diagnostics, cli]
alsoFor: [developer]
---

# Production Code Release & Rollback

A runbook for releasing cartridge code to a B2C Commerce instance with a guaranteed rollback path. It composes existing CLI skills — [`b2c-cli:b2c-code`](../../../b2c-cli/skills/b2c-code/SKILL.md) (deploy/activate/list), [`b2c-cli:b2c-logs`](../../../b2c-cli/skills/b2c-logs/SKILL.md) (verify), and [`b2c-cli:b2c-cip`](../../../b2c-cli/skills/b2c-cip/SKILL.md) (response-time health) — into one safe procedure.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead.

## How code versions and rollback actually work

These platform rules drive every step below — get them wrong and rollback fails when you need it most:

- **A code version is a folder of cartridges.** Multiple versions coexist on an instance; exactly one is _active_. Activating a version adds its folder to the server's resource-lookup path and removes the previously active one.
- **Activation clears cache.** Cached items are cleared after a new code version is activated, so expect a cold cache and a brief response-time bump. **Don't activate during peak traffic.**
- **Rollback needs the previous version to still exist.** "Rollback" simply re-activates the _previously active_ version. If that version was deleted, **the rollback fails** — you'd have to re-deploy it first.
- **Retention can delete old versions automatically.** The platform asynchronously removes the oldest versions (retention is configurable 3–20, default 10). **The active and previously-active versions are never auto-removed**, but anything older may already be gone — never assume a two-versions-back rollback is available.
- **Production rejects uploads into the active version.** On Production you can only upload to an _inactive_ version, so a release always goes to a **new** version name, never the one currently live. (Staging, Development, and Sandbox allow uploading into the active version.)
- **Rollback also reverts compatibility mode.** Re-activating the previous version re-activates the compatibility mode (API version) associated with it. Only roll back if your prior code is compatible with that mode.

## Procedure

### 1. Record the current active version (your rollback target)

```bash
b2c code list --json
```

Note which version is **active** — that is the version `Rollback` returns to. Confirm it (and ideally the one before it) still exists on the instance. Use consistent, meaningful version names (`v12`, `summer_release`); avoid overwriting a live directory with a hotfix, which destroys the ability to roll back quickly.

### 2. Deploy to a NEW, inactive code version

```bash
# Upload cartridges to a fresh version and activate in one step
b2c code deploy --code-version <new_version> --reload
```

- `<new_version>` MUST differ from the current active version — on Production, uploading into the active version is rejected.
- Best practice: prove the release on a **Staging** instance first, then promote to Production.
- To stage without going live yet, deploy without activation and activate later in step 3.

### 3. Activate (if you didn't already with `--reload`)

```bash
b2c code activate <new_version>
```

Activation is immediate; the new code is live and the cache is cleared. Schedule this **outside peak traffic**.

### 4. Verify health within a short window

```bash
# Any new ERROR/FATAL right after activation?
b2c logs get --level ERROR --level FATAL --since 5m --json

# Controller response-time / error-rate health
b2c cip report controller-health-scorecard
```

Watch for a spike in errors or response times immediately after activation. The `syslog` and `sysevent` logs record the activation event (`Active code version set to ...`) — useful for confirming exactly when the change went live. If healthy, the release is done.

### 5. Roll back if unhealthy

Re-activate the previous version you recorded in step 1:

```bash
b2c code activate <previous_version>
```

Then re-verify with the step 4 commands. Remember rollback reverts compatibility mode too, so only roll back to a version whose code is compatible with that mode.

## Guardrails

- **Never `b2c code delete` the active or previous version** — deleting your rollback target strands you with no fast recovery.
- **Never hotfix the live version in place on Production** — always cut a new version so rollback stays possible.
- **Don't activate or replicate at peak** — activation clears cache; the docs warn against data/code replication and cache invalidation during peak traffic.
- **Test on Staging first**, then promote.

## Scope & limits

- This runbook covers the CLI deploy→activate→verify→rollback path. **Staging→Production code replication** is a separate, Business-Manager-only action (`Administration > Replication`); the CLI does not perform replication. If your release model uses replication, deploy to Staging here and replicate in Business Manager.
- Changing the retention count or compatibility-mode selection is done in Business Manager (`Administration > Site Development > Code Deployment`); the CLI activates whatever mode the version carries.

## Related skills

- [`b2c-cli:b2c-code`](../../../b2c-cli/skills/b2c-code/SKILL.md) — the underlying deploy/activate/list/delete commands
- [`b2c-cli:b2c-logs`](../../../b2c-cli/skills/b2c-logs/SKILL.md) — verify the release and investigate errors
- [`b2c-cli:b2c-cip`](../../../b2c-cli/skills/b2c-cip/SKILL.md) — response-time and error-rate health reports
- [`b2c-operator:b2c-incident-triage`](../b2c-incident-triage/SKILL.md) — if the release caused a production incident
