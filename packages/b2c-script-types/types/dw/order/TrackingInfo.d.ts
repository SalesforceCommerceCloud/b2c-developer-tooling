import Extensible = require('../object/Extensible');
import ShippingOrder = require('./ShippingOrder');
import Collection = require('../util/Collection');

/**
 * Provides basic information about a tracking info. An instance is identified by an ID and can be referenced from n ShippingOrderItems
 * using dw.order.TrackingRefs. This also allows one dw.order.ShippingOrderItem to be associated with n TrackingInfo.
 * @see dw.order.ShippingOrder.addTrackingInfo
 * @see dw.order.ShippingOrderItem.addTrackingRef
 */
declare class TrackingInfo extends Extensible {
    /**
     * Get the mandatory identifier for this tracking information. The id allows the tracking information to be referenced from
     * dw.order.TrackingRefs. To support short shipping a shipping-order-item can manage a list of
     * TrackingRefs, each with an optional quantity value allowing individual items to ship in multiple
     * parcels with known item quantity in each.
     * @see dw.order.ShippingOrder.addTrackingInfo
     */
    readonly ID: string;
    /**
     * Get the Carrier.
     */
    carrier: string;
    /**
     * Get the service(ship method) of the used carrier.
     */
    carrierService: string;
    /**
     * Get the ship date.
     */
    shipDate: Date;
    /**
     * Gets the shipping order.
     */
    readonly shippingOrder: ShippingOrder;
    /**
     * Get the tracking number.
     */
    trackingNumber: string;
    /**
     * Gets the tracking refs (shipping order items) which are assigned to this tracking info.
     */
    readonly trackingRefs: Collection<any>;
    /**
     * Get the id of the shipping warehouse.
     */
    warehouseID: string;
    private constructor();
    /**
     * Get the Carrier.
     */
    getCarrier(): string;
    /**
     * Get the service(ship method) of the used carrier.
     */
    getCarrierService(): string;
    /**
     * Get the mandatory identifier for this tracking information. The id allows the tracking information to be referenced from
     * dw.order.TrackingRefs. To support short shipping a shipping-order-item can manage a list of
     * TrackingRefs, each with an optional quantity value allowing individual items to ship in multiple
     * parcels with known item quantity in each.
     * @see dw.order.ShippingOrder.addTrackingInfo
     */
    getID(): string;
    /**
     * Get the ship date.
     */
    getShipDate(): Date;
    /**
     * Gets the shipping order.
     */
    getShippingOrder(): ShippingOrder;
    /**
     * Get the tracking number.
     */
    getTrackingNumber(): string;
    /**
     * Gets the tracking refs (shipping order items) which are assigned to this tracking info.
     */
    getTrackingRefs(): Collection<any>;
    /**
     * Get the id of the shipping warehouse.
     */
    getWarehouseID(): string;
    /**
     * Set the Carrier.
     */
    setCarrier(carrier: string): void;
    /**
     * Set the service(ship method) of the used carrier.
     */
    setCarrierService(carrierService: string): void;
    /**
     * Set the ship date.
     */
    setShipDate(shipDate: Date): void;
    /**
     * Set the TrackingNumber.
     */
    setTrackingNumber(trackingNumber: string): void;
    /**
     * Set the id of the shipping warehouse.
     */
    setWarehouseID(warehouseID: string): void;
}

export = TrackingInfo;
