import PaymentInstrument = require('../order/PaymentInstrument');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface CustomerPaymentInstrument extends ICustomAttributes.PaymentInstrument {
        }
    }
}

/**
 * Represents any payment instrument stored in the customers profile, such as
 * credit card or bank transfer. The object defines standard methods for credit
 * card payment, and can be extended by attributes appropriate for other
 * payment methods.
 */
declare class CustomerPaymentInstrument extends PaymentInstrument<ICustomAttributes.CustomerPaymentInstrument> {
    /**
     * Returns the driver's license number of the bank account number
     * if the calling context meets the following criteria:
     * 
     * -
     * If the method call happens in the context of a storefront request and
     * the current customer is registered and authenticated, and the payment
     * instrument is associated to the profile of the current customer, and
     * the current protocol is HTTPS
     * 
     * Otherwise, the method returns the masked driver's license number of the bank account.
     * 
     * Note: this method handles sensitive financial and card holder data.
     * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
     */
    readonly bankAccountDriversLicense: string;
    /**
     * Returns the bank account number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the method call happens in the context of a storefront request,
     * the current customer is registered and authenticated, the payment
     * instrument is associated to the profile of the current customer, and
     * the current protocol is HTTPS
     * 
     * Otherwise, the method returns the masked bank account number.
     * 
     * Note: this method handles sensitive financial and card holder data.
     * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
     */
    readonly bankAccountNumber: string;
    /**
     * Returns the decrypted credit card number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the method call happens in the context of a storefront request,
     * the current customer is registered and authenticated, the payment
     * instrument is associated to the profile of the current customer, and
     * the current protocol is HTTPS.
     * 
     * Otherwise, the method returns the masked credit card number.
     * 
     * Note: this method handles sensitive financial and card holder data.
     * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
     */
    readonly creditCardNumber: string;
    private constructor();
    /**
     * Returns the driver's license number of the bank account number
     * if the calling context meets the following criteria:
     * 
     * -
     * If the method call happens in the context of a storefront request and
     * the current customer is registered and authenticated, and the payment
     * instrument is associated to the profile of the current customer, and
     * the current protocol is HTTPS
     * 
     * Otherwise, the method returns the masked driver's license number of the bank account.
     * 
     * Note: this method handles sensitive financial and card holder data.
     * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
     */
    getBankAccountDriversLicense(): string;
    /**
     * Returns the bank account number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the method call happens in the context of a storefront request,
     * the current customer is registered and authenticated, the payment
     * instrument is associated to the profile of the current customer, and
     * the current protocol is HTTPS
     * 
     * Otherwise, the method returns the masked bank account number.
     * 
     * Note: this method handles sensitive financial and card holder data.
     * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
     */
    getBankAccountNumber(): string;
    /**
     * Returns the decrypted credit card number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the method call happens in the context of a storefront request,
     * the current customer is registered and authenticated, the payment
     * instrument is associated to the profile of the current customer, and
     * the current protocol is HTTPS.
     * 
     * Otherwise, the method returns the masked credit card number.
     * 
     * Note: this method handles sensitive financial and card holder data.
     * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
     */
    getCreditCardNumber(): string;
}

export = CustomerPaymentInstrument;
