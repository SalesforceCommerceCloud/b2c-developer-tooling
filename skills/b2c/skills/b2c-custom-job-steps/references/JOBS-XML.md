# jobs.xml Reference (Job Definitions)

`steptypes.json` makes a step *type* available; a **job definition** (`jobs.xml`) is what actually creates a runnable, schedulable job out of one or more steps. This is the missing link between *defining* steps and *running* a job: without a job definition there is no job for `b2c job run` to execute or for Business Manager to schedule.

You author `jobs.xml` and import it with the CLI:

```bash
b2c job import ./my-job-archive
```

`jobs.xml` lives at the **root of a site import archive** (alongside `services.xml`, `meta/`, `sites/`, …):

```
my-job-archive/
└── jobs.xml          # <-- archive root
```

After import, the job appears in **Business Manager > Administration > Operations > Jobs** and can be triggered with `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).

## Namespace & Schema

Use the jobs impex namespace exactly. The schema is `jobs.xsd`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">
    <!-- one or more <job> elements -->
</jobs>
```

## Document Structure (element order matters)

A `<job>` child elements **must appear in this order** (enforced by the XSD):

```
<job>
  <description>?        (0..1)
  <parameters>?         (0..1)  job-level parameters
  (<flow> | <split>)*   (0..n)  one or more step flows
  <rules>?              (0..1)  on-running / on-retry / on-exit notifications
  <triggers>            (1..1)  REQUIRED — see below
</job>
```

| Element | Required | Notes |
|---------|----------|-------|
| `<job job-id="...">` | Yes | `job-id` attribute is required and unique; it is the name you pass to `b2c job run`. |
| `<description>` | No | Free text (max 4000 chars). |
| `<parameters>` | No | Job-level parameters; steps can reference them via `job-parameter-ref`. |
| `<flow>` / `<split>` | No* | Contains the ordered `<step>` elements. A job with no flow does nothing. |
| `<rules>` | No | Hanging-job / retry / exit email notifications. |
| **`<triggers>`** | **Yes** | **Required by the schema.** A `jobs.xml` without `<triggers>` fails import validation. Use `<run-once>` for an on-demand/manually-run job. |

## Minimal Single-Step Job

