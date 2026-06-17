import URL = require('../../web/URL');
import List = require('../../util/List');
import Money = require('../../value/Money');

/**
 * Represents a row in the Pinterest catalog feed export.
 */
declare class PinterestProduct {
    /**
     * Indicates that the product is in stock.
     */
    static readonly AVAILABILITY_IN_STOCK: string;
    /**
     * Indicates that the product is not in stock.
     */
    static readonly AVAILABILITY_OUT_OF_STOCK: string;
    /**
     * Indicates that the product is availabile in preorder.
     */
    static readonly AVAILABILITY_PREORDER: string;
    /**
     * Indicates that the product has never been used.
     */
    static readonly CONDITION_NEW: string;
    /**
     * Indicates that the product has been used but refurbished.
     */
    static readonly CONDITION_REFURBISHED: string;
    /**
     * Indicates that the product has been used.
     */
    static readonly CONDITION_USED: string;
    /**
     * Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.
     */
    readonly ID: string;
    /**
     * Returns the availability of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_IN_STOCK or
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_OUT_OF_STOCK.
     */
    availability: string;
    /**
     * Returns the Pinterest brand of the product.
     */
    brand: string;
    /**
     * Returns the Pinterest color value label of the product.
     */
    color: string;
    /**
     * Returns the Pinterest color hex value of the product.
     */
    colorHex: string;
    /**
     * Returns the URL of the image to show in Pinterest for the product color (swatch).
     */
    colorImage: URL;
    /**
     * Returns the condition of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.CONDITION_NEW,
     * dw.extensions.pinterest.PinterestProduct.CONDITION_REFURBISHED, or
     * dw.extensions.pinterest.PinterestProduct.CONDITION_USED.
     */
    condition: string;
    /**
     * Returns the Pinterest description of the product.
     */
    description: string;
    /**
     * Returns the category of this product in the Google category taxonomy.
     */
    googleProductCategory: string;
    /**
     * Returns the Pinterest GTIN of the product.
     */
    gtin: string;
    /**
     * Returns a list containing the URLs of the image to show in Pinterest for the product.
     */
    imageLinks: List<string>;
    /**
     * Returns the ID of the Pinterest item group for the product, that is, its master product.
     */
    itemGroupID: string;
    /**
     * Returns the URL of the Pinterest item group for the product, that is, the link to its master product in the
     * Demandware storefront.
     */
    itemGroupLink: URL;
    /**
     * Returns the URL of the Demandware storefront link to the product.
     */
    link: URL;
    /**
     * Returns the maximum price to show in Pinterest for the product.
     */
    maxPrice: Money;
    /**
     * Returns the minimum price to show in Pinterest for the product.
     */
    minPrice: Money;
    /**
     * Returns the price to show in Pinterest for the product.
     */
    price: Money;
    /**
     * Returns the Pinterest category path of the product.
     */
    productCategory: string;
    /**
     * Returns the Pinterest return policy of the product.
     */
    returnPolicy: string;
    /**
     * Returns the Pinterest size value label of the product.
     */
    size: string;
    /**
     * Returns the Pinterest title of the product.
     */
    title: string;
    private constructor();
    /**
     * Returns the availability of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_IN_STOCK or
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_OUT_OF_STOCK.
     */
    getAvailability(): string;
    /**
     * Returns the Pinterest brand of the product.
     */
    getBrand(): string;
    /**
     * Returns the Pinterest color value label of the product.
     */
    getColor(): string;
    /**
     * Returns the Pinterest color hex value of the product.
     */
    getColorHex(): string;
    /**
     * Returns the URL of the image to show in Pinterest for the product color (swatch).
     */
    getColorImage(): URL;
    /**
     * Returns the condition of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.CONDITION_NEW,
     * dw.extensions.pinterest.PinterestProduct.CONDITION_REFURBISHED, or
     * dw.extensions.pinterest.PinterestProduct.CONDITION_USED.
     */
    getCondition(): string;
    /**
     * Returns the Pinterest description of the product.
     */
    getDescription(): string;
    /**
     * Returns the category of this product in the Google category taxonomy.
     */
    getGoogleProductCategory(): string;
    /**
     * Returns the Pinterest GTIN of the product.
     */
    getGtin(): string;
    /**
     * Returns the ID of the Pinterest product. This is the same as the ID of the Demandware product.
     */
    getID(): string;
    /**
     * Returns a list containing the URLs of the image to show in Pinterest for the product.
     */
    getImageLinks(): List<string>;
    /**
     * Returns the ID of the Pinterest item group for the product, that is, its master product.
     */
    getItemGroupID(): string;
    /**
     * Returns the URL of the Pinterest item group for the product, that is, the link to its master product in the
     * Demandware storefront.
     */
    getItemGroupLink(): URL;
    /**
     * Returns the URL of the Demandware storefront link to the product.
     */
    getLink(): URL;
    /**
     * Returns the maximum price to show in Pinterest for the product.
     */
    getMaxPrice(): Money;
    /**
     * Returns the minimum price to show in Pinterest for the product.
     */
    getMinPrice(): Money;
    /**
     * Returns the price to show in Pinterest for the product.
     */
    getPrice(): Money;
    /**
     * Returns the Pinterest category path of the product.
     */
    getProductCategory(): string;
    /**
     * Returns the Pinterest return policy of the product.
     */
    getReturnPolicy(): string;
    /**
     * Returns the Pinterest size value label of the product.
     */
    getSize(): string;
    /**
     * Returns the Pinterest title of the product.
     */
    getTitle(): string;
    /**
     * Sets the availability of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_IN_STOCK or
     * dw.extensions.pinterest.PinterestProduct.AVAILABILITY_OUT_OF_STOCK.
     */
    setAvailability(availability: string): void;
    /**
     * Sets the Pinterest brand of the product.
     */
    setBrand(brand: string): void;
    /**
     * Sets the Pinterest color value label of the product.
     */
    setColor(color: string): void;
    /**
     * Sets the Pinterest color hex value of the product.
     */
    setColorHex(colorHex: string): void;
    /**
     * Sets the URL of the image to show in Pinterest for the product color (swatch).
     */
    setColorImage(colorImage: URL): void;
    /**
     * Sets the condition of the Pinterest product. Possible values are
     * dw.extensions.pinterest.PinterestProduct.CONDITION_NEW,
     * dw.extensions.pinterest.PinterestProduct.CONDITION_REFURBISHED, or
     * dw.extensions.pinterest.PinterestProduct.CONDITION_USED.
     */
    setCondition(condition: string): void;
    /**
     * Sets the Pinterest description of the product.
     */
    setDescription(description: string): void;
    /**
     * Sets the category of this product in the Google category taxonomy.
     */
    setGoogleProductCategory(googleProductCategory: string): void;
    /**
     * Sets the Pinterest GTIN of the product.
     */
    setGtin(gtin: string): void;
    /**
     * Sets the list of URLs of images to show in Pinterest for the product.
     */
    setImageLinks(imageLinks: List<any>): void;
    /**
     * Sets the ID of the Pinterest item group for the product, that is, its master product.
     */
    setItemGroupID(itemGroupID: string): void;
    /**
     * Sets the URL of the Pinterest item group for the product, that is, the link to its master product in the
     * Demandware storefront.
     */
    setItemGroupLink(itemGroupLink: URL): void;
    /**
     * Sets the URL of the Demandware storefront link to the product.
     */
    setLink(link: URL): void;
    /**
     * Sets the maximum price to show in Pinterest for the product.
     */
    setMaxPrice(maxPrice: Money): void;
    /**
     * Sets the minimum price to show in Pinterest for the product.
     */
    setMinPrice(minPrice: Money): void;
    /**
     * Sets the price to show in Pinterest for the product.
     */
    setPrice(price: Money): void;
    /**
     * Sets the Pinterest category path of the product.
     */
    setProductCategory(productCategory: string): void;
    /**
     * Sets the Pinterest return policy of the product.
     */
    setReturnPolicy(returnPolicy: string): void;
    /**
     * Sets the Pinterest size value label of the product.
     */
    setSize(size: string): void;
    /**
     * Sets the Pinterest title of the product.
     */
    setTitle(title: string): void;
}

export = PinterestProduct;
