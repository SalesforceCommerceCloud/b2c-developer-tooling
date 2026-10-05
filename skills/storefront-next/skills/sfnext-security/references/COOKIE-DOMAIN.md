# Cookie domain reference

Full guide: `docs/README-COOKIE-DOMAIN.md` in your project.

## Resolution order

1. `commerce.sites[].cookies.domain` (per site)
2. `app.cookies.domain` (global; env `PUBLIC__app__cookies__domain`)
3. Unset: host-only cookies

The domain is applied to every cookie the storefront writes (auth, session, site, locale, currency). It must be a parent of the serving host or the browser silently drops the cookies. A leading dot is optional.

## Business Manager match

Business Manager, Merchant Tools, Site Preferences, Hybrid Auth Settings:

| Storefront `cookies.domain` | BM level | Result |
|---|---|---|
| unset | 0 | OK, host-only everywhere |
| `.example.com` | 2 | OK, shared across subdomains |
| `.example.com` | 0 | Broken cross-subdomain session |
| unset | 2 | Duplicate host-only vs domain-scoped cookies |

Level 1 is rejected. Salesforce-managed sites need a request to the team managing Business Manager.

## Verify

```bash
curl -sI https://www.example.com/ | grep -i '^set-cookie:'
```

- Every cookie carries the same `Domain=`.
- No same-name duplicates (one host-only, one domain-scoped).
- A session persists between `www.` and `account.` hosts; in hybrid mode `dwsid` is shared with SFRA pages.
- Logout clears the domain-scoped cookies.

## Rollout

Changing the domain on a live site leaves old cookies next to new ones until they expire, and a host-only cookie shadows a domain-scoped one of the same name. Expect transient session glitches; roll out in a low-traffic window. A per-site empty string inherits the global domain; it cannot force host-only.
