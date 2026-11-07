# Join campaign assignments to promotions

Use for inspecting a selected campaign. Replace `CAMPAIGN_ID` with an observed
or user-selected ID; use the configured `siteId`. Discover both GET contracts
first. This composes across API families without fetching tokens manually.

Select a bounded assignment slice, deduplicate detail reads, then join the
results locally. Keep assignment state separate from promotion state. Neither
alone proves the effective discount; use XML archives when required settings
are absent from the API contract.

Use the corresponding [built-in snippet](snippets.md); `codemode.describe(name)`
returns its current source and input schema.

At most 13 requests, four concurrent. Detail failures remain attached to their
promotion IDs. `nextOffset` indexes the assignment array; reuse the same campaign
and site, adjusting the slice for another read. Concurrent assignment changes can
shift positions. The assignment endpoint returns its full list: slicing limits
detail requests and model output, not that first response's transfer size.

## Create a promotion

Scopes: `sfcc.promotions.rw` covers both the Promotions and Campaigns APIs.
Pass the configured `siteId` as a query parameter on every call.

1. Create the promotion: `createPromotion`, `PUT …/promotions/{id}`, with `name`,
   `enabled` and `promotionClass` (`product`, `order` or `shipping`). Read it back.
2. Create the campaign if needed: `createCampaign`, `PUT …/campaigns/{campaignId}`.
   Omitted `startDate`/`endDate` get defaults; read back and set them explicitly
   when the schedule matters.
3. Assign: `assignPromotionToCampaign`, `PUT …/campaigns/{campaignId}/promotions/{promotionId}`.
   `{}` is a valid body; `schedule`, `customerGroups`, `coupons` and `rank` are
   optional. The body has no `enabled` field.
4. Add the discount rule (what is discounted and by how much). See below.

Keep new promotions and campaigns disabled until the rule is in place and verified.

### Discount rules

The `…/promotions/{id}/discount-rule` and `…/compatibility` operations are not
available on most instances yet. They return 404 `promotion-not-found` ("No
promotion with id … was found for site …") even for a promotion that the
`getPromotion` call just returned. Treat that 404 as "discount-rule API not
available", not as a missing promotion: do not retry, poll, or recreate the
promotion. If the call is accepted, omit `promotionRule.promotionClass`; the
service rejects `product` and `order` there ("unknown enum value") although the
contract requires it. The class comes from the promotion.

Today, set the rule with a site archive import: `site_archive_import` (read
[the site import skill](skill://mcp/b2c-mcp-site-import/SKILL.md) first) with one
file, `sites/{siteId}/promotions.xml`, carrying only the promotion ID and its rule.
It merges into the promotion and keeps its campaign assignment. For other
conditions and discount types, read the `promotion` schema with `docs_schema_read`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31">
    <promotion promotion-id="spring-10-off">
        <product-promotion-rule>
            <discounted-products>
                <included-products>
                    <condition-group>
                        <category-condition catalog-id="storefront-catalog" operator="is equal">
                            <category-id>womens</category-id>
                        </category-condition>
                    </condition-group>
                </included-products>
            </discounted-products>
            <simple-discount>
                <percentage>10</percentage>
            </simple-discount>
        </product-promotion-rule>
    </promotion>
</promotions>
```

Use `<amount>10.0</amount>` for a fixed amount off, and
`<product-id-condition operator="is equal"><product-id>…</product-id></product-id-condition>`
for specific products. The rule element follows the promotion class:
`product-promotion-rule`, `order-promotion-rule` or `shipping-promotion-rule`.

The discount-rule GET also returns 404, so no API reads the rule back yet. Ask the
user to check it in Business Manager (Merchant Tools > Online Marketing >
Promotions), or, with a terminal, export `campaigns_and_promotions` with
`b2c job export`.
Then enable the promotion, campaign and assignment as the task requires.
