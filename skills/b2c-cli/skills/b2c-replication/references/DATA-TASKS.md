# Data Replication Tasks

Task groups for `data_replication_configuration.tasks`. Set a group to `true` to include it. Set `all: true` at either level to include every group. Groups that are omitted or set to `false` are skipped.

```json
{
  "data_replication_configuration": {
    "target": "production",
    "type": "transfer_and_publish",
    "tasks": {
      "global": {"catalogs": true, "price_books": true},
      "sites": {"MySite": {"content_library": true, "campaigns_and_promotions": true}}
    }
  }
}
```

## Global (`tasks.global`)

| Group                       | Notes                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `all`                       | Every global group                                                                             |
| `sites`                     | Site definitions; `true` or `{"<site-id>": true}`. Required before a site's data can replicate |
| `catalogs`                  | `true`, or `{"<catalog-id>": true \| "exclude-static"}`                                        |
| `price_books`               | `true`, or `{"<price-book-id>": true}`                                                         |
| `libraries`                 | Shared libraries; `true`, or `{"<library-id>": true}`                                          |
| `preferences`               | `true`, or `{"system_preferences", "custom_preferences", "cross_cloud_preferences", "all"}`    |
| `assignment`                | Assignments                                                                                    |
| `custom_object_types`       | Custom object type definitions                                                                 |
| `custom_objects`            | Global custom objects                                                                          |
| `customer_lists`            | Customer lists                                                                                 |
| `csc_settings`              | Customer Service Center settings                                                               |
| `csrf_whitelists`           | CSRF allowlists                                                                                |
| `geolocations`              | Geolocation data                                                                               |
| `global_sorting`            | Global sorting rules                                                                           |
| `oauth_providers`           | OAuth providers                                                                                |
| `ocapi_settings`            | Global OCAPI settings                                                                          |
| `page_meta_tags`            | Page meta tag rules                                                                            |
| `payments_config`           | Payments configuration                                                                         |
| `static_content`            | Static content                                                                                 |
| `webdav_client_permissions` | WebDAV client permissions                                                                      |

## Per Site (`tasks.sites.<site-id>`)

| Group                      | Notes                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `all`                      | Every site group                                                                                |
| `ab_tests`                 | A/B tests                                                                                       |
| `ab_tests_and_experiences` | A/B tests with experiences                                                                      |
| `active_data_feeds`        | Active data feeds                                                                               |
| `agentic_commerce_search`  | `true`, or `{"agentic_commerce_search_indexes", "agentic_commerce_merchandising_rules", "all"}` |
| `cache_settings`           | Cache settings                                                                                  |
| `campaigns_and_promotions` | Campaigns and promotions                                                                        |
| `commerce_feature_state`   | Commerce feature state                                                                          |
| `content_library`          | Site content library                                                                            |
| `content_slots`            | Content slots                                                                                   |
| `coupons`                  | Coupons                                                                                         |
| `custom_objects`           | Site custom objects                                                                             |
| `customer_groups`          | Customer groups                                                                                 |
| `dynamic_content`          | Dynamic content                                                                                 |
| `ocapi_settings`           | Site OCAPI settings                                                                             |
| `payment`                  | Payment methods and processors                                                                  |
| `preferences`              | `true`, or `{"system_preferences", "custom_preferences", "all"}`                                |
| `search_indexes`           | Search indexes                                                                                  |
| `shipping_methods`         | Shipping methods                                                                                |
| `social_feed_overrides`    | Social feed overrides                                                                           |
| `sorting`                  | Sorting rules                                                                                   |
| `source_codes`             | Source codes                                                                                    |
| `storefront_urls`          | `true`, or `{"catalog_urls", "content_urls", "pipeline_urls", "redirects", "all"}`              |
| `stores`                   | Stores                                                                                          |
| `taxation`                 | Tax configuration                                                                               |

Object-valued options take booleans, for example `"preferences": {"custom_preferences": true}`.
