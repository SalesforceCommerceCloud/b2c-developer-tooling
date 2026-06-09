import ExtensibleObject = require('./ExtensibleObject');
import CustomAttributes = require('./CustomAttributes');

declare global {
    module ICustomAttributes {
        interface CustomObject extends CustomAttributes {
        }
    }
}

/**
 * Represents a custom object and its corresponding attributes.
 */
declare class CustomObject extends ExtensibleObject<ICustomAttributes.CustomObject> {
    /**
     * Returns the type of the CustomObject.
     */
    readonly type: string;
    private constructor();
    /**
     * Returns the type of the CustomObject.
     */
    getType(): string;
}

export = CustomObject;
