import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Money = require('../value/Money');

declare global {
    module ICustomAttributes {
        interface GiftCertificate extends CustomAttributes {
        }
    }
}

/**
 * Represents a Gift Certificate that can be used to purchase
 * products.
 */
declare class GiftCertificate extends ExtensibleObject<ICustomAttributes.GiftCertificate> {
    /**
     * Represents a status of 'issued', which indicates that the Gift Certificate
     * has been created and that it can be used to purchase products.
     */
    static readonly STATUS_ISSUED = 1;
    /**
     * Represents a status of 'partially redeemed', which indicates that the Gift Certificate
     * has been used to purchase products, but that there is still a balance on
     * the gift certificate.
     */
    static readonly STATUS_PARTIALLY_REDEEMED = 2;
    /**
     * Represents a status of 'pending', which indicates that the Gift Certificate
     * has been created but that it cannot be used yet.
     */
    static readonly STATUS_PENDING = 0;
    /**
     * Represents a status of 'redeemed', which indicates that the Gift Certificate
     * has been used and no longer contains a balance.
     */
    static readonly STATUS_REDEEMED = 3;
    /**
     * Returns the code of the gift certificate. This redemption code is send to
     * gift certificate recipient.
     * @deprecated Use getGiftCertificateCode
     */
    readonly ID: string;
    /**
     * Returns the original amount on the gift certificate.
     */
    readonly amount: Money;
    /**
     * Returns the balance on the gift certificate.
     */
    readonly balance: Money;
    /**
     * Returns the description string.
     */
    description: string;
    /**
     * Returns true if the Gift Certificate is enabled, false otherwise.
     */
    enabled: boolean;
    /**
     * Returns the code of the gift certificate. This redemption code is send to
     * gift certificate recipient.
     */
    readonly giftCertificateCode: string;
    /**
     * Returns the masked gift certificate code with
     * all but the last 4 characters replaced with a '*' character.
     */
    readonly maskedGiftCertificateCode: string;
    /**
     * Returns the merchant ID of the gift certificate.
     */
    readonly merchantID: string;
    /**
     * Returns the message to include in the email of the person receiving
     * the gift certificate.
     */
    message: string;
    /**
     * Returns the order number
     */
    orderNo: string;
    /**
     * Returns the email address of the person receiving
     * the gift certificate.
     */
    recipientEmail: string;
    /**
     * Returns the name of the person receiving
     * the gift certificate.
     */
    recipientName: string;
    /**
     * Returns the name of the person or organization that
     * sent the gift certificate or null if undefined.
     */
    senderName: string | null;
    /**
     * Returns the status where the possible values are
     * STATUS_PENDING, STATUS_ISSUED, STATUS_PARTIALLY_REDEEMED
     * or STATUS_REDEEMED.
     */
    status: number;
    private constructor();
    /**
     * Returns the original amount on the gift certificate.
     */
    getAmount(): Money;
    /**
     * Returns the balance on the gift certificate.
     */
    getBalance(): Money;
    /**
     * Returns the description string.
     */
    getDescription(): string;
    /**
     * Returns the code of the gift certificate. This redemption code is send to
     * gift certificate recipient.
     */
    getGiftCertificateCode(): string;
    /**
     * Returns the code of the gift certificate. This redemption code is send to
     * gift certificate recipient.
     * @deprecated Use getGiftCertificateCode
     */
    getID(): string;
    /**
     * Returns the masked gift certificate code with
     * all but the last 4 characters replaced with a '*' character.
     */
    getMaskedGiftCertificateCode(): string;
    /**
     * Returns the masked gift certificate code with
     * all but the specified number of characters replaced with a '*' character.
     * @throws IllegalArgumentException if ignore is negative.
     */
    getMaskedGiftCertificateCode(ignore: number): string;
    /**
     * Returns the merchant ID of the gift certificate.
     */
    getMerchantID(): string;
    /**
     * Returns the message to include in the email of the person receiving
     * the gift certificate.
     */
    getMessage(): string;
    /**
     * Returns the order number
     */
    getOrderNo(): string;
    /**
     * Returns the email address of the person receiving
     * the gift certificate.
     */
    getRecipientEmail(): string;
    /**
     * Returns the name of the person receiving
     * the gift certificate.
     */
    getRecipientName(): string;
    /**
     * Returns the name of the person or organization that
     * sent the gift certificate or null if undefined.
     */
    getSenderName(): string | null;
    /**
     * Returns the status where the possible values are
     * STATUS_PENDING, STATUS_ISSUED, STATUS_PARTIALLY_REDEEMED
     * or STATUS_REDEEMED.
     */
    getStatus(): number;
    /**
     * Returns true if the Gift Certificate is enabled, false otherwise.
     */
    isEnabled(): boolean;
    /**
     * An optional description that you can use to categorize the
     * gift certificate.
     */
    setDescription(description: string): void;
    /**
     * Controls if the Gift Certificate is enabled.
     */
    setEnabled(enabled: boolean): void;
    /**
     * Sets the message to include in the email of the person receiving
     * the gift certificate.
     */
    setMessage(message: string): void;
    /**
     * Sets the order number
     */
    setOrderNo(orderNo: string): void;
    /**
     * Sets the email address of the person receiving
     * the gift certificate.
     */
    setRecipientEmail(recipientEmail: string): void;
    /**
     * Sets the name of the person receiving
     * the gift certificate.
     */
    setRecipientName(recipient: string): void;
    /**
     * Sets the name of the person or organization that
     * sent the gift certificate.
     */
    setSenderName(sender: string): void;
    /**
     * Sets the status of the gift certificate.
     * 
     * Possible values are: STATUS_ISSUED,
     * STATUS_PENDING, STATUS_PARTIALLY_REDEEMED
     * and STATUS_REDEEMED.
     */
    setStatus(status: number): void;
}

export = GiftCertificate;
