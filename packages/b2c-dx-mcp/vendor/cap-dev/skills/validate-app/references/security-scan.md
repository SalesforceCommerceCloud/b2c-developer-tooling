# Security Scan Reference

Comprehensive security validation for commerce apps before PR submission.

## Two-phase security validation

### Phase 1: Automated scan script

```bash
bash .github/scripts/security-scan.sh commerce-<appName>-app-v<version>/
```

See [security-rules.md](security-rules.md) for the complete list of blocking and warning checks.

### Phase 2: AI-powered semantic review

After the script runs, perform semantic analysis:

**Data exfiltration patterns:**
- Review hook scripts and service calls for unauthorized data collection
- Does the app send basket, customer, or order data to endpoints unrelated to its declared domain?
- Example violation: Tax app sending customer emails to external analytics service

**Permission scope creep:**
- Does the app access Script API objects or customer data beyond its stated purpose?
- Example violation: Shipping app reading dw.customer.Profile payment instruments

**Business logic vulnerabilities:**
- Could hook implementations be manipulated? (negative tax values, price overrides)
- Race conditions in shared state access?
- Improper input validation that could affect calculations?

**Service call patterns:**
- Are external API calls batched efficiently, or one call per line item?
- Are service responses validated before use?
- Is retry logic present that could cause duplicate side effects (double-charging)?

**Impex safety:**
- Do install impex files create overly broad permissions?
- Do custom object definitions expose sensitive data without access controls?
- Are retention policies appropriate for data sensitivity?

## Reporting findings

**Blocking findings:**
- Mark validation as **FAIL**
- Provide specific file paths and line numbers
- Explain the security risk
- Recommend specific fixes

**Warnings from semantic review:**
- Include in validation report with clear explanations
- Mark as warnings (non-blocking)
- Explain potential risks and recommended improvements
