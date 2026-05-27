import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import Store = require('./Store');

declare global {
    module ICustomAttributes {
        interface StoreGroup extends CustomAttributes {
        }
    }
}

/**
 * Represents a store group. Store groups can be used to group the stores for different marketing purposes.
 */
declare class StoreGroup extends ExtensibleObject<ICustomAttributes.StoreGroup> {
    /**
     * Returns the ID of the store group.
     */
    readonly ID: string;
    /**
     * Returns the name of the store group.
     */
    readonly name: string;
    /**
     * Returns all the stores that are assigned to the store group.
     */
    readonly stores: Collection<Store>;
    private constructor();
    /**
     * Returns the ID of the store group.
     */
    getID(): string;
    /**
     * Returns the name of the store group.
     */
    getName(): string;
    /**
     * Returns all the stores that are assigned to the store group.
     */
    getStores(): Collection<Store>;
}

export = StoreGroup;
