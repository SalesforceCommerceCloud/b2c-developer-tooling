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
        interface Variant extends ICustomAttributes.Product {
        }
    }
}

/**
 * Represents a variant of a product variation. If the variant does not define an own value,
 * the value is retrieved by fallback from variation groups (sorted by their position) or the
 * variation master.
 */
declare class Variant extends Product<ICustomAttributes.Variant> {
    /**
     * Returns the EAN of the product variant.
     * 
     * If the variant does not define an own value for 'EAN', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'EAN', the value of
     * the master product is returned.
     */
    readonly EAN: string;
    /**
     * Returns the UPC of the product variant.
     * 
     * If the variant does not define an own value for 'UPC', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'UPC', the value of
     * the master product is returned.
     */
    readonly UPC: string;
    /**
     * Returns all product links of the product variant.
     * 
     * If the variant does not define any product links, the product links are retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define any product links, the product links are
     * retrieved from the master product.
     */
    readonly allProductLinks: Collection<ProductLink>;
    /**
     * Returns the brand of the product variant.
     * 
     * If the variant does not define an own value for 'brand', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'brand', the value of
     * the master product is returned.
     */
    readonly brand: string;
    /**
     * Returns the classification category of the product variant.
     * 
     * Please note that the classification category is always inherited
     * from the master and cannot be overridden by the variant.
     */
    readonly classificationCategory: Category;
    /**
     * Returns the image of the product variant.
     * 
     * If the variant does not define an own value for 'image', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'image', the value of
     * the master product is returned.
     */
    readonly image: MediaFile;
    /**
     * Returns the long description of the product variant.
     * 
     * If the variant does not define an own value for 'longDescription', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'longDescription', the value of
     * the master product is returned.
     */
    readonly longDescription: MarkupText;
    /**
     * Returns the manufacturer name of the product variant.
     * 
     * If the variant does not define an own value for 'manufacturerName', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'manufacturerName', the value of
     * the master product is returned.
     */
    readonly manufacturerName: string;
    /**
     * Returns the manufacturer sku of the product variant.
     * 
     * If the variant does not define an own value for 'manufacturerSKU', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'manufacturerSKU', the value of
     * the master product is returned.
     */
    readonly manufacturerSKU: string;
    /**
     * Returns the ProductMaster for this mastered product.
     */
    readonly masterProduct: Product<any>;
    /**
     * Returns the name of the product variant.
     * 
     * If the variant does not define an own value for 'name', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'name', the value of
     * the master product is returned.
     */
    readonly name: string;
    /**
     * Returns the onlineFrom date of the product variant.
     * 
     * If the variant does not define an own value for 'onlineFrom', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'onlineFrom', the value of
     * the master product is returned.
     */
    readonly onlineFrom: Date;
    /**
     * Returns the onlineTo date of the product variant.
     * 
     * If the variant does not define an own value for 'onlineTo', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'onlineTo', the value of
     * the master product is returned.
     */
    readonly onlineTo: Date;
    /**
     * Returns 'true' if the variant has any options, otherwise 'false'.
     * Method also returns 'true' if the variant has not any options,
     * but the related variation groups (sorted by position) or
     * master product has options.
     */
    readonly optionProduct: boolean;
    /**
     * Returns the pageDescription of the product variant.
     * 
     * If the variant does not define an own value for 'pageDescription', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageDescription', the value of
     * the master product is returned.
     */
    readonly pageDescription: string;
    /**
     * Returns the pageKeywords of the product variant.
     * 
     * If the variant does not define an own value for 'pageKeywords', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageKeywords', the value of
     * the master product is returned.
     */
    readonly pageKeywords: string;
    /**
     * Returns the pageTitle of the product variant.
     * 
     * If the variant does not define an own value for 'pageTitle', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageTitle', the value of
     * the master product is returned.
     */
    readonly pageTitle: string;
    /**
     * Returns the pageURL of the product variant.
     * 
     * If the variant does not define an own value for 'pageURL', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageURL', the value of
     * the master product is returned.
     */
    readonly pageURL: string;
    /**
     * Returns all product links of the product variant for which the target
     * product is assigned to the current site catalog.
     * 
     * If the variant does not define any product links, the product links are retrieved
     * from the assigned variation groups, sorted by their position
     * 
     * If none of the variation groups define any product links, the product links are retrieved
     * from the master product.
     */
    readonly productLinks: Collection<ProductLink>;
    /**
     * Returns the short description of the product variant.
     * 
     * If the variant does not define an own value for 'shortDescription', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'shortDescription', the value of
     * the master product is returned.
     */
    readonly shortDescription: MarkupText;
    /**
     * Returns the tax class id of the product variant.
     * 
     * If the variant does not define an own value for 'taxClassID', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'taxClassID', the value of
     * the master product is returned.
     */
    readonly taxClassID: string;
    /**
     * Returns the rendering template name of the product variant.
     * 
     * If the variant does not define an own value for 'template', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'template', the value of
     * the master product is returned.
     */
    readonly template: string;
    /**
     * Returns the thumbnail image of the product variant.
     * 
     * If the variant does not define an own value for 'thumbnail', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'thumbnail', the value of
     * the master product is returned.
     */
    readonly thumbnail: MediaFile;
    /**
     * Returns the sales unit of the product variant as defined by the
     * master product.
     * 
     * If the variant does not define an own value for 'unit', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'unit', the value of
     * the master product is returned.
     */
    readonly unit: string;
    /**
     * Returns the unitQuantity of the product variant as defined by the
     * master product.
     * 
     * If the variant does not define an own value for 'unitQuantity', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'unitQuantity', the value of
     * the master product is returned.
     */
    readonly unitQuantity: Quantity;
    private constructor();
    getAllProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns all product links of the product variant.
     * 
     * If the variant does not define any product links, the product links are retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define any product links, the product links are
     * retrieved from the master product.
     */
    getAllProductLinks(): Collection<ProductLink>;
    getAllProductLinks(): Collection<ProductLink>;
    /**
     * Returns all product links of the specified type of the product variant.
     * 
     * If the variant does not define any product links of the specified type,
     * the product links are retrieved for the specified type from the assigned
     * variation groups, sorted by their position.
     * 
     * If none of the variation groups define any product links of the specified type,
     * the product links are retrieved for the specified type from the master product.
     */
    getAllProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns the brand of the product variant.
     * 
     * If the variant does not define an own value for 'brand', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'brand', the value of
     * the master product is returned.
     */
    getBrand(): string;
    /**
     * Returns the classification category of the product variant.
     * 
     * Please note that the classification category is always inherited
     * from the master and cannot be overridden by the variant.
     */
    getClassificationCategory(): Category;
    /**
     * Returns the EAN of the product variant.
     * 
     * If the variant does not define an own value for 'EAN', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'EAN', the value of
     * the master product is returned.
     */
    getEAN(): string;
    getImage(viewtype: string, index: number): MediaFile | null;
    getImage(viewtype: string): MediaFile | null;
    /**
     * Returns the image of the product variant.
     * 
     * If the variant does not define an own value for 'image', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'image', the value of
     * the master product is returned.
     */
    getImage(): MediaFile;
    /**
     * Returns the long description of the product variant.
     * 
     * If the variant does not define an own value for 'longDescription', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'longDescription', the value of
     * the master product is returned.
     */
    getLongDescription(): MarkupText;
    /**
     * Returns the manufacturer name of the product variant.
     * 
     * If the variant does not define an own value for 'manufacturerName', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'manufacturerName', the value of
     * the master product is returned.
     */
    getManufacturerName(): string;
    /**
     * Returns the manufacturer sku of the product variant.
     * 
     * If the variant does not define an own value for 'manufacturerSKU', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'manufacturerSKU', the value of
     * the master product is returned.
     */
    getManufacturerSKU(): string;
    /**
     * Returns the ProductMaster for this mastered product.
     */
    getMasterProduct(): Product<any>;
    /**
     * Returns the name of the product variant.
     * 
     * If the variant does not define an own value for 'name', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'name', the value of
     * the master product is returned.
     */
    getName(): string;
    /**
     * Returns the onlineFrom date of the product variant.
     * 
     * If the variant does not define an own value for 'onlineFrom', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'onlineFrom', the value of
     * the master product is returned.
     */
    getOnlineFrom(): Date;
    /**
     * Returns the onlineTo date of the product variant.
     * 
     * If the variant does not define an own value for 'onlineTo', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'onlineTo', the value of
     * the master product is returned.
     */
    getOnlineTo(): Date;
    /**
     * Returns the pageDescription of the product variant.
     * 
     * If the variant does not define an own value for 'pageDescription', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageDescription', the value of
     * the master product is returned.
     */
    getPageDescription(): string;
    /**
     * Returns the pageKeywords of the product variant.
     * 
     * If the variant does not define an own value for 'pageKeywords', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageKeywords', the value of
     * the master product is returned.
     */
    getPageKeywords(): string;
    /**
     * Returns the pageTitle of the product variant.
     * 
     * If the variant does not define an own value for 'pageTitle', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageTitle', the value of
     * the master product is returned.
     */
    getPageTitle(): string;
    /**
     * Returns the pageURL of the product variant.
     * 
     * If the variant does not define an own value for 'pageURL', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'pageURL', the value of
     * the master product is returned.
     */
    getPageURL(): string;
    getProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns all product links of the product variant for which the target
     * product is assigned to the current site catalog.
     * 
     * If the variant does not define any product links, the product links are retrieved
     * from the assigned variation groups, sorted by their position
     * 
     * If none of the variation groups define any product links, the product links are retrieved
     * from the master product.
     */
    getProductLinks(): Collection<ProductLink>;
    getProductLinks(): Collection<ProductLink>;
    /**
     * Returns all product links of the specified type of the product variant
     * for which the target product is assigned to the current site catalog.
     * 
     * If the variant does not define any product links of the specified type,
     * the product links are retrieved for the specified type from the assigned
     * variation groups, sorted by their position
     * 
     * If none of the variation groups define any product links of the specified type,
     * the product links are retrieved for the specified type from the master product.
     */
    getProductLinks(type: number): Collection<ProductLink>;
    getRecommendations(): Collection<Recommendation>;
    /**
     * Retrieve the sorted collection of recommendations of the specified type
     * for this product variant.  The types (cross-sell, up-sell, etc) are
     * enumerated in the `dw.catalog.Recommendation` class.  Only
     * recommendations which are stored in the current site catalog are returned.
     * Furthermore, a recommendation is only returned if the target of the
     * recommendation is assigned to the current site catalog.
     * 
     * If the variant does not define any recommendations, recommendations are
     * retrieved from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define any recommendations, the recommendations
     * of the master are returned.
     */
    getRecommendations(type: number): Collection<Recommendation>;
    /**
     * Returns the short description of the product variant.
     * 
     * If the variant does not define an own value for 'shortDescription', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'shortDescription', the value of
     * the master product is returned.
     */
    getShortDescription(): MarkupText;
    /**
     * Returns the tax class id of the product variant.
     * 
     * If the variant does not define an own value for 'taxClassID', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'taxClassID', the value of
     * the master product is returned.
     */
    getTaxClassID(): string;
    /**
     * Returns the rendering template name of the product variant.
     * 
     * If the variant does not define an own value for 'template', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'template', the value of
     * the master product is returned.
     */
    getTemplate(): string;
    /**
     * Returns the thumbnail image of the product variant.
     * 
     * If the variant does not define an own value for 'thumbnail', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'thumbnail', the value of
     * the master product is returned.
     */
    getThumbnail(): MediaFile;
    /**
     * Returns the UPC of the product variant.
     * 
     * If the variant does not define an own value for 'UPC', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'UPC', the value of
     * the master product is returned.
     */
    getUPC(): string;
    /**
     * Returns the sales unit of the product variant as defined by the
     * master product.
     * 
     * If the variant does not define an own value for 'unit', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'unit', the value of
     * the master product is returned.
     */
    getUnit(): string;
    /**
     * Returns the unitQuantity of the product variant as defined by the
     * master product.
     * 
     * If the variant does not define an own value for 'unitQuantity', the value is retrieved
     * from the assigned variation groups, sorted by their position.
     * 
     * If none of the variation groups define a value for 'unitQuantity', the value of
     * the master product is returned.
     */
    getUnitQuantity(): Quantity;
    /**
     * Returns 'true' if the variant has any options, otherwise 'false'.
     * Method also returns 'true' if the variant has not any options,
     * but the related variation groups (sorted by position) or
     * master product has options.
     */
    isOptionProduct(): boolean;
}

export = Variant;
