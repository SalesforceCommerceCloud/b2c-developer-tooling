import Collection = require('../util/Collection');
import ObjectAttributeGroup = require('../object/ObjectAttributeGroup');
import ObjectAttributeDefinition = require('../object/ObjectAttributeDefinition');

/**
 * Class representing the complete attribute model for products in the system.
 * An instance of this class provides methods to access the attribute
 * definitions and groups for the system object type 'Product' and perhaps
 * additional information depending on how the instance is obtained.
 * A ProductAttributeModel can be obtained in one of three ways:
 * 
 * - ProductAttributeModel: When the no-arg constructor is
 * used the model represents:
 * 
 * - the attribute groups of the system object type 'Product' (i.e. the
 * global product attribute groups) and their bound attributes
 * 
 * - dw.catalog.Category.getProductAttributeModel: When the
 * attribute model for a Category is retrieved, the model represents:
 * 
 * - the global product attribute groups
 * - product attribute groups of the calling category
 * - product attribute groups of any parent categories of the calling category
 * 
 * - dw.catalog.Product.getAttributeModel: When the attribute
 * model for a Product is retrieved, the model represents:
 * 
 * - the global product attribute groups
 * - product attribute groups of the product's classification category
 * - product attribute groups of any parent categories of the product's classification category
 * 
 * In this case, the model additionally provides access to the attribute values
 * of the product.  If the product lacks a classification category, then only
 * the global product attribute group is considered by the model.
 * 
 * The ProductAttributeModel provides a generic way to display the attribute
 * values of a product on a product detail page organized into appropriate
 * visual groups.  This is typically done as follows:
 * 
 * - On the product detail page, call
 * dw.catalog.Product.getAttributeModel to get the attribute model for
 * the product.
 * - Call getVisibleAttributeGroups to get the groups that are
 * appropriate for this product and all other products assigned to the same
 * classification category.
 * - Iterate the groups, and display each as a "group" in the UI.
 * - Call getVisibleAttributeDefinitions for
 * each group. Iterate and display the attribute names using
 * dw.object.ObjectAttributeDefinition.getDisplayName.
 * - For each attribute, get the product's display value(s) for that
 * attribute, using `getDisplayValue()`. This might require custom
 * display logic based on the type of attribute (strings, dates, multi-value
 * attributes, etc).
 */
