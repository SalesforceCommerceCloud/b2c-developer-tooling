/**
 * Object representing the collection of customers who are registered
 * for a given site. In Commerce Cloud Digital, every site has exactly
 * one assigned customer list but multiple sites may share a customer
 * list.
 */
declare class CustomerList {
    /**
     * Get the ID of the customer list.  For customer lists that were created automatically
     * for a given site, this is equal to the ID of the site itself.
     */
    readonly ID: string;
    /**
     * Get the optional description of the customer list.
     */
    readonly description: string;
    private constructor();
    /**
     * Get the optional description of the customer list.
     */
    getDescription(): string;
    /**
     * Get the ID of the customer list.  For customer lists that were created automatically
     * for a given site, this is equal to the ID of the site itself.
     */
    getID(): string;
}

export = CustomerList;
