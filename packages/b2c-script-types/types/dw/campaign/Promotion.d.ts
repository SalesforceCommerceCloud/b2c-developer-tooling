import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import MediaFile = require('../content/MediaFile');
import MarkupText = require('../content/MarkupText');
import Campaign = require('./Campaign');
import Collection = require('../util/Collection');
import CustomerGroup = require('../customer/CustomerGroup');
import SourceCodeGroup = require('./SourceCodeGroup');
import Coupon = require('./Coupon');
import Money = require('../value/Money');
import Product = require('../catalog/Product');
import ProductOptionModel = require('../catalog/ProductOptionModel');

declare global {
    module ICustomAttributes {
        interface Promotion extends CustomAttributes {
        }
    }
}

/**
 * This class represents a promotion in Commerce Cloud Digital. Examples of
 * promotions include:
 * 
 * - "Get 20% off your order"
 * - "$15 off a given product"
 * - "free shipping for all orders over $50"
 * - Get a bonus product with purchase of another product
 * 
 * The Promotion class provides access to the basic attributes of the promotion
 * such as name, callout message, and description, but the details of the
 * promotion rules are not available in the API due to their complexity.
 * 
 * Commerce Cloud Digital allows merchants to create a single logical "promotion
 * rule" (e.g. "Get 20% off your order") and then assign it to one or more
 * "containers" where the supported container types are campaigns or AB-tests. A
 * Promotion represents a specific instance of a promotion rule assigned to a
 * container. Promotion rules themselves that are not assigned to any container
 * are inaccessible through the API. Each instance (i.e. assignment) can have
 * separate "qualifiers". Qualifiers are the customer groups, source code
 * groups, or coupons that trigger a given promotion for a customer.
 */
