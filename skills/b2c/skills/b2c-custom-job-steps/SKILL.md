---
name: b2c-custom-job-steps
description: Create custom job steps for B2C Commerce batch processing. Use this skill whenever the user needs to write a batch job, data export script, scheduled cleanup task, or any server-side processing that runs on a schedule. Also use when they ask about steptypes.json, chunk-oriented vs task-oriented job steps, read/process/write patterns, how to get a custom job to appear in Business Manager, or how to author and import a jobs.xml job definition (job/flow/step structure, step type, the required triggers element) so a step type becomes a runnable, schedulable job — even if they just say "I need a script that runs nightly" or "batch process orders".
---

# Custom Job Steps Skill

This skill guides you through **creating new custom job steps** for Salesforce B2C Commerce batch processing.

> **Running an existing job?** If you need to execute jobs or import site archives via CLI, use the `b2c-cli:b2c-job` skill instead.

## When to Use

- Creating a **new scheduled job** for batch processing
- Building a **data import job** (customers, products, orders)
- Building a **data export job** (reports, feeds, sync)
- Implementing **data sync** between systems
- Creating **cleanup or maintenance tasks**

## Overview

Custom job steps allow you to execute custom business logic as part of B2C Commerce jobs. There are two execution models:

| Model | Use Case | Progress Tracking |
|-------|----------|-------------------|
| **Task-oriented** | Single operations (FTP, import/export) | Limited |
| **Chunk-oriented** | Bulk data processing | Fine-grained |

## File Structure

```
my_cartridge/
├── cartridge/
│   ├── scripts/
│   │   └── steps/
│   │       ├── myTaskStep.js       # Task-oriented script
│   │       └── myChunkStep.js      # Chunk-oriented script
│   └── my_cartridge.properties
└── steptypes.json                  # Step type definitions (at cartridge ROOT)
```

**Important:** The `steptypes.json` file must be placed in the **root** folder of the cartridge, not inside the `cartridge/` directory. Only one `steptypes.json` file per cartridge.

## Step Type Definition (steptypes.json)

```json
{
    "step-types": {
        "script-module-step": [
            {
                "@type-id": "custom.MyTaskStep",
                "@supports-parallel-execution": "false",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "My custom task step",
                "module": "my_cartridge/cartridge/scripts/steps/myTaskStep.js",
                "function": "execute",
                "timeout-in-seconds": 900,
                "parameters": {
                    "parameter": [
                        {
                            "@name": "InputFile",
                            "@type": "string",
                            "@required": "true",
                            "description": "Path to input file"
                        },
                        {
                            "@name": "Enabled",
                            "@type": "boolean",
                            "@required": "false",
                            "default-value": "true",
                            "description": "Enable processing"
                        }
                    ]
                },
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
                        }
                    ]
                }
            }
        ],
        "chunk-script-module-step": [
            {
                "@type-id": "custom.MyChunkStep",
                "@supports-parallel-execution": "true",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "Bulk data processing step",
                "module": "my_cartridge/cartridge/scripts/steps/myChunkStep.js",
                "before-step-function": "beforeStep",
                "read-function": "read",
                "process-function": "process",
                "write-function": "write",
                "after-step-function": "afterStep",
                "total-count-function": "getTotalCount",
                "chunk-size": 100,
                "transactional": "false",
                "timeout-in-seconds": 1800,
                "parameters": {
                    "parameter": [
                        {
                            "@name": "CategoryId",
                            "@type": "string",
                            "@required": "true"
                        }
                    ]
                }
            }
        ]
    }
}
```

## From Step Type to Runnable Job (jobs.xml)

`steptypes.json` only *declares* a step type — it does not create a job. To get a job that `b2c job run` can execute and Business Manager can schedule, author a **job definition** (`jobs.xml`) that references your step type, then import it:

```bash
b2c job import ./my-job-archive   # jobs.xml at the archive root
```

