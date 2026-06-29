import LineItem = require('./LineItem');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Shipment = require('./Shipment');
import ProductListItem = require('../customer/ProductListItem');

declare global {
    module ICustomAttributes {
        interface GiftCertificateLineItem extends ICustomAttributes.LineItem {
        }
    }
}

/**
 * Represents a Gift Certificate line item in the cart. When an order is
 * processed, a Gift Certificate is created based on the information in
 * the Gift Certificate line item.
 */
declare class GiftCertificateLineItem extends LineItem<ICustomAttributes.GiftCertificateLineItem> {
    /**
     * Returns the ID of the gift certificate that this line item
     * was used to create. If this line item has not been used to create
     * a Gift Certificate, this method returns null.
     */
    giftCertificateID: string | null;
    /**
     * Returns the message to include in the email of the person receiving
     * the gift certificate line item.
     */
    message: string;
    /**
     * Returns the associated ProductListItem.
     */
    productListItem: ProductListItem | null;
    /**
     * Returns the email address of the person receiving
     * the gift certificate line item.
     */
    recipientEmail: string;
    /**
     * Returns the name of the person receiving the gift certificate line item.
     */
    recipientName: string;
    /**
     * Returns the name of the person or organization that
     * sent the gift certificate line item or null if undefined.
     */
    senderName: string | null;
    /**
     * Returns the associated Shipment.
     */
    shipment: Shipment;
    private constructor();
    /**
     * Returns the ID of the gift certificate that this line item
     * was used to create. If this line item has not been used to create
     * a Gift Certificate, this method returns null.
     */
    getGiftCertificateID(): string | null;
    /**
     * Returns the message to include in the email of the person receiving
     * the gift certificate line item.
     */
    getMessage(): string;
    /**
     * Returns the associated ProductListItem.
     */
    getProductListItem(): ProductListItem | null;
    /**
     * Returns the email address of the person receiving
     * the gift certificate line item.
     */
    getRecipientEmail(): string;
    /**
     * Returns the name of the person receiving the gift certificate line item.
     */
    getRecipientName(): string;
    /**
     * Returns the name of the person or organization that
     * sent the gift certificate line item or null if undefined.
     */
    getSenderName(): string | null;
    /**
     * Returns the associated Shipment.
     */
    getShipment(): Shipment;
    /**
     * Sets the ID of the gift certificate associated with this line item.
     */
    setGiftCertificateID(id: string): void;
    /**
     * Sets the message to include in the email of the person receiving
     * the gift certificate line item.
     */
    setMessage(message: string): void;
    /**
     * Sets the associated ProductListItem.
     * 
     * The product list item to be set must be of type gift certificate otherwise an exception is thrown.
     */
    setProductListItem(productListItem: ProductListItem): void;
    /**
     * Sets the email address of the person receiving
     * the gift certificate line item.
     */
    setRecipientEmail(recipientEmail: string): void;
    /**
     * Sets the name of the person receiving the gift certificate line item.
     */
    setRecipientName(recipient: string): void;
    /**
     * Sets the name of the person or organization that
     * sent the gift certificate line item.
     */
    setSenderName(sender: string): void;
    /**
     * Associates the gift certificate line item with the specified shipment.
     * 
     * Gift certificate line item and shipment must belong to the same line item ctnr.
     */
    setShipment(shipment: Shipment): void;
}

export = GiftCertificateLineItem;
