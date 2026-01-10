# steptypes.json Reference

Complete schema for custom job step type definitions.

## File Location

Place `steptypes.json` in the **root** folder of the cartridge (NOT inside `cartridge/`):

```
my_cartridge/
├── cartridge/
│   ├── controllers/
│   ├── scripts/
│   │   └── steps/
│   │       └── myStep.js
│   └── my_cartridge.properties
└── steptypes.json              <-- HERE (cartridge root)
```

**Important:** Only one `steptypes.json` file per cartridge. You cannot have both `steptypes.json` and `steptypes.xml` - use one or the other (JSON preferred).

## Root Structure

```json
{
    "step-types": {
        "script-module-step": [],
        "chunk-script-module-step": []
    }
}
```

## Task-Oriented Step Schema

```json
{
    "step-types": {
        "script-module-step": [
            {
                "@type-id": "custom.MyStep",
                "@supports-parallel-execution": "false",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "Step description",
                "module": "cartridge_name/cartridge/scripts/steps/myStep.js",
                "function": "execute",
                "timeout-in-seconds": 900,
                "parameters": {},
                "status-codes": {}
            }
        ]
    }
}
```

## Chunk-Oriented Step Schema

```json
{
    "step-types": {
        "chunk-script-module-step": [
            {
                "@type-id": "custom.MyChunkStep",
                "@supports-parallel-execution": "true",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "Step description",
                "module": "cartridge_name/cartridge/scripts/steps/myChunkStep.js",
                "before-step-function": "beforeStep",
                "read-function": "read",
                "process-function": "process",
                "write-function": "write",
                "after-step-function": "afterStep",
                "before-chunk-function": "beforeChunk",
                "after-chunk-function": "afterChunk",
                "total-count-function": "getTotalCount",
                "chunk-size": 100,
                "transactional": "false",
                "timeout-in-seconds": 1800,
                "parameters": {},
                "status-codes": {}
            }
        ]
    }
}
```

## Step Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `@type-id` | Yes | Unique ID (must start with `custom.`, max 100 chars, no whitespace) |
| `@supports-parallel-execution` | No | Allow parallel execution (default: `true`) |
| `@supports-site-context` | No | Available in site-scoped jobs (default: `true`) |
| `@supports-organization-context` | No | Available in org-scoped jobs (default: `true`) |
| `description` | No | Step description (max 4000 chars, not shown in BM) |
| `module` | Yes | Path to script module (no leading/trailing whitespace) |
| `timeout-in-seconds` | No | Step timeout in seconds (recommended to set) |

**Context Constraint:** `@supports-site-context` and `@supports-organization-context` cannot both be `true` or both be `false`. One must be `true` and the other `false`.

## Task Step Functions

| Attribute | Required | Description |
|-----------|----------|-------------|
| `function` | Yes | Main function name |

## Chunk Step Functions

| Attribute | Required | Description |
|-----------|----------|-------------|
| `read-function` | No | Read function name (default: `read`) |
| `process-function` | No | Process function name (default: `process`) |
| `write-function` | No | Write function name (default: `write`) |
| `before-step-function` | No | Init function (called once before step) |
| `after-step-function` | No | Cleanup function (called once after step) |
| `before-chunk-function` | No | Called before each chunk |
| `after-chunk-function` | No | Called after each chunk |
| `total-count-function` | No | Returns total item count for progress |
| `chunk-size` | **Yes** | Items per chunk (must be > 0) |
| `transactional` | No | Wrap chunks in transaction (default: `false`) |

**Note:** Chunk-oriented steps always finish with OK or ERROR - you cannot define custom exit status.

## Parameters

```json
{
    "parameters": {
        "parameter": [
            {
                "@name": "StringParam",
                "@type": "string",
                "@required": "true",
                "@trim": "true",
                "description": "A required string parameter with validation",
                "default-value": "default",
                "min-length": "1",
                "max-length": "100",
                "pattern": "^[a-zA-Z0-9_-]+$"
            },
            {
                "@name": "EnumParam",
                "@type": "string",
                "@required": "true",
                "description": "Select from predefined values",
                "enum-values": {
                    "value": ["option1", "option2", "option3"]
                }
            },
            {
                "@name": "NumberParam",
                "@type": "double",
                "@required": "false",
                "description": "A numeric parameter with range",
                "default-value": "10",
                "min-value": "0",
                "max-value": "100"
            },
            {
                "@name": "DateParam",
                "@type": "datetime-string",
                "@required": "false",
                "@target-type": "date",
                "description": "A datetime parameter converted to date"
            }
        ]
    }
}
```

### Parameter Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `@name` | Yes | Parameter name (no leading/trailing whitespace) |
| `@type` | Yes | Data type: `boolean`, `string`, `long`, `double`, `datetime-string`, `date-string`, `time-string` |
| `@required` | No | Required flag (default: `true`) |
| `@trim` | No | Trim whitespace before validation (default: `true`) |
| `@target-type` | No | For datetime/date/time types: convert to `long` or `date` (default: `date`) |
| `description` | Yes | Parameter description (max 256 chars) |
| `default-value` | No | Default value when not provided |
| `pattern` | No | Regex pattern for string validation |
| `min-length` | No | Min string length (≥1, strings only) |
| `max-length` | No | Max string length (≤1000, strings only) |
| `min-value` | No | Min value (for long, double, datetime-string, time-string) |
| `max-value` | No | Max value (for long, double, datetime-string, time-string) |
| `enum-values` | No | Allowed values (dropdown in Business Manager) |

