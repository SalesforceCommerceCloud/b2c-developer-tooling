import CustomerPaymentInstrument = require('./CustomerPaymentInstrument');
import Collection = require('../util/Collection');

/**
 * Represents a set of payment instruments associated with a registered customer.
 * 
 * Note: this class allows access to sensitive personal and private
 * information. Pay attention to appropriate legal and regulatory requirements
 * when developing.
 */
declare class Wallet {
    /**
     * Returns the default payment instrument associated with the related customer. If not available, returns the first
     * payment instrument or null if no payment instruments are associated with the customer.
     */
    readonly defaultPaymentInstrument: CustomerPaymentInstrument | null;
    /**
     * Returns a collection of all payment instruments associated with the
     * related customer.
     */
    readonly paymentInstruments: Collection<any>;
    private constructor();
    /**
     * Creates a new, empty payment instrument object associated with the
     * related customer for the given payment method.
     * @throws NullArgumentException If passed 'paymentMethodId' is null.
     */
    createPaymentInstrument(paymentMethodId: string): CustomerPaymentInstrument;
    /**
     * Returns the default payment instrument associated with the related customer. If not available, returns the first
     * payment instrument or null if no payment instruments are associated with the customer.
     */
    getDefaultPaymentInstrument(): CustomerPaymentInstrument | null;
    /**
     * Returns a collection of all payment instruments associated with the
     * related customer.
     */
    getPaymentInstruments(): Collection<any>;
    /**
     * Returns a collection of all payment instruments associated with the
     * related customer filtered by the given payment method id. If
     * `null` is passed as payment method id all payment instruments
     * of the customer will be retrieved. If for the given payment method id no
     * payment instrument is associated with the customer an empty collection
     * will be returned.
     */
    getPaymentInstruments(paymentMethodID: string): Collection<any>;
    /**
     * Removes a payment instrument associated with the customer.
     * @throws NullArgumentException If passed 'instrument' is null.
     * @throws IllegalArgumentException If passed 'instrument' belongs to an other customer
     */
    removePaymentInstrument(instrument: CustomerPaymentInstrument): void;
}

export = Wallet;
