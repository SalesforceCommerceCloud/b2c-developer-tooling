import CustomerAddress = require('../customer/CustomerAddress');
import OrderAddress = require('./OrderAddress');

/**
 * Represents a specific location for a shipment.
 * 
 * Note: this class allows access to sensitive personal and private information.
 * Pay attention to appropriate legal and regulatory requirements related to this data.
 */
declare class ShippingLocation {
    /**
     * Returns the shipping location's first address.
     */
    address1: string;
    /**
     * Returns the shipping location's second address.
     */
    address2: string;
    /**
     * Returns the shipping location's city.
     */
    city: string;
    /**
     * Returns the shipping location's country code.
     */
    countryCode: string;
    /**
     * Returns the shipping location's post box.
     */
    postBox: string;
    /**
     * Returns the shipping location's postal code.
     */
    postalCode: string;
    /**
     * Returns the shipping location's state code.
     */
    stateCode: string;
    /**
     * Returns the shipping location's suite.
     */
    suite: string;
    /**
     * Constructs a new shipping location.
     */
    constructor();
    /**
     * Constructs a new shipping location and initializes it with the values of the
     * specified address object.
     */
    constructor(address: CustomerAddress);
    /**
     * Constructs a new shipping location and initializes it with the values of the
     * specified address object.
     */
    constructor(address: OrderAddress);
    /**
     * Returns the shipping location's first address.
     */
    getAddress1(): string;
    /**
     * Returns the shipping location's second address.
     */
    getAddress2(): string;
    /**
     * Returns the shipping location's city.
     */
    getCity(): string;
    /**
     * Returns the shipping location's country code.
     */
    getCountryCode(): string;
    /**
     * Returns the shipping location's post box.
     */
    getPostBox(): string;
    /**
     * Returns the shipping location's postal code.
     */
    getPostalCode(): string;
    /**
     * Returns the shipping location's state code.
     */
    getStateCode(): string;
    /**
     * Returns the shipping location's suite.
     */
    getSuite(): string;
    /**
     * Sets the shipping location's first address.
     */
    setAddress1(aValue: string): void;
    /**
     * Sets the shipping location's second address.
     */
    setAddress2(aValue: string): void;
    /**
     * Sets the shipping location's city.
     */
    setCity(aValue: string): void;
    /**
     * Sets the shipping location's country code.
     */
    setCountryCode(aValue: string): void;
    /**
     * Sets the shipping location's post box.
     */
    setPostBox(aValue: string): void;
    /**
     * Sets the shipping location's postal code.
     */
    setPostalCode(aValue: string): void;
    /**
     * Sets the shipping location's state code.
     */
    setStateCode(aValue: string): void;
    /**
     * Sets the shipping location's suite.
     */
    setSuite(aValue: string): void;
}

export = ShippingLocation;
