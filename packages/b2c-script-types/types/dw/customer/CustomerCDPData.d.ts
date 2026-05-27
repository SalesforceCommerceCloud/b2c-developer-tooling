/**
 * Represents the read-only Customer's Salesforce CDP (Customer Data Platform) data for a dw.customer.Customer in Commerce
 * Cloud. Please see Salesforce CDP enablement documentation
 */
declare class CustomerCDPData {
    /**
     * Return true if the CDPData is empty (has no meaningful data)
     */
    readonly empty: boolean;
    /**
     * Returns an array containing the CDP segments for the customer, or an empty array if no segments found
     */
    readonly segments: string[];
    private constructor();
    /**
     * Returns an array containing the CDP segments for the customer, or an empty array if no segments found
     */
    getSegments(): string[];
    /**
     * Return true if the CDPData is empty (has no meaningful data)
     */
    isEmpty(): boolean;
}

export = CustomerCDPData;
