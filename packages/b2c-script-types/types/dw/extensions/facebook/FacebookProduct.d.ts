import List = require('../../util/List');
import URL = require('../../web/URL');
import Money = require('../../value/Money');
import Quantity = require('../../value/Quantity');

/**
 * Represents a row in the Facebook catalog feed export.
 */
declare class FacebookProduct {
    /**
     * Indicates that the product is for adults.
     */
    static readonly AGE_GROUP_ADULT: string;
    /**
     * Indicates that the product is for infant children.
     */
    static readonly AGE_GROUP_INFANT: string;
    /**
     * Indicates that the product is for children.
     */
    static readonly AGE_GROUP_KIDS: string;
    /**
     * Indicates that the product is for newborn children.
     */
    static readonly AGE_GROUP_NEWBORN: string;
    /**
     * Indicates that the product is for toddler children.
     */
    static readonly AGE_GROUP_TODDLER: string;
    /**
     * Indicates that the product can be ordered for later shipment.
     */
    static readonly AVAILABILITY_AVAILABLE_FOR_ORDER: string;
    /**
     * Indicates that the product is available to ship immediately.
     */
    static readonly AVAILABILITY_IN_STOCK: string;
    /**
     * Indicates that the product is out of stock.
     */
    static readonly AVAILABILITY_OUT_OF_STOCK: string;
    /**
     * Indicates that the product will be available in the future.
     */
    static readonly AVAILABILITY_PREORDER: string;
    /**
     * Indicates that the product is new.
     */
    static readonly CONDITION_NEW: string;
    /**
     * Indicates that the product is used but has been refurbished.
     */
    static readonly CONDITION_REFURBISHED: string;
    /**
     * Indicates that the product has been used.
     */
    static readonly CONDITION_USED: string;
    /**
     * Indicates that the product is for females.
     */
    static readonly GENDER_FEMALE: string;
    /**
     * Indicates that the product is for males.
     */
    static readonly GENDER_MALE: string;
    /**
     * Indicates that the product is for both males and females.
     */
    static readonly GENDER_UNISEX: string;
    /**
     * Indicates that the product is measured in centimeters.
     */
    static readonly SHIPPING_SIZE_UNIT_CM: string;
    /**
     * Indicates that the product is measured in feet.
     */
    static readonly SHIPPING_SIZE_UNIT_FT: string;
    /**
     * Indicates that the product is measured in inches.
     */
    static readonly SHIPPING_SIZE_UNIT_IN: string;
    /**
     * Indicates that the product is measured in meters.
     */
    static readonly SHIPPING_SIZE_UNIT_M: string;
    /**
     * Indicates that the product is weighed in grams.
     */
    static readonly SHIPPING_WEIGHT_UNIT_G: string;
    /**
     * Indicates that the product is weighed in kilograms.
     */
    static readonly SHIPPING_WEIGHT_UNIT_KG: string;
    /**
     * Indicates that the product is weighed in pounds.
     */
    static readonly SHIPPING_WEIGHT_UNIT_LB: string;
    /**
     * Indicates that the product is weighed in ounces.
     */
    static readonly SHIPPING_WEIGHT_UNIT_OZ: string;
    /**
     * Returns the ID of the Facebook product. This is the same as the ID of the Demandware product.
     */
    readonly ID: string;
    /**
     * Returns the age group for the Facebook product.
     */
    ageGroup: string;
    /**
     * Returns the availability of the Facebook product.
     */
    availability: string;
    /**
     * Returns the Facebook brand of the product.
     */
    brand: string;
    /**
     * Returns the Facebook color value label of the product.
     */
    color: string;
    /**
     * Returns the condition of the Facebook product.
     */
    condition: string;
    /**
     * Returns the Facebook custom label 0 value of the product.
     */
    customLabel0: string;
    /**
     * Returns the Facebook custom label 1 value of the product.
     */
    customLabel1: string;
    /**
     * Returns the Facebook custom label 2 value of the product.
     */
    customLabel2: string;
    /**
     * Returns the Facebook custom label 3 value of the product.
     */
    customLabel3: string;
    /**
     * Returns the Facebook custom label 4 value of the product.
     */
    customLabel4: string;
    /**
     * Returns the description of the Facebook product.
     */
    description: string;
    /**
     * Returns the Facebook expiration date of the product. If the product is expired it will not be shown.
     */
    expirationDate: Date;
    /**
     * Returns the gender for the Facebook product.
     */
    gender: string;
    /**
     * Returns the category of this product in the Google category taxonomy. If the value is longer than 250 characters
     * it is truncated.
     */
    googleProductCategory: string;
    /**
     * Returns the Facebook GTIN of the product.
     */
    gtin: string;
    /**
     * Returns a list containing the URLs of the images to show in Facebook for the product.
     */
    imageLinks: List<string>;
    /**
     * Returns the ID of the Facebook item group for the product, that is, its master product.
     */
    itemGroupID: string;
    /**
     * Returns the URL of the Demandware storefront link to the product.
     */
    link: URL;
    /**
     * Returns the Facebook material value label of the product.
     */
    material: string;
    /**
     * Returns the Facebook MPN of the product.
     */
    mpn: string;
    /**
     * Returns the Facebook pattern value label of the product.
     */
    pattern: string;
    /**
     * Returns the price to show in Facebook for the product.
     */
    price: Money;
    /**
     * Returns the Facebook product type. This is the retailer-defined category of the item.
     */
    productType: string;
    /**
     * Returns the sale price to show in Facebook for the product.
     */
    salePrice: Money;
    /**
     * Returns the end date of the Facebook sale price of the product.
     */
    salePriceEffectiveDateEnd: Date;
    /**
     * Returns the start date of the Facebook sale price of the product.
     */
    salePriceEffectiveDateStart: Date;
    /**
     * Returns the shipping height of the product.
     * @see getShippingLength
     * @see getShippingWidth
     * @see getShippingSizeUnit
     */
    shippingHeight: number;
    /**
     * Returns the shipping length of the product.
     * @see getShippingWidth
     * @see getShippingHeight
     * @see getShippingSizeUnit
     */
    shippingLength: number;
    /**
     * Returns the shipping size unit of the product.
     * @see getShippingLength
     * @see getShippingWidth
     * @see getShippingHeight
     */
    shippingSizeUnit: string;
    /**
     * Returns the shipping weight for the product.
     */
    shippingWeight: Quantity;
    /**
     * Returns the shipping width of the product.
     * @see getShippingLength
     * @see getShippingHeight
     * @see getShippingSizeUnit
     */
    shippingWidth: number;
    /**
     * Returns the Facebook size value label of the product.
     */
    size: string;
    /**
     * Returns the title of the Facebook product.
     */
    title: string;
    private constructor();
    /**
     * Returns the age group for the Facebook product.
     */
    getAgeGroup(): string;
    /**
     * Returns the availability of the Facebook product.
     */
    getAvailability(): string;
    /**
     * Returns the Facebook brand of the product.
     */
    getBrand(): string;
    /**
     * Returns the Facebook color value label of the product.
     */
    getColor(): string;
    /**
     * Returns the condition of the Facebook product.
     */
    getCondition(): string;
    /**
     * Returns the Facebook custom label 0 value of the product.
     */
    getCustomLabel0(): string;
    /**
     * Returns the Facebook custom label 1 value of the product.
     */
    getCustomLabel1(): string;
    /**
     * Returns the Facebook custom label 2 value of the product.
     */
    getCustomLabel2(): string;
    /**
     * Returns the Facebook custom label 3 value of the product.
     */
    getCustomLabel3(): string;
    /**
     * Returns the Facebook custom label 4 value of the product.
     */
    getCustomLabel4(): string;
    /**
     * Returns the description of the Facebook product.
     */
    getDescription(): string;
    /**
     * Returns the Facebook expiration date of the product. If the product is expired it will not be shown.
     */
    getExpirationDate(): Date;
    /**
     * Returns the gender for the Facebook product.
     */
    getGender(): string;
    /**
     * Returns the category of this product in the Google category taxonomy. If the value is longer than 250 characters
     * it is truncated.
     */
    getGoogleProductCategory(): string;
    /**
     * Returns the Facebook GTIN of the product.
     */
    getGtin(): string;
    /**
     * Returns the ID of the Facebook product. This is the same as the ID of the Demandware product.
     */
    getID(): string;
    /**
     * Returns a list containing the URLs of the images to show in Facebook for the product.
     */
    getImageLinks(): List<string>;
    /**
     * Returns the ID of the Facebook item group for the product, that is, its master product.
     */
    getItemGroupID(): string;
    /**
     * Returns the URL of the Demandware storefront link to the product.
     */
    getLink(): URL;
    /**
     * Returns the Facebook material value label of the product.
     */
    getMaterial(): string;
    /**
     * Returns the Facebook MPN of the product.
     */
    getMpn(): string;
    /**
     * Returns the Facebook pattern value label of the product.
     */
    getPattern(): string;
    /**
     * Returns the price to show in Facebook for the product.
     */
    getPrice(): Money;
    /**
     * Returns the Facebook product type. This is the retailer-defined category of the item.
     */
    getProductType(): string;
    /**
     * Returns the sale price to show in Facebook for the product.
     */
    getSalePrice(): Money;
    /**
     * Returns the end date of the Facebook sale price of the product.
     */
    getSalePriceEffectiveDateEnd(): Date;
    /**
     * Returns the start date of the Facebook sale price of the product.
     */
    getSalePriceEffectiveDateStart(): Date;
    /**
     * Returns the shipping height of the product.
     * @see getShippingLength
     * @see getShippingWidth
     * @see getShippingSizeUnit
     */
    getShippingHeight(): number;
    /**
     * Returns the shipping length of the product.
     * @see getShippingWidth
     * @see getShippingHeight
     * @see getShippingSizeUnit
     */
    getShippingLength(): number;
    /**
     * Returns the shipping size unit of the product.
     * @see getShippingLength
     * @see getShippingWidth
     * @see getShippingHeight
     */
    getShippingSizeUnit(): string;
    /**
     * Returns the shipping weight for the product.
     */
    getShippingWeight(): Quantity;
    /**
     * Returns the shipping width of the product.
     * @see getShippingLength
     * @see getShippingHeight
     * @see getShippingSizeUnit
     */
    getShippingWidth(): number;
    /**
     * Returns the Facebook size value label of the product.
     */
    getSize(): string;
    /**
     * Returns the title of the Facebook product.
     */
    getTitle(): string;
    /**
     * Sets the age group for the Facebook product. Possible values are
     * dw.extensions.facebook.FacebookProduct.AGE_GROUP_ADULT,
     * dw.extensions.facebook.FacebookProduct.AGE_GROUP_INFANT,
     * dw.extensions.facebook.FacebookProduct.AGE_GROUP_KIDS,
     * dw.extensions.facebook.FacebookProduct.AGE_GROUP_NEWBORN,
     * dw.extensions.facebook.FacebookProduct.AGE_GROUP_TODDLER, or `null`.
     */
    setAgeGroup(ageGroup: string): void;
    /**
     * Sets the availability of the Facebook product. Possible values are
     * dw.extensions.facebook.FacebookProduct.AVAILABILITY_AVAILABLE_FOR_ORDER,
     * dw.extensions.facebook.FacebookProduct.AVAILABILITY_IN_STOCK,
     * dw.extensions.facebook.FacebookProduct.AVAILABILITY_OUT_OF_STOCK, or
     * dw.extensions.facebook.FacebookProduct.AVAILABILITY_PREORDER
     */
    setAvailability(availability: string): void;
    /**
     * Sets the Facebook brand of the product. If the value is longer than 70 characters it is truncated.
     */
    setBrand(brand: string): void;
    /**
     * Sets the Facebook color value label of the product. If the value is longer than 100 characters it is truncated.
     */
    setColor(color: string): void;
    /**
     * Sets the condition of the Facebook product. Possible values are
     * dw.extensions.facebook.FacebookProduct.CONDITION_NEW,
     * dw.extensions.facebook.FacebookProduct.CONDITION_REFURBISHED, or
     * dw.extensions.facebook.FacebookProduct.CONDITION_USED.
     */
    setCondition(condition: string): void;
    /**
     * Sets the Facebook custom label 0 value of the product.
     */
    setCustomLabel0(customLabel0: string): void;
    /**
     * Sets the Facebook custom label 1 value of the product.
     */
    setCustomLabel1(customLabel1: string): void;
    /**
     * Sets the Facebook custom label 2 value of the product.
     */
    setCustomLabel2(customLabel2: string): void;
    /**
     * Sets the Facebook custom label 3 value of the product.
     */
    setCustomLabel3(customLabel3: string): void;
    /**
     * Sets the Facebook custom label 4 value of the product.
     */
    setCustomLabel4(customLabel4: string): void;
    /**
     * Sets the description of the Facebook product. If the value is longer than 5000 characters it is truncated.
     */
    setDescription(description: string): void;
    /**
     * Sets the Facebook expiration date of the product.
     */
    setExpirationDate(expirationDate: Date): void;
    /**
     * Sets the gender for the Facebook product. Possible values are
     * dw.extensions.facebook.FacebookProduct.GENDER_MALE,
     * dw.extensions.facebook.FacebookProduct.GENDER_FEMALE,
     * dw.extensions.facebook.FacebookProduct.GENDER_UNISEX, or `null`.
     */
    setGender(gender: string): void;
    /**
     * Sets the category of this product in the Google category taxonomy.
     */
    setGoogleProductCategory(googleProductCategory: string): void;
    /**
     * Sets the Facebook GTIN of the product. If the value is longer than 70 characters it is truncated.
     */
    setGtin(gtin: string): void;
    /**
     * Sets the list of URLs of images to show in Facebook for the product.
     */
    setImageLinks(imageLinks: List<any>): void;
    /**
     * Sets the ID of the Facebook item group for the product, that is, its master product.
     */
    setItemGroupID(itemGroupID: string): void;
    /**
     * Sets the URL of the Demandware storefront link to the product.
     */
    setLink(link: URL): void;
    /**
     * Sets the Facebook material value label of the product. If the value is longer than 200 characters it is
     * truncated.
     */
    setMaterial(material: string): void;
    /**
     * Sets the Facebook MPN of the product. If the value is longer than 70 characters it is truncated.
     */
    setMpn(mpn: string): void;
    /**
     * Sets the Facebook pattern value label of the product. If the value is longer than 100 characters it is truncated.
     */
    setPattern(pattern: string): void;
    /**
     * Sets the price to show in Facebook for the product.
     */
    setPrice(price: Money): void;
    /**
     * Sets the Facebook product type. If the value is longer than 750 characters it is truncated.
     */
    setProductType(productType: string): void;
    /**
     * Sets the sale price to show in Facebook for the product.
     */
    setSalePrice(salePrice: Money): void;
    /**
     * Sets the end date of the Facebook sale price of the product.
     */
    setSalePriceEffectiveDateEnd(salePriceEffectiveDateEnd: Date): void;
    /**
     * Sets the start date of the Facebook sale price of the product.
     */
    setSalePriceEffectiveDateStart(salePriceEffectiveDateStart: Date): void;
    /**
     * Sets the shipping height of the product. If the value is negative it is truncated to 0.
     * @see setShippingLength
     * @see setShippingWidth
     * @see setShippingSizeUnit
     */
    setShippingHeight(shippingHeight: number): void;
    /**
     * Sets the shipping length of the product. If the value is negative it is truncated to 0.
     * @see setShippingWidth
     * @see setShippingHeight
     * @see setShippingSizeUnit
     */
    setShippingLength(shippingLength: number): void;
    /**
     * Sets the shipping size unit of the product.
     * @see setShippingLength
     * @see setShippingWidth
     * @see setShippingHeight
     */
    setShippingSizeUnit(shippingSizeUnit: string): void;
    /**
     * Sets the shipping weight for the product. Possible unit values are
     * dw.extensions.facebook.FacebookProduct.SHIPPING_WEIGHT_UNIT_LB,
     * dw.extensions.facebook.FacebookProduct.SHIPPING_WEIGHT_UNIT_OZ,
     * dw.extensions.facebook.FacebookProduct.SHIPPING_WEIGHT_UNIT_G, or
     * dw.extensions.facebook.FacebookProduct.SHIPPING_WEIGHT_UNIT_KG.
     */
    setShippingWeight(shippingWeight: Quantity): void;
    /**
     * Sets the shipping width of the product. If the value is negative it is truncated to 0.
     * @see setShippingLength
     * @see setShippingHeight
     * @see setShippingSizeUnit
     */
    setShippingWidth(shippingWidth: number): void;
    /**
     * Sets the Facebook size value label of the product. If the value is longer than 100 characters it is truncated.
     */
    setSize(size: string): void;
    /**
     * Sets the title of the Facebook product. If the value is longer than 100 characters it is truncated.
     */
    setTitle(title: string): void;
}

export = FacebookProduct;
