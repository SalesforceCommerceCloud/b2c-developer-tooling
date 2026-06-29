import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import EnumValue = require('../value/EnumValue');

declare global {
    module ICustomAttributes {
        interface OrderAddress extends CustomAttributes {
        }
    }
}

/**
 * The Address class represents a customer's address.
 * 
 * Note: this class allows access to sensitive personal and private information.
 * Pay attention to appropriate legal and regulatory requirements.
 */
declare class OrderAddress extends ExtensibleObject<ICustomAttributes.OrderAddress> {
    /**
     * Returns the customer's first address.
     */
    address1: string;
    /**
     * Returns the customer's second address.
     */
    address2: string;
    /**
     * Returns the Customer's City.
     */
    city: string;
    /**
     * Returns the Customer's company name.
     */
    companyName: string;
    /**
     * Returns the customer's country code.
     */
    countryCode: EnumValue;
    /**
     * Returns the Customer's first name.
     */
    firstName: string;
    /**
     * Returns a concatenation of the Customer's first, middle,
     * and last names and it' suffix.
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
     * Returns the customer's second address.
     */
    getAddress2(): string;
    /**
     * Returns the Customer's City.
     */
    getCity(): string;
    /**
     * Returns the Customer's company name.
     */
    getCompanyName(): string;
    /**
     * Returns the customer's country code.
     */
    getCountryCode(): EnumValue;
    /**
     * Returns the Customer's first name.
     */
    getFirstName(): string;
    /**
     * Returns a concatenation of the Customer's first, middle,
     * and last names and it' suffix.
     */
    getFullName(): string;
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
     * Sets the customer's first address.
     */
    setAddress1(value: string): void;
    /**
     * Sets the customer's second address.
     */
    setAddress2(value: string): void;
    /**
     * Sets the Customer's City.
     */
    setCity(city: string): void;
    /**
     * Sets the Customer's company name.
     */
    setCompanyName(companyName: string): void;
    /**
     * Sets the Customer's country code.
     */
    setCountryCode(countryCode: string): void;
    /**
     * Sets the Customer's first name.
     */
    setFirstName(firstName: string): void;
    /**
     * Sets the customer's job title.
     */
    setJobTitle(jobTitle: string): void;
    /**
     * Sets the customer's last name.
     */
    setLastName(lastName: string): void;
    /**
     * Sets the customer's phone number. The length is restricted to 256 characters.
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
     * Sets the customer's suite. The length is restricted to 256 characters.
     */
    setSuite(value: string): void;
    /**
     * Sets the customer's title.
     */
    setTitle(title: string): void;
}

export = OrderAddress;
