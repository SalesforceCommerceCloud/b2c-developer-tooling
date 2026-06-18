---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-cli': patch
---

Resolve all critical and high severity dependency advisories reported by `pnpm audit`.

Direct dependencies of the published packages were bumped in package.json so that consumers installing the SDK, CLI, or MCP server receive the patched versions: the SDK raises `js-yaml`, `minimatch`, `protobufjs`, and `undici`, and the MCP server raises `yaml` and `postcss`. The SDK also upgrades `applicationinsights` from 2.x to 3.x to pick up a non-vulnerable `@opentelemetry/core`; this is an internal telemetry change with no public API impact.

Remaining transitive advisories with no direct-dependency lever are pinned to patched releases (within their existing major versions) via workspace overrides: fast-xml-parser, hono, @hono/node-server, ws, vite, rollup, form-data, http-proxy-middleware, path-to-regexp, serialize-javascript, lodash, underscore, flatted, fast-uri, tmp, express-rate-limit, brace-expansion, shell-quote, and @opentelemetry/core.
