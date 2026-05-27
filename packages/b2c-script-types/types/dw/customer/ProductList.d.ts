import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import EnumValue = require('../value/EnumValue');
import ProductListItem = require('./ProductListItem');
import Collection = require('../util/Collection');
import Product = require('../catalog/Product');
import ProductListRegistrant = require('./ProductListRegistrant');
import CustomerAddress = require('./CustomerAddress');
import ProductListItemPurchase = require('./ProductListItemPurchase');
import Customer = require('./Customer');

declare global {
    module ICustomAttributes {
        interface ProductList extends CustomAttributes {
        }
    }
}

/**
 * Represents a list of products (and optionally a gift certificate) that is
 * typically maintained by a customer.  This class can be used to implement
 * a number of different storefront features, e.g. shopping list, wish list and gift registry.
 * A product list is always owned by a customer. The owner can be anonymous or a registered customer.
 * The owner can be the person for which items from that list will be purchased (wish list).
 * Or it can be a person who maintains the list, for example a gift registry, on behalf of the bridal couple.
 * Each product list can have a registrant and a co-registrant. A registrant is typically associated with an event related product list
 * such as a gift registry. It holds information about a person associated with the
 * event such as a bride or groom.
 * A shipping address can be associated with this product list to ship the items,
 * e.g. to an event location. A post-event shipping address can be associated to
 * ship items to which could not be delivered on event date.
 * The product list can also hold information about the event date and event location.
 */
