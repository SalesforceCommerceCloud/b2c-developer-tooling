import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import ProductLineItem = require('./ProductLineItem');
import Quantity = require('../value/Quantity');
import Shipment = require('./Shipment');
import ProductListItem = require('../customer/ProductListItem');
import Product = require('../catalog/Product');
import ProductOptionModel = require('../catalog/ProductOptionModel');
import BonusDiscountLineItem = require('./BonusDiscountLineItem');
import Collection = require('../util/Collection');
import GiftCertificateLineItem = require('./GiftCertificateLineItem');
import OrderPaymentInstrument = require('./OrderPaymentInstrument');
import Money = require('../value/Money');
import CouponLineItem = require('./CouponLineItem');
import CustomerPaymentInstrument = require('../customer/CustomerPaymentInstrument');
import PaymentInstrument = require('./PaymentInstrument');
import LineItem = require('./LineItem');
import PriceAdjustment = require('./PriceAdjustment');
import Discount = require('../campaign/Discount');
import Status = require('../system/Status');
import OrderAddress = require('./OrderAddress');
import Customer = require('../customer/Customer');
import HashMap = require('../util/HashMap');
import EnumValue = require('../value/EnumValue');
import Note = require('../object/Note');
import List = require('../util/List');
import SortedMap = require('../util/SortedMap');

declare global {
    module ICustomAttributes {
        interface LineItemCtnr extends CustomAttributes {
        }
    }
}

/**
 * A container for line items, such as ProductLineItems, CouponLineItems, GiftCertificateLineItems. This container also
 * provides access to shipments, shipping adjustments (promotions), and payment instruments (credit cards).
 * 
 * LineItemCtnr also contains a set of methods for creating line items and adjustments, and for accessing various price
 * values. There are three types of price-related methods:
 * 
 * - Net-based methods represent the amount of a category before tax has been calculated. For example,
 * the getMerchandizeTotalNetPrice() returns the price of all merchandise in the container whereas
 * getShippingTotalNetPrice() returns the price of all shipments in the container.
 * - Tax-based methods return the amount of tax on a category. For example, the getMerchandizeTotalTax()
 * returns the total tax for all merchandise and the getShippingTotalTax() returns the tax applied to all
 * shipments.
 * - Gross-based methods represent the amount of a category after tax has been calculated. For example,
 * the getMerchandizeTotalGrossPrice() returns the price of all merchandise in the container, including tax on the
 * merchandise, whereas getShippingTotalGrossPrice() returns the price of all shipments in the container, including tax
 * on the shipments in the container.
 * 
 * There are also a set of methods that provide access to 'adjusted' values. The adjusted-based methods return values
 * where promotions have been applied. For example, the getAdjustedMerchandizeTotalNetPrice() method returns the net
 * price of all merchandise after product-level and order-level promotions have been applied. Whereas the
 * getAdjustedMerchandizeTotalGrossPrice() method returns the price of all merchandise after product-level and
 * order-level promotions have been applied and includes the amount of merchandise-related tax.
 * 
 * Finally, there are a set of methods that return the aggregate values representing the line items in the container.
 * These are the total-based methods getTotalNetPrice(), getTotalTax() and getTotalGrossPrice(). These methods return
 * the totals of all items in the container and include any order-level promotions.
 * 
 * Note that all merchandise-related methods do not include 'gift certificates' values in the values they return. Gift
 * certificates are not considered merchandise as they do not represent a product.
 */