### Parameter Types

| Type | Description | Script Access |
|------|-------------|---------------|
| `string` | Text | `parameters.Name` (String) |
| `boolean` | true/false | `parameters.Name` (Boolean) |
| `long` | Integer | `parameters.Name` (Number) |
| `double` | Decimal | `parameters.Name` (Number) |
| `datetime-string` | ISO datetime | `parameters.Name` (String) |
| `date-string` | ISO date | `parameters.Name` (String) |
| `time-string` | ISO time | `parameters.Name` (String) |

## Status Codes

```json
{
    "status-codes": {
        "status": [
            {
                "@code": "OK",
                "description": "Step completed successfully"
            },
            {
                "@code": "ERROR",
                "description": "Step failed"
            },
            {
                "@code": "NO_DATA",
                "description": "No data to process"
            },
            {
                "@code": "PARTIAL",
                "description": "Partially completed"
            }
        ]
    }
}
```

**Important notes:**
- Custom status codes work **only** with OK status. If you return `Status.ERROR` with a custom code, it is replaced with ERROR.
- Chunk-oriented steps **cannot** define custom exit status - they always finish with OK or ERROR.
- Custom codes cannot contain commas, wildcards, leading/trailing whitespace, or exceed 100 characters.

```javascript
// Task-oriented step - custom codes work with OK only
return new Status(Status.OK, 'NO_DATA', 'No files to process');
```

## Complete Example

```json
{
    "step-types": {
        "script-module-step": [
            {
                "@type-id": "custom.FTPDownload",
                "@supports-parallel-execution": "false",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "Download files from FTP server",
                "module": "my_cartridge/cartridge/scripts/steps/ftpDownload.js",
                "function": "execute",
                "timeout-in-seconds": 600,
                "parameters": {
                    "parameter": [
                        {
                            "@name": "Host",
                            "@type": "string",
                            "@required": "true",
                            "description": "FTP hostname"
                        },
                        {
                            "@name": "Port",
                            "@type": "long",
                            "@required": "false",
                            "default-value": "21"
                        },
                        {
                            "@name": "Protocol",
                            "@type": "string",
                            "@required": "true",
                            "enum-values": {
                                "value": ["FTP", "SFTP", "FTPS"]
                            }
                        },
                        {
                            "@name": "Username",
                            "@type": "string",
                            "@required": "true"
                        },
                        {
                            "@name": "Password",
                            "@type": "string",
                            "@required": "true"
                        },
                        {
                            "@name": "RemotePath",
                            "@type": "string",
                            "@required": "true",
                            "description": "Remote file or directory path"
                        },
                        {
                            "@name": "LocalPath",
                            "@type": "string",
                            "@required": "true",
                            "default-value": "/src/download/",
                            "description": "Local path relative to IMPEX"
                        },
                        {
                            "@name": "DeleteAfterDownload",
                            "@type": "boolean",
                            "@required": "false",
                            "default-value": "false"
                        }
                    ]
                },
                "status-codes": {
                    "status": [
                        { "@code": "OK", "description": "Download successful" },
                        { "@code": "ERROR", "description": "Download failed" },
                        { "@code": "NO_FILES", "description": "No files to download" },
                        { "@code": "CONNECT_ERROR", "description": "Connection failed" }
                    ]
                }
            }
        ],
        "chunk-script-module-step": [
            {
                "@type-id": "custom.ProductExport",
                "@supports-parallel-execution": "true",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "Export products to CSV file",
                "module": "my_cartridge/cartridge/scripts/steps/productExport.js",
                "before-step-function": "beforeStep",
                "total-count-function": "getTotalCount",
                "read-function": "read",
                "process-function": "process",
                "write-function": "write",
                "after-step-function": "afterStep",
                "chunk-size": 500,
                "transactional": "false",
                "timeout-in-seconds": 7200,
                "parameters": {
                    "parameter": [
                        {
                            "@name": "OutputFile",
                            "@type": "string",
                            "@required": "false",
                            "default-value": "/export/products.csv"
                        },
                        {
                            "@name": "CategoryID",
                            "@type": "string",
                            "@required": "false",
                            "description": "Filter by category (empty = all)"
                        },
                        {
                            "@name": "OnlineOnly",
                            "@type": "boolean",
                            "@required": "false",
                            "default-value": "true"
                        },
                        {
                            "@name": "IncludeMasters",
                            "@type": "boolean",
                            "@required": "false",
                            "default-value": "false"
                        }
                    ]
                },
                "status-codes": {
                    "status": [
                        { "@code": "OK", "description": "Export completed" },
                        { "@code": "ERROR", "description": "Export failed" },
                        { "@code": "NO_PRODUCTS", "description": "No products found" }
                    ]
                }
            }
        ]
    }
}
```
