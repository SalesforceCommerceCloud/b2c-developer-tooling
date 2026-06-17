import Product = require('./Product');
import Collection = require('../util/Collection');
import Variant = require('./Variant');
import VariationGroup = require('./VariationGroup');
import ObjectAttributeDefinition = require('../object/ObjectAttributeDefinition');
import ObjectAttributeValueDefinition = require('../object/ObjectAttributeValueDefinition');
import HashMap = require('../util/HashMap');
import ProductVariationAttribute = require('./ProductVariationAttribute');
import ProductVariationAttributeValue = require('./ProductVariationAttributeValue');
import List = require('../util/List');
import Image = require('../experience/image/Image');
import MediaFile = require('../content/MediaFile');
import URL = require('../web/URL');

/**
 * Class representing the complete variation information for a master product in
 * the system. An instance of this class provides methods to access the
 * following information:
 * 
 * - The variation attributes of the master product (e.g. size and color). Use
 * getProductVariationAttributes.
 * - The variation attribute values (e.g. size=Small, Medium, Large and
 * color=Red, Blue). Use getAllValues.
 * - The variation groups which may represent a subset of variants by defining a
 * subset of the variation attribute values (e.g. color=Red, size=empty). Use
 * getVariationGroups.
 * - The variants themselves (e.g. the products representing Small Red, Large
 * Red, Small Blue, Large Blue, etc). Use getVariants.
 * - The variation attribute values of those variants. Use
 * getVariationValue.
 * 
 * This model only considers variants which are complete (i.e. the variant has a
 * value for each variation attribute), and currently online. Incomplete or
 * offline variants will not be returned by any method that returns Variants,
 * and their attribute values will not be considered in any method that returns
 * values.
 * 
 * In addition to providing access to this meta information,
 * ProductVariationModel maintains a collection of selected variation attribute
 * values, representing the selections that a customer makes in the storefront.
 * If this model was constructed for a master product, then none of the
 * attributes will have pre-selected values. If this model was constructed for a
 * variant product, then all the attribute values of that variant will be
 * pre-selected.
 * 
 * It is possible to query the current selections by calling
 * getSelectedValue or
 * isSelectedAttributeValue.
 * 
 * The method setSelectedAttributeValue can be used to modify
 * the selected values. Depending on the product type, it's possible to select or modify
 * variation attribute values:
 * 
 * - If this model was constructed for a master product, it's possible to select and modify all variation attributes.
 * - If this model was constructed for a variation group, it's possible to select and modify all variation attributes that are not defined by the variation group.
 * - If this model was constructed for a variation product, it's not possible to select or modify any of the variation attributes.
 * 
 * Furthermore, the model provides helper methods to generate URLs
 * for selecting and unselecting variation attribute values. See those methods
 * for details.
 * 
 * If this model was constructed for a product that is neither a
 * master nor a variant, then none of the methods will return useful values at
 * all.
 * 
 * The methods in this class which access the currently selected variation
 * attribute values can be used on product detail pages to render information
 * about which combinations are available or unavailable. The methods
 * getFilteredValues and
 * hasOrderableVariants
 * can be used to determine this type of situation and render the appropriate
 * message in the storefront.
 * 
 * NOTE: Several methods in this class have a version taking a
 * dw.catalog.ProductVariationAttribute parameter, and another
 * deprecated version accepting a dw.object.ObjectAttributeDefinition
 * parameter instead. The former should be strictly favored. The latter are
 * historical leftovers from when object attributes were used directly as the
 * basis for variation, and the value lists were stored directly on the
 * ObjectAttributeDefinition. Every ProductVariationAttribute corresponds with
 * exactly one ObjectAttributeDefinition, but values are now stored on the
 * ProductVariationAttribute and not the ObjectAttributeDefinition.
 */
