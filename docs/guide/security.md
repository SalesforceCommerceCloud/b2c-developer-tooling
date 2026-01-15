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
