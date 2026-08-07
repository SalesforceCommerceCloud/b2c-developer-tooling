<!-- prettier-ignore-start -->
# Standard Job Step Catalog

Catalog of built-in (standard / system) job step **type IDs** that the B2C Commerce platform ships for use in Business Manager job flows and `jobs.xml` site-import flows. Each step below has its own page with purpose and configuration parameters — read it with `b2c docs read <TypeID>` (for example `b2c docs read ImportCatalog`).

These are the standard counterparts to authoring your own steps (see the `b2c:b2c-custom-job-steps` skill) and to the CLI import/export commands (see the `b2c-cli:b2c-job` skill).

## Import Steps

| Type ID | Scope | Purpose |
| --- | --- | --- |
| `ImportABTests` | Site | Imports A/B tests. |
| `ImportActiveData` | Site | Imports active data from the provided CSV files. |
| `ImportAssignments` | Organization | Imports assignments |
| `ImportCatalog` | Organization | Imports catalog data. |
| `ImportContent` | Site | Imports content. If no library-id is specified in the import file, the data is imported into the private library of the... |
| `ImportContentSlots` | Site | Imports content slot configurations in the specified mode. |
| `ImportCouponCodeRedemptions` | Site | Imports the coupon code redemptions based on the couponredemption.xsd. Note: Coupon redemptions are evaluated during... |
| `ImportCoupons` | Site | Imports coupons in the specified mode. |
| `ImportCustomerGroups` | Site | Imports customer groups in the specified mode. |
| `ImportCustomerList` | Organization | Deprecated. Imports customer list data. Use ImportCustomerLists instead. |
| `ImportCustomerLists` | Organization | Imports customer lists. |
| `ImportCustomers` | Site | Imports Customers based on customer.xsd |
| `ImportCustomObjects` | Organization & Sites | Imports Custom Objects. |
| `ImportGiftCertificates` | Site | Import the Gift Certificates contained in ImportFile in the specified mode. |
| `ImportInventoryLists` | Organization | Imports inventory data. |
| `ImportKeyValueMapping` | Organization | Import or delete a key/value mapping in the Generic Mapping high-performance data store. Key/value mappings are exposed... |
| `ImportPageLocalization` | Site | Import translated page content for localization purposes |
| `ImportPriceBook` | Organization | Imports price data. |
| `ImportProductLists` | Site | Imports product lists. |
| `ImportPromotions` | Site | Imports promotions in the specified mode. |
| `ImportShippingMethods` | Site | Imports shipping methods in the specified mode. |
| `ImportSiteArchive` | Organization | Imports a site import archive file into the current instance. |
| `ImportSourceCodeGroups` | Site | Imports source code groups in the specified mode. |
| `ImportStores` | Site | Imports Stores based on store.xsd |
| `ImportTaxTable` | Site | Imports Tax Classes, Tax Jurisdictions and Tax Rates from the given ImportFile in the specified mode. |

## Export Steps

