# Join campaign assignments to promotions

Use for inspecting a selected campaign. Replace `CAMPAIGN_ID` with an observed
or user-selected ID; use the configured `siteId`. Discover both GET contracts
first. This composes across API families without fetching tokens manually.

Select a bounded assignment slice, deduplicate detail reads, then join the
results locally. Keep assignment state separate from promotion state. Neither
alone proves the effective discount; use XML archives when required settings
are absent from the API contract.

Use the corresponding [built-in snippet](snippets.md); `codemode.describe(name)`
returns its current source and input schema.

At most 13 requests, four concurrent. Detail failures remain attached to their
promotion IDs. `nextOffset` indexes the assignment array; reuse the same campaign
and site, adjusting the slice for another read. Concurrent assignment changes can
shift positions. The assignment endpoint returns its full list: slicing limits
detail requests and model output, not that first response's transfer size.
