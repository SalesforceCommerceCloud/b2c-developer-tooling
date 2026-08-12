<!-- prettier-ignore-start -->
# Job Step: UpdateStorefrontURLs

**Type ID:** `UpdateStorefrontURLs`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Processing)

Updates the Storefront URLs for objects like categories, products, folders and content assets. This will update the URLs for all sites assigned under 'Scope'. This job step will not work in production instances and the storefront URLs are to be replicated from STG.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

This step takes no configuration parameters.

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
