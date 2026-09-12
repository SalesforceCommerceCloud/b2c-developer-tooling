# Failed-order search recipe

## Choose a supported surface

Admin Orders has rejected `status=failed` while its
response schema still contained `failed`. Verify current query support before
relying on it; do not infer a filter from response values or repeat a rejected
request unchanged. CIP/CCAC is not evidence of the complete failed-order population.
Its reporting model, ingestion delay, and coverage differ from order search.

The demonstrated fallback is OCAPI **Shop** `POST /order_search`, backed by the
site's order search index. There is no managed OCAPI request helper in SCAPI code
mode. Use an authorized external HTTP client/terminal if available; otherwise
report the gap and continue with logs. Do not deploy an OrderMgr controller or
Custom API just to gain inspection access.

## Access and execution

Use configured hostname, site ID, and client ID from `config_inspect` or
`b2c setup inspect`. Obtain an AM token through the CLI's `b2c auth token --json`
for an external request, keeping it in memory and out of output/files. If using
the MCP token helper, read `skill://mcp/scapi/references/tokens.md`; token export
is only for the external client, never required for managed SCAPI calls.
MCP Safety Mode does not protect an independently executed HTTP request.

The OAuth client needs the site's OCAPI Shop resource grant for `POST /order_search`
and a usable order search index. Use the
[authentication guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication)
and `docs_search` for current OCAPI Settings/order indexing instructions. Have
the user authorize any grant or index maintenance; do not perform it to satisfy
a read request.

POST `https://{hostname}/s/{siteId}/dw/shop/{version}/order_search?client_id={clientId}`
with a Bearer token and JSON content type. Select a supported OCAPI version from
configuration/docs; do not assume a version from an unrelated example.

## Bounded query recipe

Count FAILED orders for fixed UTC boundaries (replace `FROM` and `TO`):

```json
{
  "query": {
    "filtered_query": {
      "query": {"term_query": {"fields": ["status"], "operator": "is", "values": ["failed"]}},
      "filter": {"range_filter": {"field": "creation_date", "from": "FROM", "to": "TO"}}
    }
  },
  "select": "(total)",
  "count": 1
}
```

For all indexed orders, replace only the inner query with `{"match_all_query":{}}`.
Use the same site and bounds. `count: 0` is rejected; read `total` from a valid
response. Report `failed / all indexed orders`, not failed/success or conversion.
The denominator includes other statuses and cannot see attempts without orders.
Separate requests are not an atomic snapshot; retain capture times/index caveats.

For a maximum 10-order sample, keep the failed query and set:

```json
{
  "select": "(hits.(data.(order_no,status,creation_date,product_items.(product_id))),total)",
  "sorts": [{"field": "creation_date", "sort_order": "desc"}],
  "count": 10
}
```

Do not select email, addresses, or payment instruments. Count a product once per
sampled order; label the sample size and total. For the earliest indexed failure
inside this window, use ascending sort with `count: 1`; this is not necessarily
incident onset. Do not crawl all historical orders by default.

## Errors and interpretation

Check HTTP success and expected response fields for **every** count/sample call.
Report failed stages and preserve available results. Missing `total` or a failed
query is unknown, never zero. Suppress the ratio if either count is unavailable.

- 401: inspect the actual auth fault/expiry; do not print tokens.
- 403 `ClientAccessForbiddenException`: check the site-specific Shop resource grant.
  Other 403s need their own fault interpretation.
- 500 mentioning Order Incremental Indexing: index prerequisite is unmet. Other
  500s are server errors, not proof of an index problem.
- Successful zero matches: distinguish no indexed matches in this window from
  no checkout failures, ingestion/index lag, and incorrect target/window.
