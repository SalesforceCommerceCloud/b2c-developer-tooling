# Package dw.campaign

## Classes
| Class | Description |
| --- | --- |
| [ABTest](dw.campaign.ABTest.md) | Object representing an AB-test in Commerce Cloud Digital. |
| [ABTestMgr](dw.campaign.ABTestMgr.md) | Manager class used to access AB-test information in the storefront. |
| [ABTestSegment](dw.campaign.ABTestSegment.md) | Object representing an AB-test segment in the Commerce Cloud Digital. |
| [AmountDiscount](dw.campaign.AmountDiscount.md) | Represents an _amount-off_ discount in the discount plan, for example  "$10 off all orders $100 or more". |
| [ApproachingDiscount](dw.campaign.ApproachingDiscount.md) | Transient class representing a discount that a [LineItemCtnr](dw.order.LineItemCtnr.md)  "almost" qualifies for based on the amount of merchandise in it. |
| [BonusChoiceDiscount](dw.campaign.BonusChoiceDiscount.md) | Represents a _choice of bonus products_ discount in the discount plan,  for example "Choose 3 DVDs from a list of 20 options with your purchase of  any DVD player." |
| [BonusDiscount](dw.campaign.BonusDiscount.md) | Represents a _bonus_ discount in the discount plan, for example  "Get a free DVD with your purchase of any DVD player." |
| [Campaign](dw.campaign.Campaign.md) | A Campaign is a set of experiences (or site configurations) which may be  deployed as a single unit for a given time frame. |
| [CampaignMgr](dw.campaign.CampaignMgr.md) | CampaignMgr provides static methods for managing campaign-specific operations  such as accessing promotions or updating promotion line items. |
| [CampaignStatusCodes](dw.campaign.CampaignStatusCodes.md) | Deprecated. |
| [Coupon](dw.campaign.Coupon.md) | Represents a coupon in Commerce Cloud Digital. |
| [CouponMgr](dw.campaign.CouponMgr.md) | Manager to access coupons. |
| [CouponRedemption](dw.campaign.CouponRedemption.md) | Represents a redeemed coupon. |
| [CouponStatusCodes](dw.campaign.CouponStatusCodes.md) | Helper class containing status codes for why a coupon code cannot be added  to cart or why a coupon code already in cart is not longer valid for redemption. |
| [Discount](dw.campaign.Discount.md) | Superclass of all specific discount classes. |
| [DiscountPlan](dw.campaign.DiscountPlan.md) | DiscountPlan represents a set of [Discount](dw.campaign.Discount.md)s. |
| [FixedPriceDiscount](dw.campaign.FixedPriceDiscount.md) | Represents a _fix price_ discount in the discount plan, for example  "Shipping only 0.99 all orders $25 or more." |
| [FixedPriceShippingDiscount](dw.campaign.FixedPriceShippingDiscount.md) | Represents a _fixed price shipping_ discount in the discount plan, for  example "Shipping only 0.99 for iPods." |
| [FreeDiscount](dw.campaign.FreeDiscount.md) | Represents a _free_ discount in the discount plan, for example  "Free shipping on all orders $25 or more." |
| [FreeShippingDiscount](dw.campaign.FreeShippingDiscount.md) | Represents a _free shipping_ discount in the discount plan, for example  "Free shipping on all iPods." |
| [PercentageDiscount](dw.campaign.PercentageDiscount.md) | Represents a _percentage-off_ discount in the discount plan, for example  "10% off all T-Shirts". |
| [PercentageOptionDiscount](dw.campaign.PercentageOptionDiscount.md) | Represents a _percentage-off options_ discount in the discount plan, for  example "50% off monogramming on shirts". |
| [PriceBookPriceDiscount](dw.campaign.PriceBookPriceDiscount.md) | Discount representing that a product's price has been calculated from a  separate sales price book other than the standard price book assigned to the  site. |
| [Promotion](dw.campaign.Promotion.md) | This class represents a promotion in Commerce Cloud Digital. |
| [PromotionMgr](dw.campaign.PromotionMgr.md) | [PromotionMgr](dw.campaign.PromotionMgr.md) is used to access campaigns and promotion  definitions, display active or upcoming promotions in a storefront, and to  calculate and apply promotional discounts to line item containers. |
| [PromotionPlan](dw.campaign.PromotionPlan.md) | PromotionPlan represents a set of [Promotion](dw.campaign.Promotion.md) instances and  is used to display active or upcoming promotions on storefront pages, or to  pass it to the [PromotionMgr](dw.campaign.PromotionMgr.md) to calculate a  [DiscountPlan](dw.campaign.DiscountPlan.md) and subsequently apply discounts to a line  item container. |
| [SlotContent](dw.campaign.SlotContent.md) | Represents content for a slot. |
| [SourceCodeGroup](dw.campaign.SourceCodeGroup.md) | A source code group defines a collection of source codes. |
| [SourceCodeInfo](dw.campaign.SourceCodeInfo.md) | Class representing a code (i.e. |
| [SourceCodeStatusCodes](dw.campaign.SourceCodeStatusCodes.md) | Helper class which contains error result codes returned by the SetSourceCode  pipelet. |
| [TotalFixedPriceDiscount](dw.campaign.TotalFixedPriceDiscount.md) | Represents a _total fix price_ discount on a group of products in the  discount plan. |
