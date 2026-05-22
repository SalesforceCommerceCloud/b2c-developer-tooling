import CustomerAddress = require('./CustomerAddress');
import List = require('../util/List');

/**
 * Represents a set of addresses associated with a specific customer.
 * The AddressBook object gets its data from the Profile object for the customer.
 * When scripting, this class allows AddressBook to be treated as a separate object
 * from the Profile. However, data is only stored in the platform in the Profile object
 * and there is no separate AddressBook object. For this reason, the AddressBook ID is
 * always the customer profile ID.
 * 
 * Note: this class allows access to sensitive personal and private information.
 * Pay attention to appropriate legal and regulatory requirements when developing.
 */
declare class AddressBook {
    /**
     * Returns a sorted list of addresses in the address book.  The addresses
     * are sorted so that the preferred address is always sorted first.  The
     * remaining addresses are sorted alphabetically by ID.
     */
    readonly addresses: List<CustomerAddress>;
    /**
     * Returns the address that has been defined as the customer's preferred
     * address.
     */
    preferredAddress: CustomerAddress | null;
    private constructor();
    /**
     * Creates a new, empty address object with the specified name.
     * @throws NullArgumentException If passed 'name' is null.
     * @throws IllegalArgumentException If passed 'name' is not null, but an empty string.
     */
    createAddress(name: string): CustomerAddress | null;
    /**
     * Returns the address with the given name from the address book. The name
     * is a unique identifier of the address within the address book.
     * @throws NullArgumentException If passed 'id' is null.
     * @throws IllegalArgumentException If passed 'id' is not null, but an empty string.
     */
    getAddress(id: string): CustomerAddress | null;
    /**
     * Returns a sorted list of addresses in the address book.  The addresses
     * are sorted so that the preferred address is always sorted first.  The
     * remaining addresses are sorted alphabetically by ID.
     */
    getAddresses(): List<CustomerAddress>;
    /**
     * Returns the address that has been defined as the customer's preferred
     * address.
     */
    getPreferredAddress(): CustomerAddress | null;
    /**
     * Removes the specified address from the address book. Because an address
     * can be associated with a product list, you may want to verify if the
     * address is being used by a product list. See ProductListMgr.findAddress().
     */
    removeAddress(address: CustomerAddress): void;
    /**
     * Sets the specified address as the customer's preferred address. If null
     * is passed, and there is an existing preferred address, then the address
     * book will have no preferred address.
     */
    setPreferredAddress(anAddress: CustomerAddress | null): void;
}

export = AddressBook;
