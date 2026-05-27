import List = require('../util/List');
import Image = require('../experience/image/Image');
import MediaFile = require('../content/MediaFile');

/**
 * Represents a product variation attribute
 */
declare class ProductVariationAttributeValue {
    /**
     * Returns the ID of the product variation attribute value.
     */
    readonly ID: string;
    /**
     * Returns the description of the product variation attribute value in the current locale.
     */
    readonly description: string | null;
    /**
     * Returns the display value for the product variation attribute value, which can be used in the
     * user interface.
     */
    readonly displayValue: string;
    /**
     * Returns the value for the product variation attribute value.
     */
    readonly value: any;
    private constructor();
    /**
     * Returns true if the specified object is equal to this object.
     */
    equals(obj: any): boolean;
    /**
     * Returns the description of the product variation attribute value in the current locale.
     */
    getDescription(): string | null;
    /**
     * Returns the display value for the product variation attribute value, which can be used in the
     * user interface.
     */
    getDisplayValue(): string;
    /**
     * Returns the ID of the product variation attribute value.
     */
    getID(): string;
    /**
     * The method calls getImages and returns the image at
     * the specific index.
     * 
     * If images are defined for this view type and variant, but not for
     * specified index, the method returns null.
     * 
     * If no images are defined for this variant and specified view type, the
     * image at the specified index of the master product images is returned. If
     * no master product image for specified index is defined, the method
     * returns null.
     * @throws NullArgumentException if viewtype is null
     */
    getImage(viewtype: string, index: number): MediaFile | null;
    /**
     * The method calls getImages and returns the first image
     * of the list. The method is specifically built for handling color
     * swatches in an apparel site.
     * 
     * If no images are defined for this variant and specified view type, then
     * the first image of the master product images for that view type is
     * returned. If no master product images are defined, the method returns
     * null.
     * @throws NullArgumentException if viewtype is null
     */
    getImage(viewtype: string): MediaFile | null;
    /**
     * Returns all images that match the given view type and have the variant
     * value of this value, which is typically the 'color' attribute. The images
     * are returned in the order of their index number ascending.
     * 
     * If no images are defined for this variant, then the images of the master
     * for that view type are returned.
     * @throws NullArgumentException if viewtype is null
     */
    getImages(viewtype: string): List<Image>;
    /**
     * Returns the value for the product variation attribute value.
     */
    getValue(): any;
    /**
     * Calculates the hash code for a product variation attribute value.
     */
    hashCode(): number;
}

export = ProductVariationAttributeValue;
