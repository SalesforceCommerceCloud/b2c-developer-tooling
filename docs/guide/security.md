---
description: Security practices for the B2C Developer Tooling project including supply chain protections and dependency management.
---

# Security

This page covers security practices used in the B2C Developer Tooling project, with a focus on supply chain security.

## Supply Chain Security

The JavaScript/Node.js ecosystem is particularly vulnerable to supply chain attacks due to the large number of transitive dependencies in typical projects. This project uses several pnpm features to mitigate these risks.

### Minimum Release Age

New package versions are quarantined for 48 hours before they can be installed:

```yaml
# pnpm-workspace.yaml
minimumReleaseAge: 2880  # minutes (48 hours)
```

This provides a buffer period during which:
- Malicious packages can be detected and removed from npm
- Security researchers can identify and report compromised packages
- The community can flag suspicious updates

If a package update is urgent, it can be added to the exclusion list:

```yaml
minimumReleaseAgeExclude:
  - some-urgent-package
```

### Trust Policy

Dependency downgrades are prevented to protect against downgrade attacks:

```yaml
# pnpm-workspace.yaml
trustPolicy: no-downgrade
```

This ensures that once a package version is installed, it cannot be replaced with an older (potentially vulnerable) version without explicit action.

### Restricting Build Scripts

Only explicitly allowed packages can run build scripts (install/postinstall hooks):

```yaml
# pnpm-workspace.yaml
onlyBuiltDependencies:
  - unrs-resolver
  - yarn
```

Build scripts are a common attack vector because they execute arbitrary code during installation. By default, pnpm blocks all build scripts except for packages in this allowlist.

When adding a new dependency that requires build scripts:
1. Verify the package is legitimate and actively maintained
2. Review what the build script does
3. Add it to `onlyBuiltDependencies` if necessary

## NPM Trusted Publishing

This project uses [NPM trusted publishers](https://docs.npmjs.com/trusted-publishers) for package publication. Instead of storing long-lived npm tokens, packages are published via GitHub Actions using short-lived OIDC tokens that cannot be extracted or reused.

## Operational Security: Safety Mode

The CLI includes a **Safety Mode** feature that prevents accidental or unwanted destructive operations. This is particularly important when:

- Using the CLI in automated environments (CI/CD pipelines)
- Providing the CLI as a tool to AI agents/LLMs
- Working in production environments
- Training new team members
- Running commands from untrusted scripts

### How It Works

Safety Mode uses a **hybrid protection approach**:

1. **HTTP Middleware Layer** (Primary Protection)
   - Intercepts ALL HTTP requests before they're sent
   - Cannot be bypassed by command-line flags
   - Works automatically for all commands
   - LLM-proof: controlled via environment variable

2. **Command-Level Checks** (Better UX)
   - Provides early, user-friendly error messages
   - Catches operations before HTTP requests

### Safety Levels

Configure via the `SFCC_SAFETY_LEVEL` environment variable:

| Level | Description | Blocks |
|-------|-------------|--------|
| `NONE` | No restrictions (default) | Nothing |
| `NO_DELETE` | Prevent deletions | DELETE operations |
| `NO_UPDATE` | Prevent deletions and destructive updates | DELETE + reset/stop/restart |
| `READ_ONLY` | Read-only mode | All writes (POST/PUT/PATCH/DELETE) |

### Usage Examples

#### Development (Allow Everything)
```bash
# No restrictions (default)
unset SFCC_SAFETY_LEVEL
# OR
export SFCC_SAFETY_LEVEL=NONE

b2c sandbox delete test-id  # ✅ Allowed
```

#### CI/CD (Prevent Deletions)
```bash
# Prevent accidental deletions in automated environments
export SFCC_SAFETY_LEVEL=NO_DELETE

b2c sandbox create --realm test  # ✅ Allowed
b2c sandbox delete test-id       # ❌ Blocked
```

#### LLM/Agent Tools (Maximum Protection)
```bash
# Prevent AI agents from performing destructive operations
export SFCC_SAFETY_LEVEL=NO_UPDATE

b2c sandbox list                 # ✅ Allowed
b2c sandbox create --realm test  # ✅ Allowed
b2c sandbox delete test-id       # ❌ Blocked
b2c sandbox reset test-id        # ❌ Blocked
```

#### Monitoring/Reporting (Read-Only)
```bash
# Absolute read-only mode
export SFCC_SAFETY_LEVEL=READ_ONLY

b2c sandbox list           # ✅ Allowed
b2c sandbox get test-id    # ✅ Allowed
b2c sandbox create test    # ❌ Blocked
```

### What Gets Blocked

| Safety Level | DELETE | POST (create) | POST (reset) | PUT/PATCH | GET |
|--------------|--------|---------------|--------------|-----------|-----|
| **NONE** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **NO_DELETE** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **NO_UPDATE** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **READ_ONLY** | ❌ | ❌ | ❌ | ❌ | ✅ |

### Protected Commands

Safety Mode automatically protects ALL destructive commands across all topics:

- **Sandbox**: `delete`, `reset`, `alias delete`
- **Account Manager**: `users delete`, `users reset`, `clients delete`
- **Code**: `delete`
- **MRT**: `project delete`, `env delete`, `env var delete`, `env redirect delete`, `project notification delete`
- **SLAS**: `client delete`
- **eCDN**: All delete operations (certificates, zones, rules, etc.)

### Why Environment Variable?

Environment variables are more secure than command-line flags because:

1. **LLMs Don't Control Them**: When an LLM uses the CLI as a tool, it controls commands and flags but NOT the environment
2. **Session-Level**: Set once for the entire session/container
3. **Audit Trail**: Can be logged and monitored in CI/CD
4. **Cannot Be Bypassed**: Even `--force` flags don't override safety mode

### Error Messages

When an operation is blocked, you'll see clear error messages:

```bash
export SFCC_SAFETY_LEVEL=NO_DELETE
b2c sandbox delete test-id

# Error: Cannot delete sandbox: blocked by safety level NO_DELETE.
#
# Delete operations are blocked in NO_DELETE mode
#
# To allow this operation, unset or change the SFCC_SAFETY_LEVEL environment variable.
```

### Best Practices

#### For CI/CD Pipelines
```yaml
# GitHub Actions example
- name: Deploy to Production
  env:
    SFCC_SAFETY_LEVEL: NO_DELETE  # Prevent accidental deletions
  run: |
    b2c code deploy
    b2c sandbox start production
```

#### For AI Agent Tools
```bash
# Provide CLI to LLMs with safety enabled
export SFCC_SAFETY_LEVEL=NO_UPDATE
# LLMs can now read and create, but cannot delete or reset
```

#### For Production Environments
```bash
# Set in shell profile for production access
echo 'export SFCC_SAFETY_LEVEL=NO_UPDATE' >> ~/.bashrc
```

### Testing Safety Mode

Verify safety mode is working:

```bash
export SFCC_SAFETY_LEVEL=NO_DELETE
b2c sandbox delete fake-id

# Expected: "blocked by safety level NO_DELETE"
# NOT expected: Authentication error or API call
```

For comprehensive testing, see [GitHub Issue #67](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues/67).

## Best Practices

### For Contributors

- Review dependency updates carefully, especially for packages with build scripts
- Be cautious when adding new dependencies
- Prefer packages with minimal transitive dependencies
- Check package health on npm before adding (download counts, maintenance activity, known vulnerabilities)

### For Users

- Keep the CLI updated to receive security patches
- Review the `pnpm-workspace.yaml` settings if you fork or modify this project
- Consider using similar protections in your own projects
- **Use Safety Mode** when running CLI in automated environments or providing it as a tool to AI agents
