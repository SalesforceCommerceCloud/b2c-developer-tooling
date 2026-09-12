# Live custom property definitions

Use `scapi_schemas_list` for a focused schema read. When the contract is large,
fetch and filter inside `scapi_execute` to keep it out of the conversation.
The Schemas API requires `sfcc.scapi-schemas`; normal managed auth and safety apply.
Known `c_*` fields work without a schema read. Discovery is optional and helps
resolve tenant-specific names, types, and constraints.

Example: find custom property definitions in the target instance's Products API.
Pass the same `projectDirectory`/instance context as subsequent product requests.

```js
async () => {
  const response = await scapi.request({
    method: 'GET',
    path: '/dx/scapi-schemas/v1/organizations/{organizationId}/schemas/product/products/v1',
    query: {expand: ['custom_properties']},
  });
  if (!response.ok) return response;
  const fields = [];
  const pending = [{node: response.data, path: '$'}];
  while (pending.length) {
    const {node, path} = pending.pop();
    if (!node || typeof node !== 'object') continue;
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('c_')) {
        fields.push({path, name: key, definition: value});
      } else {
        pending.push({node: value, path: `${path}/${key}`});
      }
    }
  }
  return {total: fields.length, fields: fields.slice(0, 20)};
}
```

Narrow by field name for large customizations; follow relevant `$ref` targets and
inspect constraints before writing. The count reports omitted matches. A field's
presence in a response schema does not establish that it is writable: inspect the
operation's request schema when discovering unfamiliar fields. Use fields directly in `scapi.request` bodies;
no schema import or refresh is needed. Read back the requested fields to verify.

For custom endpoint execution, see [custom APIs](custom-apis.md).
