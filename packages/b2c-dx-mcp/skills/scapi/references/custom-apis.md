# Custom Admin APIs

Custom contracts are live and tenant-specific; they are absent from offline `spec`.
Discover with `scapi_schemas_list({apiFamily: 'custom'})`. Inspect the chosen API's
paths, inputs, responses, and operation/root `security`. Use
`scapi_custom_apis_get_status` for registration failures.

In each execution, GET the selected contract through `scapi.request` before calling
its endpoints. This registers the host's copy for the rest of that program only;
reading via another tool or a previous program does not register it. Neither editing
the returned object nor supplying a schema in a request changes the contract.
For first use, return selected contract fields and resolve intent before writing.
For known workflows, fetch and execute in one program; do not return the whole schema.

```js
async (input) => {
  const api = `custom/${encodeURIComponent(input.apiName)}/${encodeURIComponent(input.apiVersion)}`;
  const contract = await scapi.request({
    method: 'GET',
    path: `/dx/scapi-schemas/v1/organizations/{organizationId}/schemas/${api}`,
  });
  if (!contract.ok) return {stage: 'schema', ...contract};
  // endpointPath is a previously inspected contract path with path IDs substituted.
  const result = await scapi.request({
    method: 'GET',
    path: `/${api}/organizations/{organizationId}${input.endpointPath}`,
    query: input.query,
  });
  if (!result.ok) return {stage: 'endpoint', ...result};
  return {status: result.status, fields: Object.fromEntries(
    input.fields.map(name => [name, result.data[name]])
  )};
}
```

- Schema lookup needs `sfcc.scapi-schemas`; execution needs the operation's declared
  `c_*` scope and tenant scope. Managed auth requests each; `sfcc.custom-apis` is
  for registration status, not custom business logic.
- Only `AmOAuth2` execution is supported. A `ShopperToken` contract requires a
  separate Shopper client; acquiring an Admin token does not enable it.
- Paths in custom schemas are endpoint-relative (`/info`); requests use
  `/custom/{apiName}/{apiVersion}/organizations/{organizationId}/info`.
- Required parameters and JSON-body checks, SDK safety, cancellation, and execution
  limits apply to schema reads and endpoint calls. Both count toward the call limit.
- Schema fetch errors retain their HTTP status/body and access diagnostics. No
  endpoint is enabled by a failed fetch. Unknown paths/methods are rejected.
- For writes, verify the result before retrying and preserve completed stages.

Use the same project/instance throughout. Optional CLI discovery:
`b2c scapi schemas get custom <name> <version> --expand-all --json`.
Authorization reference: `docs_read({query: 'commerce-api/custom-api-authentication'})`.