declare class ProductList extends ExtensibleObject<ICustomAttributes.ProductList> {
    /**
     * Constant for when Export Status is Exported
     */
    static readonly EXPORT_STATUS_EXPORTED: number;
    /**
     * Constant for when Export Status is Not Exported
     */
    static readonly EXPORT_STATUS_NOTEXPORTED: number;
    /**
     * Constant representing a custom list type attribute.
     */
    static readonly TYPE_CUSTOM_1: number;
    /**
     * Constant representing a custom list type attribute.
     */
    static readonly TYPE_CUSTOM_2: number;
    /**
     * Constant representing a custom list type attribute.
     */
    static readonly TYPE_CUSTOM_3: number;
    /**
     * Constant representing the gift registry type attribute.
     */
    static readonly TYPE_GIFT_REGISTRY: number;
    /**
     * Constant representing the shopping list type attribute.
     */
    static readonly TYPE_SHOPPING_LIST: number;
    /**
     * Constant representing the wish list registry type attribute.
     */
    static readonly TYPE_WISH_LIST: number;
    /**
     * Returns the unique system generated ID of the object.
     */
    readonly ID: string;
    /**
     * Returns true if this product list is owned by an anonymous customer.
     */
    readonly anonymous: boolean;
    /**
     * Returns the ProductListRegistrant assigned to the coRegistrant attribute or null
     * if this list has no co-registrant.
     */
    readonly coRegistrant: ProductListRegistrant | null;
    /**
     * This is a helper method typically used with an event related list.
     * It provides the appropriate shipping address based on the eventDate.
     * If the current date is after the eventDate, then the postEventShippingAddress
     * is returned, otherwise the shippingAddress is returned.  If the eventDate
     * is null, then null is returned.
     */
    readonly currentShippingAddress: CustomerAddress | null;
    /**
     * Returns a description text that, for example, explains the purpose of this product list.
     */
    description: string;
    /**
     * For event related uses (e.g. gift registry), this holds the event city.
     */
    eventCity: string;
    /**
     * For event related uses (e.g. gift registry), this holds the event country.
     */
    eventCountry: string;
    /**
     * For event related uses (e.g. gift registry), this holds the date
     * of the event.
     */
    eventDate: Date;
    /**
     * For event related uses (e.g. gift registry), this holds the event state.
     */
    eventState: string;
    /**
     * For event related uses (e.g. gift registry), this holds the type
     * of event, e.g. Wedding, Baby Shower.
     */
    eventType: string;
    /**
     * Returns the export status of the product list.
     * 
     * Possible values are: EXPORT_STATUS_NOTEXPORTED,
     * EXPORT_STATUS_EXPORTED.
     */
    readonly exportStatus: EnumValue;
    /**
     * Returns the item in the list that represents a gift certificate.
     */
    readonly giftCertificateItem: ProductListItem | null;
    /**
     * Returns a collection containing all items in the list.
     */
    readonly items: Collection<ProductListItem>;
    /**
     * Returns the date where this product list has been exported successfully
     * the last time.
     */
    readonly lastExportTime: Date | null;
    /**
     * Returns the name of this product list given by its owner.
     */
    name: string;
    /**
     * Returns the customer that created and owns the product list.
     */
    readonly owner: Customer;
    /**
     * Returns the shipping address for purchases made after the event date.
     */
    postEventShippingAddress: CustomerAddress | null;
    /**
     * Returns a collection containing all items in the list that reference products.
     */
    readonly productItems: Collection<ProductListItem>;
    /**
     * A flag, typically used to determine if the object is searchable
     * by other customers.
     */
    public: boolean;
    /**
     * Returns a collection containing all items in the list that are flagged as public.
     */
    readonly publicItems: Collection<ProductListItem>;
    /**
     * Returns the aggregated purchases from all the individual items.
     */
    readonly purchases: Collection<ProductListItemPurchase>;
    /**
     * Returns the ProductListRegistrant assigned to the registrant attribute or null
     * if this list has no registrant.
     */
    readonly registrant: ProductListRegistrant | null;
    /**
     * Return the address that should be used as the shipping address for purchases
     * made from the list.
     */
    shippingAddress: CustomerAddress | null;
    /**
     * Returns an int representing the type of object (e.g. wish list,
     * gift registry). This is set at object creation time.
     */
    readonly type: number;
    private constructor();
    /**
     * Create a ProductListRegistrant and assign it to the coRegistrant attribute
     * of the list.  An exception is thrown if the list already has a coRegistrant
     * assigned to it.
     * @throws CreateException if one already exists
     */
    createCoRegistrant(): ProductListRegistrant;
    /**
     * Create an item in the list that represents a gift certificate.
     * A list may only contain a single gift certificate, so an exception
     * is thrown if one already exists in the list.
     * @throws CreateException if a gift certificate item already exists in the list.
     */
    createGiftCertificateItem(): ProductListItem;
    /**
     * Create an item in the list that references the specified product.
     */
    createProductItem(product: Product<any>): ProductListItem;
    /**
     * Create a ProductListRegistrant and assign it to the registrant attribute
     * of the list.  An exception is thrown if the list already has a registrant
     * assigned to it.
     * @throws CreateException if one already exists
     */
    createRegistrant(): ProductListRegistrant;
    /**
     * Returns the ProductListRegistrant assigned to the coRegistrant attribute or null
     * if this list has no co-registrant.
     */
    getCoRegistrant(): ProductListRegistrant | null;
    /**
     * This is a helper method typically used with an event related list.
     * It provides the appropriate shipping address based on the eventDate.
     * If the current date is after the eventDate, then the postEventShippingAddress
     * is returned, otherwise the shippingAddress is returned.  If the eventDate
     * is null, then null is returned.
     */
    getCurrentShippingAddress(): CustomerAddress | null;
    /**
     * Returns a description text that, for example, explains the purpose of this product list.
     */
    getDescription(): string;
    /**
     * For event related uses (e.g. gift registry), this holds the event city.
     */
    getEventCity(): string;
    /**
     * For event related uses (e.g. gift registry), this holds the event country.
     */
    getEventCountry(): string;
    /**
     * For event related uses (e.g. gift registry), this holds the date
     * of the event.
     */
    getEventDate(): Date;
    /**
     * For event related uses (e.g. gift registry), this holds the event state.
     */
    getEventState(): string;
    /**
     * For event related uses (e.g. gift registry), this holds the type
     * of event, e.g. Wedding, Baby Shower.
     */
    getEventType(): string;
    /**
     * Returns the export status of the product list.
     * 
     * Possible values are: EXPORT_STATUS_NOTEXPORTED,
     * EXPORT_STATUS_EXPORTED.
     */
    getExportStatus(): EnumValue;
    /**
     * Returns the item in the list that represents a gift certificate.
     */
    getGiftCertificateItem(): ProductListItem | null;
    /**
     * Returns the unique system generated ID of the object.
     */
    getID(): string;
    /**
     * Returns the item from the list that has the specified ID.
     */
    getItem(ID: string): ProductListItem | null;
    /**
     * Returns a collection containing all items in the list.
     */
    getItems(): Collection<ProductListItem>;
    /**
     * Returns the date where this product list has been exported successfully
     * the last time.
     */
    getLastExportTime(): Date | null;
    /**
     * Returns the name of this product list given by its owner.
     */
    getName(): string;
    /**
     * Returns the customer that created and owns the product list.
     */
    getOwner(): Customer;
    /**
     * Returns the shipping address for purchases made after the event date.
     */
    getPostEventShippingAddress(): CustomerAddress | null;
    /**
     * Returns a collection containing all items in the list that reference products.
     */
    getProductItems(): Collection<ProductListItem>;
    /**
     * Returns a collection containing all items in the list that are flagged as public.
     */
    getPublicItems(): Collection<ProductListItem>;
    /**
     * Returns the aggregated purchases from all the individual items.
     */
    getPurchases(): Collection<ProductListItemPurchase>;
    /**
     * Returns the ProductListRegistrant assigned to the registrant attribute or null
     * if this list has no registrant.
     */
    getRegistrant(): ProductListRegistrant | null;
    /**
     * Return the address that should be used as the shipping address for purchases
     * made from the list.
     */
    getShippingAddress(): CustomerAddress | null;
    /**
     * Returns an int representing the type of object (e.g. wish list,
     * gift registry). This is set at object creation time.
     */
    getType(): number;
    /**
     * Returns true if this product list is owned by an anonymous customer.
     */
    isAnonymous(): boolean;
    /**
     * A flag, typically used to determine if the object is searchable
     * by other customers.
     */
    isPublic(): boolean;
    /**
     * Removes the ProductListRegistrant assigned to the coRegistrant attribute.
     */
    removeCoRegistrant(): void;
    /**
     * Removes the specified item from the list.  This will also cause
     * all purchase information associated with that item to be removed.
     */
    removeItem(item: ProductListItem): void;
    /**
     * Removes the ProductListRegistrant assigned to the registrant attribute.
     */
    removeRegistrant(): void;
    /**
     * Set the description of this product list.
     */
    setDescription(description: string): void;
    /**
     * Set the event city to which this product list is related.
     */
    setEventCity(eventCity: string): void;
    /**
     * Set the event country to which this product list is related.
     */
    setEventCountry(eventCountry: string): void;
    /**
     * Set the date of the event to which this product list is related.
     */
    setEventDate(eventDate: Date | null): void;
    /**
     * Set the event state to which this product list is related.
     */
    setEventState(eventState: string): void;
    /**
     * Set the event type for which this product list was created by the owner.
     */
    setEventType(eventType: string): void;
    /**
     * Set the name of this product list.
     */
    setName(name: string): void;
    /**
     * This is typically used by an event related list (e.g. gift registry) to
     * specify a shipping address for purchases made after the event date.
     */
    setPostEventShippingAddress(address: CustomerAddress): void;
    /**
     * Makes this product list visible to other customers or hides it.
     */
    setPublic(flag: boolean): void;
    /**
     * Associate an address, used as the shipping address for purchases
     * made from the list.
     */
    setShippingAddress(address: CustomerAddress): void;
}

export = ProductList;