declare class ProductAttributeModel {
    /**
     * Returns a sorted collection of attribute groups of this model. The groups
     * returned depends on how this model is constructed and what it represents.
     * (See class-level documentation for details).
     * 
     * The collection of returned groups is sorted first by scope and secondly
     * by explicit sort order. Global groups always appear before
     * category-specific groups in the list. Groups of parent categories always
     * appear before groups belonging to subcategories. At each scope, groups
     * have an explicit sort order which can be managed within the Business
     * Manager.
     * 
     * When there are multiple attribute groups with the same ID, the following
     * rules apply:
     * 
     * - If this model represents the global product attribute group only
     * (e.g. the no-arg constructor was used), duplicates cannot occur since
     * only one group can be defined with a given ID at that scope.
     * - If this model is associated with specific categories (e.g. it is
     * constructed from a product with a classification category), then a
     * category product attribute group might have the same ID as a global
     * product attribute group. In this case, the category group overrides the
     * global one.
     * - If a category and one of its ancestor categories both define a
     * product attribute group with the same ID, the sub-category group
     * overrides the parent group.
     * 
     * As a result of these rules, this method will never return two attribute
     * groups with the same ID.
     */
    readonly attributeGroups: Collection<ObjectAttributeGroup>;
    /**
     * Returns an unsorted collection of attribute definitions marked as
     * order-required. Order-required attributes are usually copied into order
     * line items.
     * 
     * The returned attribute definitions are sorted according to the explicit
     * sort order defined for the attributes in the group. This is managed by
     * merchant in the Business Manager.
     */
    readonly orderRequiredAttributeDefinitions: Collection<ObjectAttributeDefinition>;
    /**
     * Returns a sorted collection of visible attribute groups of this model.
     * This method is similar to getAttributeGroups but only includes
     * attribute groups containing at least one attribute definition that is
     * visible. See
     * getVisibleAttributeDefinitions.
     */
    readonly visibleAttributeGroups: Collection<ObjectAttributeGroup>;
    /**
     * Constructs a product attribute model that is not based on a product nor
     * a category. Therefore, the model only describes the product attributes
     * globally defined for the system object type 'Product'.
     */
    constructor();
    /**
     * Returns the attribute definition with the given id from the product attribute
     * model. If attribute definition does not exist, null is returned.
     */
    getAttributeDefinition(id: string): ObjectAttributeDefinition | null;
    /**
     * Returns a sorted collection of attribute definitions for the given attribute
     * group. If no attribute definition exist for the group, an empty collection
     * is returned.
     * 
     * The returned attribute definitions are sorted according to the explicit
     * sort order defined for the attributes in the group.  This is managed
     * by merchant in the Business Manager.
     */
    getAttributeDefinitions(group: ObjectAttributeGroup): Collection<ObjectAttributeDefinition>;
    /**
     * Returns the attribute group with the given id from the product attribute
     * model. If attribute group does not exist, null is returned.
     */
    getAttributeGroup(id: string): ObjectAttributeGroup | null;
    /**
     * Returns a sorted collection of attribute groups of this model. The groups
     * returned depends on how this model is constructed and what it represents.
     * (See class-level documentation for details).
     * 
     * The collection of returned groups is sorted first by scope and secondly
     * by explicit sort order. Global groups always appear before
     * category-specific groups in the list. Groups of parent categories always
     * appear before groups belonging to subcategories. At each scope, groups
     * have an explicit sort order which can be managed within the Business
     * Manager.
     * 
     * When there are multiple attribute groups with the same ID, the following
     * rules apply:
     * 
     * - If this model represents the global product attribute group only
     * (e.g. the no-arg constructor was used), duplicates cannot occur since
     * only one group can be defined with a given ID at that scope.
     * - If this model is associated with specific categories (e.g. it is
     * constructed from a product with a classification category), then a
     * category product attribute group might have the same ID as a global
     * product attribute group. In this case, the category group overrides the
     * global one.
     * - If a category and one of its ancestor categories both define a
     * product attribute group with the same ID, the sub-category group
     * overrides the parent group.
     * 
     * As a result of these rules, this method will never return two attribute
     * groups with the same ID.
     */
    getAttributeGroups(): Collection<ObjectAttributeGroup>;
    /**
     * Returns the value that the underlying product defines for the given
     * attribute definition in the current locale. In case the attribute
     * definition defines localized attribute values, the product's value is
     * used as an id to find the localized display value.
     */
    getDisplayValue(definition: ObjectAttributeDefinition): any;
    /**
     * Returns an unsorted collection of attribute definitions marked as
     * order-required. Order-required attributes are usually copied into order
     * line items.
     * 
     * The returned attribute definitions are sorted according to the explicit
     * sort order defined for the attributes in the group. This is managed by
     * merchant in the Business Manager.
     */
    getOrderRequiredAttributeDefinitions(): Collection<ObjectAttributeDefinition>;
    /**
     * Returns the attribute value for the specified attribute
     * definition. If the product does not define a value, null is returned.
     * 
     * Note: this method may only be used where the attribute model was created for
     * a specific product; otherwise it will always return null.
     * 
     * If the attribute is localized, the value for the current session locale
     * is returned.
     */
    getValue(definition: ObjectAttributeDefinition): any | null;
    /**
     * Returns a sorted collection of all visible attribute definitions for the
     * given attribute group. If no visible attribute definition exist for the
     * group, an empty collection is returned.
     * 
     * An attribute definition is considered visible if is marked as visible. If
     * the product attribute model is created for a specific product, the
     * product must also define a value for the attribute definition; else the
     * attribute definition is considered as invisible.
     * 
     * The returned attribute definitions are sorted according to the explicit
     * sort order defined for the attributes in the group. This is managed by
     * merchant in the Business Manager.
     */
    getVisibleAttributeDefinitions(group: ObjectAttributeGroup): Collection<ObjectAttributeDefinition>;
    /**
     * Returns a sorted collection of visible attribute groups of this model.
     * This method is similar to getAttributeGroups but only includes
     * attribute groups containing at least one attribute definition that is
     * visible. See
     * getVisibleAttributeDefinitions.
     */
    getVisibleAttributeGroups(): Collection<ObjectAttributeGroup>;
}

export = ProductAttributeModel;
