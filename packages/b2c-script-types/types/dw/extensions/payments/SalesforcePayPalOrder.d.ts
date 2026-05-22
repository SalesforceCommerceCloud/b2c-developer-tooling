import Money = require('../../value/Money');
import SalesforcePayPalOrderPayer = require('./SalesforcePayPalOrderPayer');
import SalesforcePayPalOrderAddress = require('./SalesforcePayPalOrderAddress');
import OrderPaymentInstrument = require('../../order/OrderPaymentInstrument');
import Basket = require('../../order/Basket');
import Order = require('../../order/Order');
import SalesforcePaymentDetails = require('./SalesforcePaymentDetails');

/**
 * 
 * 
 * Salesforce Payments representation of a PayPal order object. See Salesforce Payments documentation for how
 * to gain access and configure it for use on your sites.
 * 
 * A PayPal order is automatically created when a shopper is ready to pay for items in their basket. It becomes
 * completed when the shopper provides information to the payment provider that is acceptable to authorize payment for a
 * given amount.
 */
declare class SalesforcePayPalOrder {
    /**
     * Represents the `"AUTHORIZE"` intent, meaning manual capture.
     */
    static readonly INTENT_AUTHORIZE = "AUTHORIZE";
    /**
     * Represents the `"CAPTURE"` intent, meaning automatic capture.
     */
    static readonly INTENT_CAPTURE = "CAPTURE";
    /**
     * Represents the PayPal funding source.
     */
    static readonly TYPE_PAYPAL = "paypal";
    /**
     * Represents the Venmo funding source.
     */
    static readonly TYPE_VENMO = "venmo";
    /**
     * Returns the identifier of this PayPal order.
     */
    readonly ID: string;
    /**
     * Returns the amount of this PayPal order.
     */
    readonly amount: Money;
    /**
     * Returns the ID of the authorization against this order, or `null` if not available.
     */
    readonly authorizationID: string | null;
    /**
     * Returns the ID of the capture against this order, or `null` if not available.
     */
    readonly captureID: string | null;
    /**
     * Returns `true` if this PayPal order has been completed, or `false` if not.
     */
    readonly completed: boolean;
    /**
     * Returns the payer information for this PayPal order, or `null` if not known.
     */
    readonly payer: SalesforcePayPalOrderPayer | null;
    /**
     * Returns the shipping address for this PayPal order, or `null` if not known.
     */
    readonly shipping: SalesforcePayPalOrderAddress | null;
    private constructor();
    /**
     * Returns the amount of this PayPal order.
     */
    getAmount(): Money;
    /**
     * Returns the ID of the authorization against this order, or `null` if not available.
     */
    getAuthorizationID(): string | null;
    /**
     * Returns the ID of the capture against this order, or `null` if not available.
     */
    getCaptureID(): string | null;
    /**
     * Returns the identifier of this PayPal order.
     */
    getID(): string;
    /**
     * Returns the payer information for this PayPal order, or `null` if not known.
     */
    getPayer(): SalesforcePayPalOrderPayer | null;
    /**
     * Returns the details to the Salesforce Payments payment for this PayPal order, using the given payment instrument.
     */
    getPaymentDetails(paymentInstrument: OrderPaymentInstrument): SalesforcePaymentDetails;
    /**
     * Returns the payment instrument for this PayPal order in the given basket, or `null` if the given
     * basket has none.
     */
    getPaymentInstrument(basket: Basket): OrderPaymentInstrument | null;
    /**
     * Returns the payment instrument for this PayPal order in the given order, or `null` if the given
     * order has none.
     */
    getPaymentInstrument(order: Order): OrderPaymentInstrument | null;
    /**
     * Returns the shipping address for this PayPal order, or `null` if not known.
     */
    getShipping(): SalesforcePayPalOrderAddress | null;
    /**
     * Returns `true` if this PayPal order has been completed, or `false` if not.
     */
    isCompleted(): boolean;
}

export = SalesforcePayPalOrder;
