import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import MarkupText = require('../content/MarkupText');
import MediaFile = require('../content/MediaFile');
import Customer = require('../customer/Customer');
import PaymentProcessor = require('./PaymentProcessor');
import List = require('../util/List');
import PaymentCard = require('./PaymentCard');

declare global {
    module ICustomAttributes {
        interface PaymentMethod extends CustomAttributes {
        }
    }
}

/**
 * The PaymentMethod class represents a logical type of payment a customer can
 * make in the storefront. This class provides methods to access the payment
 * method attributes, status, and (for card-based payment methods) the related
 * payment cards.
 * 
 * A typical storefront presents the customer a list of payment methods that a
 * customer can choose from after he has entered his billing address during the
 * checkout.
 * dw.order.PaymentMgr.getApplicablePaymentMethods
 * is used to determine the PaymentMethods that are relevant for the customer
 * based on the amount of his order, his customer groups, and his shipping
 * address.
 */
declare class PaymentMethod extends ExtensibleObject<ICustomAttributes.PaymentMethod> {
    /**
     * Returns the unique ID of the payment method.
     */
    readonly ID: string;
    /**
     * Returns 'true' if payment method is active (enabled), otherwise 'false' is returned.
     */
    readonly active: boolean;
    /**
     * Returns enabled payment cards that are assigned to this payment method, regardless
     * of current customer, country or payment amount restrictions.
     * The payment cards are sorted as defined in the Business Manager.
     */
    readonly activePaymentCards: List<PaymentCard>;
    /**
     * Returns the description of the payment method.
     */
    readonly description: MarkupText;
    /**
     * Returns the reference to the payment method image.
     */
    readonly image: MediaFile;
    /**
     * Returns the name of the payment method.
     */
    readonly name: string;
    /**
     * Returns the payment processor associated to this payment method.
     */
    readonly paymentProcessor: PaymentProcessor;
    private constructor();
    /**
     * Returns enabled payment cards that are assigned to this payment method, regardless
     * of current customer, country or payment amount restrictions.
     * The payment cards are sorted as defined in the Business Manager.
     */
    getActivePaymentCards(): List<PaymentCard>;
    /**
     * Returns the sorted list of all enabled payment cards of this payment
     * method applicable for the specified customer, country, payment amount and the session currency
     * The payment cards are sorted as defined in the Business Manager.
     * 
     * A payment card is applicable if
     * 
     * -  the card is restricted by customer group, and at least one of
     * the groups of the specified customer is assigned to the card
     * -  the card is restricted by billing country, and the specified
     * country code is assigned to the card
     * - the card is restricted by payment amount for the session currency,
     * and the specified payment amount is within the limits of the min/max
     * payment amount defined for the method and the session currency
     * -  the card is restricted by currency code, and the specified
     * currency code matches session currency.
     * 
     * All parameters are optional, and if not specified, the respective
     * restriction won't be validated. For example, if a card is restricted
     * by billing country, but no country code is specified, this card will
     * be returned, unless it is filtered out by customer group or payment
     * amount.
     */
    getApplicablePaymentCards(customer: Customer | null, countryCode: string | null, paymentAmount: number): List<PaymentCard>;
    /**
     * Returns the description of the payment method.
     */
    getDescription(): MarkupText;
    /**
     * Returns the unique ID of the payment method.
     */
    getID(): string;
    /**
     * Returns the reference to the payment method image.
     */
    getImage(): MediaFile;
    /**
     * Returns the name of the payment method.
     */
    getName(): string;
    /**
     * Returns the payment processor associated to this payment method.
     */
    getPaymentProcessor(): PaymentProcessor;
    /**
     * Returns 'true' if payment method is active (enabled), otherwise 'false' is returned.
     */
    isActive(): boolean;
    /**
     * Returns 'true' if this payment method is applicable for the specified
     * customer, country and payment amount and the session currency.
     * 
     * The payment method is applicable if
     * 
     * - the method is restricted by customer group, and at least one of the
     * groups of the specified customer is assigned to the method
     * - the method is restricted by billing country, and the specified
     * country code is assigned to the method
     * - the method is restricted by payment amount for the session currency,
     * and the specified payment amount is within the limits of the min/max
     * payment amount defined for the method and the session currency
     * - the method is restricted by currency code, and the specified
     * currency code matches session currency.
     * 
     * All parameters are optional, and if not specified, the respective
     * restriction won't be validated. For example, if a method is restricted by
     * billing country, but no country code is specified, this method will be
     * returned, unless it is filtered out by customer group or payment amount.
     */
    isApplicable(customer: Customer | null, countryCode: string | null, paymentAmount: number): boolean;
}

export = PaymentMethod;
