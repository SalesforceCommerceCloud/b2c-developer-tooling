import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import MarkupText = require('../content/MarkupText');
import MediaFile = require('../content/MediaFile');
import Customer = require('../customer/Customer');
import Status = require('../system/Status');

declare global {
    module ICustomAttributes {
        interface PaymentCard extends CustomAttributes {
        }
    }
}

/**
 * Represents payment cards and provides methods to access the payment card
 * attributes and status.
 * 
 * Note: this class handles sensitive financial and card holder data.
 * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
 */
declare class PaymentCard extends ExtensibleObject<ICustomAttributes.PaymentCard> {
    /**
     * Returns 'true' if payment card is active (enabled), otherwise 'false' is returned.
     */
    readonly active: boolean;
    /**
     * Returns the unique card type of the payment card.
     */
    readonly cardType: string;
    /**
     * Returns the description of the payment card.
     */
    readonly description: MarkupText;
    /**
     * Returns the reference to the payment card image.
     */
    readonly image: MediaFile;
    /**
     * Returns the name of the payment card.
     */
    readonly name: string;
    private constructor();
    /**
     * Returns the unique card type of the payment card.
     */
    getCardType(): string;
    /**
     * Returns the description of the payment card.
     */
    getDescription(): MarkupText;
    /**
     * Returns the reference to the payment card image.
     */
    getImage(): MediaFile;
    /**
     * Returns the name of the payment card.
     */
    getName(): string;
    /**
     * Returns 'true' if payment card is active (enabled), otherwise 'false' is returned.
     */
    isActive(): boolean;
    /**
     * Returns 'true' if this payment card is applicable for the specified
     * customer, country and payment amount and the session currency.
     * 
     * The payment card is applicable if
     * 
     * - the card is restricted by customer group, and at least one of the
     * groups of the specified customer is assigned to the card
     * - the card is restricted by billing country, and the specified country
     * code is assigned to the card
     * - the method is restricted by payment amount for the session currency,
     * and the specified payment amount is within the limits of the min/max
     * payment amount defined for the method and the session currency
     * - the method is restricted by session currency, and the session
     * currency code is assigned to the method
     * 
     * All parameters are optional, and if not specified, the respective
     * restriction won't be validated. For example, if a card is restricted by
     * billing country, but no country code is specified, this card will be
     * returned, unless it is filtered out by customer group or payment amount.
     */
    isApplicable(customer: Customer | null, countryCode: string | null, paymentAmount: number): boolean;
    /**
     * Verify the card against the provided values. This method is equivalent to
     * verify but omits verification of the
     * card security code. If the verification fails the resulting
     * dw.system.Status will hold up to 2 error items each with a code:
     * 
     * - dw.order.PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE - the expiresMonth and expiresYear do not describe a
     * month in the future, or describe an invalid month outside the range 1-12.
     * - dw.order.PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER - the cardNumber does not verify against one or more configured
     * checks, which may include the Luhn checksum, accepted number lengths, or accepted number prefixes.
     */
    verify(expiresMonth: number, expiresYear: number, cardNumber: string): Status;
    /**
     * Verify the card against the provided values. If the verification fails the resulting
     * dw.system.Status will hold up to 3 error items with these codes:
     * 
     * - dw.order.PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE  - the expiresMonth and expiresYear do not describe a
     * month in the future, or describe an invalid month outside the range 1-12.
     * - dw.order.PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER - the cardNumber does not verify against one or more configured
     * checks, which may include the Luhn checksum, accepted number lengths, or accepted number prefixes.
     * - dw.order.PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE - the card security code does not verify against the configured
     * accepted length.
     */
    verify(expiresMonth: number, expiresYear: number, cardNumber: string, csc: string): Status;
}

export = PaymentCard;
