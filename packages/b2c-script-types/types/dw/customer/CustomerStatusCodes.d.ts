/**
 * CustomerStatusCodes contains constants representing
 * status codes that can be used with a Status object to
 * indicate the success or failure of an operation.
 * @see dw.system.Status
 */
declare class CustomerStatusCodes {
    /**
     * Indicates that an error occurred when trying to perform
     * an operation on an address that is currently associated
     * with a product list.
     */
    static readonly CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST = "CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST";
    private constructor();
}

export = CustomerStatusCodes;
