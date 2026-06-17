import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import ProductOptionValue = require('./ProductOptionValue');
import Collection = require('../util/Collection');
import MediaFile = require('../content/MediaFile');

declare global {
    module ICustomAttributes {
        interface ProductOption extends CustomAttributes {
        }
    }
}

/**
 * Represents a product option.
 */
declare class ProductOption extends ExtensibleObject<ICustomAttributes.ProductOption> {
    /**
     * Returns the product option ID.
     */
    readonly ID: string;
    /**
     * Returns the default value for the product option.
     */
    readonly defaultValue: ProductOptionValue;
    /**
     * Returns the product option's short description in the current locale.
     */
    readonly description: string | null;
    /**
     * Returns the product option's display name in the current locale.
     */
    readonly displayName: string | null;
    /**
     * Returns an HTML representation of the option id.
     */
    readonly htmlName: string;
    /**
     * Returns the product option's image.
     */
    readonly image: MediaFile;
    /**
     * Returns a collection containing the product option values.
     */
    readonly optionValues: Collection<ProductOptionValue>;
    private constructor();
    /**
     * Returns the default value for the product option.
     */
    getDefaultValue(): ProductOptionValue;
    /**
     * Returns the product option's short description in the current locale.
     */
    getDescription(): string | null;
    /**
     * Returns the product option's display name in the current locale.
     */
    getDisplayName(): string | null;
    /**
     * Returns an HTML representation of the option id.
     */
    getHtmlName(): string;
    /**
     * Returns an HTML representation of the option id with the custom prefix.
     */
    getHtmlName(prefix: string): string;
    /**
     * Returns the product option ID.
     */
    getID(): string;
    /**
     * Returns the product option's image.
     */
    getImage(): MediaFile;
    /**
     * Returns a collection containing the product option values.
     */
    getOptionValues(): Collection<ProductOptionValue>;
}

export = ProductOption;
