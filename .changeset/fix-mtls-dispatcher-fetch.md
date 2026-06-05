---
'@salesforce/b2c-tooling-sdk': patch
---

Make mTLS / self-signed client certificates robust against Node's bundled undici version. The TLS dispatcher is an undici `Agent` from the `undici` npm package, but it was handed to `global.fetch`, which is backed by whatever undici Node bundles internally — a version that drifts across Node releases and can be a different major than the npm package. Because undici's request-handler interface changed across majors (and the cross-version compatibility shim is removed in undici 8), pairing a foreign Agent with `global.fetch` can fail and silently drop the client certificate. Requests that carry a dispatcher now use undici's own `fetch` so the Agent and fetch always share one undici instance, regardless of Node version. Applies to all auth strategies (basic, client-credentials, JWT, implicit, API key), so staging deploys with `--certificate`/`--selfsigned` keep working as Node updates its bundled undici.
