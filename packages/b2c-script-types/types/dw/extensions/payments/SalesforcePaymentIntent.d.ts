import Money = require('../../value/Money');
import SalesforcePaymentMethod = require('./SalesforcePaymentMethod');
import OrderPaymentInstrument = require('../../order/OrderPaymentInstrument');
import Basket = require('../../order/Basket');
import Order = require('../../order/Order');

/**
 * 
 * 
 * Salesforce Payments representation of a Stripe payment intent object. See Salesforce Payments documentation for how
 * to gain access and configure it for use on your sites.
 * 
 * A payment intent is automatically created when a shopper is ready to pay for items in their basket. It becomes
 * confirmed when the shopper provides information to the payment provider that is acceptable to authorize payment for a
 * given amount. Once that information has been provided it becomes available as the payment method associated with the
 * payment intent.
 */
declare class SalesforcePaymentIntent {
    /**
     * Represents the payment method setup future usage is off session.
     */
    static readonly SETUP_FUTURE_USAGE_OFF_SESSION = "off_session";
    /**
     * Represents the payment method setup future usage is on session.
     */
    static readonly SETUP_FUTURE_USAGE_ON_SESSION = "on_session";
    /**
     * Returns the identifier of this payment intent.
     */
    readonly ID: string;
    /**
     * Returns the amount of this payment intent.
     */
    readonly amount: Money;
    /**
     * Returns `true` if this payment intent has a status which indicates it can be canceled,
     * or `false` if its status does not indicate it can be canceled.
     */
    readonly cancelable: boolean;
    /**
     * Returns the client secret of this payment intent.
     */
    readonly clientSecret: string;
    /**
     * Returns `true` if this payment intent has been confirmed, or `false` if not.
     */
    readonly confirmed: boolean;
    /**
     * Returns the payment method for this payment intent, or `null` if none has been established.
     */
    readonly paymentMethod: SalesforcePaymentMethod | null;
    /**
     * Returns `true` if this payment intent has a status and other state which indicate it can be refunded,
     * or `false` if it cannot be refunded.
     */
    readonly refundable: boolean;
    /**
     * Returns SETUP_FUTURE_USAGE_OFF_SESSION or SETUP_FUTURE_USAGE_ON_SESSION to indicate how the payment
     * intent can be used in the future or returns `null` if future usage is not set up.
     * @see SalesforcePaymentRequest.setSetupFutureUsage
     * @see SalesforcePaymentIntent.SETUP_FUTURE_USAGE_OFF_SESSION
     * @see SalesforcePaymentIntent.SETUP_FUTURE_USAGE_ON_SESSION
     */
    readonly setupFutureUsage: string | null;
    private constructor();
    /**
     * Returns the amount of this payment intent.
     */
    getAmount(): Money;
    /**
     * Returns the client secret of this payment intent.
     */
    getClientSecret(): string;
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
     * Returns the payment method for this payment intent, or `null` if none has been established.
     */
    getPaymentMethod(): SalesforcePaymentMethod | null;
    /**
     * Returns SETUP_FUTURE_USAGE_OFF_SESSION or SETUP_FUTURE_USAGE_ON_SESSION to indicate how the payment
     * intent can be used in the future or returns `null` if future usage is not set up.
     * @see SalesforcePaymentRequest.setSetupFutureUsage
     * @see SalesforcePaymentIntent.SETUP_FUTURE_USAGE_OFF_SESSION
     * @see SalesforcePaymentIntent.SETUP_FUTURE_USAGE_ON_SESSION
     */
    getSetupFutureUsage(): string | null;
    /**
     * Returns `true` if this payment intent has a status which indicates it can be canceled,
     * or `false` if its status does not indicate it can be canceled.
     */
    isCancelable(): boolean;
    /**
     * Returns `true` if this payment intent has been confirmed, or `false` if not.
     */
    isConfirmed(): boolean;
    /**
     * Returns `true` if this payment intent has a status and other state which indicate it can be refunded,
     * or `false` if it cannot be refunded.
     */
    isRefundable(): boolean;
}

export = SalesforcePaymentIntent;