declare class ProductVariationModel {
    /**
     * Returns the object attribute definitions corresponding with the product
     * variation attributes of the master product.
     * @deprecated This method is deprecated since custom code should work with
     * ProductVariationAttributes and not directly with their
     * corresponding ObjectAttributeDefinitions. Use
     * getProductVariationAttributes to get the
     * product variation attributes.
     */
    readonly attributeDefinitions: Collection<ObjectAttributeDefinition>;
    /**
     * Return the default variant of this model's master product. If no default
     * variant has been defined, return an arbitrary variant.
     */
    readonly defaultVariant: Variant | null;
    /**
     * Returns the master of the product variation.
     */
    readonly master: Product<any>;
    /**
     * Returns a collection of product variation attributes of the variation.
     */
    readonly productVariationAttributes: Collection<ProductVariationAttribute>;
    /**
     * Returns the variant currently selected for this variation model.
     * Returns null if no variant is selected.
     */
    readonly selectedVariant: Variant | null;
    /**
     * Returns the variants currently selected for this variation model.
     * Returns an empty collection if no variant is selected.
     */
    readonly selectedVariants: Collection<Variant>;
    /**
     * Returns the collection of product variants of this variation model.
     * This collection only includes online variants. Offline variants are
     * filtered out. If all variation products are required, consider using
     * dw.catalog.Product.getVariants.
     * 
     * The product variants are returned in no particular order.
     */
    readonly variants: Collection<Variant>;
    /**
     * Returns the collection of variation groups of this variation model.
     * This collection only includes online variation groups. Offline variation
     * groups are filtered out. If all variation group products are required,
     * consider using dw.catalog.Product.getVariationGroups.
     * 
     * The variation groups are returned in no particular order.
     */
    readonly variationGroups: Collection<VariationGroup>;
    private constructor();
    /**
     * Returns the value definitions for the specified attribute. Only values
     * that actually exist for at least one of the master product's currently
     * online and complete variants are returned.
     * 
     * Returns an empty collection if the passed attribute is not even a
     * variation attribute of the master product.
     * @deprecated This method is deprecated since custom code should work with
     * ProductVariationAttributes and not directly with their
     * corresponding ObjectAttributeDefinitions. Use
     * getAllValues to get the
     * collection of ProductVariationAttributeValue instances
     * instead.
     */
    getAllValues(attribute: ObjectAttributeDefinition): Collection<ObjectAttributeValueDefinition>;
    /**
     * Returns the values for the specified attribute. Only values that actually
     * exist for at least one of the master product's currently online and
     * complete variants are returned.
     * 
     * Returns an empty collection if the passed attribute is not even a
     * variation attribute of the master product.
     */
    getAllValues(attribute: ProductVariationAttribute): Collection<ObjectAttributeValueDefinition>;
    /**
     * Returns the object attribute definitions corresponding with the product
     * variation attributes of the master product.
     * @deprecated This method is deprecated since custom code should work with
     * ProductVariationAttributes and not directly with their
     * corresponding ObjectAttributeDefinitions. Use
     * getProductVariationAttributes to get the
     * product variation attributes.
     */
    getAttributeDefinitions(): Collection<ObjectAttributeDefinition>;
    /**
     * Return the default variant of this model's master product. If no default
     * variant has been defined, return an arbitrary variant.
     */
    getDefaultVariant(): Variant | null;
    /**
     * Returns a collection of the value definitions defined for the specified
     * attribute, filtered based on currently selected values.
     * 
     * A value is only returned if it at least one variant has the value and
     * also possesses the selected values for all previous attributes. It is
     * important to know that the filter is applied in a certain order. The
     * method looks at all ObjectAttributeDefinition instances that appear
     * before the passed one in the sorted collection returned by
     * getAttributeDefinitions. If the passed attribute is the first
     * in this collection, then this method simply returns all its values. If an
     * earlier attribute does not have a selected value, this method returns an
     * empty list. Otherwise, the filter looks at all variants matching the
     * selected value for all previous attributes, and considers the range of
     * values possessed by these variants for the passed attribute.
     * 
     * The idea behind this method is that customers in the storefront select
     * variation attribute values one by one in the order the variation
     * attributes are defined and displayed. After each selection, customer only
     * wants to see values that he can possibly order for the remaining
     * attributes.
     * 
     * Returns an empty collection if the passed attribute is not even a
     * variation attribute of the master product.
     * @deprecated Use getFilteredValues to
     * get the sorted and calculated collection of product variation
     * attribute values.
     */
    getFilteredValues(attribute: ObjectAttributeDefinition): Collection<ObjectAttributeValueDefinition>;
    /**
     * Returns a collection of the value definitions defined for the specified
     * attribute, filtered based on currently selected values.
     * 
     * A value is only returned if it at least one variant has the value and
     * also possesses the selected values for all previous attributes. It is
     * important to know that the filter is applied in a certain order. The
     * method looks at all ProductVariationAttribute instances that appear
     * before the passed one in the sorted collection returned by
     * getProductVariationAttributes. If the passed attribute is the
     * first in this collection, then this method simply returns all its values.
     * If an earlier attribute does not have a selected value, this method
     * returns an empty list. Otherwise, the filter looks at all variants
     * matching the selected value for all previous attributes, and considers
     * the range of values possessed by these variants for the passed attribute.
     * 
     * The idea behind this method is that customers in the storefront select
     * variation attribute values one by one in the order the variation
     * attributes are defined and displayed. After each selection, customer only
     * wants to see values that he can possibly order for the remaining
     * attributes.
     * 
     * Returns an empty collection if the passed attribute is not even a
     * variation attribute of the master product.
     */
    getFilteredValues(attribute: ProductVariationAttribute): Collection<ObjectAttributeValueDefinition>;
    /**
     * Returns an HTML representation of the variation attribute id. This method
     * is deprecated. You should use getHtmlName(ProductVariationAttribute)
     * instead.
     * @deprecated Use getHtmlName to get
     * the HTML representation of the product variation attribute
     * id.
     */
    getHtmlName(attribute: ObjectAttributeDefinition): string;
    /**
     * Returns an HTML representation of the variation attribute id with the
     * custom prefix. This method is deprecated. You should use
     * getHtmlName instead.
     * @deprecated Use getHtmlName
     * to get the HTML representation of the product variation
     * attribute id with the custom prefix.
     */
    getHtmlName(prefix: string, attribute: ObjectAttributeDefinition): string;
    /**
     * Returns an HTML representation of the product variation attribute id.
     */
    getHtmlName(attribute: ProductVariationAttribute): string;
    /**
     * Returns an HTML representation of the  product variation attribute id with the custom prefix.
     */
    getHtmlName(prefix: string, attribute: ProductVariationAttribute): string;
    /**
     * The method returns the first image appropriate for the currently selected attribute values.
     * 
     * The method first considers the most specific combination of attribute values (e.g
     * "Red leather") and if that is not found, more general (e.g "Red").  If no image group
     * is found for the attributes, returns null
     * 
     * The view type parameter is required, otherwise a exception is thrown.
     */
    getImage(viewtype: string, attribute: ProductVariationAttribute, value: ProductVariationAttributeValue): MediaFile | null;
    /**
     * The method returns an image appropriate for the current selected variation values
     * with the specific index.
     * 
     * If images are defined for this view type and variants, but not for
     * specified index, the method returns null.
     * 
     * If no images are defined for all variants and specified view type, the
     * image at the specified index of the master product images is returned. If
     * no master product image for specified index is defined, the method
     * returns null.
     * 
     * The view type parameter is required, otherwise a exception is thrown.
     */
    getImage(viewtype: string, index: number): MediaFile | null;
    /**
     * The method returns the first image appropriate for the current selected variation values
     * with the specific index.
     * 
     * If images are defined for this view type and variants, but not for
     * specified index, the method returns null.
     * 
     * If no images are defined for all variants and specified view type, the
     * image at the specified index of the master product images is returned. If
     * no master product image for specified index is defined, the method
     * returns null.
     * 
     * The view type parameter is required, otherwise a exception is thrown.
     */
    getImage(viewtype: string): MediaFile | null;
    /**
     * The method returns the image appropriate for the currently selected attribute values.
     * 
     * The method first considers the most specific combination of attribute values (e.g
     * "Red leather") and if that is not found, more general (e.g "Red").  If no image group
     * is found for the attributes, returns null
     * 
     * The view type parameter is required, otherwise a exception is thrown.
     */
    getImages(viewtype: string): List<Image>;
    /**
     * Returns the master of the product variation.
     */
    getMaster(): Product<any>;
    /**
     * Returns the product variation attribute for the specific id,
     * or null if there is no product variation attribute for that id.
     */
    getProductVariationAttribute(id: string): ProductVariationAttribute | null;
    /**
     * Returns a collection of product variation attributes of the variation.
     */
    getProductVariationAttributes(): Collection<ProductVariationAttribute>;
    /**
     * Returns the selected value for the specified attribute. If no value is
     * selected, null is returned.
     * @deprecated Use getSelectedValue to
     * get the selected product variation attribute value for the
     * specified attribute.
     */
    getSelectedValue(attribute: ObjectAttributeDefinition): ObjectAttributeValueDefinition | null;
    /**
     * Returns the selected value for the specified product variation attribute. If no value is
     * selected, null is returned.
     */
    getSelectedValue(attribute: ProductVariationAttribute): ProductVariationAttributeValue | null;
    /**
     * Returns the variant currently selected for this variation model.
     * Returns null if no variant is selected.
     */
    getSelectedVariant(): Variant | null;
    /**
     * Returns the variants currently selected for this variation model.
     * Returns an empty collection if no variant is selected.
     */
    getSelectedVariants(): Collection<Variant>;
    /**
     * Returns the collection of product variants of this variation model.
     * This collection only includes online variants. Offline variants are
     * filtered out. If all variation products are required, consider using
     * dw.catalog.Product.getVariants.
     * 
     * The product variants are returned in no particular order.
     */
    getVariants(): Collection<Variant>;
    /**
     * Returns the variants that match the specified filter conditions. The
     * filter conditions are specified as a hash map of <attribute_id> -
     * <value_id>.  This method does not consider the currently selected
     * attribute values.
     */
    getVariants(filter: HashMap<any, any>): Collection<Variant>;
    /**
     * Returns the collection of variation groups of this variation model.
     * This collection only includes online variation groups. Offline variation
     * groups are filtered out. If all variation group products are required,
     * consider using dw.catalog.Product.getVariationGroups.
     * 
     * The variation groups are returned in no particular order.
     */
    getVariationGroups(): Collection<VariationGroup>;
    /**
     * Returns the value for the specified variant or variation group product and
     * variation attribute. The specified product should be a dw.catalog.Variant
     * returned by getVariants or a dw.catalog.VariationGroup returned by
     * getVariationGroups. The variation attribute should be one returned by
     * getProductVariationAttributes. If an invalid product or attribute is passed,
     * null is returned. If null is passed for either argument, an exception is thrown.
     */
    getVariationValue(variantOrVariationGroup: Product<any>, attribute: ProductVariationAttribute): ProductVariationAttributeValue | null;
    /**
     * Returns true if any variant is available with the specified value of the
     * specified variation attribute. Available means that the variant is
     * orderable according to the variant's availability model. This method
     * takes currently selected attribute values into consideration. The
     * specific rules are as follows:
     * 
     * - If no variation value is currently selected, the method returns true
     * if any variant with the specified value is available, else false.
     * - if one or more variation values are selected, the method returns true
     * if any variant with a combination of the specified value and the selected
     * value is available, else false.
     * - if all variation values are selected, the method returns true of the
     * variant that is represented by the current selection is available, else
     * false.
     */
    hasOrderableVariants(attribute: ProductVariationAttribute, value: ProductVariationAttributeValue): boolean;
    /**
     * Identifies if the specified variation value is the one currently
     * selected.
     * @deprecated Use
     * isSelectedAttributeValue
     * to identify if the specified product variation attribute
     * value is the one currently selected.
     */
    isSelectedAttributeValue(attribute: ObjectAttributeDefinition, value: ObjectAttributeValueDefinition): boolean;
    /**
     * Identifies if the specified product variation attribute value is the one
     * currently selected.
     */
    isSelectedAttributeValue(attribute: ProductVariationAttribute, value: ProductVariationAttributeValue): boolean;
    /**
     * Applies a selected attribute value to this model instance.
     * Usually this method is used to set the model state corresponding to the variation attribute values
     * specified by a URL. The URLs can be obtained by using one of the models URL methods, like
     * urlSelectVariationValue and
     * urlUnselectVariationValue.
     * 
     * Anyway, there are some limitations to keep in mind when selecting variation attribute values.
     * A Variation Model created for a Variation Group or Variant Product is bound to an initial state.
     * Example:
     * 
     * - A Variation Model created for Variation Group A can't be switched to Variation Group B.
     * - A Variation Model created for Variant A can't be switched to Variant B.
     * - The state of a Variation Model for a Variation Group that defines color = red can't be changed to color = black.
     * - The state of a Variation Model for a Variant that defines color = red / size = L can't be changed to color = black / size = S.
     * However, the state of a Variation Model created for a Variation Group that defines color = red
     * can be changed to a more specific state by adding another selected value, e.g. size = L.
     * 
     * The state of a Variation Model created for a Variation Master can be changed in any possible way
     * because the initial state involves all variation values and Variants.
     */
    setSelectedAttributeValue(variationAttributeID: string, variationAttributeValueID: string): void;
    /**
     * Constructs a URL to select a set of variation attribute values. The
     * optional `varAttrAndValues` argument can be empty, or can
     * contain one or more variation attribute / value pairs. This variable list
     * should be even in length, with attributes and values alternating.
     * Attributes can be specified as instances of ProductVariationAttribute, or
     * String variation attribute ID. (Note: ObjectAttributeDefinition IDs are
     * not supported.) Values can be specified as instances of
     * ProductVariationAttributeValue or String or Integer depending on the data
     * type of the variation attribute. If a parameter type is invalid, or does
     * not reference a valid ProductVariationAttribute or
     * ProductVariationAttributeValue, then the parameter pair is not included
     * in the generated URL. The returned URL will contain variation attributes
     * and values already selected in the product variation model, as well as
     * attributes and values specified as method parameters.
     * 
     * Sample usage:
     * @example
     * master.variationModel.url("Product-Show", "color", "red", "size", "XL");
     * 
     * master.variationModel.url("Product-Show", colorVarAttr, colorValue, sizeVarAttr, sizeValue);
     * 
     * // --> on/demandware.store/Sites-SiteGenesis-Site/default/Product-Show?pid=master_id&dwvar_color=red&dwvar_size=XL
     */
    url(action: string, ...varAttrAndValues: any[]): URL;
    /**
     * Constructs an URL to select the specified value of the specified
     * variation attribute.
     * 
     * The generated URL will be an absolute URL which uses the protocol of the
     * current request.
     * @deprecated Use
     * urlSelectVariationValue
     * to construct an URL to select the specified product variation
     * attribute value of the specified product variation attribute.
     */
    urlSelectVariationValue(action: string, attribute: ObjectAttributeDefinition, value: ObjectAttributeValueDefinition): string;
    /**
     * Generates a URL for selecting a value for a given variation attribute.
     * This URL is intended to be used on dynamic product detail pages. When a
     * customer selects which value he wants for one of the variation
     * attributes, the product detail page can issue a request to the passed URL
     * which in turn can invoke the
     * `UpdateProductVariationSelections` pipelet. That pipelet reads
     * the querystring parameters and returns an updated variation model with
     * the desired attribute value selected.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    urlSelectVariationValue(action: string, attribute: ProductVariationAttribute, value: ProductVariationAttributeValue): string;
    /**
     * Constructs an URL to unselect the value of the specified variation
     * attribute.
     * 
     * The generated URL will be an absolute URL which uses the protocol of the
     * current request.
     * @deprecated Use
     * urlUnselectVariationValue
     * to unselect the product variation attribute value of the
     * specified product variation attribute.
     */
    urlUnselectVariationValue(action: string, attribute: ObjectAttributeDefinition): string;
    /**
     * Generates a URL for unselecting a value for a given variation attribute.
     * This URL is intended to be used on dynamic product detail pages. When a
     * customer deselects a value for one of the variation attributes, the
     * product detail page can issue a request to the passed URL which in turn
     * can invoke the `UpdateProductVariationSelections` pipelet.
     * That pipelet reads the querystring parameters and returns an updated
     * variation model with the desired attribute value unselected.
     * 
     * The generated URL will be an absolute URL which uses the protocol of
     * the current request.
     */
    urlUnselectVariationValue(action: string, attribute: ProductVariationAttribute): string;
}

export = ProductVariationModel;
