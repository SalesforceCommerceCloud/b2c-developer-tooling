import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import OrderPaymentInstrument = require('./OrderPaymentInstrument');
import PaymentProcessor = require('./PaymentProcessor');
import Money = require('../value/Money');
import EnumValue = require('../value/EnumValue');

declare global {
    module ICustomAttributes {
        interface PaymentTransaction extends CustomAttributes {
        }
    }
}

/**
 * The PaymentTransaction class represents a payment transaction.
 */
declare class PaymentTransaction extends ExtensibleObject<ICustomAttributes.PaymentTransaction> {
    /**
     * Constant representing the authorization type of payment transaction.
     */
    static readonly TYPE_AUTH = "AUTH";
    /**
     * Constant representing the authorization reversal type of payment transaction.
     */
    static readonly TYPE_AUTH_REVERSAL = "AUTH_REVERSAL";
    /**
     * Constant representing the capture type of payment transaction.
     */
    static readonly TYPE_CAPTURE = "CAPTURE";
    /**
     * Constant representing the credit type of payment transaction.
     */
    static readonly TYPE_CREDIT = "CREDIT";
    /**
     * Returns the payment service-specific account id.
     */
    accountID: string;
    /**
     * Returns the payment service-specific account type.
     */
    accountType: string;
    /**
     * Returns the amount of the transaction.
     */
    amount: Money;
    /**
     * Returns the payment instrument related to this payment transaction.
     */
    readonly paymentInstrument: OrderPaymentInstrument;
    /**
     * Returns the payment processor related to this payment transaction.
     */
    paymentProcessor: PaymentProcessor;
    /**
     * Returns the payment service-specific transaction id.
     */
    transactionID: string;
    /**
     * Returns the value of the transaction type where the
     * value is one of TYPE_AUTH, TYPE_AUTH_REVERSAL, TYPE_CAPTURE
     * or TYPE_CREDIT.
     */
    type: EnumValue;
    private constructor();
    /**
     * Returns the payment service-specific account id.
     */
    getAccountID(): string;
    /**
     * Returns the payment service-specific account type.
     */
    getAccountType(): string;
    /**
     * Returns the amount of the transaction.
     */
    getAmount(): Money;
    /**
     * Returns the payment instrument related to this payment transaction.
     */
    getPaymentInstrument(): OrderPaymentInstrument;
    /**
     * Returns the payment processor related to this payment transaction.
     */
    getPaymentProcessor(): PaymentProcessor;
    /**
     * Returns the payment service-specific transaction id.
     */
    getTransactionID(): string;
    /**
     * Returns the value of the transaction type where the
     * value is one of TYPE_AUTH, TYPE_AUTH_REVERSAL, TYPE_CAPTURE
     * or TYPE_CREDIT.
     */
    getType(): EnumValue;
    /**
     * Sets the payment service-specific account id.
     */
    setAccountID(accountID: string): void;
    /**
     * Sets the payment service-specific account type.
     */
    setAccountType(accountType: string): void;
    /**
     * Sets the amount of the transaction.
     */
    setAmount(amount: Money): void;
    /**
     * Sets the payment processor related to this payment transaction.
     */
    setPaymentProcessor(paymentProcessor: PaymentProcessor): void;
    /**
     * Sets the payment service-specific transaction id.
     */
    setTransactionID(transactionID: string): void;
    /**
     * Sets the value of the transaction type where permissible
     * values are TYPE_AUTH, TYPE_AUTH_REVERSAL, TYPE_CAPTURE or TYPE_CREDIT.
     */
    setType(type: string): void;
}

export = PaymentTransaction;
