import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import EnumValue = require('../value/EnumValue');
import MarkupText = require('../content/MarkupText');
import MediaFile = require('../content/MediaFile');
import ProductInventoryList = require('./ProductInventoryList');
import Collection = require('../util/Collection');
import StoreGroup = require('./StoreGroup');

declare global {
    module ICustomAttributes {
        interface Store extends CustomAttributes {
        }
    }
}

/**
 * Represents a store in Commerce Cloud Digital.
 */
declare class Store extends ExtensibleObject<ICustomAttributes.Store> {
    /**
     * Returns the ID of the store.
     */
    readonly ID: string;
    /**
     * Returns the address1 of the store.
     */
    readonly address1: string;
    /**
     * Returns the address2 of the store.
     */
    readonly address2: string;
    /**
     * Returns the city of the store.
     */
    readonly city: string;
    /**
     * Returns the countryCode of the store.
     */
    readonly countryCode: EnumValue;
    /**
     * Returns the demandwarePosEnabled flag for the store.
     * Indicates that this store uses Commerce Cloud Store for point-of-sale.
     * @deprecated Use isPosEnabled instead
     */
    readonly demandwarePosEnabled: boolean;
    /**
     * Returns the email of the store.
     */
    readonly email: string;
    /**
     * Returns the fax of the store.
     */
    readonly fax: string;
    /**
     * Returns the store image.
     */
    readonly image: MediaFile;
    /**
     * Returns the inventory list the store is associated with. If the
     * store is not associated with a inventory list, or the inventory list does not
     * exist, the method returns null.
     */
    readonly inventoryList: ProductInventoryList | null;
    /**
     * Returns the inventory list id the store is associated with. If the
     * store is not associated with a inventory list, or the inventory list does not
     * exist, the method returns null.
     */
    readonly inventoryListID: string;
    /**
     * Returns the latitude of the store.
     */
    readonly latitude: number;
    /**
     * Returns the longitude of the store.
     */
    readonly longitude: number;
    /**
     * Returns the name of the store.
     */
    readonly name: string;
    /**
     * Returns the phone of the store.
     */
    readonly phone: string;
    /**
     * Returns the posEnabled flag for the Store.
     * Indicates that this store uses Commerce Cloud Store for point-of-sale.
     */
    readonly posEnabled: boolean;
    /**
     * Returns the postalCode of the store.
     */
    readonly postalCode: string;
    /**
     * Returns the stateCode of the store.
     */
    readonly stateCode: string;
    /**
     * Returns the storeEvents of the store.
     */
    readonly storeEvents: MarkupText;
    /**
     * Returns all the store groups this store belongs to.
     */
    readonly storeGroups: Collection<StoreGroup>;
    /**
     * Returns the storeHours of the store.
     */
    readonly storeHours: MarkupText;
    /**
     * Returns the storeLocatorEnabled flag for the store.
     */
    readonly storeLocatorEnabled: boolean;
    private constructor();
    /**
     * Returns the address1 of the store.
     */
    getAddress1(): string;
    /**
     * Returns the address2 of the store.
     */
    getAddress2(): string;
    /**
     * Returns the city of the store.
     */
    getCity(): string;
    /**
     * Returns the countryCode of the store.
     */
    getCountryCode(): EnumValue;
    /**
     * Returns the email of the store.
     */
    getEmail(): string;
    /**
     * Returns the fax of the store.
     */
    getFax(): string;
    /**
     * Returns the ID of the store.
     */
    getID(): string;
    /**
     * Returns the store image.
     */
    getImage(): MediaFile;
    /**
     * Returns the inventory list the store is associated with. If the
     * store is not associated with a inventory list, or the inventory list does not
     * exist, the method returns null.
     */
    getInventoryList(): ProductInventoryList | null;
    /**
     * Returns the inventory list id the store is associated with. If the
     * store is not associated with a inventory list, or the inventory list does not
     * exist, the method returns null.
     */
    getInventoryListID(): string;
    /**
     * Returns the latitude of the store.
     */
    getLatitude(): number;
    /**
     * Returns the longitude of the store.
     */
    getLongitude(): number;
    /**
     * Returns the name of the store.
     */
    getName(): string;
    /**
     * Returns the phone of the store.
     */
    getPhone(): string;
    /**
     * Returns the postalCode of the store.
     */
    getPostalCode(): string;
    /**
     * Returns the stateCode of the store.
     */
    getStateCode(): string;
    /**
     * Returns the storeEvents of the store.
     */
    getStoreEvents(): MarkupText;
    /**
     * Returns all the store groups this store belongs to.
     */
    getStoreGroups(): Collection<StoreGroup>;
    /**
     * Returns the storeHours of the store.
     */
    getStoreHours(): MarkupText;
    /**
     * Returns the demandwarePosEnabled flag for the store.
     * Indicates that this store uses Commerce Cloud Store for point-of-sale.
     * @deprecated Use isPosEnabled instead
     */
    isDemandwarePosEnabled(): boolean;
    /**
     * Returns the posEnabled flag for the Store.
     * Indicates that this store uses Commerce Cloud Store for point-of-sale.
     */
    isPosEnabled(): boolean;
    /**
     * Returns the storeLocatorEnabled flag for the store.
     */
    isStoreLocatorEnabled(): boolean;
}

export = Store;
