import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface PaymentProcessor extends CustomAttributes {
        }
    }
}

/**
 * A PaymentProcessor represents an entity that processes payments of one or more types. In the B2C Commerce system, a
 * payment processor is just a container for configuration values, which describe, for example, the parameters (URL,
 * merchant ID, password, etc) required for connecting to a payment gateway.
 * 
 * The system has several built in PaymentProcessors. These are:
 * 
 * - BASIC_CREDIT
 * - BASIC_GIFT_CERTIFICATE
 * - CYBERSOURCE_CREDIT
 * - CYBERSOURCE_BML
 * - PAYPAL_CREDIT
 * - PAYPAL_EXPRESS
 * - VERISIGN_CREDIT
 * 
 * The first two of these are merely placeholders with no associated preference values. The remaining system payment
 * processors define preference values which are maintained in the Business Manager and are used in conjunction with
 * built-in B2C Commerce payment integrations. Preferences of system PaymentProcessors are not intended to be read
 * programmatically.
 * 
 * Merchants may also define custom payment processors. This is done by defining a payment processor with an arbitrary
 * ID in the Business Manager, and then configuring an attribute group with the same ID on the
 * dw.system.SitePreferences system object. Attributes added to the group will be considered preferences of the
 * payment processor and will be readable through getPreferenceValue. Merchants can design their
 * checkout process to read these preferences at run time for connecting to their payment gateways.
 * 
 * Every dw.order.PaymentMethod in the system is associated with at most one PaymentProcessor. This basically
 * represents the physical payment gateway which processes the (logical) payment method. Each payment processor may be
 * associated with an arbitrary number of payment methods. Also, each payment transaction has one PaymentProcessor which
 * is set by custom code during the checkout process.
 */
declare class PaymentProcessor extends ExtensibleObject<ICustomAttributes.PaymentProcessor> {
    /**
     * Returns the 'ID' of this processor.
     */
    readonly ID: string;
    private constructor();
    /**
     * Returns the 'ID' of this processor.
     */
    getID(): string;
    /**
     * Returns the value of the specified preference for this payment processor.
     * If the preference name is invalid (or null) or no preference value is
     * defined for this payment processor, null is returned.
     */
    getPreferenceValue(name: string): any | null;
}

export = PaymentProcessor;
