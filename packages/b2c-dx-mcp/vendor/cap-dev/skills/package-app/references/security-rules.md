# Security Scan Rules

Canonical list of all checks performed by `.github/scripts/security-scan.sh`.

## Blocking findings (21 checks — exit code 1)

Must fix before packaging or submission:

- S1: Dynamic code evaluation constructs — code injection sinks
- S2: Dynamic module loading with concatenation
- S3: Unsafe innerHTML assignment — XSS risk
- S4: Hardcoded secrets (API keys, AWS keys, GitHub PATs, Slack tokens, private keys)
- S5: Hardcoded credentials in impex XML
- S7: Inline Authorization headers — must use service framework
- S8: Additional DOM sinks — outerHTML assignment, document.write, insertAdjacentHTML
- S9: ISML `<isprint>` with `encoding="off"` — template injection
- S10: Secret files in package (.env, .key, .pem, .p12, .pfx, .jks)
- S11: Direct HTTPClient usage — must use service framework
- S13: setTimeout/setInterval in hook scripts — blocking calls
- S14: Unbounded loops (while(true)/for(;;)) without break/return
- S15: Service profiles missing rate-limit-enabled AND circuit-breaker-enabled
- P1: Service profile XML missing timeout-millis
- Q1: Hook scripts referenced in hooks.json that don't exist
- Q2: Hook scripts missing expected function exports
- Q3: Missing error handling (try/catch) in hook scripts
- Q4: Missing uninstall/services.xml or missing mode="delete" (including service ID mismatches)
- Q5: Hardcoded site-id instead of SITEID placeholder
- Q6: Absolute file paths in code
- Q7: Console logging in cartridge code — use dw.system.Logger

## Warning findings (6 checks — review recommended)

Should fix but non-blocking:

- S6: Non-cryptographic random number generation (Math.random)
- S12: PII field names in Logger calls (may be false positive — requires context)
- S16: Session object access in hook scripts (dw.system.Session, session.privacy)
- S17: BM controller `guard.ensure([...])` includes a state-changing method (`post`/`put`/`patch`/`delete`) but omits `'csrf'`. Scoped to files under `/bm_cartridges/` so storefront controllers with their own CSRF-token flow are not flagged. **Suggested fix:** add `'csrf'` to the guard array, e.g. `guard.ensure(['post', 'https', 'csrf', 'loggedIn'], ...)`.
- S18: Logger call stringifies a raw error/response object — `Logger.(warn|error|info|debug|trace)(... JSON.stringify(err|error|e|response|svcResponse|svcResult|result ...))`. Whole error/response payloads can carry PII, stack traces, or vendor internals. **Suggested fix:** log only `error.message` (and a request/status code) or a purpose-built redacted view; never the whole object.
- S19: `encodeURI(...)` used to sanitize a URL built by concatenation (`+`) or template-literal interpolation. `encodeURI` preserves URL delimiters (`/`, `?`, `&`, `=`, `#`) and single quotes, so a hostile segment can break out into a new query param or path. **Suggested fix:** `encodeURIComponent` each user-provided segment/param individually, or use a URL builder that percent-encodes per component.