A minimal valid definition wires one step into a flow and includes the **required `<triggers>`** element:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">
    <job job-id="MyNightlyExport">
        <flow>
            <context site-id="RefArch"/>
            <!-- type="..." matches the @type-id declared in steptypes.json -->
            <step step-id="ExportStep" type="custom.ProductExport">
                <parameters>
                    <parameter name="OutputFile">/export/products.csv</parameter>
                </parameters>
            </step>
        </flow>
        <triggers>
            <run-once enabled="false">
                <date>2025-01-01</date>
                <time>00:00:00.000Z</time>
            </run-once>
        </triggers>
    </job>
</jobs>
```

Key rules (full details in the [jobs.xml Reference](references/JOBS-XML.md)):

- **`<triggers>` is required** by the schema — a `jobs.xml` without it fails import validation. Use `<run-once enabled="false">` for an on-demand/manually-run job, or `<run-recurring>` to schedule it.
- The `<step>` **`type`** attribute references the step type; its value must match the **`@type-id`** you declared in `steptypes.json` (don't confuse the two — `steptypes.json` uses `@type-id`, `jobs.xml` uses `type`).
- `<job>` children must appear in order: `description → parameters → flow/split → rules → triggers`.
- The cartridge carrying the step's `steptypes.json` + module must be deployed and on the cartridge path before the job can resolve the step type.

After import, run it with `b2c job run MyNightlyExport --wait` (see the `b2c-cli:b2c-job` skill).

## Task-Oriented Steps

Use for single operations like FTP transfers, file generation, or import/export.

### Script (scripts/steps/myTaskStep.js)

```javascript
'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');

/**
 * Execute the task step
 * @param {Object} parameters - Job step parameters
 * @param {dw.job.JobStepExecution} stepExecution - Step execution context
 * @returns {dw.system.Status} Execution status
 */
exports.execute = function (parameters, stepExecution) {
    var log = Logger.getLogger('job', 'MyTaskStep');

    try {
        var inputFile = parameters.InputFile;
        var enabled = parameters.Enabled;

        if (!enabled) {
            log.info('Step disabled, skipping');
            return new Status(Status.OK, 'SKIP', 'Step disabled');
        }

        // Your business logic here
        log.info('Processing file: ' + inputFile);

        // Return success
        return new Status(Status.OK);

    } catch (e) {
        log.error('Step failed: ' + e.message);
        return new Status(Status.ERROR, 'ERROR', e.message);
    }
};
```

### Status Codes

```javascript
// Success
return new Status(Status.OK);
return new Status(Status.OK, 'CUSTOM_CODE', 'Custom message');

// Error
return new Status(Status.ERROR);
return new Status(Status.ERROR, null, 'Error message');
```

**Important:** Custom status codes work **only** with OK status. If you use a custom code with ERROR status, it is replaced with ERROR. Custom status codes cannot contain commas, wildcards, leading/trailing whitespace, or exceed 100 characters.

## Chunk-Oriented Steps

Use for bulk processing of countable data (products, orders, customers).

**Important:** You cannot define custom exit status for chunk-oriented steps. Chunk modules always finish with either **OK** or **ERROR**.

### Required Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `read()` | Get next item | Item or nothing |
| `process(item)` | Transform item | Processed item or nothing (filters) |
| `write(items)` | Save chunk of items | Nothing |

### Optional Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `beforeStep()` | Initialize (open files, queries) | Nothing |
| `afterStep(success)` | Cleanup (close files) | Nothing |
| `getTotalCount()` | Return total items for progress | Number |
| `beforeChunk()` | Before each chunk | Nothing |
| `afterChunk()` | After each chunk | Nothing |

### Script (scripts/steps/myChunkStep.js)

```javascript
'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');

var log = Logger.getLogger('job', 'MyChunkStep');
var products;
var fileWriter;

/**
 * Initialize before processing
 */
exports.beforeStep = function (parameters, stepExecution) {
    log.info('Starting chunk processing');

    // Open resources
    var outputFile = new File(File.IMPEX + '/export/products.csv');
    fileWriter = new FileWriter(outputFile);
    fileWriter.writeLine('ID,Name,Price');

    // Query products
    products = ProductMgr.queryAllSiteProducts();
};

