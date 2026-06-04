import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import MediaFile = require('../content/MediaFile');
import Collection = require('../util/Collection');
import Product = require('./Product');
import CategoryAssignment = require('./CategoryAssignment');
import CategoryLink = require('./CategoryLink');
import ProductAttributeModel = require('./ProductAttributeModel');
import Recommendation = require('./Recommendation');
import SortingRule = require('./SortingRule');

declare global {
    module ICustomAttributes {
        interface Category extends CustomAttributes {
        }
    }
}

/**
 * Represents a category in a product catalog.
 */
declare class Category extends ExtensibleObject<ICustomAttributes.Category> {
    /**
     * Constant representing the Variation Group Display Mode individual setting.
     */
    static readonly DISPLAY_MODE_INDIVIDUAL: number;
    /**
     * Constant representing the Variation Group Display Mode merged setting.
     */
    static readonly DISPLAY_MODE_MERGED: number;
    /**
     * Returns the id of the category.
     */
    readonly ID: string;
    /**
     * Returns all outgoing recommendations for this category.  The
     * recommendations are sorted by their explicitly set order.
     */
    readonly allRecommendations: Collection<Recommendation>;
    /**
     * Returns a collection of category assignments of the category.
     */
    readonly categoryAssignments: Collection<CategoryAssignment>;
    /**
     * Returns the default sorting rule configured for this category,
     * or `null` if there is no default rule to be applied for it.
     * 
     * This method returns the default rule for the parent category if this
     * category inherits one.  The parent category may inherit its default
     * rule from its parent, and so on, up to the root category.
     * 
     * This method returns `null` if no ancestor category for this
     * category has a default rule.
     */
    readonly defaultSortingRule: SortingRule | null;
    /**
     * Returns the description of the catalog category for the current locale.
     */
    readonly description: string | null;
    /**
     * Returns the Variation Groups Display Mode of the category or null if no display mode is defined.
     */
    displayMode: number;
    /**
     * Returns the display name of the of the catalog category for the current locale.
     * 
     * This value is intended to be used as the
     * external visible name of the catalog category.
     */
    readonly displayName: string | null;
    /**
     * Returns the image reference of this catalog category.
     */
    readonly image: MediaFile;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for which this category
     * is the target.  If the source category of a link belongs to a different
     * catalog than the catalog owning this category, it is not returned.
     */
    readonly incomingCategoryLinks: Collection<CategoryLink>;
    /**
     * Returns the value indicating whether the catalog category is "currently
     * online".  A category is currently online if its online flag equals true
     * and the current site date is within the date range defined by the
     * onlineFrom and onlineTo attributes.
     */
    readonly online: boolean;
    /**
     * Returns a collection of category assignments of the category where the
     * referenced product is currently online. When checking the online status
     * of the product, the online flag and the online from & to dates are taken
     * into account. Online flag, online from & to dates set for the current site
     * takes precedence over the default values.
     */
    readonly onlineCategoryAssignments: Collection<CategoryAssignment>;
    /**
     * Returns the online status flag of the category.
     */
    readonly onlineFlag: boolean;
    /**
     * Returns the date from which the category is online or valid.
     */
    readonly onlineFrom: Date;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for
     * which this category is the target. If the source category of a link
     * belongs to a different catalog than the catalog owning this category, it
     * is not returned. Additionally, this method will only return a link if the
     * source category is currently online. A category is currently online if
     * its online flag equals true and the current site date is within the date
     * range defined by the onlineFrom and onlineTo attributes.
     */
    readonly onlineIncomingCategoryLinks: Collection<CategoryLink>;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for
     * which this category is the source. If the target category of a link
     * belongs to a different catalog than the catalog owning this category, it
     * is not returned. Additionally, this method will only return a link if the
     * target category is currently online. A category is currently online if
     * its online flag equals true and the current site date is within the date
     * range defined by the onlineFrom and onlineTo attributes.
     */
    readonly onlineOutgoingCategoryLinks: Collection<CategoryLink>;
    /**
     * Returns online products assigned to this category.
     * Offline products are not included in the returned collection.
     * When checking the online status of the product,
     * the online flag and the online from & to dates are taken into account.
     * Online flag, online from & to dates set for the current site takes precedence
     * over the default values.
     * 
     * The order of products in the returned collection corresponds to the
     * defined explicit sorting of products in this category.
     * @see dw.catalog.Category.hasOnlineProducts
     */
    readonly onlineProducts: Collection<Product<any>>;
    /**
     * Returns a sorted collection of currently online subcategories of this
     * catalog category.
     * 
     * -
     * A category is currently online if its online flag
     * equals true and the current site date is within the date range defined by
     * the onlineFrom and onlineTo attributes.
     * 
     * -
     * The returned collection is sorted by position. Subcategories marked as
     * "unsorted" always appear after those marked as "sorted" but are otherwise
     * not in any guaranteed order.
     * 
     * -
     * The returned collection contains direct subcategories only.
     * @see dw.catalog.Category.hasOnlineSubCategories
     */
    readonly onlineSubCategories: Collection<Category>;
    /**
     * Returns the date until which the category is online or valid.
     */
    readonly onlineTo: Date;
    /**
     * Returns a list of outgoing recommendations for this category. This method
     * behaves similarly to getRecommendations but additionally filters out
     * recommendations for which the target product is unorderable according to
     * its product availability model.
     * @see dw.catalog.ProductAvailabilityModel.isOrderable
     */
    readonly orderableRecommendations: Collection<Recommendation>;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for which this category
     * is the source.  If the target category of a link belongs to a different
     * catalog than the catalog owning this category, it is not returned.
     * The collection of links is sorted by the explicitly defined order
     * for this category with unsorted links appearing at the end.
     */
    readonly outgoingCategoryLinks: Collection<CategoryLink>;
    /**
     * Returns the page description of this category for the default locale or null if not defined.
     */
    readonly pageDescription: string | null;
    /**
     * Returns the page keywords of this category for the default locale or null if not defined.
     */
    readonly pageKeywords: string | null;
    /**
     * Returns the page title of this category for the default locale or null if not defined.
     */
    readonly pageTitle: string | null;
    /**
     * Returns the page URL property of this category or null if not defined.
     */
    readonly pageURL: string | null;
    /**
     * Returns the parent of this category.
     */
    readonly parent: Category | null;
    /**
     * Returns this category's ProductAttributeModel, which makes access to the
     * category's attribute information convenient. The model is calculated
     * based on the attribute definitions assigned to this category and the
     * global attribute definitions for the object type 'Product'.
     */
    readonly productAttributeModel: ProductAttributeModel;
    /**
     * Returns all products assigned to this category.
     * The order of products in the returned collection corresponds to the
     * defined explicit sorting of products in this category.
     * @see dw.catalog.Category.getOnlineProducts
     */
    readonly products: Collection<Product<any>>;
    /**
     * Returns the outgoing recommendations for this category.  If this category
     * is not in the site catalog, or there is no site catalog, an empty
     * collection is returned.  Only recommendations for which the target
     * product exists and is assigned to the site catalog are returned.  The
     * recommendations are sorted by their explicitly set order.
     */
    readonly recommendations: Collection<Recommendation>;
    /**
     * Identifies if the category is the root category of its catalog.
     */
    readonly root: boolean;
    /**
     * Returns the search placement of the category or null of no search placement is defined.
     */
    searchPlacement: number;
    /**
     * Returns the search rank of the category or null of no search rank is defined.
     */
    searchRank: number;
    /**
     * Returns the category's sitemap change frequency.
     */
    readonly siteMapChangeFrequency: string;
    /**
     * Returns the category's sitemap inclusion.
     */
    readonly siteMapIncluded: number;
    /**
     * Returns the category's sitemap priority.
     */
    readonly siteMapPriority: number;
    /**
     * Returns a sorted collection of the subcategories of this catalog category,
     * including both online and offline subcategories.
     * 
     * -
     * The returned collection is sorted by position. Subcategories marked as
     * "unsorted" always appear after those marked as "sorted" but are otherwise
     * not in any guaranteed order.
     * 
     * -
     * The returned collection contains direct subcategories only.
     * @see dw.catalog.Category.getOnlineSubCategories
     */
    readonly subCategories: Collection<Category>;
    /**
     * Returns the template property value , which is the file name of the template
     * used to display the catalog category.
     */
    readonly template: string;
    /**
     * Returns the thumbnail image reference of this catalog category.
     */
    readonly thumbnail: MediaFile;
    /**
     * Returns true if the category is a top level category, but not the root
     * category.
     */
    readonly topLevel: boolean;
    private constructor();
    /**
     * Returns all outgoing recommendations for this category.  The
     * recommendations are sorted by their explicitly set order.
     */
    getAllRecommendations(): Collection<Recommendation>;
    /**
     * Returns all outgoing recommendations for this category which are of the
     * specified type. The recommendations are sorted by their explicitly set
     * order.
     */
    getAllRecommendations(type: number): Collection<Recommendation>;
    /**
     * Returns a collection of category assignments of the category.
     */
    getCategoryAssignments(): Collection<CategoryAssignment>;
    /**
     * Returns the default sorting rule configured for this category,
     * or `null` if there is no default rule to be applied for it.
     * 
     * This method returns the default rule for the parent category if this
     * category inherits one.  The parent category may inherit its default
     * rule from its parent, and so on, up to the root category.
     * 
     * This method returns `null` if no ancestor category for this
     * category has a default rule.
     */
    getDefaultSortingRule(): SortingRule | null;
    /**
     * Returns the description of the catalog category for the current locale.
     */
    getDescription(): string | null;
    /**
     * Returns the Variation Groups Display Mode of the category or null if no display mode is defined.
     */
    getDisplayMode(): number;
    /**
     * Returns the display name of the of the catalog category for the current locale.
     * 
     * This value is intended to be used as the
     * external visible name of the catalog category.
     */
    getDisplayName(): string | null;
    /**
     * Returns the id of the category.
     */
    getID(): string;
    /**
     * Returns the image reference of this catalog category.
     */
    getImage(): MediaFile;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for which this category
     * is the target.  If the source category of a link belongs to a different
     * catalog than the catalog owning this category, it is not returned.
     */
    getIncomingCategoryLinks(): Collection<CategoryLink>;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for which this category
     * is the target and which are of the specified type.  If the source
     * category of a link belongs to a different catalog than the catalog owning
     * this category, it is not returned.
     */
    getIncomingCategoryLinks(type: number): Collection<CategoryLink>;
    /**
     * Returns a collection of category assignments of the category where the
     * referenced product is currently online. When checking the online status
     * of the product, the online flag and the online from & to dates are taken
     * into account. Online flag, online from & to dates set for the current site
     * takes precedence over the default values.
     */
    getOnlineCategoryAssignments(): Collection<CategoryAssignment>;
    /**
     * Returns the online status flag of the category.
     */
    getOnlineFlag(): boolean;
    /**
     * Returns the date from which the category is online or valid.
     */
    getOnlineFrom(): Date;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for
     * which this category is the target. If the source category of a link
     * belongs to a different catalog than the catalog owning this category, it
     * is not returned. Additionally, this method will only return a link if the
     * source category is currently online. A category is currently online if
     * its online flag equals true and the current site date is within the date
     * range defined by the onlineFrom and onlineTo attributes.
     */
    getOnlineIncomingCategoryLinks(): Collection<CategoryLink>;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for
     * which this category is the source. If the target category of a link
     * belongs to a different catalog than the catalog owning this category, it
     * is not returned. Additionally, this method will only return a link if the
     * target category is currently online. A category is currently online if
     * its online flag equals true and the current site date is within the date
     * range defined by the onlineFrom and onlineTo attributes.
     */
    getOnlineOutgoingCategoryLinks(): Collection<CategoryLink>;
    /**
     * Returns online products assigned to this category.
     * Offline products are not included in the returned collection.
     * When checking the online status of the product,
     * the online flag and the online from & to dates are taken into account.
     * Online flag, online from & to dates set for the current site takes precedence
     * over the default values.
     * 
     * The order of products in the returned collection corresponds to the
     * defined explicit sorting of products in this category.
     * @see dw.catalog.Category.hasOnlineProducts
     */
    getOnlineProducts(): Collection<Product<any>>;
    /**
     * Returns a sorted collection of currently online subcategories of this
     * catalog category.
     * 
     * -
     * A category is currently online if its online flag
     * equals true and the current site date is within the date range defined by
     * the onlineFrom and onlineTo attributes.
     * 
     * -
     * The returned collection is sorted by position. Subcategories marked as
     * "unsorted" always appear after those marked as "sorted" but are otherwise
     * not in any guaranteed order.
     * 
     * -
     * The returned collection contains direct subcategories only.
     * @see dw.catalog.Category.hasOnlineSubCategories
     */
    getOnlineSubCategories(): Collection<Category>;
    /**
     * Returns the date until which the category is online or valid.
     */
    getOnlineTo(): Date;
    /**
     * Returns a list of outgoing recommendations for this category. This method
     * behaves similarly to getRecommendations but additionally filters out
     * recommendations for which the target product is unorderable according to
     * its product availability model.
     * @see dw.catalog.ProductAvailabilityModel.isOrderable
     */
    getOrderableRecommendations(): Collection<Recommendation>;
    /**
     * Returns a list of outgoing recommendations for this category. This method
     * behaves similarly to getRecommendations but additionally
     * filters out recommendations for which the target product is unorderable
     * according to its product availability model.
     * @see dw.catalog.ProductAvailabilityModel.isOrderable
     */
    getOrderableRecommendations(type: number): Collection<Recommendation>;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for which this category
     * is the source.  If the target category of a link belongs to a different
     * catalog than the catalog owning this category, it is not returned.
     * The collection of links is sorted by the explicitly defined order
     * for this category with unsorted links appearing at the end.
     */
    getOutgoingCategoryLinks(): Collection<CategoryLink>;
    /**
     * Returns the collection of dw.catalog.CategoryLink objects for which this category
     * is the source and which are of the specified type.  If the target
     * category of a link belongs to a different catalog than the catalog owning
     * this category, it is not returned.  The collection of links is sorted by
     * the explicitly defined order for this category with unsorted links
     * appearing at the end.
     */
    getOutgoingCategoryLinks(type: number): Collection<CategoryLink>;
    /**
     * Returns the page description of this category for the default locale or null if not defined.
     */
    getPageDescription(): string | null;
    /**
     * Returns the page keywords of this category for the default locale or null if not defined.
     */
    getPageKeywords(): string | null;
    /**
     * Returns the page title of this category for the default locale or null if not defined.
     */
    getPageTitle(): string | null;
    /**
     * Returns the page URL property of this category or null if not defined.
     */
    getPageURL(): string | null;
    /**
     * Returns the parent of this category.
     */
    getParent(): Category | null;
    /**
     * Returns this category's ProductAttributeModel, which makes access to the
     * category's attribute information convenient. The model is calculated
     * based on the attribute definitions assigned to this category and the
     * global attribute definitions for the object type 'Product'.
     */
    getProductAttributeModel(): ProductAttributeModel;
    /**
     * Returns all products assigned to this category.
     * The order of products in the returned collection corresponds to the
     * defined explicit sorting of products in this category.
     * @see dw.catalog.Category.getOnlineProducts
     */
    getProducts(): Collection<Product<any>>;
    /**
     * Returns the outgoing recommendations for this category.  If this category
     * is not in the site catalog, or there is no site catalog, an empty
     * collection is returned.  Only recommendations for which the target
     * product exists and is assigned to the site catalog are returned.  The
     * recommendations are sorted by their explicitly set order.
     */
    getRecommendations(): Collection<Recommendation>;
    /**
     * Returns the outgoing recommendations for this category which are of the
     * specified type.  Behaves the same as getRecommendations but
     * additionally filters by recommendation type.
     */
    getRecommendations(type: number): Collection<Recommendation>;
    /**
     * Returns the search placement of the category or null of no search placement is defined.
     */
    getSearchPlacement(): number;
    /**
     * Returns the search rank of the category or null of no search rank is defined.
     */
    getSearchRank(): number;
    /**
     * Returns the category's sitemap change frequency.
     */
    getSiteMapChangeFrequency(): string;
    /**
     * Returns the category's sitemap inclusion.
     */
    getSiteMapIncluded(): number;
    /**
     * Returns the category's sitemap priority.
     */
    getSiteMapPriority(): number;
    /**
     * Returns a sorted collection of the subcategories of this catalog category,
     * including both online and offline subcategories.
     * 
     * -
     * The returned collection is sorted by position. Subcategories marked as
     * "unsorted" always appear after those marked as "sorted" but are otherwise
     * not in any guaranteed order.
     * 
     * -
     * The returned collection contains direct subcategories only.
     * @see dw.catalog.Category.getOnlineSubCategories
     */
    getSubCategories(): Collection<Category>;
    /**
     * Returns the template property value , which is the file name of the template
     * used to display the catalog category.
     */
    getTemplate(): string;
    /**
     * Returns the thumbnail image reference of this catalog category.
     */
    getThumbnail(): MediaFile;
    /**
     * Returns true if this catalog category has any online products assigned.
     * When checking the online status of the product,
     * the online flag and the online from & to dates are taken into account.
     * Online flag, online from & to dates set for the current site takes precedence
     * over the default values.
     * @see dw.catalog.Category.getOnlineProducts
     */
    hasOnlineProducts(): boolean;
    /**
     * Returns true if this catalog category has any online subcategories.
     * 
     * -
     * A category is currently online if its online flag
     * equals true and the current site date is within the date range defined by
     * the onlineFrom and onlineTo attributes.
     * 
     * -
     * Only direct subcategories are considered.
     * @see dw.catalog.Category.getOnlineSubCategories
     */
    hasOnlineSubCategories(): boolean;
    /**
     * Returns true if this category is a direct sub-category of the provided
     * category.
     */
    isDirectSubCategoryOf(parent: Category): boolean;
    /**
     * Returns the value indicating whether the catalog category is "currently
     * online".  A category is currently online if its online flag equals true
     * and the current site date is within the date range defined by the
     * onlineFrom and onlineTo attributes.
     */
    isOnline(): boolean;
    /**
     * Identifies if the category is the root category of its catalog.
     */
    isRoot(): boolean;
    /**
     * Returns true if this category is a sub-category of the provided category.
     * This can be either a direct or an indirect sub-category.
     */
    isSubCategoryOf(ancestor: Category): boolean;
    /**
     * Returns true if the category is a top level category, but not the root
     * category.
     */
    isTopLevel(): boolean;
    /**
     * Set the category's Variation Groups Display Mode.
     */
    setDisplayMode(displayMode: number): void;
    /**
     * Set the category's search placement.
     */
    setSearchPlacement(placement: number): void;
    /**
     * Set the category's search rank.
     */
    setSearchRank(rank: number): void;
}

export = Category;
