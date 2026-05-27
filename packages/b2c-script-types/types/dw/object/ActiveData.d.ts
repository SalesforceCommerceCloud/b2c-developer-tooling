import ExtensibleObject = require('./ExtensibleObject');
import CustomAttributes = require('./CustomAttributes');

declare global {
    module ICustomAttributes {
        interface ActiveData extends CustomAttributes {
        }
    }
}

/**
 * Represents the active data for an object in Commerce Cloud Digital.
 */
declare class ActiveData<T extends ICustomAttributes.ActiveData = ICustomAttributes.ActiveData> extends ExtensibleObject<T> {
    /**
     * Return true if the ActiveData doesn't exist for the object
     */
    readonly empty: boolean;
    /**
     * Return true if the ActiveData doesn't exist for the object
     */
    isEmpty(): boolean;
}

export = ActiveData;