declare class LineItemCtnr<T extends ICustomAttributes.LineItemCtnr = ICustomAttributes.LineItemCtnr> extends ExtensibleObject<T> {
    /**
     * constant for Business Type B2B
     */
    static readonly BUSINESS_TYPE_B2B: number;
    /**
     * constant for Business Type B2C
     */
    static readonly BUSINESS_TYPE_B2C: number;
    /**
     * constant for Channel Type CallCenter
     */
    static readonly CHANNEL_TYPE_CALLCENTER: number;
    /**
     * constant for Channel Type ChatGPT
     */
    static readonly CHANNEL_TYPE_CHATGPT: number;
    /**
     * constant for Channel Type Customer Service Center
     */
    static readonly CHANNEL_TYPE_CUSTOMERSERVICECENTER: number;
    /**
     * constant for Channel Type DSS
     */
    static readonly CHANNEL_TYPE_DSS: number;
    /**
     * constant for Channel Type Facebook Ads
     */
    static readonly CHANNEL_TYPE_FACEBOOKADS: number;
    /**
     * constant for Channel Type Gemini
     */
    static readonly CHANNEL_TYPE_GEMINI: number;
    /**
     * constant for Channel Type Google
     */
    static readonly CHANNEL_TYPE_GOOGLE: number;
    /**
     * constant for Channel Type Instagram Commerce
     */
    static readonly CHANNEL_TYPE_INSTAGRAMCOMMERCE: number;
    /**
     * constant for Channel Type Marketplace
     */
    static readonly CHANNEL_TYPE_MARKETPLACE: number;
    /**
     * constant for Channel Type Online Reservation
     */
    static readonly CHANNEL_TYPE_ONLINERESERVATION: number;
    /**
     * constant for Channel Type Pinterest
     */
    static readonly CHANNEL_TYPE_PINTEREST: number;
    /**
     * constant for Channel Type Snapchat
     */
    static readonly CHANNEL_TYPE_SNAPCHAT: number;
    /**
     * constant for Channel Type Store
     */
    static readonly CHANNEL_TYPE_STORE: number;
    /**
     * constant for Channel Type Storefront
     */
    static readonly CHANNEL_TYPE_STOREFRONT: number;
    /**
     * constant for Channel Type Subscriptions
     */
    static readonly CHANNEL_TYPE_SUBSCRIPTIONS: number;
    /**
     * constant for Channel Type TikTok
     */
    static readonly CHANNEL_TYPE_TIKTOK: number;
    /**
     * constant for Channel Type Twitter
     */
    static readonly CHANNEL_TYPE_TWITTER: number;
    /**
     * constant for Channel Type WhatsApp
     */
    static readonly CHANNEL_TYPE_WHATSAPP: number;
    /**
     * constant for Channel Type YouTube
     */
    static readonly CHANNEL_TYPE_YOUTUBE: number;
    /**
     * Returns the adjusted total gross price (including tax) in purchase currency. Adjusted merchandize prices
     * represent the sum of product prices before services such as shipping, but after product-level and order-level
     * adjustments.
     */
    readonly adjustedMerchandizeTotalGrossPrice: Money;
    /**
     * Returns the total net price (excluding tax) in purchase currency. Adjusted merchandize prices represent the sum
     * of product prices before services such as shipping, but after product-level and order-level adjustments.
     */
    readonly adjustedMerchandizeTotalNetPrice: Money;
    /**
     * Returns the adjusted merchandize total price including product-level and order-level adjustments. If the line
     * item container is based on net pricing the adjusted merchandize total net price is returned. If the line item
     * container is based on gross pricing the adjusted merchandize total gross price is returned.
     */
    readonly adjustedMerchandizeTotalPrice: Money;
    /**
     * Returns the subtotal tax in purchase currency. Adjusted merchandize prices represent the sum of product prices
     * before services such as shipping have been added, but after adjustment from promotions have been added.
     */
    readonly adjustedMerchandizeTotalTax: Money;
    /**
     * Returns the adjusted sum of all shipping line items of the line item container, including tax after shipping
     * adjustments have been applied.
     */
    readonly adjustedShippingTotalGrossPrice: Money;
    /**
     * Returns the sum of all shipping line items of the line item container, excluding tax after shipping adjustments
     * have been applied.
     */
    readonly adjustedShippingTotalNetPrice: Money;
    /**
     * Returns the adjusted shipping total price. If the line item container is based on net pricing the adjusted
     * shipping total net price is returned. If the line item container is based on gross pricing the adjusted shipping
     * total gross price is returned.
     */
    readonly adjustedShippingTotalPrice: Money;
    /**
     * Returns the tax of all shipping line items of the line item container after shipping adjustments have been
     * applied.
     */
    readonly adjustedShippingTotalTax: Money;
    /**
     * Returns all gift certificate line items of the container.
     * @deprecated Use getGiftCertificateLineItems to get the collection instead.
     */
    readonly allGiftCertificateLineItems: Collection<GiftCertificateLineItem>;
    /**
     * Returns all product, shipping, price adjustment, and gift certificate line items of the line item container.
     */
    readonly allLineItems: Collection<LineItem<any>>;
    /**
     * Returns all product line items of the container, no matter if they are dependent or independent. This includes
     * option, bundled and bonus line items.
     */
    readonly allProductLineItems: Collection<ProductLineItem>;
    /**
     * Returns a hash mapping all products in the line item container to their total quantities. The total product
     * quantity is used chiefly to validate the availability of the items in the cart. This method is not appropriate to
     * look up prices because it returns products such as bundled line items which are included in the price of their
     * parent and therefore have no corresponding price.
     * 
     * The method counts all direct product line items, plus dependent product line items that are not option line
     * items. It also excludes product line items that are not associated to any catalog product.
     */
    readonly allProductQuantities: HashMap<any, any>;
    /**
     * Returns the collection of all shipping price adjustments applied somewhere in the container. This can be
     * adjustments applied to individual shipments or to the container itself. Note that the promotions engine only
     * applies shipping price adjustments to the the default shipping line item of shipments, and never to the
     * container.
     * @see getShippingPriceAdjustments
     */
    readonly allShippingPriceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the billing address defined for the container. Returns null if no billing address has been created yet.
     */
    readonly billingAddress: OrderAddress | null;
    /**
     * Returns an unsorted collection of the the bonus discount line items associated with this container.
     */
    readonly bonusDiscountLineItems: Collection<BonusDiscountLineItem>;
    /**
     * Returns the collection of product line items that are bonus items (where
     * dw.order.ProductLineItem.isBonusProductLineItem is true).
     */
    readonly bonusLineItems: Collection<Product<any>>;
    /**
     * Returns the type of the business this order has been placed in.
     * 
     * Possible values are BUSINESS_TYPE_B2C or BUSINESS_TYPE_B2B.
     */
    readonly businessType: EnumValue | null;
    /**
     * The channel type defines in which sales channel this order has been created. This can be used to distinguish
     * order placed through Storefront, Call Center or Marketplace.
     * 
     * Possible values are CHANNEL_TYPE_STOREFRONT, CHANNEL_TYPE_CALLCENTER,
     * CHANNEL_TYPE_MARKETPLACE, CHANNEL_TYPE_DSS, CHANNEL_TYPE_STORE,
     * CHANNEL_TYPE_PINTEREST, CHANNEL_TYPE_TWITTER, CHANNEL_TYPE_FACEBOOKADS,
     * CHANNEL_TYPE_SUBSCRIPTIONS, CHANNEL_TYPE_ONLINERESERVATION,
     * CHANNEL_TYPE_CUSTOMERSERVICECENTER, CHANNEL_TYPE_INSTAGRAMCOMMERCE,
     * CHANNEL_TYPE_GOOGLE, CHANNEL_TYPE_YOUTUBE, CHANNEL_TYPE_TIKTOK,
     * CHANNEL_TYPE_SNAPCHAT, CHANNEL_TYPE_WHATSAPP, CHANNEL_TYPE_CHATGPT,
     * CHANNEL_TYPE_GEMINI
     */
    readonly channelType: EnumValue | null;
    /**
     * Returns a sorted collection of the coupon line items in the container. The coupon line items are returned in the
     * order they were added to container.
     */
    readonly couponLineItems: Collection<CouponLineItem>;
    /**
     * Returns the currency code for this line item container. The currency code is a 3-character currency mnemonic such
     * as 'USD' or 'EUR'. The currency code represents the currency in which the calculation is made, and in which the
     * buyer sees all prices in the store front.
     */
    readonly currencyCode: string;
    /**
     * Returns the customer associated with this container.
     */
    readonly customer: Customer;
    /**
     * Returns the email of the customer associated with this container.
     */
    customerEmail: string;
    /**
     * Returns the name of the customer associated with this container.
     */
    customerName: string;
    /**
     * Returns the customer number of the customer associated with this container.
     */
    readonly customerNo: string;
    /**
     * Returns the default shipment of the line item container. Baskets always have a default shipment with ID "me".
     * For orders, this can differ, for example: dw.order.OrderMgr.createOrder removes empty
     * shipments, so if the basket's "me" shipment was empty at order creation, the order has no "me" shipment. In
     * that case, the shipment with the lowest ID is returned as the fallback, or `null` if the order has
     * no shipments. See dw.order.Shipment.isDefault for the matching logic.
     * 
     * Processes that access a shipment use the default shipment when none is specified. The default shipment can't be
     * removed. Calling removeShipment on it throws an exception.
     */
    readonly defaultShipment: Shipment | null;
    /**
     * Returns the Etag of the line item container. The Etag is a hash that represents the overall container state
     * including any associated objects like line items.
     */
    readonly etag: string;
    /**
     * Use this method to check whether the LineItemCtnr is calculated based on external tax tables.
     * 
     * Note: a basket can only be created in EXTERNAL tax mode using SCAPI.
     */
    readonly externallyTaxed: boolean;
    /**
     * Returns all gift certificate line items of the container.
     */
    readonly giftCertificateLineItems: Collection<GiftCertificateLineItem>;
    /**
     * Returns an unsorted collection of the PaymentInstrument instances that represent GiftCertificates in this
     * container.
     */
    readonly giftCertificatePaymentInstruments: Collection<OrderPaymentInstrument>;
    /**
     * Returns the total gross price of all gift certificates in the cart. Should usually be equal to total net price.
     */
    readonly giftCertificateTotalGrossPrice: Money;
    /**
     * Returns the total net price (excluding tax) of all gift certificates in the cart. Should usually be equal to
     * total gross price.
     */
    readonly giftCertificateTotalNetPrice: Money;
    /**
     * Returns the gift certificate total price. If the line item container is based on net pricing the gift certificate
     * total net price is returned. If the line item container is based on gross pricing the gift certificate total
     * gross price is returned.
     */
    readonly giftCertificateTotalPrice: Money;
    /**
     * Returns the total tax of all gift certificates in the cart. Should usually be 0.0.
     */
    readonly giftCertificateTotalTax: Money;
    /**
     * Returns the total gross price (including tax) in purchase currency. Merchandize total prices represent the sum of
     * product prices before services such as shipping or adjustment from promotions have been added.
     */
    readonly merchandizeTotalGrossPrice: Money;
    /**
     * Returns the total net price (excluding tax) in purchase currency. Merchandize total prices represent the sum of
     * product prices before services such as shipping or adjustment from promotion have been added.
     */
    readonly merchandizeTotalNetPrice: Money;
    /**
     * Returns the merchandize total price. If the line item container is based on net pricing the merchandize total net
     * price is returned. If the line item container is based on gross pricing the merchandize total gross price is
     * returned.
     */
    readonly merchandizeTotalPrice: Money;
    /**
     * Returns the total tax in purchase currency. Merchandize total prices represent the sum of product prices before
     * services such as shipping or adjustment from promotions have been added.
     */
    readonly merchandizeTotalTax: Money;
    /**
     * Returns the list of notes for this object, ordered by creation time from oldest to newest.
     */
    readonly notes: List<any>;
    /**
     * Returns the payment instrument of the line item container or null. This method is deprecated. You should use
     * getPaymentInstruments() or getGiftCertificatePaymentInstruments() instead.
     * @deprecated Use getPaymentInstruments or getGiftCertificatePaymentInstruments to get the
     * set of payment instruments.
     */
    readonly paymentInstrument: OrderPaymentInstrument | null;
    /**
     * Returns an unsorted collection of the payment instruments in this container.
     */
    readonly paymentInstruments: Collection<PaymentInstrument<any>>;
    /**
     * Returns the collection of price adjustments that have been applied to the totals such as promotion on the
     * purchase value (i.e. $10 Off or 10% Off). The price adjustments are sorted by the order in which they were
     * applied to the order by the promotions engine.
     */
    readonly priceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the product line items of the container that are not dependent on other product line items. This includes
     * line items representing bonus products in the container but excludes option, bundled, and bonus line items. The
     * returned collection is sorted by the position attribute of the product line items.
     */
    readonly productLineItems: Collection<ProductLineItem>;
    /**
     * Returns a hash map of all products in the line item container and their total quantities. The total product
     * quantity is for example used to lookup the product price.
     * 
     * The method counts all direct product line items, plus dependent product line items that are not bundled line
     * items and no option line items. It also excludes product line items that are not associated to any catalog
     * product, and bonus product line items.
     * @see getProductQuantities
     */
    readonly productQuantities: HashMap<any, any>;
    /**
     * Returns the total quantity of all product line items. Not included are bundled line items and option line items.
     */
    readonly productQuantityTotal: number;
    /**
     * Returns all shipments of the line item container.
     * 
     * The first shipment in the returned collection is the default shipment (shipment ID always set to "me"). All other
     * shipments are sorted ascending by shipment ID.
     */
    readonly shipments: Collection<Shipment>;
    /**
     * Returns the of shipping price adjustments applied to the shipping total of the container. Note that the
     * promotions engine only applies shipping price adjustments to the the default shipping line item of shipments, and
     * never to the container.
     * @see getAllShippingPriceAdjustments
     */
    readonly shippingPriceAdjustments: Collection<PriceAdjustment>;
    /**
     * Returns the sum of all shipping line items of the line item container, including tax before shipping adjustments
     * have been applied.
     */
    readonly shippingTotalGrossPrice: Money;
    /**
     * Returns the sum of all shipping line items of the line item container, excluding tax before shipping adjustments
     * have been applied.
     */
    readonly shippingTotalNetPrice: Money;
    /**
     * Returns the shipping total price. If the line item container is based on net pricing the shipping total net price
     * is returned. If the line item container is based on gross pricing the shipping total gross price is returned.
     */
    readonly shippingTotalPrice: Money;
    /**
     * Returns the tax of all shipping line items of the line item container before shipping adjustments have been
     * applied.
     */
    readonly shippingTotalTax: Money;
    /**
     * Use this method to check if the LineItemCtnr was calculated with grouped taxation calculation.
     * 
     * If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.
     */
    readonly taxRoundedAtGroup: boolean;
    /**
     * This method returns a dw.util.SortedMap in which the keys are dw.util.Decimal tax rates and the values
     * are dw.value.Money total tax for the tax rate. The map is unmodifiable.
     */
    readonly taxTotalsPerTaxRate: SortedMap<any, any>;
    /**
     * Returns the grand total price gross of tax for LineItemCtnr, in purchase currency. Total prices represent the sum
     * of product prices, services prices and adjustments.
     */
    readonly totalGrossPrice: Money;
    /**
     * Returns the grand total price for LineItemCtnr net of tax, in purchase currency. Total prices represent the sum
     * of product prices, services prices and adjustments.
     */
    readonly totalNetPrice: Money;
    /**
     * Returns the grand total tax for LineItemCtnr, in purchase currency. Total prices represent the sum of product
     * prices, services prices and adjustments.
     */
    readonly totalTax: Money;
    /**
     * Adds a note to the object.
     */
    addNote(subject: string, text: string): Note;
    /**
     * Create a billing address for the LineItemCtnr. A LineItemCtnr (e.g. basket) initially has no billing address.
     * This method creates a billing address for the LineItemCtnr and replaces an existing billing address.
     */
    createBillingAddress(): OrderAddress;
    /**
     * Creates a product line item in the container based on the passed Product and BonusDiscountLineItem. The product
     * must be assigned to the current site catalog and must also be a bonus product of the specified
     * BonusDiscountLineItem or an exception is thrown. The line item is always created in the default shipment. If
     * successful, the operation always creates a new ProductLineItem and never simply increments the quantity of an
     * existing ProductLineItem. An option model can optionally be specified.
     */
    createBonusProductLineItem(bonusDiscountLineItem: BonusDiscountLineItem, product: Product<any>, optionModel: ProductOptionModel | null, shipment: Shipment): ProductLineItem;
    /**
     * Creates a new CouponLineItem for this container based on the supplied coupon code.
     * 
     * The created coupon line item is based on the B2C Commerce campaign system if campaignBased parameter is true. In
     * that case, if the supplied coupon code is not valid, APIException with type 'CreateCouponLineItemException' is
     * thrown.
     * 
     * If you want to create a custom coupon line item, you must call this method with campaignBased = false or to use
     * createCouponLineItem.
     * 
     * Example:
     * 
     * ```
     * try {
     * var cli : CouponLineItem = basket.createCouponLineItem(couponCode, true);
     * } catch (e if e instanceof APIException && e.type === 'CreateCouponLineItemException')
     * if (e.errorCode == CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET) {
     * ...
     * }
     * }
     * ```
     * 
     * An dw.order.CreateCouponLineItemException is thrown in case of campaignBased = true only. Indicates that the
     * provided coupon code is not a valid coupon code to create a coupon line item based on the B2C Commerce campaign
     * system. The error code property (CreateCouponLineItemException.errorCode) will be set to one of the following
     * values:
     * 
     * - dw.campaign.CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET = Indicates that coupon code has already
     * been added to basket.
     * - dw.campaign.CouponStatusCodes.COUPON_ALREADY_IN_BASKET = Indicates that another code of the same
     * MultiCode/System coupon has already been added to basket.
     * - dw.campaign.CouponStatusCodes.COUPON_CODE_ALREADY_REDEEMED = Indicates that code of MultiCode/System
     * coupon has already been redeemed.
     * - dw.campaign.CouponStatusCodes.COUPON_CODE_UNKNOWN = Indicates that coupon not found for given coupon
     * code or that the code itself was not found.
     * - dw.campaign.CouponStatusCodes.COUPON_DISABLED = Indicates that coupon is not enabled.
     * - dw.campaign.CouponStatusCodes.REDEMPTION_LIMIT_EXCEEDED = Indicates that number of redemptions per
     * code exceeded.
     * - dw.campaign.CouponStatusCodes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED = Indicates that number of
     * redemptions per code and customer exceeded.
     * - dw.campaign.CouponStatusCodes.TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED = Indicates that number of
     * redemptions per code, customer and time exceeded.
     * - dw.campaign.CouponStatusCodes.NO_ACTIVE_PROMOTION = Indicates that coupon is not assigned to an
     * active promotion.
     */
    createCouponLineItem(couponCode: string, campaignBased: boolean): CouponLineItem;
    /**
     * Creates a coupon line item that is not based on the B2C Commerce campaign system and associates it with the
     * specified coupon code.
     * 
     * There may not be any other coupon line item in the container with the specific coupon code, otherwise an
     * exception is thrown.
     * 
     * If you want to create a coupon line item based on the B2C Commerce campaign system, you must use
     * createCouponLineItem with campaignBased = true.
     */
    createCouponLineItem(couponCode: string): CouponLineItem;
    /**
     * Creates a gift certificate line item.
     */
    createGiftCertificateLineItem(amount: number, recipientEmail: string): GiftCertificateLineItem;
    /**
     * Creates an OrderPaymentInstrument representing a Gift Certificate. The amount is set on a PaymentTransaction that
     * is accessible via the OrderPaymentInstrument. By default, the status of the PaymentTransaction is set to CREATE.
     * The PaymentTransaction must be processed at a later time.
     */
    createGiftCertificatePaymentInstrument(giftCertificateCode: string, amount: Money): OrderPaymentInstrument;
    /**
     * Creates a payment instrument using the specified payment method id and amount. The amount is set on the
     * PaymentTransaction that is attached to the payment instrument.
     */
    createPaymentInstrument(paymentMethodId: string, amount: Money | null): OrderPaymentInstrument;
    /**
     * Creates a payment instrument using the specified wallet payment instrument and amount. The amount is set on the
     * PaymentTransaction that is attached to the payment instrument. All data from the wallet payment
     * instrument will be copied over to the created payment instrument.
     */
    createPaymentInstrumentFromWallet(walletPaymentInstrument: CustomerPaymentInstrument, amount: Money | null): OrderPaymentInstrument;
    /**
     * Creates an order price adjustment.
     * 
     * The promotion id is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise
     * an exception is thrown.
     */
    createPriceAdjustment(promotionID: string): PriceAdjustment;
    /**
     * Creates an order level price adjustment for a specific discount.
     * 
     * The promotion id is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise
     * an exception is thrown.
     * 
     * The possible discount types are supported: dw.campaign.PercentageDiscount and
     * dw.campaign.AmountDiscount.
     * 
     * Examples:
     * 
     * `
     * var myOrder : dw.order.Order; // assume known
     * 
     * var paTenPercent : dw.order.PriceAdjustment = myOrder.createPriceAdjustment("myPromotionID1", new dw.campaign.PercentageDiscount(10));
     * 
     * var paReduceBy20 : dw.order.PriceAdjustment = myOrder.createPriceAdjustment("myPromotionID2", new dw.campaign.AmountDiscount(20);
     * 
     * `
     */
    createPriceAdjustment(promotionID: string, discount: Discount): PriceAdjustment;
    /**
     * Creates a new product line item in the container and assigns it to the specified shipment.
     * 
     * If the specified productID represents a product in the site catalog, the method will associate the product line
     * item with that catalog product and will copy all order-relevant information, like the quantity unit, from the
     * catalog product.
     * 
     * If the specified productID does not represent a product of the site catalog, the method creates a new product
     * line item and initializes it with the specified product ID and quantity. If the passed in quantity value is not a
     * positive integer, it will be rounded to the nearest positive integer. The minimum order quantity and step
     * quantity will be set to 1.0.
     * 
     * For catalog products, the method follows the configured 'Add2Basket' strategy to either increment the quantity of
     * an existing product line item or create a new product line item for the same product. For non-catalog products,
     * the method creates a new product line item no matter if the same product is already in the line item container.
     * If a negative quantity is specified, it is automatically changed to 1.0.
     * @deprecated Use createProductLineItem or
     * dw.order.ProductLineItem.updateQuantity instead.
     */
    createProductLineItem(productID: string, quantity: Quantity, shipment: Shipment): ProductLineItem;
    /**
     * Creates a new product line item in the container and assigns it to the specified shipment.
     * 
     * If the specified productID represents a product in the site catalog, the method will associate the product line
     * item with that catalog product and will copy all order-relevant information, like the quantity unit, from the
     * catalog product. The quantity of the product line item is initialized with 1.0 or - if defined - the minimum
     * order quantity of the product.
     * 
     * If the product represents a product in the site catalog and is an option product, the product is added with it's
     * default option values.
     * 
     * If the specified productID does not represent a product of the site catalog, the method creates a new product
     * line item and initializes it with the specified product ID and with a quantity, minimum order quantity, and step
     * quantity value of 1.0.
     * 
     * If the provided SKU references a product that is not available as described in method dw.order.ProductLineItem.isCatalogProduct, the new product line item is considered a non-catalog product line item without a connection to a product. Such product line items are not included in reservation requests in either OCI-based inventory or eCom-based inventory when calling dw.order.Basket.reserveInventory or dw.order.OrderMgr.createOrder.
     */
    createProductLineItem(productID: string, shipment: Shipment): ProductLineItem;
    /**
     * Creates a new product line item in the basket and assigns it to the specified shipment.
     * 
     * If the product list item references a product in the site catalog, the method will associate the product line
     * item with that catalog product and will copy all order-relevant information, like the quantity unit, from the
     * catalog product. The quantity of the product line item is initialized with 1.0 or - if defined - the minimum
     * order quantity of the product.
     * 
     * If the product list item references an option product, the option values are copied from the product list item.
     * 
     * If the product list item is associated with an existing product line item, and the BasketAddProductBehaviour
     * setting is MergeQuantities, then the product line item quantity is increased by 1.0 or, if defined, the minimum
     * order quantity of the product.
     * 
     * An exception is thrown if
     * 
     * - the line item container is no basket.
     * - the type of the product list item is not PRODUCT.
     * - the product list item references a product which is not assigned to the site catalog.
     */
    createProductLineItem(productListItem: ProductListItem, shipment: Shipment): ProductLineItem;
    /**
     * Creates a new product line item in the container and assigns it to the specified shipment. An option model can be
     * specified.
     * 
     * Please note that the product must be assigned to the current site catalog.
     */
    createProductLineItem(product: Product<any>, optionModel: ProductOptionModel | null, shipment: Shipment): ProductLineItem;
    /**
     * Creates a standard shipment for the line item container. The specified ID must not yet be in use for another
     * shipment of this line item container.
     */
    createShipment(id: string): Shipment;
    /**
     * Creates a shipping price adjustment to be applied to the container.
     * 
     * The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce; otherwise
     * the method will throw an exception.
     * 
     * If there already exists a shipping price adjustment referring to the specified promotion ID, an exception is
     * thrown.
     */
    createShippingPriceAdjustment(promotionID: string): PriceAdjustment;
    /**
     * Returns the adjusted total gross price (including tax) in purchase currency. Adjusted merchandize prices
     * represent the sum of product prices before services such as shipping, but after product-level and order-level
     * adjustments.
     */
    getAdjustedMerchandizeTotalGrossPrice(): Money;
    /**
     * Returns the total net price (excluding tax) in purchase currency. Adjusted merchandize prices represent the sum
     * of product prices before services such as shipping, but after product-level and order-level adjustments.
     */
    getAdjustedMerchandizeTotalNetPrice(): Money;
    /**
     * Returns the adjusted merchandize total price including product-level and order-level adjustments. If the line
     * item container is based on net pricing the adjusted merchandize total net price is returned. If the line item
     * container is based on gross pricing the adjusted merchandize total gross price is returned.
     */
    getAdjustedMerchandizeTotalPrice(): Money;
    /**
     * Returns the adjusted merchandize total price including order-level adjustments if requested. If the line item
     * container is based on net pricing the adjusted merchandize total net price is returned. If the line item
     * container is based on gross pricing the adjusted merchandize total gross price is returned.
     */
    getAdjustedMerchandizeTotalPrice(applyOrderLevelAdjustments: boolean): Money;
    /**
     * Returns the subtotal tax in purchase currency. Adjusted merchandize prices represent the sum of product prices
     * before services such as shipping have been added, but after adjustment from promotions have been added.
     */
    getAdjustedMerchandizeTotalTax(): Money;
    /**
     * Returns the adjusted sum of all shipping line items of the line item container, including tax after shipping
     * adjustments have been applied.
     */
    getAdjustedShippingTotalGrossPrice(): Money;
    /**
     * Returns the sum of all shipping line items of the line item container, excluding tax after shipping adjustments
     * have been applied.
     */
    getAdjustedShippingTotalNetPrice(): Money;
    /**
     * Returns the adjusted shipping total price. If the line item container is based on net pricing the adjusted
     * shipping total net price is returned. If the line item container is based on gross pricing the adjusted shipping
     * total gross price is returned.
     */
    getAdjustedShippingTotalPrice(): Money;
    /**
     * Returns the tax of all shipping line items of the line item container after shipping adjustments have been
     * applied.
     */
    getAdjustedShippingTotalTax(): Money;
    /**
     * Returns all gift certificate line items of the container.
     * @deprecated Use getGiftCertificateLineItems to get the collection instead.
     */
    getAllGiftCertificateLineItems(): Collection<GiftCertificateLineItem>;
    /**
     * Returns all product, shipping, price adjustment, and gift certificate line items of the line item container.
     */
    getAllLineItems(): Collection<LineItem<any>>;
    /**
     * Returns all product line items of the container, no matter if they are dependent or independent. This includes
     * option, bundled and bonus line items.
     */
    getAllProductLineItems(): Collection<ProductLineItem>;
    /**
     * Returns all product line items of the container that have a product ID equal to the specified product ID, no
     * matter if they are dependent or independent. This includes option, bundled and bonus line items.
     */
    getAllProductLineItems(productID: string): Collection<ProductLineItem>;
    /**
     * Returns a hash mapping all products in the line item container to their total quantities. The total product
     * quantity is used chiefly to validate the availability of the items in the cart. This method is not appropriate to
     * look up prices because it returns products such as bundled line items which are included in the price of their
     * parent and therefore have no corresponding price.
     * 
     * The method counts all direct product line items, plus dependent product line items that are not option line
     * items. It also excludes product line items that are not associated to any catalog product.
     */
    getAllProductQuantities(): HashMap<any, any>;
    /**
     * Returns the collection of all shipping price adjustments applied somewhere in the container. This can be
     * adjustments applied to individual shipments or to the container itself. Note that the promotions engine only
     * applies shipping price adjustments to the the default shipping line item of shipments, and never to the
     * container.
     * @see getShippingPriceAdjustments
     */
    getAllShippingPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the billing address defined for the container. Returns null if no billing address has been created yet.
     */
    getBillingAddress(): OrderAddress | null;
    /**
     * Returns an unsorted collection of the the bonus discount line items associated with this container.
     */
    getBonusDiscountLineItems(): Collection<BonusDiscountLineItem>;
    /**
     * Returns the collection of product line items that are bonus items (where
     * dw.order.ProductLineItem.isBonusProductLineItem is true).
     */
    getBonusLineItems(): Collection<Product<any>>;
    /**
     * Returns the type of the business this order has been placed in.
     * 
     * Possible values are BUSINESS_TYPE_B2C or BUSINESS_TYPE_B2B.
     */
    getBusinessType(): EnumValue | null;
    /**
     * The channel type defines in which sales channel this order has been created. This can be used to distinguish
     * order placed through Storefront, Call Center or Marketplace.
     * 
     * Possible values are CHANNEL_TYPE_STOREFRONT, CHANNEL_TYPE_CALLCENTER,
     * CHANNEL_TYPE_MARKETPLACE, CHANNEL_TYPE_DSS, CHANNEL_TYPE_STORE,
     * CHANNEL_TYPE_PINTEREST, CHANNEL_TYPE_TWITTER, CHANNEL_TYPE_FACEBOOKADS,
     * CHANNEL_TYPE_SUBSCRIPTIONS, CHANNEL_TYPE_ONLINERESERVATION,
     * CHANNEL_TYPE_CUSTOMERSERVICECENTER, CHANNEL_TYPE_INSTAGRAMCOMMERCE,
     * CHANNEL_TYPE_GOOGLE, CHANNEL_TYPE_YOUTUBE, CHANNEL_TYPE_TIKTOK,
     * CHANNEL_TYPE_SNAPCHAT, CHANNEL_TYPE_WHATSAPP, CHANNEL_TYPE_CHATGPT,
     * CHANNEL_TYPE_GEMINI
     */
    getChannelType(): EnumValue | null;
    /**
     * Returns the coupon line item representing the specified coupon code.
     */
    getCouponLineItem(couponCode: string): CouponLineItem | null;
    /**
     * Returns a sorted collection of the coupon line items in the container. The coupon line items are returned in the
     * order they were added to container.
     */
    getCouponLineItems(): Collection<CouponLineItem>;
    /**
     * Returns the currency code for this line item container. The currency code is a 3-character currency mnemonic such
     * as 'USD' or 'EUR'. The currency code represents the currency in which the calculation is made, and in which the
     * buyer sees all prices in the store front.
     */
    getCurrencyCode(): string;
    /**
     * Returns the customer associated with this container.
     */
    getCustomer(): Customer;
    /**
     * Returns the email of the customer associated with this container.
     */
    getCustomerEmail(): string;
    /**
     * Returns the name of the customer associated with this container.
     */
    getCustomerName(): string;
    /**
     * Returns the customer number of the customer associated with this container.
     */
    getCustomerNo(): string;
    /**
     * Returns the default shipment of the line item container. Baskets always have a default shipment with ID "me".
     * For orders, this can differ, for example: dw.order.OrderMgr.createOrder removes empty
     * shipments, so if the basket's "me" shipment was empty at order creation, the order has no "me" shipment. In
     * that case, the shipment with the lowest ID is returned as the fallback, or `null` if the order has
     * no shipments. See dw.order.Shipment.isDefault for the matching logic.
     * 
     * Processes that access a shipment use the default shipment when none is specified. The default shipment can't be
     * removed. Calling removeShipment on it throws an exception.
     */
    getDefaultShipment(): Shipment | null;
    /**
     * Returns the Etag of the line item container. The Etag is a hash that represents the overall container state
     * including any associated objects like line items.
     */
    getEtag(): string;
    /**
     * Returns all gift certificate line items of the container.
     */
    getGiftCertificateLineItems(): Collection<GiftCertificateLineItem>;
    /**
     * Returns all gift certificate line items of the container, no matter if they are dependent or independent.
     */
    getGiftCertificateLineItems(giftCertificateId: string): Collection<GiftCertificateLineItem>;
    /**
     * Returns an unsorted collection of the PaymentInstrument instances that represent GiftCertificates in this
     * container.
     */
    getGiftCertificatePaymentInstruments(): Collection<OrderPaymentInstrument>;
    /**
     * Returns an unsorted collection containing all PaymentInstruments of type
     * PaymentInstrument.METHOD_GIFT_CERTIFICATE where the specified code is the same code on the payment instrument.
     */
    getGiftCertificatePaymentInstruments(giftCertificateCode: string): Collection<OrderPaymentInstrument>;
    /**
     * Returns the total gross price of all gift certificates in the cart. Should usually be equal to total net price.
     */
    getGiftCertificateTotalGrossPrice(): Money;
    /**
     * Returns the total net price (excluding tax) of all gift certificates in the cart. Should usually be equal to
     * total gross price.
     */
    getGiftCertificateTotalNetPrice(): Money;
    /**
     * Returns the gift certificate total price. If the line item container is based on net pricing the gift certificate
     * total net price is returned. If the line item container is based on gross pricing the gift certificate total
     * gross price is returned.
     */
    getGiftCertificateTotalPrice(): Money;
    /**
     * Returns the total tax of all gift certificates in the cart. Should usually be 0.0.
     */
    getGiftCertificateTotalTax(): Money;
    /**
     * Returns the total gross price (including tax) in purchase currency. Merchandize total prices represent the sum of
     * product prices before services such as shipping or adjustment from promotions have been added.
     */
    getMerchandizeTotalGrossPrice(): Money;
    /**
     * Returns the total net price (excluding tax) in purchase currency. Merchandize total prices represent the sum of
     * product prices before services such as shipping or adjustment from promotion have been added.
     */
    getMerchandizeTotalNetPrice(): Money;
    /**
     * Returns the merchandize total price. If the line item container is based on net pricing the merchandize total net
     * price is returned. If the line item container is based on gross pricing the merchandize total gross price is
     * returned.
     */
    getMerchandizeTotalPrice(): Money;
    /**
     * Returns the total tax in purchase currency. Merchandize total prices represent the sum of product prices before
     * services such as shipping or adjustment from promotions have been added.
     */
    getMerchandizeTotalTax(): Money;
    /**
     * Returns the list of notes for this object, ordered by creation time from oldest to newest.
     */
    getNotes(): List<any>;
    /**
     * Returns the payment instrument of the line item container or null. This method is deprecated. You should use
     * getPaymentInstruments() or getGiftCertificatePaymentInstruments() instead.
     * @deprecated Use getPaymentInstruments or getGiftCertificatePaymentInstruments to get the
     * set of payment instruments.
     */
    getPaymentInstrument(): OrderPaymentInstrument | null;
    /**
     * Returns an unsorted collection of the payment instruments in this container.
     */
    getPaymentInstruments(): Collection<PaymentInstrument<any>>;
    /**
     * Returns an unsorted collection of PaymentInstrument instances based on the specified payment method ID.
     */
    getPaymentInstruments(paymentMethodID: string): Collection<PaymentInstrument<any>>;
    /**
     * Returns the price adjustment associated to the specified promotion ID.
     */
    getPriceAdjustmentByPromotionID(promotionID: string): PriceAdjustment | null;
    /**
     * Returns the collection of price adjustments that have been applied to the totals such as promotion on the
     * purchase value (i.e. $10 Off or 10% Off). The price adjustments are sorted by the order in which they were
     * applied to the order by the promotions engine.
     */
    getPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the product line items of the container that are not dependent on other product line items. This includes
     * line items representing bonus products in the container but excludes option, bundled, and bonus line items. The
     * returned collection is sorted by the position attribute of the product line items.
     */
    getProductLineItems(): Collection<ProductLineItem>;
    /**
     * Returns the product line items of the container that have a product ID equal to the specified product ID and that
     * are not dependent on other product line items. This includes line items representing bonus products in the
     * container, but excludes option, bundled and bonus line items. The returned collection is sorted by the position
     * attribute of the product line items.
     */
    getProductLineItems(productID: string): Collection<ProductLineItem>;
    /**
     * Returns a hash map of all products in the line item container and their total quantities. The total product
     * quantity is for example used to lookup the product price.
     * 
     * The method counts all direct product line items, plus dependent product line items that are not bundled line
     * items and no option line items. It also excludes product line items that are not associated to any catalog
     * product, and bonus product line items.
     * @see getProductQuantities
     */
    getProductQuantities(): HashMap<any, any>;
    /**
     * Returns a hash map of all products in the line item container and their total quantities. The total product
     * quantity is for example used to lookup the product price in the cart.
     * 
     * The method counts all direct product line items, plus dependent product line items that are not bundled line
     * items and no option line items. It also excludes product line items that are not associated to any catalog
     * product.
     * 
     * If the parameter 'includeBonusProducts' is set to true, the method also counts bonus product line items.
     */
    getProductQuantities(includeBonusProducts: boolean): HashMap<any, any>;
    /**
     * Returns the total quantity of all product line items. Not included are bundled line items and option line items.
     */
    getProductQuantityTotal(): number;
    /**
     * Returns the shipment for the specified ID or `null` if no shipment with this ID exists in the line
     * item container. Using "me" always returns the default shipment.
     */
    getShipment(id: string): Shipment | null;
    /**
     * Returns all shipments of the line item container.
     * 
     * The first shipment in the returned collection is the default shipment (shipment ID always set to "me"). All other
     * shipments are sorted ascending by shipment ID.
     */
    getShipments(): Collection<Shipment>;
    /**
     * Returns the shipping price adjustment associated with the specified promotion ID.
     */
    getShippingPriceAdjustmentByPromotionID(promotionID: string): PriceAdjustment | null;
    /**
     * Returns the of shipping price adjustments applied to the shipping total of the container. Note that the
     * promotions engine only applies shipping price adjustments to the the default shipping line item of shipments, and
     * never to the container.
     * @see getAllShippingPriceAdjustments
     */
    getShippingPriceAdjustments(): Collection<PriceAdjustment>;
    /**
     * Returns the sum of all shipping line items of the line item container, including tax before shipping adjustments
     * have been applied.
     */
    getShippingTotalGrossPrice(): Money;
    /**
     * Returns the sum of all shipping line items of the line item container, excluding tax before shipping adjustments
     * have been applied.
     */
    getShippingTotalNetPrice(): Money;
    /**
     * Returns the shipping total price. If the line item container is based on net pricing the shipping total net price
     * is returned. If the line item container is based on gross pricing the shipping total gross price is returned.
     */
    getShippingTotalPrice(): Money;
    /**
     * Returns the tax of all shipping line items of the line item container before shipping adjustments have been
     * applied.
     */
    getShippingTotalTax(): Money;
    /**
     * This method returns a dw.util.SortedMap in which the keys are dw.util.Decimal tax rates and the values
     * are dw.value.Money total tax for the tax rate. The map is unmodifiable.
     */
    getTaxTotalsPerTaxRate(): SortedMap<any, any>;
    /**
     * Returns the grand total price gross of tax for LineItemCtnr, in purchase currency. Total prices represent the sum
     * of product prices, services prices and adjustments.
     */
    getTotalGrossPrice(): Money;
    /**
     * Returns the grand total price for LineItemCtnr net of tax, in purchase currency. Total prices represent the sum
     * of product prices, services prices and adjustments.
     */
    getTotalNetPrice(): Money;
    /**
     * Returns the grand total tax for LineItemCtnr, in purchase currency. Total prices represent the sum of product
     * prices, services prices and adjustments.
     */
    getTotalTax(): Money;
    /**
     * Use this method to check whether the LineItemCtnr is calculated based on external tax tables.
     * 
     * Note: a basket can only be created in EXTERNAL tax mode using SCAPI.
     */
    isExternallyTaxed(): boolean;
    /**
     * Use this method to check if the LineItemCtnr was calculated with grouped taxation calculation.
     * 
     * If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.
     */
    isTaxRoundedAtGroup(): boolean;
    /**
     * Removes the all Payment Instruments from this container and deletes the Payment Instruments.
     */
    removeAllPaymentInstruments(): void;
    /**
     * Removes the specified bonus discount line item from the line item container.
     */
    removeBonusDiscountLineItem(bonusDiscountLineItem: BonusDiscountLineItem): void;
    /**
     * Removes the specified coupon line item from the line item container.
     */
    removeCouponLineItem(couponLineItem: CouponLineItem): void;
    /**
     * Removes the specified gift certificate line item from the line item container.
     */
    removeGiftCertificateLineItem(giftCertificateLineItem: GiftCertificateLineItem): void;
    /**
     * Removes a note from this line item container and deletes it.
     */
    removeNote(note: Note): void;
    /**
     * Removes the specified Payment Instrument from this container and deletes the Payment Instrument.
     */
    removePaymentInstrument(pi: PaymentInstrument<any>): void;
    /**
     * Removes the specified price adjustment line item from the line item container.
     */
    removePriceAdjustment(priceAdjustment: PriceAdjustment): void;
    /**
     * Removes the specified product line item from the line item container.
     */
    removeProductLineItem(productLineItem: ProductLineItem): void;
    /**
     * Removes the specified shipment and all associated product, gift certificate, shipping and price adjustment line
     * items from the line item container. It is not permissible to remove the default shipment.
     */
    removeShipment(shipment: Shipment): void;
    /**
     * Removes the specified shipping price adjustment line item from the line item container.
     */
    removeShippingPriceAdjustment(priceAdjustment: PriceAdjustment): void;
    /**
     * Sets the email address of the customer associated with this container.
     */
    setCustomerEmail(aValue: string): void;
    /**
     * Sets the name of the customer associated with this container.
     */
    setCustomerName(aValue: string): void;
    /**
     * Calculates the tax for all shipping and order-level merchandise price adjustments in this LineItemCtnr.
     * 
     * The tax on each adjustment is calculated from the taxes of the line items the adjustment applies across.
     * 
     * This method must be invoked at the end of tax calculation of a basket or an order.
     */
    updateOrderLevelPriceAdjustmentTax(): void;
    /**
     * Recalculates the totals of the line item container. It is necessary to call this method after any type of
     * modification to the basket.
     */
    updateTotals(): void;
    /**
     * Verifies whether the manual price adjustments made for the line item container exceed the corresponding limits
     * for the current user and the current site.
     * 
     * The results of this method are based on the current values held in the dw.order.LineItemCtnr, such as the
     * base price of manual price adjustments. It is important the method is only called after the calculation process
     * has completed.
     * 
     * Status.OK is returned if NONE of the manual price adjustments exceed the correspondent limits.
     * 
     * Status.ERROR is returned if ANY of the manual price adjustments exceed the correspondent limits. If this case
     * dw.system.Status.getItems returns all price adjustment limit violations. The code of each
     * dw.system.StatusItem represents the violated price adjustment type (see
     * dw.order.PriceAdjustmentLimitTypes). dw.system.StatusItem.getDetails returns a
     * dw.util.Map with the max amount and (where relevant) the item to which the violation applies.
     * 
     * Usage:
     * @example
     * var order : Order; // known
     * 
     * var status : Status = order.verifyPriceAdjustmentLimits();
     * if (status.status == Status.ERROR)
     * {
     * for each (var statusItem : StatusItem in status.items)
     * {
     * var statusDetail : MapEntry = statusItem.details.entrySet().iterator().next();
     * var maxAllowedLimit : Number = (Number) (statusDetail.key);
     * 
     * if (statusItem.code == PriceAdjustmentLimitTypes.TYPE_ORDER)
     * {
     * // fix order price adjustment considering maxAllowedLimit
     * }
     * else if (statusItem.code == PriceAdjustmentLimitTypes.TYPE_ITEM)
     * {
     * var pli : ProductLineItem = (ProductLineItem) (statusDetail.value);
     * // fix pli price adjustment considering maxAllowedLimit
     * }
     * else if (statusItem.code == PriceAdjustmentLimitTypes.TYPE_SHIPPING)
     * {
     * if (statusDetail.value == null)
     * {
     * // fix order level shipping price adjustment considering maxAllowedLimit
     * }
     * else
     * {
     * var sli : ShippingLineItem = (ShippingLineItem) (statusDetail.value);
     * // fix sli price adjustment considering maxAllowedLimit
     * }
     * }
     * }
     * }
     */
    verifyPriceAdjustmentLimits(): Status;
}

export = LineItemCtnr;
