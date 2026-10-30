# Storefront Datasets

Salesforce publishes sample data for the reference storefronts in [storefront-datasets](https://github.com/SalesforceCommerceCloud/storefront-datasets). Each dataset is a site archive with a site, catalogs, price books, inventory, content, promotions, and import jobs.

| Dataset directory  | Site ID        | Contents                                             |
| ------------------ | -------------- | ---------------------------------------------------- |
| `foundations-data` | `Foundations`  | Small default dataset for the Foundations storefront |
| `marketstreet`     | `MarketStreet` | Fashion catalog for the Market Street storefront     |
| `beautynext`       | `BeautyNext`   | Cosmetics catalog with shade variants and bundles    |
| `footwear-data`    | `Footwear`     | Footwear vertical                                    |
| `furniture-data`   | `Furniture`    | Furniture vertical                                   |
| `luxury-data`      | `Luxury`       | Luxury vertical                                      |

Check the repository README for the current list.

## Pick a Version

Releases are tagged with the Storefront Next template version they target (`vX.Y.Z`; dataset-only fixes are `vX.Y.Z-data.N`). Match the template version of your storefront. Each GitHub release attaches one ZIP per dataset, images included.

```bash
# Clone the datasets for template 1.4.0
git clone --branch v1.4.0 --depth 1 https://github.com/SalesforceCommerceCloud/storefront-datasets.git
```

## Import

Import on a **sandbox** or **staging** instance only; production and development get the data by replication. On staging, confirm first (see [safety](SAFETY.md)).

```bash
# Directory import: no zip needed
b2c job import ./storefront-datasets/marketstreet --show-log

# A release ZIP works too (the root folder matches the zip name)
b2c job import ./marketstreet.zip --show-log
```

If a directory with images exceeds the instance upload limit, add `--split` to import the XML first and the static files in later parts.

A dataset contains global data as well as its site: preferences (active locales, instance time zone), customer lists, geolocations, and jobs. On an instance that already has sites, review `preferences.xml` and the other top-level files before importing, and remove what should not change.

## Rebuild Search Indexes

Products are not searchable until the indexes are rebuilt. The Foundations, Market Street, and Beauty Next datasets include a `Reindex` job:

```bash
b2c job run Reindex --wait
```

For any site, run the system index jobs:

```bash
b2c job run sfcc-search-index-product-full-update --wait --body '{"site_scope":["MarketStreet"]}'
b2c job run sfcc-search-index-content-full-update --wait --body '{"site_scope":["MarketStreet"]}'
```

## Verify

```bash
b2c sites list
```

The dataset's site should be listed. Then set up the storefront: `b2c-cli:b2c-storefronts` for Storefront Next.

## Common Problems

- **"There must be a root directory with the same name as the archive."** Rename the ZIP or its root folder so they match.
- **Inventory quota errors on `allocation-timestamp`.** Remove the field from custom inventory files or set it to the current UTC time.
- **Import failed with a generic error.** Rerun with `--show-log`; the cause is in the `[DATAERROR]` lines.
