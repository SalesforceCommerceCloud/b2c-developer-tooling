import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Category = require('./Category');
import Product = require('./Product');
import MarkupText = require('../content/MarkupText');
import MediaFile = require('../content/MediaFile');

declare global {
    module ICustomAttributes {
        interface CategoryAssignment extends CustomAttributes {
        }
    }
}

/**
 * Represents a category assignment in Commerce Cloud Digital.
 */
declare class CategoryAssignment extends ExtensibleObject<ICustomAttributes.CategoryAssignment> {
    /**
     * Returns the category assignment's callout message in the current locale.
     */
    readonly calloutMsg: MarkupText | null;
    /**
     * Returns the category to which this category assignment is bound.
     */
    readonly category: Category;
    /**
     * Returns the category assignment's image.
     */
    readonly image: MediaFile;
    /**
     * Returns the category assignment's long description in the current locale.
     */
    readonly longDescription: MarkupText | null;
    /**
     * Returns the name of the category assignment in the current locale.
     */
    readonly name: string | null;
    /**
     * Returns the product to which this category assignment is bound.
     */
    readonly product: Product<any>;
    /**
     * Returns the category assignment's short description in the current locale.
     */
    readonly shortDescription: MarkupText | null;
    private constructor();
    /**
     * Returns the category assignment's callout message in the current locale.
     */
    getCalloutMsg(): MarkupText | null;
    /**
     * Returns the category to which this category assignment is bound.
     */
    getCategory(): Category;
    /**
     * Returns the category assignment's image.
     */
    getImage(): MediaFile;
    /**
     * Returns the category assignment's long description in the current locale.
     */
    getLongDescription(): MarkupText | null;
    /**
     * Returns the name of the category assignment in the current locale.
     */
    getName(): string | null;
    /**
     * Returns the product to which this category assignment is bound.
     */
    getProduct(): Product<any>;
    /**
     * Returns the category assignment's short description in the current locale.
     */
    getShortDescription(): MarkupText | null;
}

export = CategoryAssignment;
