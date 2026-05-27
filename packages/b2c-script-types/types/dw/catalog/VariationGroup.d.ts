import Product = require('./Product');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import MarkupText = require('../content/MarkupText');
import MediaFile = require('../content/MediaFile');
import Quantity = require('../value/Quantity');
import Category = require('./Category');
import Collection = require('../util/Collection');
import ProductLink = require('./ProductLink');
import Recommendation = require('./Recommendation');

declare global {
    module ICustomAttributes {
        interface VariationGroup extends ICustomAttributes.Product {
        }
    }
}

/**
 * Class representing a group of variants within a master product who share a
 * common value for one or more variation attribute values. Variation groups are
 * used to simplify merchandising of products.
 * 
 * From a more technical perspective, variation groups are defined by two things:
 * 
 * - A relation to a master product.
 * - A set of variation attributes which have fixed values.
 * 
 * A variant of the related master product is considered in the group if and
 * only if it matches on the fixed variation attribute values.
 * 
 * Similar to a Variant, a VariationGroup does a fallback to the master product
 * for all attributes (name, description, etc) and relations (recommendations,
 * etc).
 */
declare class VariationGroup extends Product<ICustomAttributes.VariationGroup> {
    /**
     * Returns the EAN of the product variation group.
     * 
     * If the variation group does not define an own value for 'EAN', the value of
     * the master product is returned.
     */
    readonly EAN: string;
    /**
     * Returns the UPC of the product variation group.
     * 
     * If the variation group does not define an own value for 'UPC', the value of
     * the master product is returned.
     */
    readonly UPC: string;
    /**
     * Returns all product links of the product variation group.
     * 
     * If the variation group does not define any product links, but the master product
     * does, the product links of the master are returned.
     */
    readonly allProductLinks: Collection<ProductLink>;
    /**
     * Returns the brand of the product variation group.
     * 
     * If the variation group does not define an own value for 'brand', the value of
     * the master product is returned.
     */
    readonly brand: string;
    /**
     * Returns the classification category of the product variation group.
     * 
     * Please note that the classification category is always inherited
     * from the master and cannot be overridden by the variation group.
     */
    readonly classificationCategory: Category;
    /**
     * Returns the image of the product variation group.
     * 
     * If the variation group does not define an own value for 'image', the value of
     * the master product is returned.
     */
    readonly image: MediaFile;
    /**
     * Returns the long description of the product variation group.
     * 
     * If the variation group does not define an own value for 'longDescription', the value of
     * the master product is returned.
     */
    readonly longDescription: MarkupText;
    /**
     * Returns the manufacturer name of the product variation group.
     * 
     * If the variation group does not define an own value for 'manufacturerName', the value of
     * the master product is returned.
     */
    readonly manufacturerName: string;
    /**
     * Returns the manufacturer sku of the product variation group.
     * 
     * If the variation group does not define an own value for 'manufacturerSKU', the value of
     * the master product is returned.
     */
    readonly manufacturerSKU: string;
    /**
     * Returns the ProductMaster for this mastered product.
     */
    readonly masterProduct: Product<any>;
    /**
     * Returns the name of the product variation group.
     * 
     * If the variation group does not define an own value for 'name', the value of
     * the master product is returned.
     */
    readonly name: string;
    /**
     * Returns the onlineFrom date of the product variation group.
     * 
     * If the variation group does not define an own value for 'onlineFrom', the value of
     * the master product is returned.
     */
    readonly onlineFrom: Date;
    /**
     * Returns the onlineTo date of the product variation group.
     * 
     * If the variation group does not define an own value for 'onlineTo', the value of
     * the master product is returned.
     */
    readonly onlineTo: Date;
    /**
     * Returns 'true' if the variation group has any options, otherwise 'false'.
     * Method also returns 'true' if the variation group has not any options,
     * but the related master product has options.
     */
    readonly optionProduct: boolean;
    /**
     * Returns the pageDescription of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageDescription', the value of
     * the master product is returned.
     */
    readonly pageDescription: string;
    /**
     * Returns the pageKeywords of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageKeywords', the value of
     * the master product is returned.
     */
    readonly pageKeywords: string;
    /**
     * Returns the pageTitle of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageTitle', the value of
     * the master product is returned.
     */
    readonly pageTitle: string;
    /**
     * Returns the pageURL of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageURL', the value of
     * the master product is returned.
     */
    readonly pageURL: string;
    /**
     * Returns all product links of the product variation group for which the target
     * product is assigned to the current site catalog.
     * 
     * If the variation group does not define any product links, but the master product
     * does, the product links of the master are returned.
     */
    readonly productLinks: Collection<ProductLink>;
    /**
     * Returns the short description of the product variation group.
     * 
     * If the variation group does not define an own value for 'shortDescription', the value of
     * the master product is returned.
     */
    readonly shortDescription: MarkupText;
    /**
     * Returns the tax class id of the product variation group.
     * 
     * If the variation group does not define an own value for 'taxClassID', the value of
     * the master product is returned.
     */
    readonly taxClassID: string;
    /**
     * Returns the rendering template name of the product variation group.
     * 
     * If the variation group does not define an own value for 'template', the value of
     * the master product is returned.
     */
    readonly template: string;
    /**
     * Returns the thumbnail image of the product variation group.
     * 
     * If the variation group does not define an own value for 'thumbnailImage', the value of
     * the master product is returned.
     */
    readonly thumbnail: MediaFile;
    /**
     * Returns the sales unit of the product variation group as defined by the
     * master product.
     * 
     * If the variation group does not define an own value for 'unit', the value of
     * the master product is returned.
     */
    readonly unit: string;
    /**
     * Returns the unitQuantity of the product variation group as defined by the
     * master product.
     * 
     * If the variation group does not define an own value for 'unitQuantity', the value of
     * the master product is returned.
     */
    readonly unitQuantity: Quantity;
    private constructor();
    getAllProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns all product links of the product variation group.
     * 
     * If the variation group does not define any product links, but the master product
     * does, the product links of the master are returned.
     */
    getAllProductLinks(): Collection<ProductLink>;
    getAllProductLinks(): Collection<ProductLink>;
    /**
     * Returns all product links of the specified type of the product variation group.
     * 
     * If the variation group does not define any product links, but the master product
     * does, the product links of the master are returned.
     */
    getAllProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns the brand of the product variation group.
     * 
     * If the variation group does not define an own value for 'brand', the value of
     * the master product is returned.
     */
    getBrand(): string;
    /**
     * Returns the classification category of the product variation group.
     * 
     * Please note that the classification category is always inherited
     * from the master and cannot be overridden by the variation group.
     */
    getClassificationCategory(): Category;
    /**
     * Returns the EAN of the product variation group.
     * 
     * If the variation group does not define an own value for 'EAN', the value of
     * the master product is returned.
     */
    getEAN(): string;
    getImage(viewtype: string, index: number): MediaFile | null;
    getImage(viewtype: string): MediaFile | null;
    /**
     * Returns the image of the product variation group.
     * 
     * If the variation group does not define an own value for 'image', the value of
     * the master product is returned.
     */
    getImage(): MediaFile;
    /**
     * Returns the long description of the product variation group.
     * 
     * If the variation group does not define an own value for 'longDescription', the value of
     * the master product is returned.
     */
    getLongDescription(): MarkupText;
    /**
     * Returns the manufacturer name of the product variation group.
     * 
     * If the variation group does not define an own value for 'manufacturerName', the value of
     * the master product is returned.
     */
    getManufacturerName(): string;
    /**
     * Returns the manufacturer sku of the product variation group.
     * 
     * If the variation group does not define an own value for 'manufacturerSKU', the value of
     * the master product is returned.
     */
    getManufacturerSKU(): string;
    /**
     * Returns the ProductMaster for this mastered product.
     */
    getMasterProduct(): Product<any>;
    /**
     * Returns the name of the product variation group.
     * 
     * If the variation group does not define an own value for 'name', the value of
     * the master product is returned.
     */
    getName(): string;
    /**
     * Returns the onlineFrom date of the product variation group.
     * 
     * If the variation group does not define an own value for 'onlineFrom', the value of
     * the master product is returned.
     */
    getOnlineFrom(): Date;
    /**
     * Returns the onlineTo date of the product variation group.
     * 
     * If the variation group does not define an own value for 'onlineTo', the value of
     * the master product is returned.
     */
    getOnlineTo(): Date;
    /**
     * Returns the pageDescription of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageDescription', the value of
     * the master product is returned.
     */
    getPageDescription(): string;
    /**
     * Returns the pageKeywords of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageKeywords', the value of
     * the master product is returned.
     */
    getPageKeywords(): string;
    /**
     * Returns the pageTitle of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageTitle', the value of
     * the master product is returned.
     */
    getPageTitle(): string;
    /**
     * Returns the pageURL of the product variation group.
     * 
     * If the variation group does not define an own value for 'pageURL', the value of
     * the master product is returned.
     */
    getPageURL(): string;
    getProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns all product links of the product variation group for which the target
     * product is assigned to the current site catalog.
     * 
     * If the variation group does not define any product links, but the master product
     * does, the product links of the master are returned.
     */
    getProductLinks(): Collection<ProductLink>;
    getProductLinks(): Collection<ProductLink>;
    /**
     * Returns all product links of the specified type of the product variation group
     * for which the target product is assigned to the current site catalog.
     * 
     * If the variation group does not define any product links of the specified type,
     * but the master product does, the product links of the master are returned.
     */
    getProductLinks(type: number): Collection<ProductLink>;
    getRecommendations(): Collection<Recommendation>;
    /**
     * Retrieve the sorted collection of recommendations of the specified type
     * for this product variation group.  The types (cross-sell, up-sell, etc) are
     * enumerated in the `dw.catalog.Recommendation` class.  Only
     * recommendations which are stored in the current site catalog are returned.
     * Furthermore, a recommendation is only returned if the target of the
     * recommendation is assigned to the current site catalog.
     * 
     * If the variation group does not define any recommendations, but the master
     * product does, the recommendations of the master are returned.
     */
    getRecommendations(type: number): Collection<Recommendation>;
    /**
     * Returns the short description of the product variation group.
     * 
     * If the variation group does not define an own value for 'shortDescription', the value of
     * the master product is returned.
     */
    getShortDescription(): MarkupText;
    /**
     * Returns the tax class id of the product variation group.
     * 
     * If the variation group does not define an own value for 'taxClassID', the value of
     * the master product is returned.
     */
    getTaxClassID(): string;
    /**
     * Returns the rendering template name of the product variation group.
     * 
     * If the variation group does not define an own value for 'template', the value of
     * the master product is returned.
     */
    getTemplate(): string;
    /**
     * Returns the thumbnail image of the product variation group.
     * 
     * If the variation group does not define an own value for 'thumbnailImage', the value of
     * the master product is returned.
     */
    getThumbnail(): MediaFile;
    /**
     * Returns the UPC of the product variation group.
     * 
     * If the variation group does not define an own value for 'UPC', the value of
     * the master product is returned.
     */
    getUPC(): string;
    /**
     * Returns the sales unit of the product variation group as defined by the
     * master product.
     * 
     * If the variation group does not define an own value for 'unit', the value of
     * the master product is returned.
     */
    getUnit(): string;
    /**
     * Returns the unitQuantity of the product variation group as defined by the
     * master product.
     * 
     * If the variation group does not define an own value for 'unitQuantity', the value of
     * the master product is returned.
     */
    getUnitQuantity(): Quantity;
    /**
     * Returns 'true' if the variation group has any options, otherwise 'false'.
     * Method also returns 'true' if the variation group has not any options,
     * but the related master product has options.
     */
    isOptionProduct(): boolean;
}

export = VariationGroup;
