import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface ProductOptionValue extends CustomAttributes {
        }
    }
}

/**
 * Represents the value of a product option.
 */
declare class ProductOptionValue extends ExtensibleObject<ICustomAttributes.ProductOptionValue> {
    /**
     * Returns the product option value's ID.
     */
    readonly ID: string;
    /**
     * Returns the the product option value's description
     * in the current locale.
     */
    readonly description: string | null;
    /**
     * Returns the the product option value's display name
     * in the current locale.
     */
    readonly displayValue: string | null;
    /**
     * Returns the product option value's product ID modifier which
     * can be used to build the SKU for the actual product.
     */
    readonly productIDModifier: string;
    private constructor();
    /**
     * Returns the the product option value's description
     * in the current locale.
     */
    getDescription(): string | null;
    /**
     * Returns the the product option value's display name
     * in the current locale.
     */
    getDisplayValue(): string | null;
    /**
     * Returns the product option value's ID.
     */
    getID(): string;
    /**
     * Returns the product option value's product ID modifier which
     * can be used to build the SKU for the actual product.
     */
    getProductIDModifier(): string;
}

export = ProductOptionValue;
