# Object definitions (system object attributes)

`dx/object-definitions/v1` reads and writes the attribute definitions and attribute groups of **system object
types** (Product, Order, Profile, SitePreferences, ...). Use it to find the `c_*` attributes an instance has, to
check value types and enum values before you write `product.custom.x` code or `c_x` request bodies, and to add
attributes without a site import. Custom object types are not available here (they appear only as unnamed
`CustomObject` list entries, and `GET .../object-types/CustomObject` returns 404).

Built-in snippets: `object-type-attributes-inspect` (read, compact rows with enum values) and
`attribute-create-and-group` (write, create-if-missing plus group assignment plus verify).

## Scopes

`sfcc.object-definitions.rw` is needed for writes **and** for `attribute-definition-search` and
`attribute-group-search`. The read-only `sfcc.object-definitions` scope covers only list and get. A 403 on a
search with a read-only client means the scope is missing; fall back to list and get.

## Behaviour to know

- **IDs:** paths use the plain ID (`color`). Requesting `c_color` returns 404. `effectiveId` is `c_color`.
- **Fields:** list and get return only IDs unless you pass `select: '(**)'`. Don't add `select` to a search
  request, because it breaks the search.
- **Enum values:** only search returns `valueDefinitions`, and it returns them without `select`. Get and list
  never do. Writes silently ignore `valueDefinitions`, so enum values need a metadata site import
  (`meta/system-objecttype-extensions.xml`); tell the user that.
- **PUT** on `attribute-definitions/{id}` creates (201) or **fully replaces** (200) the definition, and resets
  every field you leave out. Use **PATCH** for partial changes, and GET first so you don't replace by accident.
  Changing `valueType` is rejected (400 `attribute-definition-property-read-only`). Deleting a system
  attribute returns 400 `attribute-definition-read-only`.
- **Groups:** PUT on `attribute-groups/{id}` replaces the group and clears its assignments. To assign or
  unassign, use PUT or DELETE on `attribute-groups/{groupId}/attribute-definitions/{defId}` (204, no body).
  System attributes can be assigned to custom groups. `expand: 'definition'` (a string) inlines the assigned
  definitions.
- **Paging:** `limit` is at most 200 and `offset` pages. Search takes the same values in the body:
  `{query, limit, offset}`, and returns `hits` and `total`.

## Search queries

Use the OCAPI-style query DSL. `boolQuery.must` combines clauses; OR works only within one field bucket.

```js
{
  boolQuery: {
    must: [
      {termQuery: {fields: ['system'], operator: 'is', values: [false]}},          // custom only
      {termQuery: {fields: ['value_type'], operator: 'one_of', values: ['enum_of_string']}},
      {textQuery: {fields: ['id', 'display_name'], searchPhrase: 'color'}},
    ],
  },
}
```

Term fields include `id`, `system`, `group`, `value_type`, `localizable`, and `site_specific`. The operators are
`is`, `one_of`, `is_null`, `is_not_null`, `less`, `greater`, `not_in`, and `neq`.

The CLI equivalent is `b2c object-types` (skill `b2c-cli:b2c-object-types`).