| Type ID | Scope | Purpose |
| --- | --- | --- |
| `CatalogDeltaExport` | Site | Creates Delta Export for Catalogs. Support must be contacted to enable delta exports. |
| `CustomerListsDeltaExport` | Site | Creates Delta Export for Customer Lists. Support must be contacted to enable delta exports. |
| `ExportABTests` | Site | Exports A/B tests. |
| `ExportAssignments` | Organization | Exports all assignments in the system. |
| `ExportCatalog` | Organization | Exports catalog data. |
| `ExportContent` | Organization & Sites | Exports the folders in the specified content Library. |
| `ExportContentSlots` | Site | Exports all content slot data. |
| `ExportCouponCodes` | Site | Exports the codes of a specified coupon. |
| `ExportCoupons` | Site | Exports coupons. |
| `ExportCustomerGroups` | Site | Exports all customer groups. |
| `ExportCustomerList` | Organization | Exports a customer list, it's preferences as well as the customers assigned to the customer list. |
| `ExportCustomers` | Site | Exports the customer profiles from the default customer list of the given site. |
| `ExportCustomObjects` | Organization & Sites | Exports custom objects of a specified type and scope. The scope of the job flow (Organization or Sites) must match the... |
| `ExportFacebookFeed` | Site | Exports Catalog Feed for Facebook. |
| `ExportGiftCertificates` | Site | Exports Gift Certificates. |
| `ExportInventoryLists` | Site | Exports inventory lists. |
| `ExportMetaData` | Organization | Export System Object Type extensions and Custom Object Type definitions. |
| `ExportOrders` | Site | Exports all orders matching the selected criteria using Search Service, with a maximum of 1000 orders per run. After an... |
| `ExportPageLocalization` | Site | Export page content for localization purposes |
| `ExportPriceBook` | Organization | Exports price data. |
| `ExportProductLists` | Site | Exports product lists of a site. If all the options are selected, all product lists that were created by anonymous or... |
| `ExportPromotions` | Site | Exports promotions. |
| `ExportShippingMethods` | Site | Exports shipping methods. |
| `ExportSourceCodeGroups` | Site | Exports source code groups. |
| `ExportStores` | Site | Exports stores. |
| `ExportTaxTable` | Site | Exports tax data. |
| `LibraryDeltaExport` | Organization | Creates Delta Export for Libraries. Support must be contacted to enable delta exports. |
| `SiteExport` | Organization | Exports site data. The DataUnits parameter defines which objects are included in the export. Its function is similar to... |

## Processing Steps

| Type ID | Scope | Purpose |
| --- | --- | --- |
| `CreateSitemap` | Site | Creates Sitemap. |
| `DownloadActiveDataFromStorage` | Site | Download active data from storage system to current site. This step downloads active data to the new site from storage... |
| `ExecuteCategorizationRules` | Organization | Executes the Categorization based on the Categorization Rules and Conditions defined on a CatalogCategory. |
| `ExecuteDataReplication` | Organization | Replicates data to a target system. The ReplicationConfiguration parameter requires a string in JSON format that... |
| `ExecutePipeline` | Organization & Sites | Executes a pipeline. The name and start node of the pipeline has to be configured at parameter... |
| `ExecutePreconfiguredCodeReplicationProcess` | Organization | Executes the preconfigured code replication process with the ID defined at parameter 'ReplicationProcessID'. The code... |
| `ExecutePreconfiguredDataReplicationProcess` | Organization | Executes the preconfigured data replication process with the ID defined at parameter 'ReplicationProcessID'. The data... |
| `ExecuteScriptModule` | Organization & Sites | Executes a function exported by a script module. The module ID has to be configured at parameter... |
| `IncludeStepsFromJob` | Organization & Sites | Includes steps from another job. This step makes it easy to create a set of standard steps that you can execute in... |
| `InvalidateCache` | Site | Invalidate Page and Static Content Cache Invalidates the page cache and/or static content cache (images, styles, etc.)... |
| `SearchReindex` | Site | Rebuilds or updates search indexes. The number of search indexes that can be rebuilt or updated in parallel is globally... |
| `UndoPreconfiguredCodeReplicationProcess` | Organization | Undo the preconfigured code replication process with the ID defined at parameter 'ReplicationProcessID'. The given code... |
| `UndoPreconfiguredDataReplicationProcess` | Organization | Undo the preconfigured data replication process with the ID defined at parameter 'ReplicationProcessID'. The given data... |
| `UpdateStorefrontURLs` | Site | Updates the Storefront URLs for objects like categories, products, folders and content assets. This will update the... |
| `UploadActiveDataBackupToStorage` | Site | Upload current site's active data to storage system (as a backup). This step uploads active data as a backup to storage... |
| `UploadActiveDataToStorage` | Site | Upload current site's active data to storage system. This step uploads active data from an old site to storage system... |

## Provenance

Generated from the public B2C Commerce Job Step API documentation (the jobstepapi section of the Script API documentation archive obtained via `b2c docs download`). Each step lists its purpose, execution scope, and input parameters (required, description, allowed values, default) as published in that documentation.

<!-- prettier-ignore-end -->
