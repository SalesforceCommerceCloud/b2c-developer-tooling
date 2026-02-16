# Known CIP Tables

This quick catalog is based on the official JDBC schema docs under:

- `/Users/clavery/code/commerce-cloud-docs/content/en-us/b2c-commerce/guides/jdbc/*.md`

Use this as a starting point. Always verify actual availability in your tenant with:

```bash
b2c cip tables --tenant-id <tenant-id>
b2c cip describe <table-name> --tenant-id <tenant-id>
```

Official schema references:

- https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_lakehouse_schema.html
- https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_aggregate_tables.html
- https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_dimension_tables.html
- https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_fact_tables.html

## Aggregate Tables (`ccdw_aggr_*`)

Best for KPI/reporting use cases (already summarized):

- [`ccdw_aggr_sales_summary`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_sales_summary.html)
- [`ccdw_aggr_product_sales_summary`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_product_sales_summary.html)
- [`ccdw_aggr_promotion_sales_summary`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_promotion_sales_summary.html)
- [`ccdw_aggr_payment_sales_summary`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_payment_sales_summary.html)
- [`ccdw_aggr_registration`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_registration.html)
- [`ccdw_aggr_search`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_search.html)
- [`ccdw_aggr_search_query`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_search_query.html)
- [`ccdw_aggr_search_conversion`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_search_conversion.html)
- [`ccdw_aggr_ocapi_request`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_ocapi_request.html)
- [`ccdw_aggr_scapi_request`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_scapi_request.html)
- [`ccdw_aggr_visit`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_visit.html)
- [`ccdw_aggr_visit_checkout`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_visit_checkout.html)
- [`ccdw_aggr_visit_referrer`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_visit_referrer.html)
- [`ccdw_aggr_visit_ip_address`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_visit_ip_address.html)
- [`ccdw_aggr_visit_user_agent`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_visit_user_agent.html)
- [`ccdw_aggr_visit_robot`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_visit_robot.html)
- [`ccdw_aggr_controller_request`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_controller_request.html)
- [`ccdw_aggr_include_controller_request`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_include_controller_request.html)
- [`ccdw_aggr_source_code_activation`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_source_code_activation.html)
- [`ccdw_aggr_source_code_sales`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_source_code_sales.html)
- [`ccdw_aggr_product_cobuy`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_product_cobuy.html)
- [`ccdw_aggr_product_recommendation`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_product_recommendation.html)
- [`ccdw_aggr_product_recommendation_recommender`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_product_recommendation_recommender.html)
- [`ccdw_aggr_detail_product_recommendation_recommender`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_detail_product_recommendation_recommender.html)
- [`ccdw_aggr_daily_detail_product_recommendation_recommender`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_daily_detail_product_recommendation_recommender.html)
- [`ccdw_aggr_inventory_by_location`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_inventory_by_location.html)
- [`ccdw_aggr_inventory_by_location_group`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_inventory_by_location_group.html)
- [`ccdw_aggr_promotion_activation`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_promotion_activation.html)
- [`ccdw_aggr_promotion_cobuy`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_aggr_promotion_cobuy.html)

## Dimension Tables (`ccdw_dim_*`)

Reference/context entities used for joins:

- [`ccdw_dim_site`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_site.html)
- [`ccdw_dim_product`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_product.html)
- [`ccdw_dim_customer`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_customer.html)
- [`ccdw_dim_campaign`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_campaign.html)
- [`ccdw_dim_coupon`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_coupon.html)
- [`ccdw_dim_promotion`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_promotion.html)
- [`ccdw_dim_payment_method`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_payment_method.html)
- [`ccdw_dim_business_channel`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_business_channel.html)
- [`ccdw_dim_locale`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_locale.html)
- [`ccdw_dim_geography`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_geography.html)
- [`ccdw_dim_currency`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_currency.html)
- [`ccdw_dim_source_code_group`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_source_code_group.html)
- [`ccdw_dim_location`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_location.html)
- [`ccdw_dim_location_group`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_location_group.html)
- [`ccdw_dim_date`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_date.html)
- [`ccdw_dim_time`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_time.html)
- [`ccdw_dim_timezone`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_timezone.html)
- [`ccdw_dim_user_agent`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_dim_user_agent.html)

## Fact Tables (`ccdw_fact_*`)

Most granular event-level tables (typically larger):

- [`ccdw_fact_line_item`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_line_item.html)
- [`ccdw_fact_order_payments`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_order_payments.html)
- [`ccdw_fact_customer_registration`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_customer_registration.html)
- [`ccdw_fact_customer_list_snapshot`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_customer_list_snapshot.html)
- [`ccdw_fact_promotion_line_item`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_promotion_line_item.html)
- [`ccdw_fact_promotion_activation`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_promotion_activation.html)
- [`ccdw_fact_source_codes_activation`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_source_codes_activation.html)
- [`ccdw_fact_inventory_record_snapshot`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_inventory_record_snapshot.html)
- [`ccdw_fact_inventory_record_snapshot_hourly`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_inventory_record_snapshot_hourly.html)
- [`ccdw_fact_realtime_metric`](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_ccdw_fact_realtime_metric.html)

## Practical Starters

When users ask for common analysis, start with:

- **Sales trends:** `ccdw_aggr_sales_summary`
- **Product performance:** `ccdw_aggr_product_sales_summary`, join `ccdw_dim_product`
- **Promotion impact:** `ccdw_aggr_promotion_sales_summary`, join `ccdw_dim_promotion`
- **Search conversion:** `ccdw_aggr_search_conversion`, `ccdw_aggr_search_query`
- **Traffic source:** `ccdw_aggr_visit_referrer`
- **API performance:** `ccdw_aggr_ocapi_request`, `ccdw_aggr_scapi_request`

## Notes

- Some doc pages may contain naming variance/typos (for example `..._couse` vs `..._cobuy`). Prefer actual tenant metadata output from `cip tables`.
- Non-table helper objects may appear in some tenants (for example `all_calcite_types`).
