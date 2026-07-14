import PaymentMethod = require('./PaymentMethod');
import List = require('../util/List');
import Customer = require('../customer/Customer');
import PaymentCard = require('./PaymentCard');

/**
 * dw.order.PaymentMgr is used to access payment methods and payment
 * cards of the current site.
 * 
 * To access payment methods and payment cards explicitly, use methods
 * getPaymentMethod and getPaymentCard.
 * 
 * To access active payment methods use method getActivePaymentMethods.
 * 
 * To access applicable payment methods for a customer, country and/or payment
 * amount use method getApplicablePaymentMethods.
 */
declare class PaymentMgr {
    /**
     * Returns the sorted list of all enabled payment methods of the current
     * site, regardless of any customer group, country, payment amount or currency
     * restrictions. The payment methods are sorted as defined in the Business
     * Manager.
     */
    static readonly activePaymentMethods: List<PaymentMethod>;
    private constructor();
    /**
     * Returns the sorted list of all enabled payment methods of the current
     * site, regardless of any customer group, country, payment amount or currency
     * restrictions. The payment methods are sorted as defined in the Business
     * Manager.
     */
    static getActivePaymentMethods(): List<PaymentMethod>;
    /**
     * Returns the sorted list of all enabled payment methods of the current
     * site applicable for the session currency, specified customer, country and payment amount.
     * The payment methods are sorted as defined in the Business Manager.
     * 
     * A payment method is applicable if
     * 
     * -  the method is restricted by customer group, and at least one of
     * the groups of the specified customer is assigned to the method
     * -  the method is restricted by billing country, and the specified
     * country code is assigned to the method
     * - the method is restricted by payment amount for the session currency,
     * and the specified payment amount is within the limits of the min/max
     * payment amount defined for the method and the session currency
     * -  the method is restricted by currency code, and the specified
     * currency code matches session currency.
     * 
     * All parameters are optional, and if not specified, the respective
     * restriction won't be validated. For example, if a method is restricted
     * by billing country, but no country code is specified, this method will
     * be returned, unless it is filtered out by customer group or payment
     * amount.
     */
    static getApplicablePaymentMethods(customer: Customer | null, countryCode: string | null, paymentAmount: number): List<PaymentMethod>;
    /**
     * Returns the payment card for the specified cardType or null if no such
     * card exists in the current site.
     */
    static getPaymentCard(cardType: string): PaymentCard | null;
    /**
     * Returns the payment method for the specified ID or null if no such method
     * exists in the current site.
     */
    static getPaymentMethod(id: string): PaymentMethod | null;
}

export = PaymentMgr;
