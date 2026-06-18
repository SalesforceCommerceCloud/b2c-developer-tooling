---
'b2c-vs-extension': minor
---

Overhaul the B2C Operations (Jobs) experience in the VS Code extension:

- **Run Job** now always lets you confirm which job to run and optionally pass execution parameters, then polls the execution to completion and opens its log automatically (jumping to the error on failure). Re-Run reuses the original execution's parameters. This fixes a bug where clicking Run could silently trigger the wrong job.
- Added a **Job Definitions** view alongside Job History, mirroring Business Manager's two tabs. It lists the jobs (`jobs.xml`) and custom step types (`steptypes.json`) defined in your workspace cartridges, with actions to run, deploy, and open the source files, plus a button to open the live Job Definitions page in Business Manager.
- Reworked **Create Job Scaffold** to generate a real, deployable custom job step: it scaffolds the cartridge step script and its `steptypes.json` registration, then writes a matching `jobs.xml` that references the registered `custom.*` step type. Deploy now checks that custom step code is present and warns to deploy the cartridge first, fixing the previous "invalid job" failures.