/**
 * Get total count for progress tracking
 */
exports.getTotalCount = function (parameters, stepExecution) {
    return products.count;
};

/**
 * Read next item
 * Return nothing to signal end of data
 */
exports.read = function (parameters, stepExecution) {
    if (products.hasNext()) {
        return products.next();
    }
    // Return nothing = end of data
};

/**
 * Process single item
 * Return nothing to filter out item
 */
exports.process = function (product, parameters, stepExecution) {
    // Filter: skip offline products
    if (!product.online) {
        return;  // Filtered out
    }

    // Transform
    return {
        id: product.ID,
        name: product.name,
        price: product.priceModel.price.value
    };
};

/**
 * Write chunk of processed items
 */
exports.write = function (items, parameters, stepExecution) {
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        fileWriter.writeLine(item.id + ',' + item.name + ',' + item.price);
    }
};

/**
 * Cleanup after all chunks
 */
exports.afterStep = function (success, parameters, stepExecution) {
    // Close resources
    if (fileWriter) {
        fileWriter.close();
    }
    if (products) {
        products.close();
    }

    if (success) {
        log.info('Chunk processing completed successfully');
    } else {
        log.error('Chunk processing failed');
    }
};
```

## Parameter Types

| Type | Description | Example Value |
|------|-------------|---------------|
| `string` | Text value | `"my-value"` |
| `boolean` | true/false | `true` |
| `long` | Integer | `12345` |
| `double` | Decimal | `123.45` |
| `datetime-string` | ISO datetime | `"2024-01-15T10:30:00Z"` |
| `date-string` | ISO date | `"2024-01-15"` |
| `time-string` | ISO time | `"10:30:00"` |

### Parameter Validation Attributes

| Attribute | Applies To | Description |
|-----------|------------|-------------|
| `@trim` | All | Trim whitespace before validation (default: `true`) |
| `@required` | All | Mark as required (default: `true`) |
| `@target-type` | datetime-string, date-string, time-string | Convert to `long` or `date` (default: `date`) |
| `pattern` | string | Regex pattern for validation |
| `min-length` | string | Minimum string length (must be ≥1) |
| `max-length` | string | Maximum string length (max 1000 chars total) |
| `min-value` | long, double, datetime-string, time-string | Minimum numeric value |
| `max-value` | long, double, datetime-string, time-string | Maximum numeric value |
| `enum-values` | All | Restrict to allowed values (dropdown in BM) |

## Configuration Options

### steptypes.json Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `@type-id` | Yes | Unique ID (must start with `custom.`, max 100 chars) |
| `@supports-parallel-execution` | No | Allow parallel execution (default: `true`) |
| `@supports-site-context` | No | Available in site-scoped jobs (default: `true`) |
| `@supports-organization-context` | No | Available in org-scoped jobs (default: `true`) |
| `module` | Yes | Path to script module |
| `function` | Yes | Function name to execute (task-oriented) |
| `timeout-in-seconds` | No | Step timeout (recommended to set) |
| `transactional` | No | Wrap in single transaction (default: `false`) |
| `chunk-size` | Yes* | Items per chunk (*required for chunk steps) |

**Context Constraints:** `@supports-site-context` and `@supports-organization-context` cannot both be `true` or both be `false` - one must be `true` and the other `false`.

## Standard (System) Job Steps

Custom steps are only half of a job flow. B2C Commerce also ships **standard (system) job steps** — built-in step **type IDs** you add to a flow in **Business Manager → Administration → Operations → Jobs**, or reference by type ID in a `jobs.xml` flow inside a site-import archive. Unlike custom steps, you do **not** declare these in `steptypes.json`; they are always available. Use them for catalog/inventory/price/content/coupon/custom-object import & export, order export, and similar platform operations — and chain them with your custom steps.

**Do not guess standard step type IDs or their parameters.** The full catalog — every step's purpose plus its configuration parameters (required, defaults, allowed values) — is bundled with the CLI and searchable through the `b2c-cli:b2c-docs` skill:

```bash
# Browse the catalog of standard step type IDs
b2c docs read job-steps

