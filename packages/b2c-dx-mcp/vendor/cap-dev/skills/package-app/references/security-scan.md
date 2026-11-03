# Security Scan Reference

Run before packaging any app to catch security issues early.

## Running the scan

```bash
bash .github/scripts/security-scan.sh <domain>/<appName>/commerce-<appName>-app-v<version>/
```

## Rule reference

See [security-rules.md](security-rules.md) for the complete list of blocking and warning checks.

## Response to findings

If **blocking** findings are found:
- **Stop packaging** — do not generate ZIP
- Report specific file paths and line numbers
- Help developer fix each issue
- Re-run scan after fixes

If only **warnings** are found:
- Continue with packaging
- Report warnings for developer review
- Suggest fixes but don't block