The smallest valid definition: one flow, one step referencing a custom step type, and the **required `<triggers>`** element. `<run-once>` registers the job for manual/on-demand execution (you still run it with `b2c job run`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">
    <job job-id="MyNightlyExport">
        <description>Exports products to a CSV feed</description>
        <flow>
            <context site-id="RefArch"/>
            <step step-id="ExportStep" type="custom.ProductExport">
                <parameters>
                    <parameter name="OutputFile">/export/products.csv</parameter>
                    <parameter name="OnlineOnly">true</parameter>
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

## Step Element

```xml
<step step-id="UniqueStepId" type="custom.ProductExport" enforce-restart="false">
    <description>...</description>?
    <parameters>?
        <parameter name="ParamName">value</parameter>
        <parameter name="OtherParam" job-parameter-ref="GlobalParam"/>
    </parameters>
    <rules>?
        <on-exit status="ERROR"><stop-job/></on-exit>
    </rules>
</step>
```

| Attribute / element | Required | Notes |
|---------------------|----------|-------|
| `step-id` | Yes | Unique within the flow. |
| **`type`** | **Yes** | **References the step type to run.** This is the key distinction from `steptypes.json`: in `jobs.xml` you use the attribute **`type`** (e.g. `type="custom.ProductExport"`); the value matches the **`@type-id`** declared in `steptypes.json` for custom steps, or a built-in/system step `type-id` (e.g. `ImportCatalog`, `ExecuteScriptModule`). |
| `<parameters>/<parameter name="...">` | No | Per-step parameter values. The `name` must match a `@name` declared in the step type's `parameters` in `steptypes.json`. The value is the element text. |
| `job-parameter-ref` | No | On a `<parameter>`, binds this step parameter to a job-level `<parameter>` instead of a literal value (lets one job parameter feed many steps). |
| `<rules>/<on-exit status="...">` | No | Per-step flow control: `<stop/>`, `<stop-job/>`, `<stop-flow/>`, or `<continue next-step="..."/>` keyed on the step's exit status code. |

> **`type` (jobs.xml) vs `@type-id` (steptypes.json)** — a common stumbling block. `steptypes.json` *declares* a step type with `"@type-id": "custom.ProductExport"`. `jobs.xml` *uses* it with `<step type="custom.ProductExport">`. They must match exactly (custom type-ids start with `custom.`).

## Multi-Step Job

Steps run in document order within a flow. Use `<context site-id="...">` to scope a site-aware flow; omit it (or use a `<split>`) for organization-scoped steps.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">
    <job job-id="OrderFulfillmentSync">
        <parameters>
            <parameter name="Site">RefArch</parameter>
        </parameters>
        <flow>
            <context site-id="RefArch"/>
            <step step-id="PullOrders" type="custom.PullOpenOrders">
                <parameters>
                    <parameter name="SiteId" job-parameter-ref="Site"/>
                </parameters>
                <rules>
                    <on-exit status="ERROR"><stop-job/></on-exit>
                </rules>
            </step>
            <step step-id="ExportToOMS" type="custom.ExportOrdersToOMS">
                <parameters>
                    <parameter name="BatchSize">100</parameter>
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

## Triggers (required)

`<triggers>` is **mandatory** and holds exactly one of `<run-once>` or `<run-recurring>`.

### run-once (on-demand / manual)

Use for jobs you trigger from the CLI or Business Manager rather than on a schedule. `enabled="false"` keeps the one-time scheduled fire from auto-running; you still run it manually.

```xml
<triggers>
    <run-once enabled="false">
        <date>2025-01-01</date>
        <time>00:00:00.000Z</time>
    </run-once>
</triggers>
```

### run-recurring (scheduled)

```xml
<triggers>
    <run-recurring enabled="true">
        <recurrence>
            <date-from>2025-01-01</date-from>
            <start-time>02:00:00.000Z</start-time>
            <interval>1d</interval>
            <day-of-week>
                <weekday>Monday</weekday>
                <weekday>Wednesday</weekday>
                <weekday>Friday</weekday>
            </day-of-week>
        </recurrence>
    </run-recurring>
</triggers>
```

| `<recurrence>` child | Required | Notes |
|----------------------|----------|-------|
| `<date-from>` | Yes | Start date (`YYYY-MM-DD`). |
| `<date-to>` | No | Optional end date. |
| `<start-time>` | Yes | Time of day (`HH:MM:SS.SSSZ`). |
| `<interval>` | No | e.g. `1d`, `30m`, `1h` (max 10 chars). |
| `<day-of-week>/<weekday>` | No | One or more of `Monday`…`Sunday`. |

## Importing & Running

```bash
# import the archive containing jobs.xml (waits for completion by default)
b2c job import ./my-job-archive

# verify / run the job after import
b2c job run MyNightlyExport --wait --show-log
```

If the import fails with a schema validation error, the most common causes are a **missing `<triggers>` element**, children out of the required order, or a `<step type="...">` whose value doesn't match a declared `@type-id` (custom step types must be imported via `steptypes.json` in a deployed cartridge first). Use `b2c job import ./my-job-archive --show-log` to see the validation detail.

## Common Pitfalls

- **Missing `<triggers>`** — the element is required by the XSD; import fails without it. For a manually-run job, use `<run-once enabled="false">`.
- **Child order** — `description → parameters → flow/split → rules → triggers`. Out-of-order children fail validation.
- **`type` vs `@type-id`** — `jobs.xml` uses the `type` attribute on `<step>`; it must match the `@type-id` in `steptypes.json` (or a system step type-id).
- **Custom step not deployed** — the cartridge carrying the step's `steptypes.json` and module must be on the active code version (and on the cartridge path) before the job can resolve the step type.
- **Wrong context scope** — site-scoped steps need a `<context site-id="...">`; org-scoped steps must not be placed under a site context. This must agree with `@supports-site-context` / `@supports-organization-context` in `steptypes.json`.

## Related

- [steptypes.json Reference](STEPTYPES-JSON.md) — declaring the step types referenced by `<step type="...">`.
- `b2c-cli:b2c-job` — running the imported job (`b2c job run`) and importing the archive (`b2c job import`).
- `b2c-cli:b2c-site-import-export` — site archive structure (`jobs.xml` is a root-level archive file).
