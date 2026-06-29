<!-- prettier-ignore-start -->
# Job Step: ExportOrders

**Type ID:** `ExportOrders`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Export)

Exports all orders matching the selected criteria using Search Service, with a maximum of 1000 orders per run. After an order has been exported successfully, its export status is EXPORTED. If an order did not export successfully, its order export status is FAILED. It is important to note that an asynchronous write action performed on an order by another process can result in an optimistic locking exception during order export.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `Canceled` | No | `true` | — | Include orders in order status CANCELED. |
| `Completed` | No | `true` | — | Include orders in order status COMPLETED. |
| `Confirmation Status` | Yes | `All` | `All`, `Not Confirmed`, `Confirmed` | The confirmation status. |
| `Created` | No | `true` | — | Deprecated. Created orders cannot be exported. |
| `Export Status` | Yes | `Ready for Export` | `All`, `Not Exported`, `Exported`, `Ready for Export`, `Export Failed` | The export status. Recommendation is to use READY FOR EXPORT to signal the export is needed. |
| `ExportFile` | No | — | — | Export file name and path relative to 'IMPEX/src'. Required if not using FileNamePrefix. |
| `Failed` | No | `true` | — | Deprecated. Failed orders cannot be exported. |
| `FileNamePrefix` | No | — | — | Prefix for the export file. A timestamp is appended and site information as applicable. To order the files chronologically, sort alphanumerically. Path is relative to 'IMPEX/src' and can include a subdirectory. Required if not using ExportFile. |
| `New` | No | `true` | — | Include orders in order status NEW. |
| `Open` | No | `true` | — | Include orders in order status OPEN. |
| `OverwriteExportFile` | No | `true` | — | If selected, the option overwrites an existing file. If not selected and a file exists, the job step exits and reports an error. |
| `Payment Status` | Yes | `All` | `All`, `Not Paid`, `Partially Paid`, `Paid` | The payment status. |
| `Replaced` | No | `true` | — | Include orders in order status REPLACED. |
| `Shipment Status` | Yes | `All` | `All`, `Not Shipped`, `Partially Shipped`, `Shipped` | The shipment status. |
| `Use Order Export Delay` | No | `false` | — | See 'Order Export Delay' at 'Site Preferences' -> 'Order Preferences' -> 'Order Export Settings' |

## Working With IMPEX Files

This step writes a file into the instance IMPEX area (typically under `IMPEX/src/...`). The produced file can be consumed by a later step in the same flow (for example a replication or a custom processing step) or downloaded via WebDAV. See the `b2c:b2c-custom-job-steps` skill for IMPEX hand-off patterns.

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
