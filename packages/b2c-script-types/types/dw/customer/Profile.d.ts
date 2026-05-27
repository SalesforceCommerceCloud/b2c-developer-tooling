import EncryptedObject = require('./EncryptedObject');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Customer = require('./Customer');
import AddressBook = require('./AddressBook');
import Wallet = require('./Wallet');
import Credentials = require('./Credentials');
import EnumValue = require('../value/EnumValue');

declare global {
    module ICustomAttributes {
        interface Profile extends ICustomAttributes.EncryptedObject {
        }
    }
}

/**
 * The class represents a customer profile. It also provides access to the
 * customers address book and credentials.
 * 
 * Note: this class handles sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 */
declare class Profile extends EncryptedObject<ICustomAttributes.Profile> {
    /**
     * Returns the customer's address book.
     */
    readonly addressBook: AddressBook;
    /**
     * Returns the customer's birthday as a date.
     */
    birthday: Date;
    /**
     * Returns the customer's company name.
     */
    companyName: string;
    /**
     * Returns the customer's credentials.
     */
    readonly credentials: Credentials;
    /**
     * Returns the customer object related to this profile.
     */
    readonly customer: Customer;
    /**
     * Returns the customer's number, which is a number used to identify the Customer.
     */
    readonly customerNo: string;
    /**
     * Returns the customer's email address.
     */
    email: string;
    /**
     * Returns whether the customer's email has been verified.
     * 
     * This is a read-only field. The field value cannot be set externally and will be set in platform based on
     * following rules:
     * 
     * - If the Email Verification Site Preference under LoginPreferences is disabled: the value for this field will
     * always be NULL;
     * - If the Email Verification Site Preference under LoginPreferences is enabled:
     * 
     * - If the incoming email value is the same as existing email and email was previously verified, the value for
     * this field will remain unchanged as TRUE;
     * - If the incoming email value is the same as existing email and email was not previously verified, the value
     * for this field will remain unchanged as FALSE;
     * - If the incoming email value is not the same as existing email, the value for this field will be set to FALSE
     * no matter the previous state;
     */
    readonly emailVerified: boolean;
    /**
     * Returns the fax number to use for the customer.
     * The length is restricted to 32 characters.
     */
    fax: string;
    /**
     * Indicates that the customer is female when set to true.
     */
    readonly female: boolean;
    /**
     * Returns the customer's first name.
     */
    firstName: string;
    /**
     * Returns the customer's gender.
     */
    gender: EnumValue;
    /**
     * Returns the customer's job title.
     */
    jobTitle: string;
    /**
     * Returns the last login time of the customer.
     */
    readonly lastLoginTime: Date;
    /**
     * Returns the customer's last name.
     */
    lastName: string;
    /**
     * Returns the last visit time of the customer.
     */
    readonly lastVisitTime: Date;
    /**
     * Indicates that the customer is male when set to true.
     */
    readonly male: boolean;
    /**
     * Returns the upcoming customer's birthday as a date.
     * If the customer already had birthday this year the method returns the birthday of the next year.
     * Otherwise its birthday in this year.
     * If the customer has not set a birthday this method returns null.
     */
    readonly nextBirthday: Date;
    /**
     * Returns the business phone number to use for the customer.
     */
    phoneBusiness: string;
    /**
     * Returns the phone number to use for the customer.
     */
    phoneHome: string;
    /**
     * Returns the mobile phone number to use for the customer.
     */
    phoneMobile: string;
    /**
     * Returns the customer's preferred locale.
     */
    preferredLocale: string;
    /**
     * Returns the time the customer logged in prior to the current login.
     */
    readonly previousLoginTime: Date;
    /**
     * Returns the time the customer visited the store prior to the current visit.
     */
    readonly previousVisitTime: Date;
    /**
     * Returns the salutation to use for the customer.
     */
    salutation: string;
    /**
     * Returns the customer's second name.
     */
    secondName: string;
    /**
     * Returns the customer's suffix, such as "Jr." or "Sr.".
     */
    suffix: string;
    /**
     * Returns the tax ID value. The value is returned either plain
     * text if the current context allows plain text access, or
     * if it's not allowed, the ID value will be returned masked.
     * The following criteria must be met in order to have plain text access:
     * 
     * - the method call must happen in the context of a storefront request;
     * - the current customer must be registered and authenticated;
     * - it is the profile of the current customer;
     * - and the current protocol is HTTPS.
     */
    taxID: string;
    /**
     * Returns the masked value of the tax ID.
     */
    readonly taxIDMasked: string;
    /**
     * Returns the tax ID type.
     */
    taxIDType: EnumValue;
    /**
     * Returns the customer's title, such as "Mrs" or "Mr".
     */
    title: string;
    /**
     * Returns the wallet of this customer.
     */
    readonly wallet: Wallet;
    private constructor();
    /**
     * Returns the customer's address book.
     */
    getAddressBook(): AddressBook;
    /**
     * Returns the customer's birthday as a date.
     */
    getBirthday(): Date;
    /**
     * Returns the customer's company name.
     */
    getCompanyName(): string;
    /**
     * Returns the customer's credentials.
     */
    getCredentials(): Credentials;
    /**
     * Returns the customer object related to this profile.
     */
    getCustomer(): Customer;
    /**
     * Returns the customer's number, which is a number used to identify the Customer.
     */
    getCustomerNo(): string;
    /**
     * Returns the customer's email address.
     */
    getEmail(): string;
    /**
     * Returns the fax number to use for the customer.
     * The length is restricted to 32 characters.
     */
    getFax(): string;
    /**
     * Returns the customer's first name.
     */
    getFirstName(): string;
    /**
     * Returns the customer's gender.
     */
    getGender(): EnumValue;
    /**
     * Returns the customer's job title.
     */
    getJobTitle(): string;
    /**
     * Returns the last login time of the customer.
     */
    getLastLoginTime(): Date;
    /**
     * Returns the customer's last name.
     */
    getLastName(): string;
    /**
     * Returns the last visit time of the customer.
     */
    getLastVisitTime(): Date;
    /**
     * Returns the upcoming customer's birthday as a date.
     * If the customer already had birthday this year the method returns the birthday of the next year.
     * Otherwise its birthday in this year.
     * If the customer has not set a birthday this method returns null.
     */
    getNextBirthday(): Date;
    /**
     * Returns the business phone number to use for the customer.
     */
    getPhoneBusiness(): string;
    /**
     * Returns the phone number to use for the customer.
     */
    getPhoneHome(): string;
    /**
     * Returns the mobile phone number to use for the customer.
     */
    getPhoneMobile(): string;
    /**
     * Returns the customer's preferred locale.
     */
    getPreferredLocale(): string;
    /**
     * Returns the time the customer logged in prior to the current login.
     */
    getPreviousLoginTime(): Date;
    /**
     * Returns the time the customer visited the store prior to the current visit.
     */
    getPreviousVisitTime(): Date;
    /**
     * Returns the salutation to use for the customer.
     */
    getSalutation(): string;
    /**
     * Returns the customer's second name.
     */
    getSecondName(): string;
    /**
     * Returns the customer's suffix, such as "Jr." or "Sr.".
     */
    getSuffix(): string;
    /**
     * Returns the tax ID value. The value is returned either plain
     * text if the current context allows plain text access, or
     * if it's not allowed, the ID value will be returned masked.
     * The following criteria must be met in order to have plain text access:
     * 
     * - the method call must happen in the context of a storefront request;
     * - the current customer must be registered and authenticated;
     * - it is the profile of the current customer;
     * - and the current protocol is HTTPS.
     */
    getTaxID(): string;
    /**
     * Returns the masked value of the tax ID.
     */
    getTaxIDMasked(): string;
    /**
     * Returns the tax ID type.
     */
    getTaxIDType(): EnumValue;
    /**
     * Returns the customer's title, such as "Mrs" or "Mr".
     */
    getTitle(): string;
    /**
     * Returns the wallet of this customer.
     */
    getWallet(): Wallet;
    /**
     * Returns whether the customer's email has been verified.
     * 
     * This is a read-only field. The field value cannot be set externally and will be set in platform based on
     * following rules:
     * 
     * - If the Email Verification Site Preference under LoginPreferences is disabled: the value for this field will
     * always be NULL;
     * - If the Email Verification Site Preference under LoginPreferences is enabled:
     * 
     * - If the incoming email value is the same as existing email and email was previously verified, the value for
     * this field will remain unchanged as TRUE;
     * - If the incoming email value is the same as existing email and email was not previously verified, the value
     * for this field will remain unchanged as FALSE;
     * - If the incoming email value is not the same as existing email, the value for this field will be set to FALSE
     * no matter the previous state;
     */
    isEmailVerified(): boolean;
    /**
     * Indicates that the customer is female when set to true.
     */
    isFemale(): boolean;
    /**
     * Indicates that the customer is male when set to true.
     */
    isMale(): boolean;
    /**
     * Sets the customer's birthday as a date.
     */
    setBirthday(aValue: Date): void;
    /**
     * Sets the customer's company name.
     */
    setCompanyName(aValue: string): void;
    /**
     * Sets the customer's email address.
     */
    setEmail(aValue: string): void;
    /**
     * Sets the fax number to use for the customer.
     * The length is restricted to 32 characters.
     */
    setFax(number: string): void;
    /**
     * Sets the customer's first name.
     */
    setFirstName(aValue: string): void;
    /**
     * Sets the customer's gender.
     */
    setGender(aValue: number): void;
    /**
     * Sets the customer's job title.
     */
    setJobTitle(aValue: string): void;
    /**
     * Sets the customer's last name.
     */
    setLastName(aValue: string): void;
    /**
     * Sets the business phone number to use for the customer.
     * The length is restricted to 32 characters.
     */
    setPhoneBusiness(number: string): void;
    /**
     * Sets the phone number to use for the customer.
     * The length is restricted to 32 characters.
     */
    setPhoneHome(number: string): void;
    /**
     * Sets the mobile phone number to use for the customer.
     * The length is restricted to 32 characters.
     */
    setPhoneMobile(number: string): void;
    /**
     * Sets the customer's preferred locale.
     */
    setPreferredLocale(aValue: string): void;
    /**
     * Sets the salutation to use for the customer.
     * @deprecated Use setSalutation
     */
    setSaluation(salutation: string): void;
    /**
     * Sets the salutation to use for the customer.
     */
    setSalutation(salutation: string): void;
    /**
     * Sets the customer's second name.
     */
    setSecondName(aValue: string): void;
    /**
     * Sets the the customer's suffix.
     */
    setSuffix(aValue: string): void;
    /**
     * Sets the tax ID value. The value can be set if the current context
     * allows write access.
     * The current context allows write access if the currently
     * logged in user owns this profile and the connection is secured.
     */
    setTaxID(taxID: string): void;
    /**
     * Sets the tax ID type.
     */
    setTaxIDType(taxIdType: string): void;
    /**
     * Sets the customer's title.
     */
    setTitle(aValue: string): void;
}

export = Profile;
