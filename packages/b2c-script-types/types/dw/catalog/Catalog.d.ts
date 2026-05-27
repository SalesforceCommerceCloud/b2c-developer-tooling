import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Category = require('./Category');

declare global {
    module ICustomAttributes {
        interface Catalog extends CustomAttributes {
        }
    }
}

/**
 * Represents a Commerce Cloud Digital Catalog. Catalogs are containers of products
 * and other product-related information and can be shared between sites. Every
 * product in the system is contained in (or "owned by") exactly one catalog.
 * Every site has a single "site catalog" which defines the products that are
 * available to purchase on that site. The static method
 * dw.catalog.CatalogMgr.getSiteCatalog returns the site catalog for
 * the current site.
 * 
 * Catalogs are organized into a tree of categories with a single top-level root
 * category. Products are assigned to categories within catalogs. They can be
 * assigned to categories in their owning catalog, or other catalogs. They can
 * be assigned to multiple categories within the same catalog. Products that are
 * not assigned to any categories are considered "uncategorized." A product has
 * a single "classification category" in some catalog, and one
 * "primary category" per catalog. The classification category defines the
 * attribute set of the product. The primary category is used as standard
 * presentation context within that catalog in the storefront.
 * 
 * While Commerce Cloud Digital does not currently distinguish different
 * catalog types, it is common practice to have two general types of catalog:
 * 
 * - "Product catalogs" typically contain detailed product information and are
 * frequently generated from some backend PIM system.
 * - "Site Catalogs" define the category structure of the storefront and
 * contain primarily the assignments of these categories to the products defined
 * in the product catalogs. The site catalog is assigned to the site.
 * 
 * In addition to products and categories, catalogs contain recommendations,
 * shared variation attributes which can be used by multiple master products,
 * and shared product options which can be used by multiple option products.
 */
declare class Catalog extends ExtensibleObject<ICustomAttributes.Catalog> {
    /**
     * Returns the value of attribute 'id'.
     */
    readonly ID: string;
    /**
     * Returns the value of the localized extensible object attribute
     * "shortDescription" for the current locale.
     */
    readonly description: string | null;
    /**
     * Returns the value of the localized extensible object attribute
     * "displayName" for the current locale.
     */
    readonly displayName: string | null;
    /**
     * Returns the object for the relation 'root'.
     */
    readonly root: Category;
    private constructor();
    /**
     * Returns the value of the localized extensible object attribute
     * "shortDescription" for the current locale.
     */
    getDescription(): string | null;
    /**
     * Returns the value of the localized extensible object attribute
     * "displayName" for the current locale.
     */
    getDisplayName(): string | null;
    /**
     * Returns the value of attribute 'id'.
     */
    getID(): string;
    /**
     * Returns the object for the relation 'root'.
     */
    getRoot(): Category;
}

export = Catalog;
