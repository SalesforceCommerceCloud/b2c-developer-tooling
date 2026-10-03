---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Address review feedback on the MRT SCAPI backend commands:

- `mrt env access-control delete` now prompts for confirmation (with a `--force` / `-f` flag to skip it), matching `mrt env delete`, `mrt env redirect delete`, and `mrt project delete`. Removing an access-control header can leave an environment publicly reachable, so it should not be a silent one-shot delete.
- `mrt env redirect list --search` now warns when combined with the SCAPI backend. The SCAPI Storefront Environments gateway does not yet accept a `search` query parameter (it rejects the request), so the filter is honored on the legacy backend only; on SCAPI the term is dropped and the user is warned rather than silently receiving an unfiltered list.
- `mrt env redirect list` keeps `fromPath` / `toUrl` as backward-compatible aliases for the renamed `source` / `destination` columns, so existing `--columns fromPath,toUrl` scripts keep working.
- `mrt env redirect delete --json` emits both `identifier` and the backward-compatible `fromPath` key alongside a `deleted` boolean.
- `mrt env redirect clone --json` synthesizes a stable `{from, to, count}` object on the SCAPI backend (which returns an empty 201) instead of emitting a bare `null`.
