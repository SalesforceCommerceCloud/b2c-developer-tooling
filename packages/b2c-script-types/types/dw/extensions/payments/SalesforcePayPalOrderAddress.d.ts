/**
 * 
 * 
 * Salesforce Payments representation of a PayPal order address object. See Salesforce Payments documentation
 * for how to gain access and configure it for use on your sites.
 */
declare class SalesforcePayPalOrderAddress {
    /**
     * Returns the address line 1.
     */
    readonly addressLine1: string;
    /**
     * Returns the address line 2.
     */
    readonly addressLine2: string;
    /**
     * Returns the address highest level sub-division in a country, which is usually a province, state, or ISO-3166-2
     * subdivision.
     */
    readonly adminArea1: string;
    /**
     * Returns the address city, town, or village.
     */
    readonly adminArea2: string;
    /**
     * Returns the address two-character ISO 3166-1 code that identifies the country or region.
     */
    readonly countryCode: string;
    /**
     * Returns the address full name.
     */
    readonly fullName: string;
    /**
     * Returns the address postal code.
     */
    readonly postalCode: string;
    private constructor();
    /**
     * Returns the address line 1.
     */
    getAddressLine1(): string;
    /**
     * Returns the address line 2.
     */
    getAddressLine2(): string;
    /**
     * Returns the address highest level sub-division in a country, which is usually a province, state, or ISO-3166-2
     * subdivision.
     */
    getAdminArea1(): string;
    /**
     * Returns the address city, town, or village.
     */
    getAdminArea2(): string;
    /**
     * Returns the address two-character ISO 3166-1 code that identifies the country or region.
     */
    getCountryCode(): string;
    /**
     * Returns the address full name.
     */
    getFullName(): string;
    /**
     * Returns the address postal code.
     */
    getPostalCode(): string;
}

export = SalesforcePayPalOrderAddress;
