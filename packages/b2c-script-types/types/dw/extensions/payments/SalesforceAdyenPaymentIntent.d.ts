import OrderPaymentInstrument = require('../../order/OrderPaymentInstrument');
import Basket = require('../../order/Basket');
import Order = require('../../order/Order');

/**
 * 
 * 
 * Salesforce Payments representation of an Adyen payment intent object. See Salesforce Payments documentation for how
 * to gain access and configure it for use on your sites.
 */
declare class SalesforceAdyenPaymentIntent {
    /**
     * Returns the identifier of this payment intent.
     */
    readonly ID: string;
    /**
     * Returns the payment action for this payment intent.
     */
    readonly action: Object;
    /**
     * Returns the Adyen result code for this payment intent.
     */
    readonly resultCode: string;
    private constructor();
    /**
     * Returns the payment action for this payment intent.
     */
    getAction(): Object;
    /**
     * Returns the identifier of this payment intent.
     */
    getID(): string;
    /**
     * Returns the payment instrument for this payment intent in the given basket, or `null` if the given
     * basket has none.
     */
    getPaymentInstrument(basket: Basket): OrderPaymentInstrument | null;
    /**
     * Returns the payment instrument for this payment intent in the given order, or `null` if the given
     * order has none.
     */
    getPaymentInstrument(order: Order): OrderPaymentInstrument | null;
    /**
     * Returns the Adyen result code for this payment intent.
     */
    getResultCode(): string;
    /**
     * Returns `true` if this payment intent has an action, or `false` if not.
     */
    hasAction(): boolean;
}

export = SalesforceAdyenPaymentIntent;
