# OCAPI Custom Object Search Reference

Full reference for searching custom objects via OCAPI Data API.

## Search Endpoint

```http
POST /s/-/dw/data/v24_1/custom_object_search/{object_type}
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
            "field": "c_status",
            "value": "active"
        }
    }
}
```

Supports operators:
- `is` (default): Exact match
- `one_of`: Match any value in array
- `is_null`: Check for null
- `is_not_null`: Check for non-null
- `less`, `greater`, `less_or_equal`, `greater_or_equal`: Comparisons
- `not_in`: Exclude values
- `neq`: Not equal

```json
{
    "term_query": {
        "field": "c_priority",
        "operator": "greater",
        "value": 5
    }
}
```

```json
{
    "term_query": {
        "field": "c_status",
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

### Range Query

```json
{
    "query": {
        "range_query": {
            "field": "c_count",
            "from": 1,
            "to": 100,
            "from_inclusive": true,
            "to_inclusive": false
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
                { "term_query": { "field": "c_isActive", "value": true } },
                { "term_query": { "field": "c_type", "value": "premium" } }
            ],
            "should": [
                { "term_query": { "field": "c_priority", "operator": "greater", "value": 5 } }
            ],
            "must_not": [
                { "term_query": { "field": "c_status", "value": "deleted" } }
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
                "term_query": {
                    "field": "c_isActive",
                    "value": true
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
                    "field": "c_addresses.city",
                    "value": "Boston"
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

```json
{
    "_v": "24.1",
    "count": 25,
    "data": [
        {
            "key_property": "key1",
            "c_name": "Test Object",
            "c_status": "active",
            "creation_date": "2024-01-15T10:30:00.000Z"
        }
    ],
    "expand": [],
    "hits": [
        {
            "data": { },
            "relevant_attributes": ["c_name"]
        }
    ],
    "query": { },
    "select": "(**)",
    "start": 0,
    "total": 150
}
```

## Pagination Example

```bash
# First page
curl -X POST ".../custom_object_search/MyType" \
  -d '{"query":{"match_all_query":{}},"start":0,"count":25}'

# Second page
curl -X POST ".../custom_object_search/MyType" \
  -d '{"query":{"match_all_query":{}},"start":25,"count":25}'
```

## Complex Query Example

Find active premium configs modified in the last 7 days:

```json
{
    "query": {
        "bool_query": {
            "must": [
                { "term_query": { "field": "c_isActive", "value": true } },
                { "term_query": { "field": "c_tier", "value": "premium" } },
                {
                    "range_query": {
                        "field": "last_modified",
                        "from": "2024-01-08T00:00:00.000Z"
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
