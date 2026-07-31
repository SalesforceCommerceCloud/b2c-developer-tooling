# OCAPI Custom Object Search Reference

Full reference for searching custom objects via OCAPI Data API.

## Search Endpoint

```http
POST /s/-/dw/data/v{version}/custom_objects_search/{object_type}
Authorization: Bearer {token}
Content-Type: application/json
```

## Request Structure

```json
{
    "query": { },
    "select": "(**)",
    "expand": [],
    "sorts": [{ "field": "creation_date", "sort_order": "desc" }],
    "start": 0,
    "count": 25
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `query` | Yes | Search query object |
| `select` | No | Fields to return (`(**)` for all) |
| `expand` | No | Related objects to expand |
| `sorts` | No | Sort order array |
| `start` | No | Pagination offset (default: 0) |
| `count` | No | Results per page (default: 25, max: 200) |

## Query Types

### Term Query (Exact Match)

```json
{
    "query": {
        "term_query": {
            "fields": ["c_status"],
            "operator": "is",
            "values": ["active"]
        }
    }
}
```

`fields` is a required array, and `operator` is required. `values`, when used, is an array;
omit it for `is_null` and `is_not_null`. Supported operators:
- `is`: Exact match
- `one_of`: Match any value in array
- `is_null`: Check for null
- `is_not_null`: Check for non-null
- `less`, `greater`: Comparisons
- `not_in`: Exclude values
- `neq`: Not equal

```json
{
    "term_query": {
        "fields": ["c_priority"],
        "operator": "greater",
        "values": [5]
    }
}
```

```json
{
    "term_query": {
        "fields": ["c_status"],
        "operator": "one_of",
        "values": ["active", "pending"]
    }
}
```

### Text Query (Full-Text Search)

```json
{
    "query": {
        "text_query": {
            "fields": ["c_name", "c_description"],
            "search_phrase": "test product"
        }
    }
}
```

### Range Filter

There is no `range_query`. Ranges are expressed as a `range_filter` inside a `filtered_query`:

```json
{
    "query": {
        "filtered_query": {
            "query": { "match_all_query": {} },
            "filter": {
                "range_filter": {
                    "field": "c_count",
                    "from": 1,
                    "to": 100,
                    "from_inclusive": true,
                    "to_inclusive": false
                }
            }
        }
    }
}
```

### Boolean Query

Combine multiple queries:

```json
{
    "query": {
        "bool_query": {
            "must": [
                { "term_query": { "fields": ["c_isActive"], "operator": "is", "values": [true] } },
                { "term_query": { "fields": ["c_type"], "operator": "is", "values": ["premium"] } }
            ],
            "should": [
                { "term_query": { "fields": ["c_priority"], "operator": "greater", "values": [5] } }
            ],
            "must_not": [
                { "term_query": { "fields": ["c_status"], "operator": "is", "values": ["deleted"] } }
            ]
        }
    }
}
```

| Clause | Description |
|--------|-------------|
| `must` | All conditions must match (AND) |
| `should` | At least one should match (OR) |
| `must_not` | None of these should match (NOT) |

### Match All Query

```json
{
    "query": {
        "match_all_query": {}
    }
}
```

### Filtered Query

Combine query with filter (filter doesn't affect scoring):

```json
{
    "query": {
        "filtered_query": {
            "query": {
                "text_query": {
                    "fields": ["c_name"],
                    "search_phrase": "test"
                }
            },
            "filter": {
                "term_filter": {
                    "field": "c_isActive",
                    "operator": "is",
                    "values": [true]
                }
            }
        }
    }
}
```

### Nested Query

Query nested objects:

```json
{
    "query": {
        "nested_query": {
            "path": "c_addresses",
            "query": {
                "term_query": {
                    "fields": ["c_addresses.city"],
                    "operator": "is",
                    "values": ["Boston"]
                }
            }
        }
    }
}
```

## Sorting

```json
{
    "sorts": [
        { "field": "creation_date", "sort_order": "desc" },
        { "field": "c_priority", "sort_order": "asc" }
    ]
}
```

| Sort Order | Description |
|------------|-------------|
| `asc` | Ascending (A-Z, 0-9, oldest first) |
| `desc` | Descending (Z-A, 9-0, newest first) |

## Field Selection

```json
{
    "select": "(c_name, c_status, creation_date)"
}
```

- `(**)` - All fields (default)
- `(field1, field2)` - Specific fields only

## Response Structure

This example assumes `MyType` defines a string key attribute named `customObjectId`.

```json
{
    "count": 1,
    "hits": [
        {
            "key_property": "customObjectId",
            "key_value_string": "key1",
            "object_type": "MyType",
            "c_name": "Test Object",
            "c_status": "active"
        }
    ],
    "query": { "match_all_query": {} },
    "select": "(**)",
    "start": 0,
    "total": 1
}
```

## Pagination Example

```bash
# First page
curl -X POST ".../custom_objects_search/MyType" \
  -d '{"query":{"match_all_query":{}},"start":0,"count":25}'

# Second page
curl -X POST ".../custom_objects_search/MyType" \
  -d '{"query":{"match_all_query":{}},"start":25,"count":25}'
```

## Complex Query Example

Find active premium configs modified in the last 7 days:

```json
{
    "query": {
        "bool_query": {
            "must": [
                { "term_query": { "fields": ["c_isActive"], "operator": "is", "values": [true] } },
                { "term_query": { "fields": ["c_tier"], "operator": "is", "values": ["premium"] } },
                {
                    "term_query": {
                        "fields": ["last_modified"],
                        "operator": "greater",
                        "values": ["2024-01-08T00:00:00.000Z"]
                    }
                }
            ]
        }
    },
    "sorts": [{ "field": "last_modified", "sort_order": "desc" }],
    "count": 50
}
```

## Error Handling

| Status | Description |
|--------|-------------|
| 400 | Invalid query syntax |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Custom object type not found |
