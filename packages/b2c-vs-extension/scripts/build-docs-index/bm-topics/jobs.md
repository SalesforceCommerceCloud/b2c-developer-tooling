---
id: jobs
title: Jobs
category: scheduling
tags: [job, schedule, batch, import, export]
---

Jobs are scheduled or on-demand workflows composed of one or more steps. Use
them for catalog imports, exports, integrations, and any background processing
that is too long for a request handler.

## Where to manage

`Administration > Operations > Jobs`

## Step types

- **System steps** — built-in steps for common imports/exports
  (catalog, customer, order, content, inventory, price, stock).
- **Custom steps** — JavaScript functions in your cartridge declared in
  `cartridge/steptypes.json`.

## Defining a custom step

```json
// cartridge/steptypes.json
{
  "step-types": {
    "script-module-step": [
      {
        "@type-id": "custom.MyStep",
        "module": "*/cartridge/scripts/jobs/myStep",
        "function": "execute",
        "transactional": "false",
        "timeout-in-seconds": "3600",
        "parameters": {
          "parameter": [
            {"@name": "PreferenceID", "@type": "string", "@required": "true"}
          ]
        }
      }
    ]
  }
}
```

```javascript
// cartridge/scripts/jobs/myStep.js
exports.execute = function (parameters, stepExecution) {
  var Status = require('dw/system/Status');
  // ...
  return new Status(Status.OK);
};
```

## Tips

- Set `transactional` only when the step issues writes that must roll back as a
  unit — transactional steps consume a worker thread.
- Use the `stepExecution.getJobExecution()` API to access shared job-level
  context across steps.
- Schedule jobs **per site** when the work is site-scoped; **organization-level**
  for cross-site work like sandbox housekeeping.
