import Profile = require('./Profile');
import OrderHistory = require('./OrderHistory');
import Collection = require('../util/Collection');
import CustomerGroup = require('./CustomerGroup');
import ProductList = require('./ProductList');
import CustomerActiveData = require('./CustomerActiveData');
import CustomerCDPData = require('./CustomerCDPData');
import AddressBook = require('./AddressBook');
import ExternalProfile = require('./ExternalProfile');

/**
 * Represents a customer.
 */
declare class Customer {
    /**
     * Returns the Salesforce CDP (Customer Data Platform) data for this customer.
     */
    readonly CDPData: CustomerCDPData;
    /**
     * Returns the unique, system generated ID of the customer.
     */
    readonly ID: string;
    /**
     * Returns the active data for this customer.
     */
    readonly activeData: CustomerActiveData;
    /**
     * Returns the address book for the profile of this customer,
     * or `null` if this customer has no profile, such as for an
     * anonymous customer.
     */
    readonly addressBook: AddressBook | null;
    /**
     * Identifies if the customer is anonymous. An anonymous
     * customer is the opposite of a registered customer.
     */
    readonly anonymous: boolean;
    /**
     * Identifies if the customer is authenticated. This method checks whether
     * this customer is the customer associated with the session and than checks
     * whether the session in an authenticated state.
     * 
     * Note: The pipeline debugger will always show 'false' for this value
     * regardless of whether the customer is authenticated or not.
     */
    readonly authenticated: boolean;
    /**
     * Returns the customer groups this customer is member of.
     * 
     * - Result contains static customer groups in storefront and job session
     * - Result contains dynamic customer groups in storefront  and job session.
     * Dynamic customer groups referring session or request data are not available
     * when processing the customer in a job session, or when this customer is not the customer assigned to the current session.
     * 
     * - Result contains system groups 'Everyone', 'Unregistered', 'Registered' for all customers in storefront and job sessions
     */
    readonly customerGroups: Collection<CustomerGroup>;
    /**
     * Returns a collection of any external profiles the customer may have
     */
    readonly externalProfiles: Collection<ExternalProfile>;
    /**
     * Identifies if the customer is externally authenticated. An externally
     * authenticated customer does not have the password stored in our system
     * but logs in through an external OAuth provider (Google, Facebook, LinkedIn, etc.)
     */
    readonly externallyAuthenticated: boolean;
    /**
     * Returns the Global Party ID for the customer, if there is one.
     * Global Party ID is created by Customer 360 and identifies a person across multiple systems.
     */
    readonly globalPartyID: string;
    /**
     * Returns the note for this customer, or `null` if this customer has no note, such as for an anonymous
     * customer or when note has 0 length.
     */
    note: string | null;
    /**
     * Returns the customer order history.
     */
    readonly orderHistory: OrderHistory;
    /**
     * Returns the customer profile.
     */
    readonly profile: Profile;
    /**
     * Identifies if the customer is registered. A registered customer
     * may or may not be authenticated. This method checks whether
     * the user has a profile.
     */
    readonly registered: boolean;
    private constructor();
    /**
     * Creates an externalProfile and attaches it to the list of external profiles for the customer
     */
    createExternalProfile(authenticationProviderId: string, externalId: string): ExternalProfile;
    /**
     * Returns the active data for this customer.
     */
    getActiveData(): CustomerActiveData;
    /**
     * Returns the address book for the profile of this customer,
     * or `null` if this customer has no profile, such as for an
     * anonymous customer.
     */
    getAddressBook(): AddressBook | null;
    /**
     * Returns the Salesforce CDP (Customer Data Platform) data for this customer.
     */
    getCDPData(): CustomerCDPData;
    /**
     * Returns the customer groups this customer is member of.
     * 
     * - Result contains static customer groups in storefront and job session
     * - Result contains dynamic customer groups in storefront  and job session.
     * Dynamic customer groups referring session or request data are not available
     * when processing the customer in a job session, or when this customer is not the customer assigned to the current session.
     * 
     * - Result contains system groups 'Everyone', 'Unregistered', 'Registered' for all customers in storefront and job sessions
     */
    getCustomerGroups(): Collection<CustomerGroup>;
    /**
     * A convenience method for finding an external profile among the customer's external profiles collection
     */
    getExternalProfile(authenticationProviderId: string, externalId: string): ExternalProfile | null;
    /**
     * Returns a collection of any external profiles the customer may have
     */
    getExternalProfiles(): Collection<ExternalProfile>;
    /**
     * Returns the Global Party ID for the customer, if there is one.
     * Global Party ID is created by Customer 360 and identifies a person across multiple systems.
     */
    getGlobalPartyID(): string;
    /**
     * Returns the unique, system generated ID of the customer.
     */
    getID(): string;
    /**
     * Returns the note for this customer, or `null` if this customer has no note, such as for an anonymous
     * customer or when note has 0 length.
     */
    getNote(): string | null;
    /**
     * Returns the customer order history.
     */
    getOrderHistory(): OrderHistory;
    /**
     * Returns the product lists of the specified type.
     * @see dw.customer.ProductList
     */
    getProductLists(type: number): Collection<ProductList>;
    /**
     * Returns the customer profile.
     */
    getProfile(): Profile;
    /**
     * Identifies if the customer is anonymous. An anonymous
     * customer is the opposite of a registered customer.
     */
    isAnonymous(): boolean;
    /**
     * Identifies if the customer is authenticated. This method checks whether
     * this customer is the customer associated with the session and than checks
     * whether the session in an authenticated state.
     * 
     * Note: The pipeline debugger will always show 'false' for this value
     * regardless of whether the customer is authenticated or not.
     */
    isAuthenticated(): boolean;
    /**
     * Identifies if the customer is externally authenticated. An externally
     * authenticated customer does not have the password stored in our system
     * but logs in through an external OAuth provider (Google, Facebook, LinkedIn, etc.)
     */
    isExternallyAuthenticated(): boolean;
    /**
     * Returns true if there exist CustomerGroup for all of the given IDs and the customer is member of at least one of that groups.
     */
    isMemberOfAnyCustomerGroup(...groupIDs: string[]): boolean;
    /**
     * Returns true if the customer is member of the specified
     * CustomerGroup.
     */
    isMemberOfCustomerGroup(group: CustomerGroup): boolean;
    /**
     * Returns true if there is a CustomerGroup with such an ID and the customer is member of that group.
     */
    isMemberOfCustomerGroup(groupID: string): boolean;
    /**
     * Returns true if there exist CustomerGroup for all of the given IDs and the customer is member of all that groups.
     */
    isMemberOfCustomerGroups(...groupIDs: string[]): boolean;
    /**
     * Identifies if the customer is registered. A registered customer
     * may or may not be authenticated. This method checks whether
     * the user has a profile.
     */
    isRegistered(): boolean;
    /**
     * Removes an external profile from the customer
     */
    removeExternalProfile(externalProfile: ExternalProfile): void;
    /**
     * Sets the note for this customer. This is a no-op for an anonymous customer.
     */
    setNote(aValue: string): void;
}

export = Customer;