# Look up a specific step's purpose + configuration parameters
b2c docs read ImportCatalog
b2c docs read ExportInventoryLists

# Fuzzy-search for a step
b2c docs search "import price"
```

### Commonly used standard steps

The bundled catalog covers the full set of standard step type IDs shown in the Business Manager job-step picker (import, export, and processing steps). Below is a representative subset — run `b2c docs read job-steps` for the complete list, and `b2c docs read <TypeID>` for any step's full parameters and defaults. **Scope** is the execution scope (Organization, Site, or both).

| Type ID | Scope | Key required params |
| --- | --- | --- |
| `ImportCatalog` | Organization | `NoFilesFoundHandling`, `ImportMode`, `ImportFailedHandling` |
| `ImportInventoryLists` | Organization | `NoFilesFoundHandling`, `ImportMode`, `ImportFailedHandling` |
| `ImportPriceBook` | Organization | `NoFilesFoundHandling`, `ImportMode`, `ImportFailedHandling` |
| `ImportContent` | Site | `NoFilesFoundHandling`, `ImportMode`, `ImportFailedHandling` |
| `ImportCustomObjects` | Organization & Sites | `NoFilesFoundHandling`, `ImportFailedHandling` |
| `ExportCatalog` | Organization | `CatalogID` |
| `ExportInventoryLists` | Site | (none) |
| `ExportPriceBook` | Organization | `PriceBookID` |
| `ExportContent` | Organization & Sites | `LibraryID` |
| `ExportOrders` | Site | `Confirmation Status`, `Shipment Status`, `Payment Status` |
| `ExecutePreconfiguredDataReplicationProcess` | Organization | `ReplicationProcessID` |
| `SearchReindex` | Site | `Indexer Type` |
| `ExecuteScriptModule` | Organization & Sites | `ExecuteScriptModule.Module` |

Import steps share a common set of file-handling parameters (`WorkingFolder`, `FileNamePattern`, `ImportMode`, `NoFilesFoundHandling`, `ImportFailedHandling`, `AfterImportFileHandling`, `ArchiveFolder`); export steps share `ExportFile` / `FileNamePrefix` / `OverwriteExportFile`. Processing steps (replication, reindex, cache invalidation, `ExecutePipeline`/`ExecuteScriptModule`/`IncludeStepsFromJob`) have their own parameters. Read any step's doc for the exact list.

### Referencing an IMPEX-staged file from a prior step

Standard import steps read from the instance **IMPEX** area. The `WorkingFolder` parameter is resolved relative to `IMPEX/src/` (and defaults to `IMPEX/src/`); `FileNamePattern` is a regex that selects which file(s) in that folder to import. This is the hand-off contract: **a step that writes a file under `IMPEX/src/...` can be followed by a standard import step that reads it** — no download/upload round-trip.

In a custom step, write to that location with `dw.io.File` using the `IMPEX` constant:

```javascript
var File = require('dw/io/File');

