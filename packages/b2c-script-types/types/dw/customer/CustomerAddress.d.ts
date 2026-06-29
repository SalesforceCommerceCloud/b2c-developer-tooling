import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import EnumValue = require('../value/EnumValue');

declare global {
    module ICustomAttributes {
        interface CustomerAddress extends CustomAttributes {
        }
    }
}

/**
 * The Address class represents a customer's address.
 * 
 * Note: this class allows access to sensitive personal and private information.
 * Pay attention to appropriate legal and regulatory requirements.
 */
declare class CustomerAddress extends ExtensibleObject<ICustomAttributes.CustomerAddress> {
    /**
     * Returns the name of the address.
     */
    ID: string;
    /**
     * Returns the customer's first address.
     */
    address1: string;
    /**
     * Returns the customer's second address value.
     */
    address2: string;
    /**
     * Returns the customer's city.
     */
    city: string;
    /**
     * Returns the customer's company name.
     */
    companyName: string;
    /**
     * Returns the customer's country code. Commerce Cloud Digital supports two-character
     * country codes per ISO 3166-1 alpha-2. See
     * http://www.iso.org/iso/country_codes/iso_3166-faqs/iso_3166_faqs_general.htm
     * for additional information.
     */
    countryCode: EnumValue;
    /**
     * Returns the customer's first name.
     */
    firstName: string;
    /**
     * Returns a concatenation of the customer's first, middle,
     * and last names and its suffix.
     */
    readonly fullName: string;
    /**
     * Returns the customer's job title.
     */
    jobTitle: string;
    /**
     * Returns the customer's last name.
     */
    lastName: string;
    /**
     * Returns the customer's phone number.
     */
    phone: string;
    /**
     * Returns the customer's post box.
     */
    postBox: string;
    /**
     * Returns the customer's postal code.
     */
    postalCode: string;
    /**
     * Returns the customer's salutation.
     */
    salutation: string;
    /**
     * Returns the customer's second name.
     */
    secondName: string;
    /**
     * Returns the customer's state.
     */
    stateCode: string;
    /**
     * Returns the customer's suffix.
     */
    suffix: string;
    /**
     * Returns the customer's suite.
     */
    suite: string;
    /**
     * Returns the customer's title.
     */
    title: string;
    private constructor();
    /**
     * Returns the customer's first address.
     */
    getAddress1(): string;
    /**
     * Returns the customer's second address value.
     */
    getAddress2(): string;
    /**
     * Returns the customer's city.
     */
    getCity(): string;
    /**
     * Returns the customer's company name.
     */
    getCompanyName(): string;
    /**
     * Returns the customer's country code. Commerce Cloud Digital supports two-character
     * country codes per ISO 3166-1 alpha-2. See
     * http://www.iso.org/iso/country_codes/iso_3166-faqs/iso_3166_faqs_general.htm
     * for additional information.
     */
    getCountryCode(): EnumValue;
    /**
     * Returns the customer's first name.
     */
    getFirstName(): string;
    /**
     * Returns a concatenation of the customer's first, middle,
     * and last names and its suffix.
     */
    getFullName(): string;
    /**
     * Returns the name of the address.
     */
    getID(): string;
    /**
     * Returns the customer's job title.
     */
    getJobTitle(): string;
    /**
     * Returns the customer's last name.
     */
    getLastName(): string;
    /**
     * Returns the customer's phone number.
     */
    getPhone(): string;
    /**
     * Returns the customer's post box.
     */
    getPostBox(): string;
    /**
     * Returns the customer's postal code.
     */
    getPostalCode(): string;
    /**
     * Returns the customer's salutation.
     */
    getSalutation(): string;
    /**
     * Returns the customer's second name.
     */
    getSecondName(): string;
    /**
     * Returns the customer's state.
     */
    getStateCode(): string;
    /**
     * Returns the customer's suffix.
     */
    getSuffix(): string;
    /**
     * Returns the customer's suite.
     */
    getSuite(): string;
    /**
     * Returns the customer's title.
     */
    getTitle(): string;
    /**
     * Returns true if the specified address is equivalent to
     * this address. An equivalent address is an address whose
     * core attributes contain the same values. The core attributes
     * are:
     * 
     * - address1
     * - address2
     * - city
     * - companyName
     * - countryCode
     * - firstName
     * - lastName
     * - postalCode
     * - postBox
     * - stateCode
     */
    isEquivalentAddress(address: any): boolean;
    /**
     * Sets the value of the customer's first address.
     */
    setAddress1(value: string): void;
    /**
     * Sets the customer's second address value.
     */
    setAddress2(value: string): void;
    /**
     * Sets the customer's city.
     */
    setCity(city: string): void;
    /**
     * Sets the customer's company name.
     */
    setCompanyName(companyName: string): void;
    /**
     * Sets the customer's country code. Commerce Cloud Digital supports two-character
     * country codes per ISO 3166-1 alpha-2. See
     * http://www.iso.org/iso/country_codes/iso_3166-faqs/iso_3166_faqs_general.htm
     * for additional information.
     */
    setCountryCode(countryCode: string): void;
    /**
     * Sets the customer's first name.
     */
    setFirstName(firstName: string): void;
    /**
     * Sets the address name.
     */
    setID(value: string): void;
    /**
     * Sets the customer's job title.
     */
    setJobTitle(jobTitle: string): void;
    /**
     * Sets the customer's last name.
     */
    setLastName(lastName: string): void;
    /**
     * Sets the customer's phone number. The length is restricted to 32 characters.
     */
    setPhone(phoneNumber: string): void;
    /**
     * Sets the customer's post box.
     */
    setPostBox(postBox: string): void;
    /**
     * Sets the customer's postal code.
     */
    setPostalCode(postalCode: string): void;
    /**
     * Sets the customer's salutation.
     * @deprecated Use setSalutation
     */
    setSaluation(value: string): void;
    /**
     * Sets the customer's salutation.
     */
    setSalutation(value: string): void;
    /**
     * Sets the customer's second name.
     */
    setSecondName(secondName: string): void;
    /**
     * Sets the customer's state.
     */
    setStateCode(state: string): void;
    /**
     * Sets the customer's suffix.
     */
    setSuffix(suffix: string): void;
    /**
     * Sets the customer's suite. The length is restricted to 32 characters.
     */
    setSuite(value: string): void;
    /**
     * Sets the customer's title.
     */
    setTitle(title: string): void;
}

export = CustomerAddress;
