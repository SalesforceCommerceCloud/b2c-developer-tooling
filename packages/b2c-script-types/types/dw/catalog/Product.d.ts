import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import Category = require('./Category');
import CategoryAssignment = require('./CategoryAssignment');
import MediaFile = require('../content/MediaFile');
import MarkupText = require('../content/MarkupText');
import Recommendation = require('./Recommendation');
import Catalog = require('./Catalog');
import ProductOptionModel = require('./ProductOptionModel');
import Quantity = require('../value/Quantity');
import ProductPriceModel = require('./ProductPriceModel');
import ProductVariationModel = require('./ProductVariationModel');
import VariationGroup = require('./VariationGroup');
import Variant = require('./Variant');
import ProductLink = require('./ProductLink');
import ProductAvailabilityModel = require('./ProductAvailabilityModel');
import ProductInventoryList = require('./ProductInventoryList');
import ProductAttributeModel = require('./ProductAttributeModel');
import List = require('../util/List');
import Image = require('../experience/image/Image');
import ProductActiveData = require('./ProductActiveData');
import PageMetaTag = require('../web/PageMetaTag');

declare global {
    module ICustomAttributes {
        interface Product extends CustomAttributes {
        }
    }
}

/**
 * Represents a product in Commerce Cloud Digital. Products are identified by
 * a unique product ID, sometimes called the SKU. There are several different
 * types of product:
 * 
 * - Simple product
 * - Master products: This type of product defines a template for a set
 * of related products which differ only by a set of defined
 * "variation attributes", such as size or color. Master products are not
 * orderable themselves. The variation information for a master product is
 * available through its dw.catalog.ProductVariationModel.
 * - Variant: Variants are the actual orderable products that are
 * related to a master product. Each variant of a master product has a unique
 * set of values for the defined variation attributes. Variants are said to be
 * "mastered" by the corresponding master product.
 * - Option products: Option products define additional options, such
 * as a warranty, which can be purchased for a defined price at the time the
 * product is purchased. The option information for an option product is
 * available through its dw.catalog.ProductOptionModel.
 * - Product-sets: A product-set is a set of products which the
 * merchant can sell as a collection in the storefront, for example an outfit of
 * clothes. Product-sets are not orderable and therefore do not define prices.
 * They exist only to group the products together in the storefront UI. Members
 * of the set are called "product-set-products".
 * - Products bundles: A collection of products which can be ordered as
 * a single unit and therefore can define its own price and inventory record.
 * 
 * Product price and availability information are retrievable through
 * getPriceModel and getAvailabilityModel respectively.
 * Attribute information is retrievable through getAttributeModel.
 * Products may reference other products, either as recommendations or product
 * links. This class provides the methods for retrieving these referenced
 * products.
 * 
 * Products belong to a catalog (the "owning" catalog) and are assigned to
 * categories in other catalogs. Products assigned to categories in the site
 * catalog are typically orderable on the site.
 * 
 * Any API method which returns products will return an instance of a
 * dw.catalog.Variant for variant products. This subclass contains
 * methods which are specific to this type of product.
 */