// Custom step writes a catalog import file into IMPEX/src/jobdata/
exports.beforeStep = function () {
    var dir = new File(File.IMPEX + '/src/jobdata');
    dir.mkdirs();
    outputFile = new File(dir, 'catalog-' + Date.now() + '.xml');
    fileWriter = new dw.io.FileWriter(outputFile);
    // ... write valid catalog XML (validate against the `catalog` XSD:
    //     b2c docs schema catalog) ...
};
```

Then the standard `ImportCatalog` step in the next stage of the flow reads it by pointing `WorkingFolder` at `src/jobdata` (relative to `IMPEX/src/` → use `jobdata`) with a `FileNamePattern` of `catalog-.*\.xml`.

### Chaining custom + standard steps in one flow

A flow can interleave your custom steps with standard ones. Example: a custom step pulls data from an external system and generates a catalog XML in IMPEX; a standard `ImportCatalog` step then applies it; finally a standard replication step publishes the change to production.

```xml
<!-- jobs.xml — a flow chaining a custom step with standard steps -->
<job job-id="NightlyCatalogSync">
  <flow>
    <!-- 1. Custom step: fetch + write IMPEX/src/jobdata/catalog-*.xml -->
    <step step-id="generateCatalog" type="custom.GenerateCatalogExport">
      <parameters>
        <parameter name="OutputFolder">jobdata</parameter>
      </parameters>
    </step>

    <!-- 2. Standard step: import the file the custom step produced -->
    <step step-id="importCatalog" type="ImportCatalog">
      <parameters>
        <parameter name="WorkingFolder">jobdata</parameter>
        <parameter name="FileNamePattern">catalog-.*\.xml</parameter>
        <parameter name="ImportMode">Merge</parameter>
        <parameter name="NoFilesFoundHandling">ERROR</parameter>
        <parameter name="ImportFailedHandling">ERROR</parameter>
        <parameter name="AfterImportFileHandling">Archive</parameter>
      </parameters>
    </step>

    <!-- 3. Standard step: publish to production via a preconfigured replication
         process (on Staging only; configured in BM with activation 'Job Step') -->
    <step step-id="publishCatalog" type="ExecutePreconfiguredDataReplicationProcess">
      <parameters>
        <parameter name="ReplicationProcessID">nightly-catalog-publish</parameter>
      </parameters>
    </step>
  </flow>
</job>
```

The custom step's `OutputFolder` and the standard step's `WorkingFolder` agree on `jobdata` (i.e. `IMPEX/src/jobdata/`), so the file written in step 1 is exactly what step 2 imports; step 3 then replicates the result. (In Business Manager you build the same flow visually: add your custom step, then the standard `ImportCatalog` step after it, then the replication step, setting each step's parameters in its form.)

### In-flow standard step vs. the CLI equivalent

Some standard steps overlap with `b2c` CLI commands (the CLI's `b2c job import`/`b2c job export` are themselves the `sfcc-site-archive-import`/`-export` system jobs). Choose based on where the data lives:

- **Use an in-flow standard step** when the file is produced or already staged **on the instance** — especially when an earlier step in the same flow generated it (no round-trip), when it should run on a Business Manager schedule, or when it must follow custom processing server-side. Example: the standard `ImportCatalog` step consuming a catalog XML that a prior custom step wrote to IMPEX.
- **Use the CLI** (`b2c job import`, `b2c job export`) when you are moving data **between your machine and the instance** — uploading a local archive, downloading an export, or scripting a one-off from CI.

Rule of thumb: data already on (or generated on) the instance → in-flow standard step; data crossing the machine/instance boundary → CLI. See the `b2c-cli:b2c-job` skill for the CLI side.

## Best Practices

1. **Use chunk-oriented** for bulk data - better progress tracking and resumability
2. **Close resources** in `afterStep()` - queries, files, connections
3. **Set explicit timeouts** - default may be too short
4. **Log progress** - helps debugging
5. **Handle errors gracefully** - return proper Status objects
6. **Don't rely on transactional=true** - use `Transaction.wrap()` for control

## Related Skills

- `b2c-cli:b2c-job` - For **running** existing jobs and importing site archives via CLI
- `b2c-cli:b2c-docs` - To look up standard job step type IDs and their parameters (`b2c docs read job-steps`, `b2c docs read <TypeID>`)
- `b2c:b2c-webservices` - When job steps need to call external HTTP services or APIs, use the webservices skill for service configuration and HTTP client patterns

## Detailed Reference

- [Task-Oriented Steps](references/TASK-ORIENTED.md) - Full task step patterns
- [Chunk-Oriented Steps](references/CHUNK-ORIENTED.md) - Full chunk step patterns
- [steptypes.json Reference](references/STEPTYPES-JSON.md) - Complete schema
- [jobs.xml Reference](references/JOBS-XML.md) - Authoring & importing a job definition (flows, steps, required triggers)
