import EncryptedObject = require('../customer/EncryptedObject');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import CertificateRef = require('../crypto/CertificateRef');

declare global {
    module ICustomAttributes {
        interface PaymentInstrument extends ICustomAttributes.EncryptedObject {
        }
    }
}

/**
 * Base class for payment instrument either stored in the customers profile
 * or related to an order. A payment instrument can be credit card
 * or bank transfer. The object defines standard methods for credit card
 * payment, and can be extended by attributes appropriate for other
 * payment methods.
 * 
 * Note: this class handles sensitive financial and card holder data.
 * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
 */
declare abstract class PaymentInstrument<T extends ICustomAttributes.PaymentInstrument = ICustomAttributes.PaymentInstrument> extends EncryptedObject<T> {
    /**
     * The outdated encryption algorithm "RSA/ECB/PKCS1Padding". Please do not use anymore!
     * @deprecated Support for this algorithm will be removed in a future release. Please use
     * ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING instead.
     */
    static readonly ENCRYPTION_ALGORITHM_RSA: string;
    /**
     * The encryption algorithm "RSA/ECB/OAEPWithSHA-256AndMGF1Padding".
     */
    static readonly ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA_256ANDMGF1PADDING = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    /**
     * Represents a bank transfer type of payment.
     */
    static readonly METHOD_BANK_TRANSFER: string;
    /**
     * Represents a 'bill me later' type of payment.
     */
    static readonly METHOD_BML: string;
    /**
     * Represents a credit card type of payment.
     */
    static readonly METHOD_CREDIT_CARD: string;
    /**
     * Represents an Android Pay payment.
     */
    static readonly METHOD_DW_ANDROID_PAY: string;
    /**
     * Represents an Apple Pay payment.
     */
    static readonly METHOD_DW_APPLE_PAY: string;
    /**
     * Represents a gift certificate.
     */
    static readonly METHOD_GIFT_CERTIFICATE: string;
    /**
     * Returns the driver's license number associated with the bank account if the
     * calling context meets the following criteria:
     * 
     * -
     * If the instance is a CustomerPaymentInstrument, and
     * we are in the context of a storefront request, and the current customer
     * is registered and authenticated, and the payment instrument is associated
     * to the profile of the current customer, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a storefront request, and the current customer is identical
     * to the customer related to the basket, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a business manager request, and the current user has the
     * permission MANAGE_ORDERS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and the account information
     * has not been masked as a result of the data retention security policy
     * for the site
     * 
     * Otherwise, the method returns the masked driver's license number. If a basket is reopened with
     * OrderMgr.failOrder, it always masks sensitive information
     * because during order creation, basket payment information is permanently masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    bankAccountDriversLicense: string;
    /**
     * Returns the last 4 characters of the decrypted driver's license number of
     * the bank account associated with this PaymentInstrument.
     * 
     * If the number is empty or null
     * it will be returned without an exception.
     */
    readonly bankAccountDriversLicenseLastDigits: string | null;
    /**
     * Returns the driver's license state code associated with a bank account payment instrument.
     * Returns null for other payment methods.
     */
    bankAccountDriversLicenseStateCode: string;
    /**
     * Returns the full name of the holder of a bank account payment instrument.
     * Returns null for other payment methods.
     */
    bankAccountHolder: string;
    /**
     * Returns the bank account number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the instance is a CustomerPaymentInstrument, and
     * we are in the context of a storefront request, and the current customer
     * is registered and authenticated, and the payment instrument is associated
     * to the profile of the current customer, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a storefront request, and the current customer is identical
     * to the customer related to the basket, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a business manager request, and the current user has the
     * permission MANAGE_ORDERS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and the account information
     * has not been masked as a result of the data retention security policy
     * for the site
     * 
     * Otherwise, the method returns the masked bank account number. If a basket is reopened with
     * OrderMgr.failOrder, it always masks sensitive information
     * because during order creation, basket payment information is permanently masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    bankAccountNumber: string;
    /**
     * Returns the last 4 characters of the decrypted bank account number.
     * 
     * If the number is empty or null,
     * it will be returned without an exception.
     */
    readonly bankAccountNumberLastDigits: string | null;
    /**
     * Returns the bank routing number of a bank account payment instrument.
     * Returns null for other payment methods.
     * 
     * If account information has been masked due to the data retention security
     * policy for the site, the return value is fully masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    bankRoutingNumber: string;
    /**
     * Returns the month of the year in which the credit card
     * expires (1-12).
     */
    creditCardExpirationMonth: number;
    /**
     * Returns the year in which the credit card
     * expires, such as '2004'.
     */
    creditCardExpirationYear: number;
    /**
     * Returns true if this payment instrument represents an expired credit
     * card. This check is only logical if the credit card expiration month and
     * year are set. If either of these attributes are not set, then this method
     * always returns false.
     */
    readonly creditCardExpired: boolean;
    /**
     * Returns the name of the credit card owner.
     */
    creditCardHolder: string;
    /**
     * Returns the credit card issue number.  This attribute is only used by
     * specific credit/debit card processors such as Solo and Switch in the UK.
     */
    creditCardIssueNumber: string;
    /**
     * Returns the decrypted credit card number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the instance is a CustomerPaymentInstrument, and
     * we are in the context of a storefront request, and the current customer
     * is registered and authenticated, and the payment instrument is associated
     * to the profile of the current customer, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrument in the context of a storefront request, and
     * the current authenticated customer is referenced by the basket or order, and
     * the current protocol is HTTPS.
     * 
     * -
     * If the customer is anonymous, and the customer is referenced by the order, and the protocol is secure and
     * the order status is CREATED.
     * 
     * -
     * If the instance is a OrderPaymentInstrument, and we are in
     * the context of a business manager request, and the current user has the
     * permission MANAGE_ORDERS
     * 
     * -
     * If the instance is a OrderPaymentInstrument, and the account information
     * has not been masked as a result of the data retention security policy
     * for the site
     * 
     * Otherwise, the method returns the masked credit card number. If a basket is reopened with
     * OrderMgr.failOrder, it always masks sensitive information
     * because during order creation, basket payment information is permanently masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    creditCardNumber: string;
    /**
     * Returns the last 4 characters of the decrypted credit card number.
     * 
     * If the number is empty or null
     * it will be returned without an exception.
     */
    readonly creditCardNumberLastDigits: string | null;
    /**
     * Secure credit card data can be replaced by a token by utilizing a
     * tokenization provider, which securely stores the credit card data using
     * the token as a key. The stored data can later reused by including the
     * token in a request. In this way credit card processes such as
     * authorization and capture can be implemented without being responsible
     * for persisting the credit card data.
     */
    creditCardToken: string;
    /**
     * Returns the type of the credit card.
     */
    creditCardType: string;
    /**
     * Returns the month of the year in which the credit card became
     * valid (1-12).  This attribute is not used by all credit card types.
     */
    creditCardValidFromMonth: number;
    /**
     * Returns the year in which the credit card became valid, such as '2001'.
     * This attribute is not used by all credit card types.
     */
    creditCardValidFromYear: number;
    /**
     * Returns the Gift Certificate code for this Payment Instrument.
     */
    giftCertificateCode: string | null;
    /**
     * Returns the Gift Certificate ID for this Payment Instrument.
     * @deprecated Use getGiftCertificateCode
     */
    giftCertificateID: string | null;
    /**
     * Returns the decrypted driver's license number of the bank account with
     * all but the last 4 characters replaced with a '*' character.
     * 
     * If the driver's license number is empty,
     * it will be returned without an exception.
     */
    readonly maskedBankAccountDriversLicense: string;
    /**
     * Returns the decrypted bank account number with
     * all but the last 4 characters replaced with a '*' character.
     * 
     * If the number is empty (i.e. "" or null),
     * it will be returned without an exception.
     */
    readonly maskedBankAccountNumber: string | null;
    /**
     * Returns the decrypted credit card number with
     * all but the last 4 characters replaced with a '*' character.
     * 
     * If the number is empty,
     * it will be returned without an exception.
     */
    readonly maskedCreditCardNumber: string;
    /**
     * Returns the masked gift certificate code with
     * all but the last 4 characters replaced with a '*' character.
     */
    readonly maskedGiftCertificateCode: string;
    /**
     * Returns the identifier of the payment method represented by this
     * payment instrument.
     */
    readonly paymentMethod: string;
    /**
     * Returns `true` if the account information for this Payment Instrument
     * has been permanently masked as a result of the data retention security policy
     * for the site or a creditcard tokenization, and `false` otherwise.
     * 
     * When account information is masked only the last 4 digits of the credit card
     * or bank account number are recoverable.  The bank account driver's license number
     * and bank routing number are completely masked.
     */
    readonly permanentlyMasked: boolean;
    /**
     * Returns the driver's license number associated with the bank account if the
     * calling context meets the following criteria:
     * 
     * -
     * If the instance is a CustomerPaymentInstrument, and
     * we are in the context of a storefront request, and the current customer
     * is registered and authenticated, and the payment instrument is associated
     * to the profile of the current customer, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a storefront request, and the current customer is identical
     * to the customer related to the basket, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a business manager request, and the current user has the
     * permission MANAGE_ORDERS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and the account information
     * has not been masked as a result of the data retention security policy
     * for the site
     * 
     * Otherwise, the method returns the masked driver's license number. If a basket is reopened with
     * OrderMgr.failOrder, it always masks sensitive information
     * because during order creation, basket payment information is permanently masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getBankAccountDriversLicense(): string;
    /**
     * Returns the last 4 characters of the decrypted driver's license number of
     * the bank account associated with this PaymentInstrument.
     * 
     * If the number is empty or null
     * it will be returned without an exception.
     */
    getBankAccountDriversLicenseLastDigits(): string | null;
    /**
     * Returns the last specified number of characters of the decrypted driver's license number of
     * the bank account associated with this PaymentInstrument.
     * 
     * If the number is empty (i.e. "" or null),
     * it will be returned without an exception.
     * 
     * Note that `count` is limited to 4 in an unsecure environment,
     * and if account information for this payment instrument has been masked
     * due to the data retention security policy for the site.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getBankAccountDriversLicenseLastDigits(count: number): string | null;
    /**
     * Returns the driver's license state code associated with a bank account payment instrument.
     * Returns null for other payment methods.
     */
    getBankAccountDriversLicenseStateCode(): string;
    /**
     * Returns the full name of the holder of a bank account payment instrument.
     * Returns null for other payment methods.
     */
    getBankAccountHolder(): string;
    /**
     * Returns the bank account number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the instance is a CustomerPaymentInstrument, and
     * we are in the context of a storefront request, and the current customer
     * is registered and authenticated, and the payment instrument is associated
     * to the profile of the current customer, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a storefront request, and the current customer is identical
     * to the customer related to the basket, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and we are in
     * the context of a business manager request, and the current user has the
     * permission MANAGE_ORDERS
     * 
     * -
     * If the instance is a OrderPaymentInstrumentInfo, and the account information
     * has not been masked as a result of the data retention security policy
     * for the site
     * 
     * Otherwise, the method returns the masked bank account number. If a basket is reopened with
     * OrderMgr.failOrder, it always masks sensitive information
     * because during order creation, basket payment information is permanently masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getBankAccountNumber(): string;
    /**
     * Returns the last 4 characters of the decrypted bank account number.
     * 
     * If the number is empty or null,
     * it will be returned without an exception.
     */
    getBankAccountNumberLastDigits(): string | null;
    /**
     * Returns the last specified number of characters of the decrypted bank account card number.
     * 
     * If the number is empty (i.e. "" or null),
     * it will be returned without an exception.
     * 
     * Note that `count` is limited to 4 in an unsecure environment,
     * and if account information for this payment instrument has been masked
     * due to the data retention security policy for the site.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getBankAccountNumberLastDigits(count: number): string | null;
    /**
     * Returns the bank routing number of a bank account payment instrument.
     * Returns null for other payment methods.
     * 
     * If account information has been masked due to the data retention security
     * policy for the site, the return value is fully masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getBankRoutingNumber(): string;
    /**
     * Returns the month of the year in which the credit card
     * expires (1-12).
     */
    getCreditCardExpirationMonth(): number;
    /**
     * Returns the year in which the credit card
     * expires, such as '2004'.
     */
    getCreditCardExpirationYear(): number;
    /**
     * Returns the name of the credit card owner.
     */
    getCreditCardHolder(): string;
    /**
     * Returns the credit card issue number.  This attribute is only used by
     * specific credit/debit card processors such as Solo and Switch in the UK.
     */
    getCreditCardIssueNumber(): string;
    /**
     * Returns the decrypted credit card number if the calling context meets
     * the following criteria:
     * 
     * -
     * If the instance is a CustomerPaymentInstrument, and
     * we are in the context of a storefront request, and the current customer
     * is registered and authenticated, and the payment instrument is associated
     * to the profile of the current customer, and the current protocol is HTTPS
     * 
     * -
     * If the instance is a OrderPaymentInstrument in the context of a storefront request, and
     * the current authenticated customer is referenced by the basket or order, and
     * the current protocol is HTTPS.
     * 
     * -
     * If the customer is anonymous, and the customer is referenced by the order, and the protocol is secure and
     * the order status is CREATED.
     * 
     * -
     * If the instance is a OrderPaymentInstrument, and we are in
     * the context of a business manager request, and the current user has the
     * permission MANAGE_ORDERS
     * 
     * -
     * If the instance is a OrderPaymentInstrument, and the account information
     * has not been masked as a result of the data retention security policy
     * for the site
     * 
     * Otherwise, the method returns the masked credit card number. If a basket is reopened with
     * OrderMgr.failOrder, it always masks sensitive information
     * because during order creation, basket payment information is permanently masked.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getCreditCardNumber(): string;
    /**
     * Returns the last 4 characters of the decrypted credit card number.
     * 
     * If the number is empty or null
     * it will be returned without an exception.
     */
    getCreditCardNumberLastDigits(): string | null;
    /**
     * Returns the last specified number of characters of the decrypted credit card number.
     * 
     * If the number is empty (i.e. "" or null),
     * it will be returned without an exception.
     * 
     * Note that `count` is limited to 4 in an unsecure environment,
     * and if account information for this payment instrument has been masked
     * due to the data retention security policy for the site.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getCreditCardNumberLastDigits(count: number): string | null;
    /**
     * Secure credit card data can be replaced by a token by utilizing a
     * tokenization provider, which securely stores the credit card data using
     * the token as a key. The stored data can later reused by including the
     * token in a request. In this way credit card processes such as
     * authorization and capture can be implemented without being responsible
     * for persisting the credit card data.
     */
    getCreditCardToken(): string;
    /**
     * Returns the type of the credit card.
     */
    getCreditCardType(): string;
    /**
     * Returns the month of the year in which the credit card became
     * valid (1-12).  This attribute is not used by all credit card types.
     */
    getCreditCardValidFromMonth(): number;
    /**
     * Returns the year in which the credit card became valid, such as '2001'.
     * This attribute is not used by all credit card types.
     */
    getCreditCardValidFromYear(): number;
    /**
     * Encrypts the driver's license number of the bank account of this object with the given algorithm and the given
     * public key. Returned is the Base64 encoded representation of the result.
     * 
     * See also dw.crypto.Cipher.encrypt_2 on how to generate RSA key
     * pairs.
     * 
     * If account information has been masked due to the data retention security policy for the site, the returned value
     * is the Base64 encoded representation of the encrypted form of the masked number.
     * @throws IllegalArgumentException If  algorithm  is not a valid known algorithm.
     * @throws IllegalArgumentException If  publicKey  is a null, empty or blank string.
     */
    getEncryptedBankAccountDriversLicense(algorithm: string, publicKey: string): string;
    /**
     * Encrypts the bank account number of this object with the given algorithm and the given public key. Returned is
     * the Base64 encoded representation of the result.
     * 
     * If account information has been masked due to the data retention security policy for the site, the returned value
     * is the Base64 encoded representation of the encrypted form of the masked number.
     * @throws IllegalArgumentException If  algorithm  is not a valid known algorithm.
     * @throws IllegalArgumentException If  publicKey  is a null, empty or blank string.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getEncryptedBankAccountNumber(algorithm: string, publicKey: string): string;
    /**
     * Encrypts the credit card number of this object with the given algorithm and the given public key. Returned is the
     * Base64 encoded representation of the result.
     * 
     * See also dw.crypto.Cipher.encrypt_2 on how to generate RSA key
     * pairs.
     * 
     * If account information has been masked due to the data retention security policy for the site, the returned value
     * is the Base64 encoded representation of the encrypted form of the masked number.
     * @throws IllegalArgumentException If  algorithm  is not a valid known algorithm.
     * @throws IllegalArgumentException If  publicKey  is a null, empty or blank string.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     * @deprecated Please use getEncryptedCreditCardNumber instead.
     */
    getEncryptedCreditCardNumber(algorithm: string, publicKey: string): string;
    /**
     * Encrypts the credit card number of this object with the given algorithm and the public key taken from a
     * certificate in the keystore. Returned is the Base64 encoded representation of the result.
     * 
     * See also dw.crypto.Cipher.encrypt_2 on how to generate RSA
     * key pairs.
     * 
     * If account information has been masked due to the data retention security policy for the site, the returned value
     * is the Base64 encoded representation of the encrypted form of the masked number.
     * @throws IllegalArgumentException If  algorithm  is not a valid known algorithm.
     * @throws IllegalArgumentException If  certificateRef  is  null  or could not be found.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getEncryptedCreditCardNumber(algorithm: string, certificateRef: CertificateRef): string;
    /**
     * Returns the Gift Certificate code for this Payment Instrument.
     */
    getGiftCertificateCode(): string | null;
    /**
     * Returns the Gift Certificate ID for this Payment Instrument.
     * @deprecated Use getGiftCertificateCode
     */
    getGiftCertificateID(): string | null;
    /**
     * Returns the decrypted driver's license number of the bank account with
     * all but the last 4 characters replaced with a '*' character.
     * 
     * If the driver's license number is empty,
     * it will be returned without an exception.
     */
    getMaskedBankAccountDriversLicense(): string;
    /**
     * Returns the decrypted driver's license number of the bank account with
     * all but the specified number characters replaced with a '*' character.
     * 
     * If the driver's license number is empty (i.e. "" or null),
     * it will be returned without an exception.
     * 
     * Note that `ignore` is limited to 4 in an unsecure environment,
     * and if account information for this payment instrument has been masked
     * due to the data retention security policy for the site.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getMaskedBankAccountDriversLicense(ignore: number): string | null;
    /**
     * Returns the decrypted bank account number with
     * all but the last 4 characters replaced with a '*' character.
     * 
     * If the number is empty (i.e. "" or null),
     * it will be returned without an exception.
     */
    getMaskedBankAccountNumber(): string | null;
    /**
     * Returns the decrypted bank account number with
     * all but the specified number characters replaced with a '*' character.
     * 
     * If the card number is empty (i.e. "" or null),
     * it will be returned without an exception.
     * 
     * Note that `ignore` is limited to 4 in an unsecure environment,
     * and if account information for this payment instrument has been masked
     * due to the data retention security policy for the site.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getMaskedBankAccountNumber(ignore: number): string | null;
    /**
     * Returns the decrypted credit card number with
     * all but the last 4 characters replaced with a '*' character.
     * 
     * If the number is empty,
     * it will be returned without an exception.
     */
    getMaskedCreditCardNumber(): string;
    /**
     * Returns the decrypted credit card number with
     * all but the specified number characters replaced with a '*' character.
     * 
     * If the card number is empty (i.e. "" or null),
     * it will be returned without an exception.
     * 
     * Note that `ignore` is limited to 4 in an unsecure environment,
     * and if account information for this payment instrument has been masked
     * due to the data retention security policy for the site.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    getMaskedCreditCardNumber(ignore: number): string | null;
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
     * Returns the identifier of the payment method represented by this
     * payment instrument.
     */
    getPaymentMethod(): string;
    /**
     * Returns true if this payment instrument represents an expired credit
     * card. This check is only logical if the credit card expiration month and
     * year are set. If either of these attributes are not set, then this method
     * always returns false.
     */
    isCreditCardExpired(): boolean;
    /**
     * Returns `true` if the account information for this Payment Instrument
     * has been permanently masked as a result of the data retention security policy
     * for the site or a creditcard tokenization, and `false` otherwise.
     * 
     * When account information is masked only the last 4 digits of the credit card
     * or bank account number are recoverable.  The bank account driver's license number
     * and bank routing number are completely masked.
     */
    isPermanentlyMasked(): boolean;
    /**
     * Set the driver's license number associated with a bank account payment instrument.
     */
    setBankAccountDriversLicense(license: string): void;
    /**
     * Set the driver's license state code associated with a bank account payment instrument.
     */
    setBankAccountDriversLicenseStateCode(stateCode: string): void;
    /**
     * Set the full name of the holder of a bank account payment instrument.
     */
    setBankAccountHolder(holder: string): void;
    /**
     * Set the bank account number of a bank account payment instrument.
     */
    setBankAccountNumber(accountNumber: string): void;
    /**
     * Set the bank routing number of a bank account payment instrument.
     */
    setBankRoutingNumber(routingNumber: string): void;
    /**
     * Sets the month of the year in which the credit card
     * expires. Permissible values are from 1 to 12.
     */
    setCreditCardExpirationMonth(aValue: number): void;
    /**
     * Sets the year in which the credit card
     * expires, such as '2004'.
     */
    setCreditCardExpirationYear(aValue: number): void;
    /**
     * Sets the name of the credit card owner.
     */
    setCreditCardHolder(aValue: string): void;
    /**
     * Set the credit card issue number.  This attribute is only used by
     * specific credit/debit card processors such as Solo and Switch in the UK.
     */
    setCreditCardIssueNumber(aValue: string): void;
    /**
     * Sets the credit card number for this payment.
     */
    setCreditCardNumber(aValue: string): void;
    /**
     * Secure credit card data can be replaced by a token by utilizing a
     * tokenization provider, which securely stores the credit card data using
     * the token as a key. The stored data can later reused by including the
     * token in a request. In this way credit card processes such as
     * authorization and capture can be implemented without being responsible
     * for persisting the credit card data.
     * 
     * An Exception will be thrown when the token is null or blank.
     * 
     * When setting a credit card token, the account information (including the
     * creditcard number) is masked and all creditcard attributes are frozen and
     * an attempt to change will be result in an exception.
     * @see dw.order.PaymentInstrument.isPermanentlyMasked
     */
    setCreditCardToken(token: string): void;
    /**
     * Sets the type of the credit card.
     */
    setCreditCardType(aValue: string): void;
    /**
     * Sets the month of the year in which the credit card became valid (1-12).
     * This attribute is not used by all credit card types
     */
    setCreditCardValidFromMonth(aValue: number): void;
    /**
     * Sets the year in which the credit card became valid, such as '2001'.
     * This attribute is not used by all credit card types.
     */
    setCreditCardValidFromYear(aValue: number): void;
    /**
     * Sets the Gift Certificate code for this Payment Instrument.
     */
    setGiftCertificateCode(giftCertificateCode: string): void;
    /**
     * Sets the Gift Certificate ID for this Payment Instrument.
     * @deprecated Use setGiftCertificateCode
     */
    setGiftCertificateID(giftCertificateID: string): void;
}

export = PaymentInstrument;
