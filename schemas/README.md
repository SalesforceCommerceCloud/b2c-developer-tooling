# B2C API schemas

Language-neutral OpenAPI files and `manifest.json` for standard SCAPI APIs.
The private workspace package is bundled with the TypeScript SDK. No npm access
to this package is needed by consumers. Other languages can read these JSON files
directly from a versioned repository snapshot.

The manifest identifies API/version/status, relative file path, and upstream source.
Contracts come from the SCAPI Schemas API without tenant custom
property expansion. Custom API contracts are excluded. Coverage is the complete
standard listing returned by the source instance, including deprecated versions;
the manifest is the exact supported inventory, not a claim about future APIs.

Refresh from a configured instance with `sfcc.scapi-schemas` access:

```sh
pnpm --filter @salesforce/b2c-tooling-sdk exec tsx --conditions=development scripts/refresh-scapi-schemas.ts --project-directory /path/to/project
```

Review the diff and add a changeset for `@salesforce/b2c-api-schemas`. Its regular
workspace dependency triggers an SDK release and dependent package bumps.
Normal builds use checked-in files and never fetch schemas. Consumer-specific
code generation stays outside this package.
