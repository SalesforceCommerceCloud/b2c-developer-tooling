import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Quantity = require('../value/Quantity');
import Product = require('../catalog/Product');
import ProductList = require('./ProductList');
import ProductListItemPurchase = require('./ProductListItemPurchase');
import Collection = require('../util/Collection');
import ProductOptionModel = require('../catalog/ProductOptionModel');

declare global {
    module ICustomAttributes {
        interface ProductListItem extends CustomAttributes {
        }
    }
}

/**
 * An item in a product list.  Types of items are:
 * 
 * - An item that references a product via the product's SKU.
 * - An item that represents a gift certificate.
 */
declare class ProductListItem extends ExtensibleObject<ICustomAttributes.ProductListItem> {
    /**
     * Constant representing a gift certificate list item type.
     */
    static readonly TYPE_GIFT_CERTIFICATE: number;
    /**
     * Constant representing a product list item type.
     */
    static readonly TYPE_PRODUCT: number;
    /**
     * Returns the unique system generated ID of the object.
     */
    readonly ID: string;
    /**
     * Returns the product list that this item belongs to.
     */
    readonly list: ProductList;
    /**
     * Specify the priority level for the item.  Typically the lower the
     * number, the higher the priority. This can be used by the owner of the product list
     * to express which items he/she likes to get purchased first.
     */
    priority: number;
    /**
     * Returns the referenced product for this item.  The reference is made
     * via the product ID attribute.  This method returns null if there is
     * no such product in the system or if the product exists but is not
     * assigned to the site catalog.
     */
    product: Product<any> | null;
    /**
     * Returns the ID of the product referenced by this item.
     * This attribute is set when a product is assigned via setProduct().
     * It is possible for the ID to reference a product that doesn't exist
     * anymore.  In this case getProduct() would return null.
     */
    readonly productID: string | null;
    /**
     * Returns the ProductOptionModel for the product associated with this item,
     * or null if there is no valid product associated with this item.
     */
    productOptionModel: ProductOptionModel | null;
    /**
     * A flag, typically used to determine whether the item should display
     * in a customer's view of the list (as opposed to the list owner's view).
     */
    public: boolean;
    /**
     * Returns the sum of the quantities of all the individual purchase records
     * for this item.
     */
    readonly purchasedQuantity: Quantity;
    /**
     * Returns the value part of the underlying purchased quantity object, as distinct
     * from the unit.
     */
    readonly purchasedQuantityValue: number;
    /**
     * Returns all purchases made for this item.
     */
    readonly purchases: Collection<ProductListItemPurchase>;
    /**
     * Returns the quantity of the item.
     * The quantity is the number of products or gift certificates
     * that get shipped when purchasing this product list item.
     */
    quantity: Quantity;
    /**
     * Returns the value part of the underlying quantity object, as distinct
     * from the unit.
     */
    quantityValue: number;
    /**
     * Returns the type of this product list item.
     */
    readonly type: number;
    private constructor();
    /**
     * Create a purchase record for this item.
     */
    createPurchase(quantity: number, purchaserName: string): ProductListItemPurchase;
    /**
     * Returns the unique system generated ID of the object.
     */
    getID(): string;
    /**
     * Returns the product list that this item belongs to.
     */
    getList(): ProductList;
    /**
     * Specify the priority level for the item.  Typically the lower the
     * number, the higher the priority. This can be used by the owner of the product list
     * to express which items he/she likes to get purchased first.
     */
    getPriority(): number;
    /**
     * Returns the referenced product for this item.  The reference is made
     * via the product ID attribute.  This method returns null if there is
     * no such product in the system or if the product exists but is not
     * assigned to the site catalog.
     */
    getProduct(): Product<any> | null;
    /**
     * Returns the ID of the product referenced by this item.
     * This attribute is set when a product is assigned via setProduct().
     * It is possible for the ID to reference a product that doesn't exist
     * anymore.  In this case getProduct() would return null.
     */
    getProductID(): string | null;
    /**
     * Returns the ProductOptionModel for the product associated with this item,
     * or null if there is no valid product associated with this item.
     */
    getProductOptionModel(): ProductOptionModel | null;
    /**
     * Returns the sum of the quantities of all the individual purchase records
     * for this item.
     */
    getPurchasedQuantity(): Quantity;
    /**
     * Returns the value part of the underlying purchased quantity object, as distinct
     * from the unit.
     */
    getPurchasedQuantityValue(): number;
    /**
     * Returns all purchases made for this item.
     */
    getPurchases(): Collection<ProductListItemPurchase>;
    /**
     * Returns the quantity of the item.
     * The quantity is the number of products or gift certificates
     * that get shipped when purchasing this product list item.
     */
    getQuantity(): Quantity;
    /**
     * Returns the value part of the underlying quantity object, as distinct
     * from the unit.
     */
    getQuantityValue(): number;
    /**
     * Returns the type of this product list item.
     */
    getType(): number;
    /**
     * A flag, typically used to determine whether the item should display
     * in a customer's view of the list (as opposed to the list owner's view).
     */
    isPublic(): boolean;
    /**
     * Specify the priority level for the item.  Typically the lower the
     * number, the higher the priority. This can be used by the owner of the product list
     * to express which items he/she likes to get purchased first.
     */
    setPriority(priority: number): void;
    /**
     * Sets the referenced product for this item by storing the product's id.
     * If null is specified, then the id is set to null.
     * @deprecated Use dw.customer.ProductList.createProductItem instead.
     */
    setProduct(product: Product<any>): void;
    /**
     * Store a product option model with this object.  This stores a copy
     * of the specified model, rather than an assocation to the same instance.
     */
    setProductOptionModel(productOptionModel: ProductOptionModel): void;
    /**
     * Typically used to determine if the item is visible to other customers.
     */
    setPublic(flag: boolean): void;
    /**
     * Sets the quantity of the item.
     * @deprecated Use setQuantityValue instead.
     */
    setQuantity(value: Quantity): void;
    /**
     * Set the value part of the underlying quantity object, as distinct from
     * the unit.
     */
    setQuantityValue(value: number): void;
}

export = ProductListItem;