declare class Promotion extends ExtensibleObject<ICustomAttributes.Promotion> {
    /**
     * Constant representing promotion exclusivity of type class.
     */
    static readonly EXCLUSIVITY_CLASS: string;
    /**
     * Constant representing promotion exclusivity of type global.
     */
    static readonly EXCLUSIVITY_GLOBAL: string;
    /**
     * Constant representing promotion exclusivity of type no.
     */
    static readonly EXCLUSIVITY_NO: string;
    /**
     * Constant representing promotion class of type order.
     */
    static readonly PROMOTION_CLASS_ORDER: string;
    /**
     * Constant representing promotion class of type product.
     */
    static readonly PROMOTION_CLASS_PRODUCT: string;
    /**
     * Constant representing promotion class of type shipping.
     */
    static readonly PROMOTION_CLASS_SHIPPING: string;
    /**
     * Constant indicating that that all qualifier conditions must be met in
     * order for this promotion to apply for a given customer.
     */
    static readonly QUALIFIER_MATCH_MODE_ALL = "all";
    /**
     * Constant indicating that that at least one qualifier condition must be
     * met in order for this promotion to apply for a given customer.
     */
    static readonly QUALIFIER_MATCH_MODE_ANY = "any";
    /**
     * Returns the unique ID of the promotion.
     */
    readonly ID: string;
    /**
     * Returns 'true' if promotion is active, otherwise 'false'.
     * 
     * A promotion is active if its campaign is active, and the promotion
     * is enabled, and it is scheduled for now.
     */
    readonly active: boolean;
    /**
     * Returns 'true' if the promotion is triggered by a coupon,
     * false otherwise.
     * @deprecated Use isBasedOnCoupons
     */
    readonly basedOnCoupon: boolean;
    /**
     * Returns 'true' if the promotion is triggered by coupons,
     * false otherwise.
     */
    readonly basedOnCoupons: boolean;
    /**
     * Returns 'true' if the promotion is triggered by customer groups,
     * false otherwise.
     */
    readonly basedOnCustomerGroups: boolean;
    /**
     * Returns 'true' if the promotion is triggered by source codes,
     * false otherwise.
     */
    readonly basedOnSourceCodes: boolean;
    /**
     * Returns the callout message of the promotion.
     */
    readonly calloutMsg: MarkupText;
    /**
     * Returns the campaign this particular instance of the promotion is defined
     * in.
     * 
     * Note: If this promotion is defined as part of an AB-test, then a Campaign
     * object will be returned, but it is a mock implementation, and not a true
     * Campaign. This behavior is required for backwards compatibility and
     * should not be relied upon as it may change in future releases.
     */
    readonly campaign: Campaign;
    /**
     * Returns the promotion's combinable promotions. Combinable promotions is a set of promotions or groups this
     * promotion can be combined with.
     */
    readonly combinablePromotions: string[];
    /**
     * Returns a description of the condition that must be met for this
     * promotion to be applicable.
     * 
     * The method and the related attribute have been deprecated. Use the
     * getDetails method instead.
     * @deprecated Use getDetails
     */
    readonly conditionalDescription: MarkupText;
    /**
     * Returns the coupons directly assigned to the promotion or assigned to the campaign of the promotion.
     * 
     * If the promotion is not based on coupons (see isBasedOnCoupons), or no coupons is assigned to the
     * promotion or its campaign, an empty collection is returned.
     */
    readonly coupons: Collection<Coupon>;
    /**
     * Returns the customer groups directly assigned to the promotion or assigned to the campaign of the promotion.
     * 
     * If the promotion is not based on customer groups (see isBasedOnCustomerGroups), or no customer group is assigned to the
     * promotion or its campaign, an empty collection is returned.
     */
    readonly customerGroups: Collection<CustomerGroup>;
    /**
     * Returns the description of the promotion.
     * 
     * Method is deprecated and returns the same value as getCalloutMsg.
     * @deprecated Use getCalloutMsg
     */
    readonly description: MarkupText;
    /**
     * Returns the detailed description of the promotion.
     */
    readonly details: MarkupText;
    /**
     * Returns true if promotion is enabled, otherwise false.
     */
    readonly enabled: boolean;
    /**
     * Returns the effective end date of this instance of the promotion. If no
     * explicit end date is defined for the promotion, the end date of the
     * containing Campaign or AB-test is returned.
     */
    readonly endDate: Date | null;
    /**
     * Returns the promotion's exclusivity specifying how the promotion can be
     * combined with other promotions.
     * Possible values are EXCLUSIVITY_NO, EXCLUSIVITY_CLASS
     * and EXCLUSIVITY_GLOBAL.
     */
    readonly exclusivity: string;
    /**
     * Returns the reference to the promotion image.
     */
    readonly image: MediaFile;
    /**
     * Returns the date that this object was last modified.
     */
    readonly lastModified: Date;
    /**
     * Returns the promotion's mutually exclusive Promotions. Mutually exclusive Promotions is a set of promotions or
     * groups this promotion cannot be combined with.
     */
    readonly mutuallyExclusivePromotions: string[];
    /**
     * Returns the name of the promotion.
     */
    readonly name: string;
    /**
     * Returns the promotion class indicating the general type of the promotion.
     * Possible values are PROMOTION_CLASS_PRODUCT,
     * PROMOTION_CLASS_ORDER, and PROMOTION_CLASS_SHIPPING.
     */
    readonly promotionClass: string | null;
    /**
     * Returns the qualifier matching mode specified by this promotion. A
     * promotion may have up to 3 qualifier conditions based on whether it is
     * customer-group based, coupon based, and/or source-code based. A promotion
     * may require for example that a customer belong to a certain customer
     * group and also have a certain coupon in the cart in order for the
     * promotion to apply. This method returns QUALIFIER_MATCH_MODE_ALL if it is
     * necessary that all the qualifier conditions are satisfied in order for
     * this promotion to apply for a given customer. Otherwise, this method
     * returns QUALIFIER_MATCH_MODE_ANY indicating that at least of the
     * qualifier conditions must be satisfied.
     * 
     * Note: currently QUALIFIER_MATCH_MODE_ALL is only supported for promotions
     * assigned to campaigns, and not those assigned to AB-tests.
     */
    readonly qualifierMatchMode: string;
    /**
     * Returns the promotion's rank. Rank is a numeric attribute that you can specify.
     * Promotions with a defined rank are calculated before promotions without a defined rank.
     * If two promotions have a rank, the one with the lowest rank is calculated first.
     * For example, a promotion with rank 10 is calculated before one with rank 30.
     */
    readonly rank: number;
    /**
     * Returns true if promotion is refinable, otherwise false.
     */
    readonly refinable: boolean;
    /**
     * Returns the source code groups directly assigned to the promotion or assigned to the campaign of the promotion.
     * 
     * If the promotion is not based on source code groups (see isBasedOnSourceCodes), or no source code group is assigned to the
     * promotion or its campaign, an empty collection is returned.
     */
    readonly sourceCodeGroups: Collection<SourceCodeGroup>;
    /**
     * Returns the effective start date of this instance of the promotion. If no
     * explicit start date is defined for this instance, the start date of the
     * containing Campaign or AB-test is returned.
     */
    readonly startDate: Date | null;
    /**
     * Returns the promotion's tags. Tags are a way of categorizing and organizing promotions. A promotion can have many
     * tags. Tags will be returned in alphabetical order.
     */
    readonly tags: string[];
    private constructor();
    /**
     * Returns the callout message of the promotion.
     */
    getCalloutMsg(): MarkupText;
    /**
     * Returns the campaign this particular instance of the promotion is defined
     * in.
     * 
     * Note: If this promotion is defined as part of an AB-test, then a Campaign
     * object will be returned, but it is a mock implementation, and not a true
     * Campaign. This behavior is required for backwards compatibility and
     * should not be relied upon as it may change in future releases.
     */
    getCampaign(): Campaign;
    /**
     * Returns the promotion's combinable promotions. Combinable promotions is a set of promotions or groups this
     * promotion can be combined with.
     */
    getCombinablePromotions(): string[];
    /**
     * Returns a description of the condition that must be met for this
     * promotion to be applicable.
     * 
     * The method and the related attribute have been deprecated. Use the
     * getDetails method instead.
     * @deprecated Use getDetails
     */
    getConditionalDescription(): MarkupText;
    /**
     * Returns the coupons directly assigned to the promotion or assigned to the campaign of the promotion.
     * 
     * If the promotion is not based on coupons (see isBasedOnCoupons), or no coupons is assigned to the
     * promotion or its campaign, an empty collection is returned.
     */
    getCoupons(): Collection<Coupon>;
    /**
     * Returns the customer groups directly assigned to the promotion or assigned to the campaign of the promotion.
     * 
     * If the promotion is not based on customer groups (see isBasedOnCustomerGroups), or no customer group is assigned to the
     * promotion or its campaign, an empty collection is returned.
     */
    getCustomerGroups(): Collection<CustomerGroup>;
    /**
     * Returns the description of the promotion.
     * 
     * Method is deprecated and returns the same value as getCalloutMsg.
     * @deprecated Use getCalloutMsg
     */
    getDescription(): MarkupText;
    /**
     * Returns the detailed description of the promotion.
     */
    getDetails(): MarkupText;
    /**
     * Returns the effective end date of this instance of the promotion. If no
     * explicit end date is defined for the promotion, the end date of the
     * containing Campaign or AB-test is returned.
     */
    getEndDate(): Date | null;
    /**
     * Returns the promotion's exclusivity specifying how the promotion can be
     * combined with other promotions.
     * Possible values are EXCLUSIVITY_NO, EXCLUSIVITY_CLASS
     * and EXCLUSIVITY_GLOBAL.
     */
    getExclusivity(): string;
    /**
     * Returns the unique ID of the promotion.
     */
    getID(): string;
    /**
     * Returns the reference to the promotion image.
     */
    getImage(): MediaFile;
    /**
     * Returns the date that this object was last modified.
     */
    getLastModified(): Date;
    /**
     * Returns the promotion's mutually exclusive Promotions. Mutually exclusive Promotions is a set of promotions or
     * groups this promotion cannot be combined with.
     */
    getMutuallyExclusivePromotions(): string[];
    /**
     * Returns the name of the promotion.
     */
    getName(): string;
    /**
     * Returns the promotion class indicating the general type of the promotion.
     * Possible values are PROMOTION_CLASS_PRODUCT,
     * PROMOTION_CLASS_ORDER, and PROMOTION_CLASS_SHIPPING.
     */
    getPromotionClass(): string | null;
    /**
     * Returns the promotional price for the specified product. The promotional
     * price is only returned if the following conditions are met:
     * 
     * - this promotion is a product promotion without purchase conditions,
     * i.e. is of type 'Without qualifying products'.
     * - this promotion's discount is Discount.TYPE_AMOUNT,
     * Discount.TYPE_PERCENTAGE, Discount.TYPE_FIXED_PRICE, or
     * Discount.TYPE_PRICEBOOK_PRICE.
     * - specified product is one of the discounted products of the
     * promotion.
     * - the product has a valid sales price for quantity 1.0.
     * 
     * In all other cases, the method will return Money.NOT_AVAILABLE. It is
     * not required that this promotion be an active customer
     * promotion.
     * 
     * NOTE: the method might be extended in the future to support more
     * promotion types.
     * 
     * To calculate the promotional price, the method uses the current sales
     * price of the product for quantity 1.0, and applies the discount
     * associated with the promotion to this price. For example, if the product
     * price is $14.99, and the promotion discount is 10%, the method will
     * return $13.49. If the discount is $2 off, the method will return $12.99.
     * If the discount is $10.00 fixed price, the method will return $10.00.
     */
    getPromotionalPrice(product: Product<any>): Money;
    /**
     * This method follows the same logic as
     * getPromotionalPrice but prices are calculated based
     * on the option values selected in the specified option model.
     */
    getPromotionalPrice(product: Product<any>, optionModel: ProductOptionModel): Money;
    /**
     * Returns the qualifier matching mode specified by this promotion. A
     * promotion may have up to 3 qualifier conditions based on whether it is
     * customer-group based, coupon based, and/or source-code based. A promotion
     * may require for example that a customer belong to a certain customer
     * group and also have a certain coupon in the cart in order for the
     * promotion to apply. This method returns QUALIFIER_MATCH_MODE_ALL if it is
     * necessary that all the qualifier conditions are satisfied in order for
     * this promotion to apply for a given customer. Otherwise, this method
     * returns QUALIFIER_MATCH_MODE_ANY indicating that at least of the
     * qualifier conditions must be satisfied.
     * 
     * Note: currently QUALIFIER_MATCH_MODE_ALL is only supported for promotions
     * assigned to campaigns, and not those assigned to AB-tests.
     */
    getQualifierMatchMode(): string;
    /**
     * Returns the promotion's rank. Rank is a numeric attribute that you can specify.
     * Promotions with a defined rank are calculated before promotions without a defined rank.
     * If two promotions have a rank, the one with the lowest rank is calculated first.
     * For example, a promotion with rank 10 is calculated before one with rank 30.
     */
    getRank(): number;
    /**
     * Returns the source code groups directly assigned to the promotion or assigned to the campaign of the promotion.
     * 
     * If the promotion is not based on source code groups (see isBasedOnSourceCodes), or no source code group is assigned to the
     * promotion or its campaign, an empty collection is returned.
     */
    getSourceCodeGroups(): Collection<SourceCodeGroup>;
    /**
     * Returns the effective start date of this instance of the promotion. If no
     * explicit start date is defined for this instance, the start date of the
     * containing Campaign or AB-test is returned.
     */
    getStartDate(): Date | null;
    /**
     * Returns the promotion's tags. Tags are a way of categorizing and organizing promotions. A promotion can have many
     * tags. Tags will be returned in alphabetical order.
     */
    getTags(): string[];
    /**
     * Returns 'true' if promotion is active, otherwise 'false'.
     * 
     * A promotion is active if its campaign is active, and the promotion
     * is enabled, and it is scheduled for now.
     */
    isActive(): boolean;
    /**
     * Returns 'true' if the promotion is triggered by a coupon,
     * false otherwise.
     * @deprecated Use isBasedOnCoupons
     */
    isBasedOnCoupon(): boolean;
    /**
     * Returns 'true' if the promotion is triggered by coupons,
     * false otherwise.
     */
    isBasedOnCoupons(): boolean;
    /**
     * Returns 'true' if the promotion is triggered by customer groups,
     * false otherwise.
     */
    isBasedOnCustomerGroups(): boolean;
    /**
     * Returns 'true' if the promotion is triggered by source codes,
     * false otherwise.
     */
    isBasedOnSourceCodes(): boolean;
    /**
     * Returns true if promotion is enabled, otherwise false.
     */
    isEnabled(): boolean;
    /**
     * Returns true if promotion is refinable, otherwise false.
     */
    isRefinable(): boolean;
}

export = Promotion;