declare class Product<T extends ICustomAttributes.Product = ICustomAttributes.Product> extends ExtensibleObject<T> {
    /**
     * Returns the European Article Number of the product.
     */
    readonly EAN: string;
    /**
     * Returns the ID of the product.
     */
    readonly ID: string;
    /**
     * Returns the Universal Product Code of the product.
     */
    readonly UPC: string;
    /**
     * Returns the active data for this product, for the current site.
     */
    readonly activeData: ProductActiveData;
    /**
     * Returns a collection of all categories to which this product is assigned.
     */
    readonly allCategories: Collection<Category>;
    /**
     * Returns all category assignments for this product in any catalog.
     */
    readonly allCategoryAssignments: Collection<CategoryAssignment>;
    /**
     * Returns all incoming ProductLinks.
     */
    readonly allIncomingProductLinks: Collection<ProductLink>;
    /**
     * Returns all outgoing ProductLinks.
     */
    readonly allProductLinks: Collection<ProductLink>;
    /**
     * Returns `true` if the product is assigned to the current site (via the site catalog), otherwise
     * `false` is returned.
     * 
     * In case of the product being a variant, the variant will be considered as assigned if its master, one of the
     * variation groups it is in or itself is assigned to the site catalog. In case this is triggered for a variation
     * group the variation group is considered as assigned if its master or itself is assigned.
     */
    readonly assignedToSiteCatalog: boolean;
    /**
     * Returns this product's ProductAttributeModel, which makes access to the
     * product attribute information convenient. The model is calculated based
     * on the product attributes assigned to this product's classification
     * category (or any of it's ancestors) and the global attribute definitions
     * for the system object type 'Product'. If this product has no
     * classification category, the attribute model is calculated on the global
     * attribute definitions only. If this product is a variant, then the
     * attribute model is calculated based on the classification category of its
     * corresponding master product.
     */
    readonly attributeModel: ProductAttributeModel;
    /**
     * Returns the availability model, which can be used to determine availability
     * information for a product.
     */
    readonly availabilityModel: ProductAvailabilityModel;
    /**
     * Identifies if the product is available.
     * @deprecated Use getAvailabilityModel.isInStock() instead
     */
    readonly available: boolean;
    /**
     * Identifies if the product is available.
     * @deprecated Use getAvailabilityModel instead.
     */
    availableFlag: boolean;
    /**
     * Returns the Brand of the product.
     */
    readonly brand: string;
    /**
     * Identifies if this product instance is a product bundle.
     */
    readonly bundle: boolean;
    /**
     * Identifies if this product instance is bundled within at least one
     * product bundle.
     */
    readonly bundled: boolean;
    /**
     * Returns a collection containing all products that participate in the
     * product bundle.
     */
    readonly bundledProducts: Collection<Product<any>>;
    /**
     * Returns a collection of all bundles in which this product is included.
     * The method only returns bundles assigned to the current site.
     */
    readonly bundles: Collection<Product<any>>;
    /**
     * Returns a collection of all categories to which this product is assigned
     * and which are also available through the current site.
     */
    readonly categories: Collection<Category>;
    /**
     * Identifies if this product is bound to at least one catalog category.
     */
    readonly categorized: boolean;
    /**
     * Returns a collection of category assignments for this product in
     * the current site catalog.
     */
    readonly categoryAssignments: Collection<CategoryAssignment>;
    /**
     * Returns the classification category associated with this Product. A
     * product has a single classification category which may or may not be in
     * the site catalog. The classification category defines the attribute set
     * of the product. See dw.catalog.Product.getAttributeModel for
     * how the classification category is used.
     */
    readonly classificationCategory: Category | null;
    /**
     * Identifies if the product is Facebook enabled.
     */
    readonly facebookEnabled: boolean;
    /**
     * Returns the product's image.
     * @deprecated 
     * Commerce Cloud Digital introduces a new more powerful product
     * image management. It allows to group product images by self-defined view types
     * (e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
     * color 'red', 'blue'). Images can be annotated with pattern based title and
     * alt. Product images can be accessed from Digital locations or external storage
     * locations.
     * 
     * Please use the new product image management. Therefore you have to set
     * up the common product image settings like view types, image location,
     * default image alt and title for your catalogs first. After that you can
     * group your product images by the previously defined view types in context
     * of a product. Finally use getImages and
     * getImage to access your images.
     */
    readonly image: MediaFile;
    /**
     * Returns incoming ProductLinks, where the source product is a site product.
     */
    readonly incomingProductLinks: Collection<ProductLink>;
    /**
     * Returns the product's long description in the current locale.
     */
    readonly longDescription: MarkupText | null;
    /**
     * Returns the name of the product manufacturer.
     */
    readonly manufacturerName: string;
    /**
     * Returns the value of the manufacturer's stock keeping unit.
     */
    readonly manufacturerSKU: string;
    /**
     * Identifies if this product instance is a product master.
     */
    readonly master: boolean;
    /**
     * Returns the minimum order quantity for this product.
     */
    readonly minOrderQuantity: Quantity;
    /**
     * Returns the name of the product in the current locale.
     */
    readonly name: string | null;
    /**
     * Returns the online status of the product. The online status
     * is calculated from the online status flag and the onlineFrom
     * onlineTo dates defined for the product.
     */
    readonly online: boolean;
    /**
     * Returns a collection of all currently online categories to which this
     * product is assigned and which are also available through the current
     * site. A category is currently online if its online flag equals true and
     * the current site date is within the date range defined by the onlineFrom
     * and onlineTo attributes.
     */
    readonly onlineCategories: Collection<Category>;
    /**
     * Returns the online status flag of the product.
     */
    readonly onlineFlag: boolean;
    /**
     * Returns the date from which the product is online or valid.
     */
    readonly onlineFrom: Date;
    /**
     * Returns the date until which the product is online or valid.
     */
    readonly onlineTo: Date;
    /**
     * Returns the product's option model. The option values selections are
     * initialized with the values defined for the product, or the default values
     * defined for the option.
     */
    readonly optionModel: ProductOptionModel;
    /**
     * Identifies if the product has options.
     */
    readonly optionProduct: boolean;
    /**
     * Returns a list of outgoing recommendations for this product. This method
     * behaves similarly to getRecommendations but additionally filters out
     * recommendations for which the target product is unorderable according to
     * its product availability model.
     * @see dw.catalog.ProductAvailabilityModel.isOrderable
     */
    readonly orderableRecommendations: Collection<Recommendation>;
    /**
     * Returns product's page description in the default locale.
     */
    readonly pageDescription: string | null;
    /**
     * Returns the product's page keywords in the default locale.
     */
    readonly pageKeywords: string | null;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the product detail page meta tag context and rules. The rules are
     * obtained from the current product context or inherited from variation groups, master product, the primary
     * category, up to the root category.
     */
    readonly pageMetaTags: Array<PageMetaTag>;
    /**
     * Returns the product's page title in the default locale.
     */
    readonly pageTitle: string | null;
    /**
     * Returns the product's page URL in the default locale.
     */
    readonly pageURL: string | null;
    /**
     * Identifies if the product is Pinterest enabled.
     */
    readonly pinterestEnabled: boolean;
    /**
     * Returns the price model, which can be used to retrieve a price
     * for this product.
     */
    readonly priceModel: ProductPriceModel;
    /**
     * Returns the primary category of the product within the current site catalog.
     */
    readonly primaryCategory: Category | null;
    /**
     * Returns the category assignment to the primary category in the current site
     * catalog or null if no primary category is defined within the current site
     * catalog.
     */
    readonly primaryCategoryAssignment: CategoryAssignment | null;
    /**
     * Returns 'true' if the instance represents a product. Returns 'false' if
     * the instance represents a product set.
     * @see isProductSet
     */
    readonly product: boolean;
    /**
     * Returns all outgoing ProductLinks, where the target product is also
     * available in the current site. The ProductLinks are unsorted.
     */
    readonly productLinks: Collection<ProductLink>;
    /**
     * Returns 'true' if the instance represents a product set, otherwise 'false'.
     * @see isProduct
     */
    readonly productSet: boolean;
    /**
     * Returns true if this product is part of any product set, otherwise false.
     */
    readonly productSetProduct: boolean;
    /**
     * Returns a collection of all products which are assigned to this product
     * and which are also available through the current site.  If this product
     * does not represent a product set then an empty collection will be
     * returned.
     */
    readonly productSetProducts: Collection<Product<any>>;
    /**
     * Returns a collection of all product sets in which this product is included.
     * The method only returns product sets assigned to the current site.
     */
    readonly productSets: Collection<Product<any>>;
    /**
     * Returns the outgoing recommendations for this product which
     * belong to the site catalog.  If this product is not assigned to the site
     * catalog, or there is no site catalog, an empty collection is returned.
     * Only recommendations for which the target product exists and is assigned
     * to the site catalog are returned.  The recommendations are sorted by
     * their explicitly set order.
     */
    readonly recommendations: Collection<Recommendation>;
    /**
     * Identifies if this product instance is part of a retail set.
     * @deprecated Use isProductSet instead
     */
    readonly retailSet: boolean;
    /**
     * Returns the product's search placement classification. The higher the
     * numeric product placement value, the more relevant is the product when
     * sorting search results. The range of numeric placement values is
     * defined in the meta data of object type 'Product' and can therefore be
     * customized.
     */
    readonly searchPlacement: number;
    /**
     * Returns the product's search rank. The higher the numeric product rank,
     * the more relevant is the product when sorting search results. The range of
     * numeric rank values is defined in the meta data of object type 'Product'
     * and can therefore be customized.
     */
    readonly searchRank: number;
    /**
     * Identifies if the product is searchable.
     */
    readonly searchable: boolean;
    /**
     * Returns, whether the product is currently searchable.
     */
    readonly searchableFlag: boolean;
    /**
     * Returns the searchable status of the Product if unavailable.
     * 
     * Besides `true` or `false`, the return value `null` indicates that the value is not set.
     */
    readonly searchableIfUnavailableFlag: boolean;
    /**
     * Returns the product's short description in the current locale.
     */
    readonly shortDescription: MarkupText | null;
    /**
     * Returns the product's change frequency needed for the sitemap creation.
     */
    readonly siteMapChangeFrequency: string;
    /**
     * Returns the status if the product is included into the sitemap.
     */
    readonly siteMapIncluded: number;
    /**
     * Returns the product's priority needed for the sitemap creation.
     */
    readonly siteMapPriority: number;
    /**
     * Returns 'true' if the product is assigned to the current site (via the
     * site catalog), otherwise 'false' is returned.
     * @deprecated Use isAssignedToSiteCatalog instead
     */
    readonly siteProduct: boolean;
    /**
     * Returns the steps in which the order amount of the product can be
     * increased.
     */
    readonly stepQuantity: Quantity;
    /**
     * Returns the store receipt name of the product in the current locale.
     */
    readonly storeReceiptName: string | null;
    /**
     * Returns the store tax class ID.
     * 
     * This is an optional override for in-store tax calculation.
     */
    readonly storeTaxClass: string;
    /**
     * Returns the ID of the product's tax class, by resolving
     * the Global Preference setting selected. If the Localized
     * Tax Class setting under Global Preferences -> Products is
     * selected, the localizedTaxClassID attribute value will be
     * returned, else the legacy taxClassID attribute value will
     * be returned.
     */
    readonly taxClassID: string;
    /**
     * Returns the name of the product's rendering template.
     */
    readonly template: string;
    /**
     * Returns the product's thumbnail image.
     * @deprecated 
     * Commerce Cloud Digital introduces a new more powerful product
     * image management. It allows to group product images by self-defined view types
     * (e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
     * color 'red', 'blue'). Images can be annotated with pattern based title and
     * alt. Product images can be accessed from Digital locations or external storage
     * locations.
     * 
     * Please use the new product image management. Therefore you have to set
     * up the common product image settings like view types, image location,
     * default image alt and title for your catalogs first. After that you can
     * group your product images by the previously defined view types in context
     * of a product. Finally use getImages and
     * getImage to access your images.
     */
    readonly thumbnail: MediaFile;
    /**
     * Returns the product's sales unit.
     */
    readonly unit: string;
    /**
     * Returns the product's unit quantity.
     */
    readonly unitQuantity: Quantity;
    /**
     * Identifies if this product instance is mastered by a product master.
     */
    readonly variant: boolean;
    /**
     * Returns a collection of all variants assigned to this variation master
     * or variation group product. All variants are returned regardless of whether
     * they are online or offline.
     * 
     * If this product does not represent a variation master or variation group
     * product then an empty collection is returned.
     */
    readonly variants: Collection<Variant>;
    /**
     * Identifies if this product instance is a variation group product.
     */
    readonly variationGroup: boolean;
    /**
     * Returns a collection of all variation groups assigned to this variation
     * master product. All variation groups are returned regardless of whether
     * they are online or offline.
     * 
     * If this product does not represent a variation master product then an
     * empty collection is returned.
     */
    readonly variationGroups: Collection<VariationGroup>;
    /**
     * Returns the variation model of this product. If this product is a master
     * product, then the returned model will encapsulate all the information
     * about its variation attributes and variants. If this product is a variant
     * product, then the returned model will encapsulate all the same
     * information, but additionally pre-select all the variation attribute
     * values of this variant. (See dw.catalog.ProductVariationModel for
     * details on what "selected" means.) If this product is neither a master
     * product or a variation product, then a model will be returned but will be
     * essentially empty and not useful for any particular purpose.
     */
    readonly variationModel: ProductVariationModel;
    /**
     * Identifies if this product is bound to the specified catalog category.
     * @deprecated Use isAssignedToCategory
     */
    assignedToCategory(category: Category): boolean;
    /**
     * Returns the active data for this product, for the current site.
     */
    getActiveData(): ProductActiveData;
    /**
     * Returns a collection of all categories to which this product is assigned.
     */
    getAllCategories(): Collection<Category>;
    /**
     * Returns all category assignments for this product in any catalog.
     */
    getAllCategoryAssignments(): Collection<CategoryAssignment>;
    /**
     * Returns all incoming ProductLinks.
     */
    getAllIncomingProductLinks(): Collection<ProductLink>;
    /**
     * Returns all incoming ProductLinks of a specific type.
     */
    getAllIncomingProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns all outgoing ProductLinks.
     */
    getAllProductLinks(): Collection<ProductLink>;
    /**
     * Returns all outgoing ProductLinks of a specific type.
     */
    getAllProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns the outgoing recommendations for this product which belong to the
     * specified catalog. The recommendations are sorted by their explicitly set
     * order.
     */
    getAllRecommendations(catalog: Catalog): Collection<Recommendation>;
    /**
     * Returns the outgoing recommendations for this product which are of the
     * specified type and which belong to the specified catalog.
     * The recommendations are sorted by their explicitly set order.
     */
    getAllRecommendations(catalog: Catalog, type: number): Collection<Recommendation>;
    /**
     * Returns this product's ProductAttributeModel, which makes access to the
     * product attribute information convenient. The model is calculated based
     * on the product attributes assigned to this product's classification
     * category (or any of it's ancestors) and the global attribute definitions
     * for the system object type 'Product'. If this product has no
     * classification category, the attribute model is calculated on the global
     * attribute definitions only. If this product is a variant, then the
     * attribute model is calculated based on the classification category of its
     * corresponding master product.
     */
    getAttributeModel(): ProductAttributeModel;
    /**
     * Returns the availability model, which can be used to determine availability
     * information for a product.
     */
    getAvailabilityModel(): ProductAvailabilityModel;
    /**
     * Returns the availability model of the given inventory list, which can be
     * used to determine availability information for a product.
     */
    getAvailabilityModel(list: ProductInventoryList | null): ProductAvailabilityModel;
    /**
     * Identifies if the product is available.
     * @deprecated Use getAvailabilityModel instead.
     */
    getAvailableFlag(): boolean;
    /**
     * Returns the Brand of the product.
     */
    getBrand(): string;
    /**
     * Returns the quantity of the specified product within the bundle. If the
     * specified product is not part of the bundle, a 0 quantity is returned.
     */
    getBundledProductQuantity(aProduct: Product<any>): Quantity;
    /**
     * Returns a collection containing all products that participate in the
     * product bundle.
     */
    getBundledProducts(): Collection<Product<any>>;
    /**
     * Returns a collection of all bundles in which this product is included.
     * The method only returns bundles assigned to the current site.
     */
    getBundles(): Collection<Product<any>>;
    /**
     * Returns a collection of all categories to which this product is assigned
     * and which are also available through the current site.
     */
    getCategories(): Collection<Category>;
    /**
     * Returns the category assignment for a specific category.
     */
    getCategoryAssignment(category: Category): CategoryAssignment;
    /**
     * Returns a collection of category assignments for this product in
     * the current site catalog.
     */
    getCategoryAssignments(): Collection<CategoryAssignment>;
    /**
     * Returns the classification category associated with this Product. A
     * product has a single classification category which may or may not be in
     * the site catalog. The classification category defines the attribute set
     * of the product. See dw.catalog.Product.getAttributeModel for
     * how the classification category is used.
     */
    getClassificationCategory(): Category | null;
    /**
     * Returns the European Article Number of the product.
     */
    getEAN(): string;
    /**
     * Returns the ID of the product.
     */
    getID(): string;
    /**
     * Returns the product's image.
     * @deprecated 
     * Commerce Cloud Digital introduces a new more powerful product
     * image management. It allows to group product images by self-defined view types
     * (e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
     * color 'red', 'blue'). Images can be annotated with pattern based title and
     * alt. Product images can be accessed from Digital locations or external storage
     * locations.
     * 
     * Please use the new product image management. Therefore you have to set
     * up the common product image settings like view types, image location,
     * default image alt and title for your catalogs first. After that you can
     * group your product images by the previously defined view types in context
     * of a product. Finally use getImages and
     * getImage to access your images.
     */
    getImage(): MediaFile;
    /**
     * The method calls getImages and returns the image at
     * the specific index. If no image for specified index is available the
     * method returns null.
     * @throws NullArgumentException if viewtype is null
     */
    getImage(viewtype: string, index: number): MediaFile | null;
    /**
     * The method calls getImages and returns the first image.
     * If no image is available the method returns null.
     * 
     * When called for a variant with defined images for specified view type the
     * method returns the first image.
     * 
     * When called for a variant without defined images for specified view type
     * the method returns the first master product image. If no master product
     * images are defined, the method returns null.
     * @throws NullArgumentException if viewtype is null
     */
    getImage(viewtype: string): MediaFile | null;
    /**
     * Returns all images assigned to this product for a specific view type,
     * e.g. all 'thumbnail' images. The images are returned in the order of
     * their index number ascending.
     * 
     * When called for a master the method returns the images specific to the
     * master, which are typically the fall back images.
     * @throws NullArgumentException if viewtype is null
     */
    getImages(viewtype: string): List<Image>;
    /**
     * Returns incoming ProductLinks, where the source product is a site product.
     */
    getIncomingProductLinks(): Collection<ProductLink>;
    /**
     * Returns incoming ProductLinks, where the source product is a site product
     * of a specific type.
     */
    getIncomingProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns the product's long description in the current locale.
     */
    getLongDescription(): MarkupText | null;
    /**
     * Returns the name of the product manufacturer.
     */
    getManufacturerName(): string;
    /**
     * Returns the value of the manufacturer's stock keeping unit.
     */
    getManufacturerSKU(): string;
    /**
     * Returns the minimum order quantity for this product.
     */
    getMinOrderQuantity(): Quantity;
    /**
     * Returns the name of the product in the current locale.
     */
    getName(): string | null;
    /**
     * Returns a collection of all currently online categories to which this
     * product is assigned and which are also available through the current
     * site. A category is currently online if its online flag equals true and
     * the current site date is within the date range defined by the onlineFrom
     * and onlineTo attributes.
     */
    getOnlineCategories(): Collection<Category>;
    /**
     * Returns the online status flag of the product.
     */
    getOnlineFlag(): boolean;
    /**
     * Returns the date from which the product is online or valid.
     */
    getOnlineFrom(): Date;
    /**
     * Returns the date until which the product is online or valid.
     */
    getOnlineTo(): Date;
    /**
     * Returns the product's option model. The option values selections are
     * initialized with the values defined for the product, or the default values
     * defined for the option.
     */
    getOptionModel(): ProductOptionModel;
    /**
     * Returns a list of outgoing recommendations for this product. This method
     * behaves similarly to getRecommendations but additionally filters out
     * recommendations for which the target product is unorderable according to
     * its product availability model.
     * @see dw.catalog.ProductAvailabilityModel.isOrderable
     */
    getOrderableRecommendations(): Collection<Recommendation>;
    /**
     * Returns a list of outgoing recommendations for this product. This method
     * behaves similarly to getRecommendations but additionally
     * filters out recommendations for which the target product is unorderable
     * according to its product availability model.
     * @see dw.catalog.ProductAvailabilityModel.isOrderable
     */
    getOrderableRecommendations(type: number): Collection<Recommendation>;
    /**
     * Returns product's page description in the default locale.
     */
    getPageDescription(): string | null;
    /**
     * Returns the product's page keywords in the default locale.
     */
    getPageKeywords(): string | null;
    /**
     * Returns the page meta tag for the specified id.
     * 
     * The meta tag content is generated based on the product detail page meta tag context and rule. The rule is
     * obtained from the current product context or inherited from variation groups, master product, the primary
     * category, up to the root category.
     * 
     * Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
     * current context, or if the rule resolves to an empty string.
     */
    getPageMetaTag(id: string): PageMetaTag | null;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the product detail page meta tag context and rules. The rules are
     * obtained from the current product context or inherited from variation groups, master product, the primary
     * category, up to the root category.
     */
    getPageMetaTags(): Array<PageMetaTag>;
    /**
     * Returns the product's page title in the default locale.
     */
    getPageTitle(): string | null;
    /**
     * Returns the product's page URL in the default locale.
     */
    getPageURL(): string | null;
    /**
     * Returns the price model, which can be used to retrieve a price
     * for this product.
     */
    getPriceModel(): ProductPriceModel;
    /**
     * Returns the price model based on the specified optionModel. The
     * price model can be used to retrieve a price
     * for this product. Prices are calculated based on the option values
     * selected in the specified option model.
     */
    getPriceModel(optionModel: ProductOptionModel): ProductPriceModel;
    /**
     * Returns the primary category of the product within the current site catalog.
     */
    getPrimaryCategory(): Category | null;
    /**
     * Returns the category assignment to the primary category in the current site
     * catalog or null if no primary category is defined within the current site
     * catalog.
     */
    getPrimaryCategoryAssignment(): CategoryAssignment | null;
    /**
     * Returns all outgoing ProductLinks, where the target product is also
     * available in the current site. The ProductLinks are unsorted.
     */
    getProductLinks(): Collection<ProductLink>;
    /**
     * Returns all outgoing ProductLinks of a specific type, where the target
     * product is also available in the current site. The ProductLinks are
     * sorted.
     */
    getProductLinks(type: number): Collection<ProductLink>;
    /**
     * Returns a collection of all products which are assigned to this product
     * and which are also available through the current site.  If this product
     * does not represent a product set then an empty collection will be
     * returned.
     */
    getProductSetProducts(): Collection<Product<any>>;
    /**
     * Returns a collection of all product sets in which this product is included.
     * The method only returns product sets assigned to the current site.
     */
    getProductSets(): Collection<Product<any>>;
    /**
     * Returns the outgoing recommendations for this product which
     * belong to the site catalog.  If this product is not assigned to the site
     * catalog, or there is no site catalog, an empty collection is returned.
     * Only recommendations for which the target product exists and is assigned
     * to the site catalog are returned.  The recommendations are sorted by
     * their explicitly set order.
     */
    getRecommendations(): Collection<Recommendation>;
    /**
     * Returns the outgoing recommendations for this product which are of the
     * specified type and which belong to the site catalog.  Behaves the same as
     * getRecommendations but additionally filters by recommendation
     * type.
     */
    getRecommendations(type: number): Collection<Recommendation>;
    /**
     * Returns the product's search placement classification. The higher the
     * numeric product placement value, the more relevant is the product when
     * sorting search results. The range of numeric placement values is
     * defined in the meta data of object type 'Product' and can therefore be
     * customized.
     */
    getSearchPlacement(): number;
    /**
     * Returns the product's search rank. The higher the numeric product rank,
     * the more relevant is the product when sorting search results. The range of
     * numeric rank values is defined in the meta data of object type 'Product'
     * and can therefore be customized.
     */
    getSearchRank(): number;
    /**
     * Returns, whether the product is currently searchable.
     */
    getSearchableFlag(): boolean;
    /**
     * Returns the searchable status of the Product if unavailable.
     * 
     * Besides `true` or `false`, the return value `null` indicates that the value is not set.
     */
    getSearchableIfUnavailableFlag(): boolean;
    /**
     * Returns the product's short description in the current locale.
     */
    getShortDescription(): MarkupText | null;
    /**
     * Returns the product's change frequency needed for the sitemap creation.
     */
    getSiteMapChangeFrequency(): string;
    /**
     * Returns the status if the product is included into the sitemap.
     */
    getSiteMapIncluded(): number;
    /**
     * Returns the product's priority needed for the sitemap creation.
     */
    getSiteMapPriority(): number;
    /**
     * Returns the steps in which the order amount of the product can be
     * increased.
     */
    getStepQuantity(): Quantity;
    /**
     * Returns the store receipt name of the product in the current locale.
     */
    getStoreReceiptName(): string | null;
    /**
     * Returns the store tax class ID.
     * 
     * This is an optional override for in-store tax calculation.
     */
    getStoreTaxClass(): string;
    /**
     * Returns the ID of the product's tax class, by resolving
     * the Global Preference setting selected. If the Localized
     * Tax Class setting under Global Preferences -> Products is
     * selected, the localizedTaxClassID attribute value will be
     * returned, else the legacy taxClassID attribute value will
     * be returned.
     */
    getTaxClassID(): string;
    /**
     * Returns the name of the product's rendering template.
     */
    getTemplate(): string;
    /**
     * Returns the product's thumbnail image.
     * @deprecated 
     * Commerce Cloud Digital introduces a new more powerful product
     * image management. It allows to group product images by self-defined view types
     * (e.g. 'large', 'thumbnail', 'swatch') and variation values (e.g. for attribute
     * color 'red', 'blue'). Images can be annotated with pattern based title and
     * alt. Product images can be accessed from Digital locations or external storage
     * locations.
     * 
     * Please use the new product image management. Therefore you have to set
     * up the common product image settings like view types, image location,
     * default image alt and title for your catalogs first. After that you can
     * group your product images by the previously defined view types in context
     * of a product. Finally use getImages and
     * getImage to access your images.
     */
    getThumbnail(): MediaFile;
    /**
     * Returns the Universal Product Code of the product.
     */
    getUPC(): string;
    /**
     * Returns the product's sales unit.
     */
    getUnit(): string;
    /**
     * Returns the product's unit quantity.
     */
    getUnitQuantity(): Quantity;
    /**
     * Returns a collection of all variants assigned to this variation master
     * or variation group product. All variants are returned regardless of whether
     * they are online or offline.
     * 
     * If this product does not represent a variation master or variation group
     * product then an empty collection is returned.
     */
    getVariants(): Collection<Variant>;
    /**
     * Returns a collection of all variation groups assigned to this variation
     * master product. All variation groups are returned regardless of whether
     * they are online or offline.
     * 
     * If this product does not represent a variation master product then an
     * empty collection is returned.
     */
    getVariationGroups(): Collection<VariationGroup>;
    /**
     * Returns the variation model of this product. If this product is a master
     * product, then the returned model will encapsulate all the information
     * about its variation attributes and variants. If this product is a variant
     * product, then the returned model will encapsulate all the same
     * information, but additionally pre-select all the variation attribute
     * values of this variant. (See dw.catalog.ProductVariationModel for
     * details on what "selected" means.) If this product is neither a master
     * product or a variation product, then a model will be returned but will be
     * essentially empty and not useful for any particular purpose.
     */
    getVariationModel(): ProductVariationModel;
    /**
     * Identifies if the specified product participates in this product bundle.
     * If this product does not represent a bundle at all, then false will
     * always be returned.
     */
    includedInBundle(product: Product<any>): boolean;
    /**
     * Returns 'true' if item is assigned to the specified
     * category.
     */
    isAssignedToCategory(category: Category): boolean;
    /**
     * Returns `true` if the product is assigned to the current site (via the site catalog), otherwise
     * `false` is returned.
     * 
     * In case of the product being a variant, the variant will be considered as assigned if its master, one of the
     * variation groups it is in or itself is assigned to the site catalog. In case this is triggered for a variation
     * group the variation group is considered as assigned if its master or itself is assigned.
     */
    isAssignedToSiteCatalog(): boolean;
    /**
     * Identifies if the product is available.
     * @deprecated Use getAvailabilityModel.isInStock() instead
     */
    isAvailable(): boolean;
    /**
     * Identifies if this product instance is a product bundle.
     */
    isBundle(): boolean;
    /**
     * Identifies if this product instance is bundled within at least one
     * product bundle.
     */
    isBundled(): boolean;
    /**
     * Identifies if this product is bound to at least one catalog category.
     */
    isCategorized(): boolean;
    /**
     * Identifies if the product is Facebook enabled.
     */
    isFacebookEnabled(): boolean;
    /**
     * Identifies if this product instance is a product master.
     */
    isMaster(): boolean;
    /**
     * Returns the online status of the product. The online status
     * is calculated from the online status flag and the onlineFrom
     * onlineTo dates defined for the product.
     */
    isOnline(): boolean;
    /**
     * Identifies if the product has options.
     */
    isOptionProduct(): boolean;
    /**
     * Identifies if the product is Pinterest enabled.
     */
    isPinterestEnabled(): boolean;
    /**
     * Returns 'true' if the instance represents a product. Returns 'false' if
     * the instance represents a product set.
     * @see isProductSet
     */
    isProduct(): boolean;
    /**
     * Returns 'true' if the instance represents a product set, otherwise 'false'.
     * @see isProduct
     */
    isProductSet(): boolean;
    /**
     * Returns true if this product is part of any product set, otherwise false.
     */
    isProductSetProduct(): boolean;
    /**
     * Identifies if this product instance is part of a retail set.
     * @deprecated Use isProductSet instead
     */
    isRetailSet(): boolean;
    /**
     * Identifies if the product is searchable.
     */
    isSearchable(): boolean;
    /**
     * Returns 'true' if the product is assigned to the current site (via the
     * site catalog), otherwise 'false' is returned.
     * @deprecated Use isAssignedToSiteCatalog instead
     */
    isSiteProduct(): boolean;
    /**
     * Identifies if this product instance is mastered by a product master.
     */
    isVariant(): boolean;
    /**
     * Identifies if this product instance is a variation group product.
     */
    isVariationGroup(): boolean;
    /**
     * Set the availability status flag of the product.
     * @deprecated Don't use this method anymore.
     */
    setAvailableFlag(available: boolean): void;
    /**
     * Set the online status flag of the product.
     */
    setOnlineFlag(online: boolean): void;
    /**
     * Set the product's search placement.
     */
    setSearchPlacement(placement: number): void;
    /**
     * Set the product's search rank.
     */
    setSearchRank(rank: number): void;
    /**
     * Set the flag indicating whether the product is searchable or not.
     */
    setSearchableFlag(searchable: boolean): void;
}

export = Product;
